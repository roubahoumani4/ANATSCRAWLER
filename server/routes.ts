import type { Express, Request, Response, NextFunction, Router } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { mongodb } from "./lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { ObjectId } from 'mongodb';
import { registerRoutes as registerSearchRoutes } from './routes/search';
import authenticate from './middleware/auth';
import type { User } from './types/User';
import express from 'express';
import cookieParser from "cookie-parser";
import sanitizeHtml from "sanitize-html";
import crypto from "crypto";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "ANAT_SECURITY_JWT_SECRET_KEY";
const TOKEN_EXPIRATION = "24h";

export async function registerRoutes(app: Express): Promise<void> {
  // Create a new secure router
  const secureRouter = express.Router();
  
  // Apply authentication middleware to secure router
  secureRouter.use(authenticate);

  // Register search routes
  registerSearchRoutes(app);

  // Health check endpoint - public, no auth needed
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000
    });
  });

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"]
      }
    }
  }));

  app.use(cors({
    origin: 'http://192.168.1.105:5000',
    credentials: true
  }));

  app.use(mongoSanitize());
  app.use(cookieParser());

  // Custom CSRF protection (double-submit cookie pattern)
  app.use((req, res, next) => {
    // Only generate CSRF token for GET requests
    if (req.method === "GET" && !req.cookies["csrfToken"]) {
      const csrfToken = crypto.randomBytes(32).toString("hex");
      res.cookie("csrfToken", csrfToken, {
        httpOnly: false, // must be readable by JS
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production"
      });
    }
    next();
  });

  // CSRF token endpoint (for frontend to fetch token)
  app.get("/api/csrf-token", (req: Request, res: Response) => {
    const csrfToken = req.cookies["csrfToken"];
    res.json({ csrfToken });
  });

  // CSRF validation middleware for state-changing requests
  function csrfProtection(req: Request, res: Response, next: NextFunction) {
    const csrfCookie = req.cookies["csrfToken"];
    const csrfHeader = req.headers["x-csrf-token"];
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return res.status(403).json({ error: "Invalid CSRF token" });
    }
    next();
  }

  // Apply CSRF protection to login and signup
  app.post("/api/login", csrfProtection, [
    body("username").trim().notEmpty().withMessage("Username is required").customSanitizer(v => v.toLowerCase()),
    body("password")
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
      .withMessage("Password must be at least 8 characters and include uppercase, lowercase, number, and special character")
  ], async (req: Request, res: Response) => {
    const ip = String(req.ip);
    const now = Date.now();
    const loginAttempts = (app.locals as any).loginAttempts;
    if (!loginAttempts[ip]) loginAttempts[ip] = [];
    loginAttempts[ip] = loginAttempts[ip].filter((t: number) => now - t < 15 * 60 * 1000); // 15 min window
    if (loginAttempts[ip].length >= 10) {
      return res.status(429).json({ error: "Too many login attempts. Please try again later." });
    }
    loginAttempts[ip].push(now);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;
    const cleanUsername = sanitizeHtml(username, { allowedTags: [], allowedAttributes: {} });
    try {
      // Find user (normalized username)
      const userResult = await mongodb.findUsers({ filters: { username: cleanUsername } });
      if (!userResult.success || !userResult.users || userResult.users.length === 0) {
        await mongodb.logAuthEvent({ event: 'login', username: cleanUsername, ip, timestamp: new Date(), success: false, reason: 'user not found' });
        await new Promise(r => setTimeout(r, 500)); // Delay for brute force protection
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const user = userResult.users[0];
      // Account lockout check
      if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
        await mongodb.logAuthEvent({ event: 'login', username: cleanUsername, ip, timestamp: new Date(), success: false, reason: 'account locked' });
        return res.status(423).json({ error: "Account is temporarily locked due to too many failed login attempts. Please try again later." });
      }
      // Check password
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        // Increment loginAttempts and lock if needed
        const attempts = (user.loginAttempts || 0) + 1;
        let lockUntil = user.lockUntil;
        if (attempts >= 5) {
          lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        }
        if (user._id) {
          await mongodb.updateUser(user._id.toString(), { loginAttempts: attempts, lockUntil });
        }
        await mongodb.logAuthEvent({ event: 'login', username: cleanUsername, ip, timestamp: new Date(), success: false, reason: 'wrong password' });
        await new Promise(r => setTimeout(r, 500)); // Delay for brute force protection
        return res.status(401).json({ error: "Invalid username or password" });
      }
      // Reset loginAttempts and lockUntil on successful login
      if (user._id) {
        await mongodb.updateUser(user._id.toString(), { loginAttempts: 0, lockUntil: undefined, lastLogin: new Date() });
      }
      await mongodb.logAuthEvent({ event: 'login', username: cleanUsername, ip, timestamp: new Date(), success: true });
      // Issue JWT as HttpOnly, Secure cookie
      const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
        domain: ".anatsecurity.fr"
      });
      // Do not return password or sensitive info, and do not return token in body
      return res.json({ success: true, user: { username: cleanUsername, _id: user._id } });
    } catch (err: any) {
      await mongodb.logAuthEvent({ event: 'login', username: cleanUsername, ip, timestamp: new Date(), success: false, reason: 'server error' });
      return res.status(500).json({ error: "Login failed" });
    }
  });

  // Signup endpoint - public
  app.post("/api/signup", csrfProtection, [
    body("username").trim().notEmpty().withMessage("Username is required").customSanitizer(v => v.toLowerCase()),
    body("password")
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
      .withMessage("Password must be at least 8 characters and include uppercase, lowercase, number, and special character")
  ], async (req: Request, res: Response) => {
    const ip = String(req.ip);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await mongodb.logAuthEvent({ event: 'signup', username: req.body.username, ip, timestamp: new Date(), success: false, reason: 'validation error' });
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;
    const cleanSignupUsername = sanitizeHtml(username, { allowedTags: [], allowedAttributes: {} });
    try {
      // Check if user already exists (normalized username)
      const existing = await mongodb.findUsers({ filters: { username: cleanSignupUsername } });
      if (existing.success && existing.users && existing.users.length > 0) {
        await mongodb.logAuthEvent({ event: 'signup', username: cleanSignupUsername, ip, timestamp: new Date(), success: false, reason: 'username exists' });
        return res.status(409).json({ error: "Username already exists" });
      }
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create user
      const result = await mongodb.createUser({ username: cleanSignupUsername, password: hashedPassword });
      if (!result.success) {
        await mongodb.logAuthEvent({ event: 'signup', username: cleanSignupUsername, ip, timestamp: new Date(), success: false, reason: 'db error' });
        return res.status(500).json({ error: result.error || "Failed to create user" });
      }
      await mongodb.logAuthEvent({ event: 'signup', username: cleanSignupUsername, ip, timestamp: new Date(), success: true });
      return res.status(201).json({ success: true, userId: result.userId });
    } catch (err: any) {
      await mongodb.logAuthEvent({ event: 'signup', username: cleanSignupUsername, ip, timestamp: new Date(), success: false, reason: 'server error' });
      return res.status(500).json({ error: err.message || "Signup failed" });
    }
  });

  // Add protected routes to secure router
  secureRouter.get("/profile", async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      res.json({
        id: user._id,
        username: user.username,
        fullName: user.fullName || '',
        email: user.email || '',
        organization: user.organization || '',
        department: user.department || '',
        jobPosition: user.jobPosition || '',
        roles: user.roles || ['user']
      });
    } catch (error) {
      console.error("[Profile] Error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // RESTful User Endpoints
  app.get("/api/users", authenticate, async (req: Request, res: Response) => {
    try {
      const result = await mongodb.findUsers({});
      if (!result.success) return res.status(500).json({ error: result.error });
      res.json(result.users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authenticate, async (req: Request, res: Response) => {
    try {
      const { username, password, ...rest } = req.body;
      if (!username || !password) return res.status(400).json({ error: "Username and password required" });
      const hash = await bcrypt.hash(password, 12);
      const result = await mongodb.createUser({ username, password: hash, ...rest });
      if (!result.success) return res.status(500).json({ error: result.error });
      res.status(201).json({ userId: result.userId });
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const update = { ...req.body };
      if (update.password) delete update.password; // Don't allow password change here
      const result = await mongodb.updateUser(id, update);
      if (!result.success) return res.status(404).json({ error: result.error });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!mongodb.deleteUser) {
        return res.status(500).json({ error: "Delete method not implemented" });
      }
      const result = await mongodb.deleteUser(id);
      if (!result.success) return res.status(404).json({ error: result.error });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Search History Endpoints (stub, expand as needed)
  app.get("/api/search-history", authenticate, async (req: Request, res: Response) => {
    // TODO: Implement search history retrieval
    res.json([]);
  });

  app.post("/api/search-history", authenticate, async (req: Request, res: Response) => {
    // TODO: Implement search history creation
    res.status(201).json({ success: true });
  });

  // Validate token endpoint (for cookie-based auth)
  app.get("/api/validate-token", async (req: Request, res: Response) => {
    try {
      const token = req.cookies.token;
      if (!token) return res.status(401).json({ error: "Not authenticated" });
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (!decoded || !decoded._id) return res.status(401).json({ error: "Invalid token" });
      const userResult = await mongodb.findUsers({ filters: { _id: new ObjectId(decoded._id) } });
      if (!userResult.success || !userResult.users || userResult.users.length === 0) {
        return res.status(401).json({ error: "User not found" });
      }
      const user = userResult.users[0];
      res.json({ _id: user._id, username: user.username });
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Logout endpoint (clear cookie)
  app.post("/api/logout", (req: Request, res: Response) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      domain: ".anatsecurity.fr"
    });
    res.json({ success: true });
  });

  // Profile Info Endpoints
  app.get("/api/profile-info", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { getProfileInfo } = await import("./lib/profileInfo");
      const info = await getProfileInfo(new ObjectId(userId));
      res.json(info || {});
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch profile info" });
    }
  });

  app.patch("/api/profile-info", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { upsertProfileInfo } = await import("./lib/profileInfo");
      const updated = await upsertProfileInfo(new ObjectId(userId), req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update profile info" });
    }
  });

  // Change Username Endpoint
  app.patch("/api/user/username", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const { newUsername } = req.body;
      if (!userId || !newUsername) {
        return res.status(400).json({ error: "Missing user or new username" });
      }
      // Sanitize and validate new username
      const cleanUsername = sanitizeHtml(newUsername, { allowedTags: [], allowedAttributes: {} }).toLowerCase();
      if (cleanUsername.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }
      // Check if username is taken
      const existing = await mongodb.findUsers({ filters: { username: cleanUsername } });
      if (existing.success && existing.users && existing.users.length > 0) {
        return res.status(409).json({ error: "Username already taken" });
      }
      // Update username
      const result = await mongodb.updateUser(userId.toString(), { username: cleanUsername });
      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to update username" });
      }
      // Optionally, issue a new JWT and set cookie
      const token = jwt.sign({ _id: userId, username: cleanUsername }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
        domain: ".anatsecurity.fr"
      });
      res.json({ success: true, username: cleanUsername });
    } catch (err) {
      res.status(500).json({ error: "Failed to change username" });
    }
  });

  // Change Password Endpoint
  app.patch("/api/user/password", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;
      const { currentPassword, newPassword } = req.body;
      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Validate new password strength
      if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(newPassword)) {
        return res.status(400).json({ error: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character" });
      }
      // Fetch user
      const userResult = await mongodb.findUsers({ filters: { _id: new ObjectId(userId) } });
      if (!userResult.success || !userResult.users || userResult.users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const user = userResult.users[0];
      // Check current password
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      // Hash new password
      const hash = await bcrypt.hash(newPassword, 12);
      const result = await mongodb.updateUser(userId.toString(), { password: hash });
      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to update password" });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Get all user profiles (username + profile info)
  app.get("/api/user-profiles", authenticate, async (req: Request, res: Response) => {
    try {
      const { getAllUserProfiles } = await import("./lib/userProfile");
      const profiles = await getAllUserProfiles();
      res.json(profiles);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch user profiles" });
    }
  });

  // Mount secure router at /api/secure path
  app.use('/api/secure', secureRouter);
}
