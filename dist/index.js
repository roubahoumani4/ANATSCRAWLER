// server/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";

// server/routes.ts
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

// server/lib/mongodb.ts
import "dotenv/config";
import { MongoClient } from "mongodb";
import dns from "dns";
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://192.168.1.110:27017/anat_security?directConnection=true";
var DB_NAME = "anat_security";
var COLLECTION_NAME = "people";
console.log("MongoDB URI being used:", MONGODB_URI);
console.log("Database:", DB_NAME);
console.log("Collection:", COLLECTION_NAME);
var MongoDBClient = class _MongoDBClient {
  static instance;
  client = null;
  isConnected = false;
  db = null;
  collection = null;
  constructor() {
  }
  static getInstance() {
    if (!_MongoDBClient.instance) {
      _MongoDBClient.instance = new _MongoDBClient();
    }
    return _MongoDBClient.instance;
  }
  async checkHostResolution() {
    try {
      const uri = new URL(MONGODB_URI);
      console.log("Checking DNS resolution for MongoDB host...");
      return new Promise((resolve) => {
        dns.lookup(uri.hostname, (err) => {
          if (err) {
            console.error("DNS resolution failed:", err);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error("Error parsing MongoDB URI:", error);
      return false;
    }
  }
  async getConnection() {
    if (this.client && this.isConnected) {
      try {
        await this.client.db(DB_NAME).command({ ping: 1 });
        return this.client;
      } catch (error) {
        console.log("Existing connection is stale, creating new connection...");
        this.isConnected = false;
      }
    }
    const canResolve = await this.checkHostResolution();
    if (!canResolve) {
      throw new Error("Cannot resolve MongoDB host");
    }
    const options = {
      connectTimeoutMS: 1e4,
      serverSelectionTimeoutMS: 1e4,
      directConnection: true,
      retryWrites: true,
      w: "majority"
    };
    console.log("Attempting to connect to MongoDB at:", MONGODB_URI);
    console.log("Connecting with options:", JSON.stringify(options, null, 2));
    try {
      this.client = await MongoClient.connect(MONGODB_URI, options);
      await this.client.db(DB_NAME).command({ ping: 1 });
      console.log("MongoDB connection verified via ping on database:", DB_NAME);
      this.isConnected = true;
      this.db = this.client.db(DB_NAME);
      this.collection = this.db.collection(COLLECTION_NAME);
      return this.client;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      this.isConnected = false;
      throw error;
    }
  }
  async testConnection() {
    try {
      await this.getConnection();
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async createUser(userData) {
    try {
      await this.getConnection();
      const existingUser = await this.collection.findOne({
        username: userData.username
      });
      if (existingUser) {
        return {
          success: false,
          error: "Username already exists"
        };
      }
      const result = await this.collection.insertOne({
        ...userData,
        createdAt: /* @__PURE__ */ new Date(),
        lastLogin: /* @__PURE__ */ new Date()
      });
      return {
        success: true,
        userId: result.insertedId.toString()
      };
    } catch (error) {
      console.error("Error creating user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create user"
      };
    }
  }
  async findUsers(query = {}) {
    try {
      await this.getConnection();
      let filter = {};
      if (query.filters) {
        filter = { ...query.filters };
      }
      if (query.search) {
        filter.$or = [
          { username: new RegExp(query.search, "i") }
        ];
      }
      const users = await this.collection.find(filter).toArray();
      return {
        success: true,
        users: users.map((user) => ({
          _id: user._id.toString(),
          username: user.username,
          password: user.password,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }))
      };
    } catch (error) {
      console.error("Error finding users:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to find users"
      };
    }
  }
};
var mongodb = MongoDBClient.getInstance();

// server/routes.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body as body2, validationResult as validationResult2 } from "express-validator";
import { ObjectId as ObjectId2 } from "mongodb";

// server/routes/search.ts
import { body, validationResult } from "express-validator";

// server/config.ts
var ELASTICSEARCH_URI = process.env.ELASTICSEARCH_URI || "http://192.168.1.110:9200";
var MONGODB_URI2 = process.env.MONGODB_URI || "mongodb://192.168.1.110:27017/anat_security";
var PORT = process.env.PORT || 50106;
var JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";
var NODE_ENV = process.env.NODE_ENV || "development";

// server/routes/search.ts
async function searchElasticsearch(query) {
  console.log(`[Search] Starting search for query "${query}"`);
  try {
    const searchBody = {
      query: {
        multi_match: {
          query,
          fields: ["field1", "field2"],
          operator: "and"
        }
      },
      size: 100
    };
    const response = await fetch(`${ELASTICSEARCH_URI}/filesearchdb.fs.chunks/_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(searchBody)
    });
    if (!response.ok) {
      throw new Error("Search failed");
    }
    const data = await response.json();
    const results = data.hits.hits.map((hit) => {
      const field1 = hit._source?.field1 || "";
      const field2 = hit._source?.field2 || "";
      const content = field1 || field2;
      return {
        id: hit._id,
        score: hit._score,
        snippet: content.slice(0, 200) + (content.length > 200 ? "..." : ""),
        type: "document"
      };
    });
    return results.filter((result) => result.snippet && result.snippet.trim() !== "");
  } catch (error) {
    console.error("[Search] Error:", error);
    throw error;
  }
}
function registerRoutes(app2) {
  app2.post("/api/darkweb-search", [
    body("query").trim().notEmpty().withMessage("Search query is required")
  ], async (req, res) => {
    console.log("[API] Received search request:", {
      query: req.body.query,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      headers: req.headers
    });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn("[API] Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const results = await searchElasticsearch(req.body.query);
      console.log("[API] Search completed successfully:", {
        query: req.body.query,
        resultCount: results.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      const sanitizedResults = results.map((result) => ({
        id: result.id,
        score: result.score,
        snippet: result.snippet,
        type: result.type
      }));
      return res.json({
        success: true,
        results: sanitizedResults.slice(0, 20),
        // Limit to 20 results max
        query: req.body.query,
        total: results.length
      });
    } catch (error) {
      console.error("[Search] Error processing search:", error);
      return res.status(500).json({
        success: false,
        error: "Search failed"
      });
    }
  });
}

// server/routes.ts
var JWT_SECRET2 = process.env.JWT_SECRET || "ANAT_SECURITY_JWT_SECRET_KEY";
var TOKEN_EXPIRATION = "24h";
async function registerRoutes2(app2) {
  registerRoutes(app2);
  app2.use(helmet({
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
  app2.use(cors({
    origin: true,
    credentials: true
  }));
  app2.use(xss());
  app2.use(mongoSanitize());
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1e3,
    max: 100
  });
  app2.use("/api", apiLimiter);
  app2.post("/api/signup", [
    body2("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters").matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers and underscore"),
    body2("password").trim().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body2("confirmPassword").trim().custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    })
  ], async (req, res) => {
    console.log("[Auth] Received signup request");
    const errors = validationResult2(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await mongodb.createUser({
        username,
        password: hashedPassword,
        createdAt: /* @__PURE__ */ new Date(),
        lastLogin: /* @__PURE__ */ new Date()
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
  app2.post("/api/login", [
    body2("identifier").trim().notEmpty().withMessage("Username or email is required"),
    body2("password").trim().notEmpty().withMessage("Password is required")
  ], async (req, res) => {
    console.log("[Auth] Received login request");
    const errors = validationResult2(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    try {
      const { identifier, password } = req.body;
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
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log("[Auth] Invalid password for user:", identifier);
        return res.status(401).json({ error: "Invalid username/email or password" });
      }
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
          roles: user.roles || ["user"]
        },
        JWT_SECRET2,
        { expiresIn: TOKEN_EXPIRATION }
      );
      console.log("[Auth] Login successful for user:", identifier);
      res.json({
        token,
        id: user._id,
        username: user.username,
        fullName: user.fullName || "",
        email: user.email || "",
        organization: user.organization || "",
        department: user.department || "",
        jobPosition: user.jobPosition || "",
        roles: user.roles || ["user"]
      });
    } catch (error) {
      console.error("[Auth] Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.get("/api/profile", authenticate, async (req, res) => {
    try {
      const result = await mongodb.findUsers({
        filters: { _id: new ObjectId2(req.user?.id) }
      });
      if (!result.success || !result.users || result.users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const user = result.users[0];
      res.json({
        id: user._id,
        username: user.username,
        fullName: user.fullName || "",
        email: user.email || "",
        organization: user.organization || "",
        department: user.department || "",
        jobPosition: user.jobPosition || "",
        roles: user.roles || ["user"]
      });
    } catch (error) {
      console.error("[Auth] Profile fetch error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server2) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server: server2 },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/middleware/auth.ts
import jwt2 from "jsonwebtoken";
import { ObjectId as ObjectId3 } from "mongodb";
async function authenticate2(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Authorization required" });
  }
  try {
    const decoded = jwt2.verify(token, process.env.JWT_SECRET || "ANAT_SECURITY_JWT_SECRET_KEY");
    if (!decoded || !decoded._id) {
      throw new Error("Invalid token structure");
    }
    const result = await mongodb.findUsers({
      filters: { _id: new ObjectId3(decoded._id) }
    });
    if (!result.success || !result.users || result.users.length === 0) {
      throw new Error("User not found");
    }
    const user = result.users[0];
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
}

// server/index.ts
import path3 from "path";
import cors2 from "cors";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(cors2());
app.use("/api/secure", authenticate2);
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  console.log(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Incoming ${req.method} ${path4}`);
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` - Response: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});
var server = null;
async function startServer() {
  try {
    if (server) {
      log("Server is already running");
      return;
    }
    const mongoConnection = await mongodb.testConnection();
    if (!mongoConnection.connected) {
      throw new Error(`MongoDB connection failed: ${mongoConnection.error}`);
    }
    log("MongoDB connected successfully");
    await registerRoutes2(app);
    log("API routes registered");
    server = createServer(app);
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
      log("Vite middleware setup completed");
    } else {
      app.use("/", express2.static(path3.join(process.cwd(), "dist/client")));
    }
    const port = process.env.PORT || 5e3;
    server.listen(port, () => {
      log(`Server running on port ${port}`);
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log(`Server startup error: ${errorMessage}`);
    process.exit(1);
  }
}
startServer();
