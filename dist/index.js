// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

// server/lib/mongodb.ts
import "dotenv/config";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dns from "dns";
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://46.165.254.175:50105/anat_security?directConnection=true";
var DB_NAME = "anat_security";
var COLLECTION_NAME = "people";
console.log("MongoDB URI being used:", MONGODB_URI);
console.log("Database:", DB_NAME);
console.log("Collection:", COLLECTION_NAME);
var MongoDBClient = class _MongoDBClient {
  static instance;
  client = null;
  isConnected = false;
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
      return this.client;
    }
    try {
      console.log("Checking DNS resolution for MongoDB host...");
      const canResolve = await this.checkHostResolution();
      if (!canResolve) {
        throw new Error("Cannot resolve MongoDB hostname. Please check network connectivity and DNS settings.");
      }
      console.log("Attempting to connect to MongoDB at:", MONGODB_URI);
      const options = {
        connectTimeoutMS: 1e4,
        serverSelectionTimeoutMS: 1e4,
        directConnection: true
      };
      console.log("Connecting with options:", JSON.stringify(options, null, 2));
      this.client = new MongoClient(MONGODB_URI, options);
      await this.client.connect();
      const db = this.client.db(DB_NAME);
      await db.command({ ping: 1 });
      console.log("MongoDB connection verified via ping on database:", DB_NAME);
      this.isConnected = true;
      this.client.on("close", () => {
        console.log("MongoDB connection closed");
        this.isConnected = false;
      });
      this.client.on("error", (error) => {
        console.error("MongoDB connection error:", error);
        this.isConnected = false;
      });
      return this.client;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      this.isConnected = false;
      throw error;
    }
  }
  async testConnection() {
    try {
      const client = await this.getConnection();
      const db = client.db(DB_NAME);
      const collections = await db.listCollections().toArray();
      const hasCollection = collections.some((col) => col.name === COLLECTION_NAME);
      return {
        connected: true,
        stats: {
          databaseName: db.databaseName,
          collections: collections.map((col) => col.name),
          hasRequiredCollection: hasCollection
        }
      };
    } catch (error) {
      console.error("MongoDB test connection failed:", error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async findUsers(query = {}) {
    try {
      const client = await this.getConnection();
      const users = await client.db(DB_NAME).collection(COLLECTION_NAME).find(query).project({ password: 0 }).toArray();
      return { success: true, users };
    } catch (error) {
      console.error("Error finding users:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async createUser(userData) {
    try {
      const client = await this.getConnection();
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      const result = await client.db(DB_NAME).collection(COLLECTION_NAME).insertOne({
        username: userData.username,
        password: hashedPassword,
        createdAt: /* @__PURE__ */ new Date(),
        lastLogin: null
      });
      return { success: true, userId: result.insertedId };
    } catch (error) {
      console.error("Error creating user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async validateUser(credentials2) {
    try {
      const client = await this.getConnection();
      const user = await client.db(DB_NAME).collection(COLLECTION_NAME).findOne({ username: credentials2.username });
      if (!user) {
        return { success: false, error: "Invalid credentials" };
      }
      const isPasswordValid = await bcrypt.compare(credentials2.password, user.password);
      if (!isPasswordValid) {
        return { success: false, error: "Invalid credentials" };
      }
      await client.db(DB_NAME).collection(COLLECTION_NAME).updateOne(
        { _id: user._id },
        { $set: { lastLogin: /* @__PURE__ */ new Date() } }
      );
      const { password, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error("Error validating user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
};
var mongodb = MongoDBClient.getInstance();

// server/routes.ts
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

// server/mockData.ts
var credentials = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    email: "admin@anatsecurity.com",
    fullName: "Admin User",
    organization: "ANAT Security",
    department: "IT Administration",
    jobPosition: "System Administrator",
    roles: ["admin"]
  },
  {
    id: 2,
    username: "jsmith",
    password: "password123",
    email: "jsmith@anatsecurity.com",
    fullName: "John Smith",
    organization: "ANAT Security",
    department: "Threat Research",
    jobPosition: "Security Analyst",
    roles: ["analyst"]
  },
  {
    id: 3,
    username: "mjohnson",
    password: "secure456",
    email: "mjohnson@anatsecurity.com",
    fullName: "Maria Johnson",
    organization: "ANAT Security",
    department: "Forensics",
    jobPosition: "Digital Forensic Investigator",
    roles: ["investigator"]
  }
];
var searchResults = [
  {
    id: 1,
    collection: "Email Archives",
    folder: "Company/HR",
    fileName: "recruitment_2023.eml",
    content: "Username: recruiter1 Password: Summer2023! Server: mail.example.com"
  },
  {
    id: 2,
    collection: "Source Code",
    folder: "Projects/WebApp",
    fileName: "config.js",
    content: "const API_KEY = 'a1b2c3d4e5f6g7h8i9j0'; const DB_PASSWORD = 'SecureDB123!';"
  },
  {
    id: 3,
    collection: "Documentation",
    folder: "Internal/Access",
    fileName: "server_access.docx",
    content: "SSH credentials for prod server: username=sysadmin password=Pr0d@ccess2023"
  },
  {
    id: 4,
    collection: "Cloud Storage",
    folder: "Backups/Database",
    fileName: "backup_script.sh",
    content: "# Backup script using credentials\n# username: backup-user\n# password: BackM3Up!"
  },
  {
    id: 5,
    collection: "Network Scans",
    folder: "Quarterly/Q2_2023",
    fileName: "discovered_devices.csv",
    content: "Device,IP,Access,Credentials\nRouter1,192.168.1.1,Admin,admin:router@123"
  },
  {
    id: 6,
    collection: "Chat Logs",
    folder: "Teams/IT_Support",
    fileName: "march_chat.log",
    content: "John: I created a temporary account for the consultant\nUsername: temp_user\nPassword: Spring2023!"
  },
  {
    id: 7,
    collection: "Configuration Files",
    folder: "Servers/Web",
    fileName: "apache2.conf",
    content: "# Basic auth credentials\nAuthUser webmaster\nAuthPassword W3bAdmin2023!"
  },
  {
    id: 8,
    collection: "Client Data",
    folder: "Projects/Acme_Corp",
    fileName: "deployment_notes.txt",
    content: "Client portal credentials:\nURL: https://portal.acmecorp.com\nLogin: acme_admin\nPassword: AcmePortal2023!"
  }
];

// server/config/db.ts
var connectDB = async () => {
  try {
    const connection = await mongodb.testConnection();
    if (!connection.connected) {
      throw new Error(connection.error || "Failed to connect to MongoDB");
    }
    console.log("MongoDB connected successfully");
    return connection;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// server/routes.ts
var JWT_SECRET = process.env.JWT_SECRET || "ANAT_SECURITY_JWT_SECRET_KEY";
var TOKEN_EXPIRATION = "24h";
var MONGODB_URI2 = process.env.MONGODB_URI || "mongodb://46.165.254.175:50105/anat_security";
var ELASTICSEARCH_URI = process.env.ELASTICSEARCH_URI || "http://46.165.254.175:50104";
var authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
async function registerRoutes(app2) {
  await connectDB();
  app2.set("trust proxy", 1);
  app2.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://kit.fontawesome.com", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
        imgSrc: ["'self'", "data:", "https://api.qrserver.com", "https://images.unsplash.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          ELASTICSEARCH_URI,
          MONGODB_URI2.replace(/^mongodb:\/\//, "http://"),
          MONGODB_URI2.replace(/^mongodb:\/\//, "https://")
        ]
      }
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: "same-origin" }
  }));
  app2.use(cors({
    origin: process.env.CORS_ORIGIN || "http://46.165.254.175:50106",
    credentials: true
  }));
  app2.use(xss());
  app2.use(mongoSanitize());
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 100,
    // limit each IP to 100 requests per windowMs
    message: { error: "Too many requests, please try again later." }
  });
  app2.use("/api", apiLimiter);
  app2.post("/api/signup", [
    body("username").trim().notEmpty().withMessage("Username is required").isLength({ min: 3 }).withMessage("Username must be at least 3 characters long").custom(async (value) => {
      const existingUsers = await mongodb.findUsers({ username: value });
      if (existingUsers.success && existingUsers.users && existingUsers.users.length > 0) {
        throw new Error("Username already exists");
      }
      return true;
    }),
    body("password").trim().notEmpty().withMessage("Password is required").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long")
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const { username, password } = req.body;
      const result = await mongodb.createUser({ username, password });
      if (!result.success) {
        throw new Error(result.error);
      }
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Error registering user" });
    }
  });
  app2.post("/api/login", [
    body("identifier").trim().notEmpty().withMessage("Username is required"),
    body("password").trim().notEmpty().withMessage("Password is required")
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const { identifier, password } = req.body;
      const result = await mongodb.validateUser({ username: identifier, password });
      if (!result.success || !result.user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign(
        {
          id: result.user._id,
          username: result.user.username
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRATION }
      );
      res.json({
        token,
        username: result.user.username,
        id: result.user._id
      });
    } catch (error) {
      const err = error;
      console.error("Login error:", err.message);
      res.status(500).json({ error: "Error during login" });
    }
  });
  app2.get("/api/validate-token", authenticate, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    res.json({
      id: req.user.id,
      username: req.user.username
      // In a real app, we would fetch the user from the database here
    });
  });
  app2.post("/api/register-user", [
    body("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
    body("email").trim().isEmail().withMessage("Please provide a valid email"),
    body("password").trim().isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    try {
      const { username, email, password } = req.body;
      const userExists = credentials.some(
        (user) => user.username === username || user.email === email
      );
      if (userExists) {
        return res.status(400).json({ error: "Username or email already exists" });
      }
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  app2.post("/api/edit-user", authenticate, [
    body("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
    body("email").trim().isEmail().withMessage("Please provide a valid email")
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    try {
      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Edit user error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  app2.post("/api/change-password", authenticate, [
    body("currentPassword").trim().notEmpty().withMessage("Current password is required"),
    body("newPassword").trim().isLength({ min: 6 }).withMessage("New password must be at least 6 characters")
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    try {
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  app2.get("/api/users", authenticate, async (req, res) => {
    try {
      const result = await mongodb.findUsers();
      if (!result.success || !result.users) {
        throw new Error(result.error || "Failed to fetch users");
      }
      res.json(result.users.map((user) => ({
        id: user._id,
        username: user.username,
        fullName: user.fullName || "",
        email: user.email || "",
        organization: user.organization || "",
        department: user.department || "",
        jobPosition: user.jobPosition || ""
      })));
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.get("/api/search", authenticate, async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }
      const filteredResults = searchResults.filter(
        (result) => result.content.toLowerCase().includes(query.toLowerCase())
      );
      res.json(filteredResults);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });
  app2.post("/api/export", authenticate, async (req, res) => {
    try {
      res.json({ message: "Export successful" });
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Export failed" });
    }
  });
  app2.get("/api/download-excel", authenticate, (req, res) => {
    try {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=search_results.xlsx");
      res.status(200).end("Excel file content would go here");
    } catch (error) {
      console.error("Download Excel error:", error);
      res.status(500).json({ error: "Download failed" });
    }
  });
  app2.post("/api/darkweb-search", [
    body("query").trim().notEmpty().withMessage("Search query is required")
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    try {
      const { query } = req.body;
      const indicesResponse = await fetch(`${ELASTICSEARCH_URI}/_cat/indices?format=json`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      let targetIndices = "filesearchdb.fs.chunks,fs_chunks_index";
      if (indicesResponse.ok) {
        const indices = await indicesResponse.json();
        const availableIndices = indices.map((idx) => idx.index).filter((name) => !name.startsWith(".")).join(",");
        if (availableIndices) {
          targetIndices = availableIndices;
          console.log(`Searching in indices: ${targetIndices}`);
        }
      }
      const searchBody = {
        query: {
          bool: {
            should: [
              // Exact phrase matches (highest priority - 10x boost)
              { match_phrase: { data: { query, boost: 10 } } },
              { match_phrase: { content: { query, boost: 10 } } },
              { match_phrase: { text: { query, boost: 10 } } },
              { match_phrase: { body: { query, boost: 10 } } },
              { match_phrase: { filename: { query, boost: 15 } } },
              { match_phrase: { fileName: { query, boost: 15 } } },
              { match_phrase: { title: { query, boost: 15 } } },
              { match_phrase: { name: { query, boost: 15 } } },
              // Regular matches (high priority - 5x boost)
              { match: { data: { query, boost: 5 } } },
              { match: { content: { query, boost: 5 } } },
              { match: { text: { query, boost: 5 } } },
              { match: { body: { query, boost: 5 } } },
              { match: { filename: { query, boost: 8 } } },
              { match: { fileName: { query, boost: 8 } } },
              { match: { title: { query, boost: 8 } } },
              { match: { name: { query, boost: 8 } } },
              // Wildcard searches (medium priority - 2x boost)
              { wildcard: { data: { value: `*${query.toLowerCase()}*`, boost: 2 } } },
              { wildcard: { content: { value: `*${query.toLowerCase()}*`, boost: 2 } } },
              { wildcard: { text: { value: `*${query.toLowerCase()}*`, boost: 2 } } },
              { wildcard: { body: { value: `*${query.toLowerCase()}*`, boost: 2 } } },
              { wildcard: { filename: { value: `*${query.toLowerCase()}*`, boost: 3 } } },
              { wildcard: { fileName: { value: `*${query.toLowerCase()}*`, boost: 3 } } },
              { wildcard: { title: { value: `*${query.toLowerCase()}*`, boost: 3 } } },
              { wildcard: { name: { value: `*${query.toLowerCase()}*`, boost: 3 } } },
              // Fuzzy matches (lowest priority - no boost)
              { match: { data: { query, fuzziness: "AUTO" } } },
              { match: { content: { query, fuzziness: "AUTO" } } },
              { match: { text: { query, fuzziness: "AUTO" } } },
              { match: { body: { query, fuzziness: "AUTO" } } },
              { match: { filename: { query, fuzziness: "AUTO" } } },
              { match: { fileName: { query, fuzziness: "AUTO" } } },
              { match: { title: { query, fuzziness: "AUTO" } } },
              { match: { name: { query, fuzziness: "AUTO" } } }
            ],
            minimum_should_match: 1,
            // Filter to only return results that actually contain the search term
            filter: [
              {
                bool: {
                  should: [
                    { wildcard: { data: `*${query.toLowerCase()}*` } },
                    { wildcard: { content: `*${query.toLowerCase()}*` } },
                    { wildcard: { text: `*${query.toLowerCase()}*` } },
                    { wildcard: { body: `*${query.toLowerCase()}*` } },
                    { wildcard: { filename: `*${query.toLowerCase()}*` } },
                    { wildcard: { fileName: `*${query.toLowerCase()}*` } },
                    { wildcard: { title: `*${query.toLowerCase()}*` } },
                    { wildcard: { name: `*${query.toLowerCase()}*` } }
                  ],
                  minimum_should_match: 1
                }
              }
            ]
          }
        },
        _source: ["data", "content", "text", "body", "filename", "fileName", "title", "name", "url", "uploadDate", "timestamp", "created", "collection", "folder", "folderName"],
        size: 100,
        sort: [
          { "_score": { "order": "desc" } }
        ],
        highlight: {
          fields: {
            "data": {
              fragment_size: 300,
              number_of_fragments: 2,
              pre_tags: ["<mark>"],
              post_tags: ["</mark>"]
            },
            "content": {
              fragment_size: 300,
              number_of_fragments: 2,
              pre_tags: ["<mark>"],
              post_tags: ["</mark>"]
            },
            "text": {
              fragment_size: 300,
              number_of_fragments: 2,
              pre_tags: ["<mark>"],
              post_tags: ["</mark>"]
            },
            "body": {
              fragment_size: 300,
              number_of_fragments: 2,
              pre_tags: ["<mark>"],
              post_tags: ["</mark>"]
            },
            "filename": {
              fragment_size: 100,
              number_of_fragments: 1,
              pre_tags: ["<mark>"],
              post_tags: ["</mark>"]
            },
            "fileName": {
              fragment_size: 100,
              number_of_fragments: 1,
              pre_tags: ["<mark>"],
              post_tags: ["</mark>"]
            }
          }
        }
      };
      const elasticsearchResponse = await fetch(`${ELASTICSEARCH_URI}/${targetIndices}/_search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(searchBody)
      });
      if (!elasticsearchResponse.ok) {
        const errorText = await elasticsearchResponse.text();
        console.error(`Elasticsearch error (${elasticsearchResponse.status}):`, errorText);
        throw new Error(`Elasticsearch responded with status: ${elasticsearchResponse.status}`);
      }
      const elasticsearchData = await elasticsearchResponse.json();
      console.log(`Elasticsearch returned ${elasticsearchData.hits?.total?.value || 0} results`);
      const results = elasticsearchData.hits?.hits?.map((hit) => {
        const source = hit._source;
        const rawContent = source.data || source.content || source.text || source.body || "";
        const filename = source.filename || source.fileName || source.title || source.name || hit._id;
        let displayContent = "No content available";
        let contextSnippet = "";
        if (typeof rawContent === "string" && rawContent.length > 0) {
          if (hit.highlight) {
            const highlights = Object.values(hit.highlight).flat().join(" ... ");
            if (highlights.length > 0) {
              contextSnippet = highlights;
            }
          }
          if (!contextSnippet) {
            const lowerContent = rawContent.toLowerCase();
            const lowerQuery = query.toLowerCase();
            const queryIndex = lowerContent.indexOf(lowerQuery);
            if (queryIndex !== -1) {
              const start = Math.max(0, queryIndex - 200);
              const end = Math.min(rawContent.length, queryIndex + query.length + 200);
              contextSnippet = rawContent.substring(start, end);
              if (start > 0) contextSnippet = "..." + contextSnippet;
              if (end < rawContent.length) contextSnippet = contextSnippet + "...";
              const regex = new RegExp(`(${query})`, "gi");
              contextSnippet = contextSnippet.replace(regex, "<mark>$1</mark>");
            } else {
              contextSnippet = rawContent.length > 500 ? rawContent.substring(0, 500) + "..." : rawContent;
            }
          }
          displayContent = contextSnippet || (rawContent.length > 500 ? rawContent.substring(0, 500) + "..." : rawContent);
        }
        return {
          id: hit._id,
          source: filename,
          timestamp: source.uploadDate || source.timestamp || source.created || (/* @__PURE__ */ new Date()).toISOString(),
          content: displayContent,
          title: filename,
          url: source.url || filename,
          score: hit._score?.toFixed(2),
          highlight: hit.highlight,
          index: hit._index,
          collection: source.collection || hit._index,
          folder: source.folder || source.folderName || "Unknown",
          fileName: source.fileName || filename,
          matchedField: hit.highlight ? Object.keys(hit.highlight)[0] : "content"
        };
      }) || [];
      res.json({
        success: true,
        results,
        total: elasticsearchData.hits?.total?.value || 0,
        query,
        searchedIndices: targetIndices
      });
    } catch (error) {
      console.error("Dark web search error:", error);
      const err = error;
      if (err.message && (err.message.includes("fetch") || err.message.includes("ECONNREFUSED"))) {
        console.error("Connection error:", err.message);
      }
      res.status(500).json({
        error: "Dark web search failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.patch("/api/user/update-profile", authenticate, [
    body("fullName").optional().trim().isLength({ min: 1 }).withMessage("Full name cannot be empty"),
    body("email").optional().trim().isEmail().withMessage("Please provide a valid email"),
    body("organization").optional().trim(),
    body("department").optional().trim(),
    body("jobPosition").optional().trim()
  ], async (req, res) => {
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
  app2.patch("/api/user/update-username", authenticate, [
    body("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters")
  ], async (req, res) => {
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
  app2.patch("/api/user/change-password", authenticate, [
    body("currentPassword").trim().notEmpty().withMessage("Current password is required"),
    body("newPassword").trim().isLength({ min: 6 }).withMessage("New password must be at least 6 characters")
  ], async (req, res) => {
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
  app2.get("/api/db-test", async (req, res) => {
    try {
      const connection = await mongodb.testConnection();
      const testResult = {
        mongoDbConnection: connection.connected ? "connected" : "disconnected",
        connectionUrl: MONGODB_URI2.replace(/\/\/([^:]+):[^@]+@/, "//***:***@"),
        // Hide credentials
        databaseInfo: connection.stats || { error: "Failed to retrieve database information" },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("MongoDB connection test result:", testResult);
      res.json(testResult);
    } catch (error) {
      console.error("MongoDB test error:", error);
      res.status(500).json({
        error: "Failed to test MongoDB connection",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/check-user-storage", async (req, res) => {
    try {
      const allUsers = await mongodb.findUsers();
      if (!allUsers.success || !allUsers.users) {
        throw new Error(allUsers.error || "No users found");
      }
      res.json({
        collection: "people",
        count: allUsers.users.length,
        users: allUsers.users.map((u) => ({ username: u.username, _id: u._id }))
      });
    } catch (error) {
      console.error("Storage check error:", error);
      res.status(500).json({ error: "Error checking user storage" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
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
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
async function startServer() {
  try {
    const mongoConnection = await mongodb.testConnection();
    if (!mongoConnection.connected) {
      throw new Error(`MongoDB connection failed: ${mongoConnection.error}`);
    }
    log("MongoDB connected successfully");
    app.use((req, res, next) => {
      const start = Date.now();
      const path3 = req.path;
      let capturedJsonResponse = void 0;
      const originalResJson = res.json;
      res.json = function(bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };
      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path3.startsWith("/api")) {
          let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` - Response: ${JSON.stringify(capturedJsonResponse)}`;
          }
          log(logLine);
        }
      });
      next();
    });
    const httpServer = await registerRoutes(app);
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, httpServer);
    } else {
      app.use(express2.static("dist/public"));
    }
    const port = Number(process.env.PORT) || 50106;
    httpServer.listen(port, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    log(`Server startup error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
startServer();
