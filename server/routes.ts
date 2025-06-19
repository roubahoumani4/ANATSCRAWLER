import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
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

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "ANAT_SECURITY_JWT_SECRET_KEY";
const TOKEN_EXPIRATION = "24h";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        roles?: string[];
      };
    }
  }
}

export async function registerRoutes(app: Express): Promise<void> {
  // Register search routes
  registerSearchRoutes(app);

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
    origin: true,
    credentials: true
  }));

  app.use(xss());
  app.use(mongoSanitize());

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  });
  app.use("/api", apiLimiter);

  // Simplified Signup endpoint
  app.post("/api/signup", [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers and underscore"),
    body("password")
      .trim()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      })
  ], async (req: Request, res: Response) => {
    console.log("[Auth] Received signup request");
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { username, password } = req.body;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user in MongoDB
      const result = await mongodb.createUser({
        username,
        password: hashedPassword,
        createdAt: new Date(),
        lastLogin: new Date()
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({ 
        message: "User registered successfully",
        userId: result.userId
      });
    } catch (error) {
      console.error("[Auth] Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/login", [
    body("identifier").trim().notEmpty().withMessage("Username or email is required"),
    body("password").trim().notEmpty().withMessage("Password is required")
  ], async (req: Request, res: Response) => {
    console.log("[Auth] Received login request");
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

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
        console.log("[Auth] User not found:", identifier);
        return res.status(401).json({ error: "Invalid username/email or password" });
      }

      const user = result.users[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log("[Auth] Invalid password for user:", identifier);
        return res.status(401).json({ error: "Invalid username/email or password" });
      }

      // Create token
      const token = jwt.sign(
        { 
          id: user._id,
          username: user.username,
          roles: user.roles || ['user']
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRATION }
      );

      console.log("[Auth] Login successful for user:", identifier);

      // Return user data and token
      res.json({
        token,
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
      console.error("[Auth] Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Protected route example
  app.get("/api/profile", authenticate, async (req: Request, res: Response) => {
    try {
      const result = await mongodb.findUsers({
        filters: { _id: new ObjectId(req.user?.id) }
      });

      if (!result.success || !result.users || result.users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = result.users[0];
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
      console.error("[Auth] Profile fetch error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
}
