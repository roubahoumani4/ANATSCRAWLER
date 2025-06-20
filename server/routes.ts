import type { Express, Request, Response, NextFunction } from "express";
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

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "ANAT_SECURITY_JWT_SECRET_KEY";
const TOKEN_EXPIRATION = "24h";

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
    origin: 'http://127.0.0.1:5000',
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

  // Protected routes
  const secureRouter = app._router.stack
    .find((layer: any) => layer.regexp?.test('/api/secure'))?.handle;

  if (!secureRouter) {
    throw new Error('Secure router not found - ensure it is set up in index.ts');
  }

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
}
