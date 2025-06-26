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

  // Login endpoint - public
  // Ensure app.locals.loginAttempts is typed and initialized
  if (!('loginAttempts' in app.locals)) {
    (app.locals as any).loginAttempts = {};
  }
  app.post("/api/login", [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
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
      // Find user
      const userResult = await mongodb.findUsers({ filters: { username } });
      if (!userResult.success || !userResult.users || userResult.users.length === 0) {
        // Generic error to prevent user enumeration
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const user = userResult.users[0];
      // Check password
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        // Generic error to prevent user enumeration
        return res.status(401).json({ error: "Invalid username or password" });
      }
      // Issue JWT
      const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
      // Do not return password or sensitive info
      return res.json({ success: true, token, user: { username: user.username, _id: user._id } });
    } catch (err: any) {
      return res.status(500).json({ error: "Login failed" });
    }
  });

  // Signup endpoint - public
  app.post("/api/signup", [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password")
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
      .withMessage("Password must be at least 8 characters and include uppercase, lowercase, number, and special character")
  ], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;
    try {
      // Check if user already exists
      const existing = await mongodb.findUsers({ filters: { username } });
      if (existing.success && existing.users && existing.users.length > 0) {
        return res.status(409).json({ error: "Username already exists" });
      }
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create user
      const result = await mongodb.createUser({ username, password: hashedPassword });
      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to create user" });
      }
      return res.status(201).json({ success: true, userId: result.userId });
    } catch (err: any) {
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

  // Mount secure router at /api/secure path
  app.use('/api/secure', secureRouter);
}
