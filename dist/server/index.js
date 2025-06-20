// server/index.ts
import "dotenv/config";
import express3 from "express";
import { createServer } from "http";

// server/routes.ts
import helmet from "helmet";
import cors from "cors";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

// server/lib/mongodb.ts
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import dns from "dns";
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://192.168.1.110:27017/anat_security?directConnection=true";
var DB_NAME = "anat_security";
var COLLECTION_NAME = "users";
console.log("MongoDB URI being used:", MONGODB_URI);
console.log("Database:", DB_NAME);
console.log("Collection:", COLLECTION_NAME);
var MongoDBClient = class _MongoDBClient {
  static instance;
  client = null;
  isConnected = false;
  db = null;
  collection = null;
  connectionPromise = null;
  constructor() {
  }
  static getInstance() {
    if (!_MongoDBClient.instance) {
      _MongoDBClient.instance = new _MongoDBClient();
    }
    return _MongoDBClient.instance;
  }
  async connect() {
    if (this.isConnected) {
      return true;
    }
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }
  async _connect() {
    try {
      console.log("Checking DNS resolution for MongoDB host...");
      const mongoUrl = new URL(MONGODB_URI);
      try {
        await new Promise((resolve, reject) => {
          dns.lookup(mongoUrl.hostname, (err, address) => {
            if (err) reject(err);
            else {
              console.log(`MongoDB host resolves to: ${address}`);
              resolve(address);
            }
          });
        });
      } catch (error) {
        console.error("DNS resolution failed:", error);
      }
      const options = {
        connectTimeoutMS: 1e4,
        serverSelectionTimeoutMS: 1e4,
        socketTimeoutMS: 45e3,
        maxPoolSize: 10,
        minPoolSize: 1,
        retryWrites: true,
        retryReads: true,
        w: "majority",
        directConnection: true
      };
      console.log("Attempting to connect to MongoDB at:", MONGODB_URI);
      console.log("Connecting with options:", JSON.stringify(options, null, 2));
      this.client = await MongoClient.connect(MONGODB_URI, options);
      this.db = this.client.db(DB_NAME);
      this.collection = this.db.collection(COLLECTION_NAME);
      this.isConnected = true;
      await this.db.command({ ping: 1 });
      console.log(`MongoDB connection verified via ping on database: ${DB_NAME}`);
      this.client.on("serverHeartbeatSucceeded", () => {
        this.isConnected = true;
      });
      this.client.on("serverHeartbeatFailed", () => {
        console.warn("MongoDB heartbeat failed");
      });
      this.client.on("close", () => {
        console.warn("MongoDB connection closed");
        this.isConnected = false;
      });
      return true;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      this.isConnected = false;
      this.client = null;
      this.connectionPromise = null;
      return false;
    }
  }
  async findUsers(query) {
    try {
      await this.connect();
      if (!this.isConnected) {
        throw new Error("Not connected to database");
      }
      const users = await this.collection.find(query.filters || {}).toArray();
      return { success: true, users };
    } catch (error) {
      console.error("Error finding users:", error);
      return { success: false, error: error.message };
    }
  }
  async createUser(user) {
    try {
      await this.connect();
      if (!this.isConnected) {
        throw new Error("Not connected to database");
      }
      const result = await this.collection.insertOne({
        ...user,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        isActive: true
      });
      return {
        success: true,
        userId: result.insertedId.toString()
      };
    } catch (error) {
      console.error("Error creating user:", error);
      return { success: false, error: error.message };
    }
  }
  async updateUser(userId, update) {
    try {
      await this.connect();
      if (!this.isConnected) {
        throw new Error("Not connected to database");
      }
      const result = await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            ...update,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }
      );
      if (result.matchedCount === 0) {
        return { success: false, error: "User not found" };
      }
      return { success: true };
    } catch (error) {
      console.error("Error updating user:", error);
      return { success: false, error: error.message };
    }
  }
  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
    }
  }
};
var mongodb = MongoDBClient.getInstance();

// server/routes.ts
import bcrypt from "bcryptjs";
import jwt2 from "jsonwebtoken";
import { body as body2 } from "express-validator";

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

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
import { ObjectId as ObjectId2 } from "mongodb";
var JWT_SECRET2 = process.env.JWT_SECRET || "ANAT_SECURITY_JWT_SECRET_KEY";
async function authenticate(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Authorization required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET2);
    if (!decoded || !decoded._id) {
      throw new Error("Invalid token structure");
    }
    const result = await mongodb.findUsers({
      filters: {
        _id: new ObjectId2(decoded._id),
        isActive: { $ne: false }
        // User is active or field doesn't exist
      }
    });
    if (!result.success || !result.users || result.users.length === 0) {
      throw new Error("User not found or inactive");
    }
    const user = result.users[0];
    await mongodb.updateUser(decoded._id, { lastLogin: /* @__PURE__ */ new Date() });
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expired" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(401).json({ error: "Authentication failed" });
  }
}

// server/routes.ts
import express from "express";
var JWT_SECRET3 = process.env.JWT_SECRET || "ANAT_SECURITY_JWT_SECRET_KEY";
var TOKEN_EXPIRATION = "24h";
async function registerRoutes2(app2) {
  const secureRouter = express.Router();
  secureRouter.use(authenticate);
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
    origin: "http://127.0.0.1:5000",
    credentials: true
  }));
  app2.use(xss());
  app2.use(mongoSanitize());
  app2.post("/api/login", [
    body2("identifier").trim().notEmpty(),
    body2("password").trim().notEmpty()
  ], async (req, res) => {
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
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const user = result.users[0];
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = jwt2.sign({
        _id: user._id,
        username: user.username,
        roles: user.roles || ["user"]
      }, JWT_SECRET3, { expiresIn: TOKEN_EXPIRATION });
      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName || "",
          email: user.email || "",
          organization: user.organization || "",
          department: user.department || "",
          jobPosition: user.jobPosition || "",
          roles: user.roles || ["user"]
        }
      });
    } catch (error) {
      console.error("[Auth] Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  secureRouter.get("/profile", async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
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
      console.error("[Profile] Error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  app2.use("/api/secure", secureRouter);
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/client"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "client/index.html")
      },
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "framer-motion",
            "@tanstack/react-query"
          ]
        }
      }
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true
      }
    }
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
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
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

// server/index.ts
import path3 from "path";
import cors2 from "cors";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path3.dirname(__filename2);
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use(cors2({
  origin: "http://127.0.0.1:5000",
  credentials: true
}));
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
      if (capturedJsonResponse && !path4.includes("password")) {
        logLine += ` - Response: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});
var httpServer = null;
async function startServer() {
  try {
    if (!await mongodb.connect()) {
      throw new Error("Failed to connect to MongoDB");
    }
    httpServer = createServer(app);
    await registerRoutes2(app);
    if (process.env.NODE_ENV !== "production") {
      console.log("Setting up Vite development server...");
      await setupVite(app, httpServer);
    } else {
      const clientDistPath = path3.resolve(__dirname2, "../dist/client");
      console.log("Serving static files from:", clientDistPath);
      app.use(express3.static(clientDistPath, {
        index: false,
        // Don't immediately serve index.html for '/'
        maxAge: "1d"
        // Cache static assets for 1 day
      }));
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next();
        }
        const indexPath = path3.join(clientDistPath, "index.html");
        console.log("Serving index.html for:", req.path);
        res.sendFile(indexPath);
      });
    }
    const port = parseInt(process.env.PORT || "5000", 10);
    const host = "0.0.0.0";
    httpServer.listen({ port, host }, () => {
      console.log(`Server running at http://${host}:${port}`);
      console.log("You can access the server at:");
      console.log(`- Local: http://localhost:${port}`);
      console.log(`- Network: http://${host}:${port}`);
    });
    httpServer.on("error", console.error);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  if (httpServer) {
    httpServer.close(() => {
      console.log("HTTP server closed");
      mongodb.close().catch(console.error);
    });
  }
});
startServer();
