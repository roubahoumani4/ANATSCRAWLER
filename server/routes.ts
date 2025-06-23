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

  // Public routes
  app.post("/api/login", [
    body("identifier").trim().notEmpty(),
    body("password").trim().notEmpty()
  ], async (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;
      
      // Find user
      const result = await mongodb.findUsers({
        filters: {
          $or: [
            { username: identifier },
            { email: identifier }
          ]
        }
      });

      if (!result.success || !result.users || result.users.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result.users[0];

      // Compare password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create token
      const token = jwt.sign({
        _id: user._id,
        username: user.username,
        roles: user.roles || ['user']
      }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });

      // Return user data and token
      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName || '',
          email: user.email || '',
          organization: user.organization || '',
          department: user.department || '',
          jobPosition: user.jobPosition || '',
          roles: user.roles || ['user']
        }
      });
    } catch (error) {
      console.error("[Auth] Login error:", error);
      res.status(500).json({ error: "Login failed" });
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
