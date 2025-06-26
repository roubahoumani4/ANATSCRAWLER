import type { Express, Request, Response, NextFunction, Router } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
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
import csurf from "csurf";

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

  app.use(xss());
  app.use(mongoSanitize());
  app.use(cookieParser());
  app.use(csurf({ cookie: { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" } }));

  // CSRF token endpoint
  app.get("/api/csrf-token", (req: Request, res: Response) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // Login endpoint - public
  // Ensure app.locals.loginAttempts is typed and initialized
  if (!('loginAttempts' in app.locals)) {
    (app.locals as any).loginAttempts = {};
  }
  app.post("/api/login", [
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
    try {
      // Find user (normalized username)
      const userResult = await mongodb.findUsers({ filters: { username } });
      if (!userResult.success || !userResult.users || userResult.users.length === 0) {
        await mongodb.logAuthEvent({ event: 'login', username, ip, timestamp: new Date(), success: false, reason: 'user not found' });
        await new Promise(r => setTimeout(r, 500)); // Delay for brute force protection
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const user = userResult.users[0];
      // Account lockout check
      if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
        await mongodb.logAuthEvent({ event: 'login', username, ip, timestamp: new Date(), success: false, reason: 'account locked' });
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
        await mongodb.logAuthEvent({ event: 'login', username, ip, timestamp: new Date(), success: false, reason: 'wrong password' });
        await new Promise(r => setTimeout(r, 500)); // Delay for brute force protection
        return res.status(401).json({ error: "Invalid username or password" });
      }
      // Reset loginAttempts and lockUntil on successful login
      if (user._id) {
        await mongodb.updateUser(user._id.toString(), { loginAttempts: 0, lockUntil: undefined, lastLogin: new Date() });
      }
      await mongodb.logAuthEvent({ event: 'login', username, ip, timestamp: new Date(), success: true });
      // Issue JWT as HttpOnly, Secure cookie
      const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000
      });
      // Do not return password or sensitive info, and do not return token in body
      return res.json({ success: true, user: { username: user.username, _id: user._id } });
    } catch (err: any) {
      await mongodb.logAuthEvent({ event: 'login', username, ip, timestamp: new Date(), success: false, reason: 'server error' });
      return res.status(500).json({ error: "Login failed" });
    }
  });

  // Signup endpoint - public
  app.post("/api/signup", [
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
    try {
      // Check if user already exists (normalized username)
      const existing = await mongodb.findUsers({ filters: { username } });
      if (existing.success && existing.users && existing.users.length > 0) {
        await mongodb.logAuthEvent({ event: 'signup', username, ip, timestamp: new Date(), success: false, reason: 'username exists' });
        return res.status(409).json({ error: "Username already exists" });
      }
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create user
      const result = await mongodb.createUser({ username, password: hashedPassword });
      if (!result.success) {
        await mongodb.logAuthEvent({ event: 'signup', username, ip, timestamp: new Date(), success: false, reason: 'db error' });
        return res.status(500).json({ error: result.error || "Failed to create user" });
      }
      await mongodb.logAuthEvent({ event: 'signup', username, ip, timestamp: new Date(), success: true });
      return res.status(201).json({ success: true, userId: result.userId });
    } catch (err: any) {
      await mongodb.logAuthEvent({ event: 'signup', username, ip, timestamp: new Date(), success: false, reason: 'server error' });
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
    res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
    res.json({ success: true });
  });

  // Mount secure router at /api/secure path
  app.use('/api/secure', secureRouter);
}
