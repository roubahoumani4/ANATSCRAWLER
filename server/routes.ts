import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { searchResults, credentials } from "./mockData";

// Type for search results
interface SearchResult {
  id: number;
  collection: string;
  folder: string;
  fileName: string;
  content: string;
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "ANAT_SECURITY_JWT_SECRET_KEY";

// Token expiration time
const TOKEN_EXPIRATION = "24h";

// MongoDB connection string for user data, authentication, etc.
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://46.165.254.175:50105/anat_security";

// Elasticsearch connection for dark web search only
const ELASTICSEARCH_URI = process.env.ELASTICSEARCH_URI || "http://46.165.254.175:50104";

// Authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust proxy for rate limiting
  app.set('trust proxy', 1);

  // Apply security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://kit.fontawesome.com", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
        imgSrc: ["'self'", "data:", "https://api.qrserver.com", "https://images.unsplash.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", ELASTICSEARCH_URI, "mongodb://46.165.254.175:50105"],
      },
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: "same-origin" }
  }));

  app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://46.165.254.175:50106",
    credentials: true
  }));

  app.use(xss());
  app.use(mongoSanitize());

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: "Too many requests, please try again later." }
  });
  app.use("/api", apiLimiter);

  // Login route
  app.post("/api/login", [
    body("identifier").trim().notEmpty().withMessage("Username is required"),
    body("password").trim().notEmpty().withMessage("Password is required")
  ], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { identifier, password } = req.body;

      // Log the login attempt (for debugging)
      console.log(`Login attempt: ${identifier}`);

      // Check mock credentials for demo
      const user = credentials.find(cred => 
        cred.username === identifier || cred.email === identifier
      );

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // In a real app, we would use bcrypt.compare
      // const isPasswordValid = await bcrypt.compare(password, user.password);
      const isPasswordValid = password === user.password;

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRATION }
      );

      // Log successful login
      console.log(`Successful login: ${user.username}`);

      res.json({
        token,
        username: user.username,
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        organization: user.organization,
        department: user.department,
        jobPosition: user.jobPosition,
        roles: user.roles
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Validate token route
  app.get("/api/validate-token", authenticate, (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    res.json({ 
      id: req.user.id, 
      username: req.user.username,
      // In a real app, we would fetch the user from the database here
    });
  });

  // User registration
  app.post("/api/register-user", [
    body("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
    body("email").trim().isEmail().withMessage("Please provide a valid email"),
    body("password").trim().isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
  ], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { username, email, password } = req.body;

      // Check if username or email already exists
      const userExists = credentials.some(user => 
        user.username === username || user.email === email
      );

      if (userExists) {
        return res.status(400).json({ error: "Username or email already exists" });
      }

      // In a real app, we would create a new user in the database
      // const hashedPassword = await bcrypt.hash(password, 10);

      // For this mock implementation, we'll just return success
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Edit user
  app.post("/api/edit-user", authenticate, [
    body("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
    body("email").trim().isEmail().withMessage("Please provide a valid email")
  ], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      // In a real app, we would update the user in the database
      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Edit user error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Change password
  app.post("/api/change-password", authenticate, [
    body("currentPassword").trim().notEmpty().withMessage("Current password is required"),
    body("newPassword").trim().isLength({ min: 6 }).withMessage("New password must be at least 6 characters")
  ], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      // In a real app, we would verify the current password and update with the new one
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get users
  app.get("/api/users", authenticate, async (req: Request, res: Response) => {
    try {
      res.json(credentials.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        organization: user.organization,
        department: user.department,
        jobPosition: user.jobPosition
      })));
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Search API
  app.get("/api/search", authenticate, async (req: Request, res: Response) => {
    try {
      const { query } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }

      // In a real app, we would search in Elasticsearch
      // For this mock implementation, we'll filter the search results
      const filteredResults = searchResults.filter(result => 
        result.content.toLowerCase().includes(query.toLowerCase())
      );

      res.json(filteredResults);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Export to Excel
  app.post("/api/export", authenticate, async (req: Request, res: Response) => {
    try {
      // In a real app, we would create an Excel file
      res.json({ message: "Export successful" });
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Export failed" });
    }
  });

  // Download Excel
  app.get("/api/download-excel", authenticate, (req: Request, res: Response) => {
    try {
      // In a real app, we would generate and stream an Excel file
      // For now, we'll just send a mock response
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=search_results.xlsx");
      res.status(200).end("Excel file content would go here");
    } catch (error) {
      console.error("Download Excel error:", error);
      res.status(500).json({ error: "Download failed" });
    }
  });

  // Dark Web Search API - connects to Elasticsearch (no auth required for basic search)
  app.post("/api/darkweb-search", [
    body("query").trim().notEmpty().withMessage("Search query is required")
  ], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { query } = req.body;

      // Get all available indices
      const indicesResponse = await fetch(`${ELASTICSEARCH_URI}/_cat/indices?format=json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      let targetIndices = "*";

      if (indicesResponse.ok) {
        const indices = await indicesResponse.json();
        const availableIndices = indices
          .map((idx: any) => idx.index)
          .filter((name: string) => !name.startsWith('.'))
          .join(',');

        if (availableIndices) {
          targetIndices = availableIndices;
        }
      }

      // Simple multi-match query
      const searchBody = {
        query: {
          multi_match: {
            query: query,
            fields: ["*"]
          }
        },
        size: 100
      };

      // Make request to Elasticsearch
      const elasticsearchResponse = await fetch(`${ELASTICSEARCH_URI}/${targetIndices}/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody)
      });

      if (!elasticsearchResponse.ok) {
        const errorText = await elasticsearchResponse.text();
        console.error(`Elasticsearch error (${elasticsearchResponse.status}):`, errorText);
        throw new Error(`Elasticsearch responded with status: ${elasticsearchResponse.status}`);
      }

      const elasticsearchData = await elasticsearchResponse.json();

      // Transform results
      const results = elasticsearchData.hits?.hits?.map((hit: any) => {
        const source = hit._source;

        return {
          id: hit._id,
          source: hit._index,
          content: JSON.stringify(source),
          score: hit._score,
          index: hit._index
        };
      }) || [];

      const totalHits = elasticsearchData.hits?.total?.value || elasticsearchData.hits?.total || 0;
      console.log(`Elasticsearch query: ${query}`);
      console.log(`Searched indices: ${targetIndices}`);
      console.log(`Total hits found: ${totalHits}`);
      console.log(`Results returned: ${elasticsearchData.hits?.hits?.length || 0}`);

      res.json({
        success: true,
        results: results,
        total: elasticsearchData.hits?.total?.value || 0,
        query: query
      });

    } catch (error) {
      console.error("Dark web search error:", error);
      res.status(500).json({ 
        error: "Dark web search failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // User Profile Management API Endpoints

  // Update user profile information
  app.patch("/api/user/update-profile", authenticate, [
    body("fullName").optional().trim().isLength({ min: 1 }).withMessage("Full name cannot be empty"),
    body("email").optional().trim().isEmail().withMessage("Please provide a valid email"),
    body("organization").optional().trim(),
    body("department").optional().trim(),
    body("jobPosition").optional().trim()
  ], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { fullName, email, organization, department, jobPosition } = req.body;
      const userId = req.user?.id;

      console.log(`Updating profile for user ${userId}:`, { fullName, email, organization, department, jobPosition });

      res.json({ 
        message: "Profile updated successfully",
        user: {
          id: userId,
          username: req.user?.username,
          fullName,
          email,
          organization,
          department,
          jobPosition
        }
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Update username
  app.patch("/api/user/update-username", authenticate, [
    body("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters")
  ], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { username } = req.body;
      const userId = req.user?.id;

      console.log(`Updating username for user ${userId} to: ${username}`);

      res.json({ 
        message: "Username updated successfully",
        username 
      });
    } catch (error) {
      console.error("Username update error:", error);
      res.status(500).json({ error: "Failed to update username" });
    }
  });

  // Change password
  app.patch("/api/user/change-password", authenticate, [
    body("currentPassword").trim().notEmpty().withMessage("Current password is required"),
    body("newPassword").trim().isLength({ min: 6 }).withMessage("New password must be at least 6 characters")
  ], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      console.log(`Changing password for user ${userId}`);

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Add user property to Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
      };
    }
  }
}