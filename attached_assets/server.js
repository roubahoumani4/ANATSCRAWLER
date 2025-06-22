const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const winston = require("winston");
const { Client } = require("@elastic/elasticsearch");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xssClean = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const { body, validationResult } = require("express-validator");


(async () => {
  const app = express();
  const PORT = 5000;
  const SECRET_KEY = process.env.SECRET_KEY || "Rfdl$GUH^vfds@04";
app.set('trust proxy', 1);
  // Security Middleware
  app.use(helmet());
  app.use(cors({
    origin: "http://192.168.1.105:5000",
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(xssClean());
  app.use(mongoSanitize());

  // Rate Limiter
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
  });
  //app.use(limiter);

  // Logger Configuration
  const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
      })
    ),
    transports: [
      new winston.transports.File({ filename: "backend.log" }),
      new winston.transports.Console(),
    ],
  });

  // MongoDB Connection
  mongoose.connect("mongodb://192.168.1.110:27017/anat_security", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

    .then(() => logger.info("Successfully connected to MongoDB on port 27017"))
    .catch((error) => logger.error(`MongoDB connection error: ${error.message}`));

  // Elasticsearch Configuration
  const esClient = new Client({ node: "http://192.168.1.110:9200" });

  // User Schema
  const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  });

  const User = mongoose.model("User", UserSchema);

  // ✅ Change Password Endpoint (Updated)
  app.post("/api/change-password", async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    try {
      // Validate user existence
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Compare current password with stored hashed password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Incorrect current password" });
      }

      // Hash the new password before saving
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update the user's password in the database
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error.message);
      res.status(500).json({ error: "Server error. Please try again later." });
    }
  });

  // Signup Endpoint
  app.post(
    "/api/register-user",
    [
      body("username").trim().isLength({ min: 3 }).escape().withMessage("Username is required"),
      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
      body("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) throw new Error("Passwords do not match");
        return true;
      }),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { username, password } = req.body;

      try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: "Username already exists" });

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });
      } catch (error) {
        logger.error(`Signup error: ${error.message}`);
        res.status(500).json({ error: "Server error. Please try again." });
      }
    }
  );

  // Alias: /api/signup for compatibility
  app.post(
    "/api/signup",
    [
      body("username").trim().isLength({ min: 3 }).escape().withMessage("Username is required"),
      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
      body("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) throw new Error("Passwords do not match");
        return true;
      }),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { username, password } = req.body;

      try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: "Username already exists" });

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });
      } catch (error) {
        logger.error(`Signup error: ${error.message}`);
        res.status(500).json({ error: "Server error. Please try again." });
      }
    }
  );

  // Login Endpoint
  app.post("/api/login", async (req, res) => {
    const { identifier, password } = req.body;

    try {
      const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
      if (!user) return res.status(400).json({ error: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

      const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: "1h" });
      res.json({ token, username: user.username });
    } catch (error) {
      console.error("Login error:", error.message);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Define GeneralInformation Schema
  const GeneralInformationSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    fullName: { type: String },
    email: { type: String },
    organization: { type: String },
    department: { type: String },
    jobPosition: { type: String },
  });

  const GeneralInformation = mongoose.model("GeneralInformation", GeneralInformationSchema);

  // Edit User Endpoint
  app.post("/api/edit-user", async (req, res) => {
    const { username, password, fullName, email, organization, department, jobPosition } = req.body;

    try {
      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ error: "Incorrect credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Incorrect credentials" });

      await GeneralInformation.findOneAndUpdate(
        { username },
        { $set: { fullName, email, organization, department, jobPosition } },
        { upsert: true, new: true }
      );

      res.json({ message: "User information updated successfully" });
    } catch (error) {
      console.error("Server Error:", error.message);
      res.status(500).json({ error: "Server error. Please check logs." });
    }
  });

  // Get All Users Endpoint
  app.get("/api/users", async (req, res) => {
    try {
      const users = await GeneralInformation.find({}, "-_id username fullName email organization department jobPosition");
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error.message);
      res.status(500).json({ error: "Server error. Could not retrieve users." });
    }
  });

  // Elasticsearch Functions and Endpoints
  async function getDynamicIndices() {
    try {
      const response = await esClient.cat.indices({ format: "json" });
      const indices = response.body || response;

      if (!Array.isArray(indices)) throw new Error("Unexpected response format from ES: expected an array");

      const filteredIndices = indices.map((index) => index.index).filter((indexName) => !indexName.startsWith("."));
      return filteredIndices;
    } catch (error) {
      logger.error(`Error fetching dynamic indices: ${error.message}`);
      return [];
    }
  }

  // List All Current Indices Endpoint
  app.get("/api/indices", async (req, res) => {
    try {
      const indices = await getDynamicIndices();
      logger.info(`Fetched indices: ${indices.join(", ")}`);
      res.json({ indices });
    } catch (error) {
      logger.error(`Error in /api/indices: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch indices." });
    }
  });

  // Total Indexed Files Endpoint
  app.get("/api/total-indexed", async (req, res) => {
    try {
      const indices = await getDynamicIndices();
      const counts = await Promise.all(
        indices.map(async (index) => {
          try {
            const countResponse = await esClient.count({ index });
            return countResponse.body ? countResponse.body.count : countResponse.count;
          } catch (error) {
            logger.error(`Error counting index ${index}: ${error.message}`);
            return 0;
          }
        })
      );
      const total = counts.reduce((sum, count) => sum + count, 0);
      logger.info(`Total indexed documents: ${total}`);
      res.json({ total });
    } catch (error) {
      logger.error(`Error fetching total indexed documents: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch total indexed documents." });
    }
  });

  // Search Using Elasticsearch Endpoint
  app.get("/api/search", async (req, res) => {
    const { query } = req.query;
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ error: "Please enter a valid query." });
    }

    try {
      const indices = await getDynamicIndices();
      if (!indices.length) return res.status(200).json({ message: "No indices available.", results: [] });

      const indicesString = indices.join(",");

      const esResponse = await esClient.search({
        index: indicesString,
        body: {
          query: {
            match: {
              content: {
                query,
                operator: "and",
              },
            },
          },
          size: 100,
        },
      });

      const results = [];
      const hits = esResponse.body ? esResponse.body.hits.hits : esResponse.hits.hits;
      if (hits) {
        for (const hit of hits) {
          const source = hit._source;
          const collection = hit._index;
          const content = source.content;
          if (!content || content.trim() === "") continue;

          const matchedContent = content
            .split("\n")
            .filter((line) => line.toLowerCase().includes(query.toLowerCase()))
            .join("\n");

          if (matchedContent) {
            results.push({
              content: matchedContent,
              fileName: source.fileName || "Unknown File",
              folderName: source.folderName || "Unknown Folder",
              collection,
            });
          }
        }
      }

      if (results.length === 0) return res.status(200).json({ message: "No results found.", results: [] });

      res.json({ results });
    } catch (error) {
      logger.error(`Search error: ${error.message}`);
      res.status(500).json({ error: "Search failed. Please try again later." });
    }
  });

  // Batch Search Endpoint
  app.post("/api/batch-search", async (req, res) => {
    const { queries } = req.body;
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: "Invalid or empty query list." });
    }

    try {
      const indices = await getDynamicIndices();
      if (!indices.length) return res.status(200).json({ found: false, data: [] });

      const indicesString = indices.join(",");

      const msearchBody = queries.flatMap((query) => [
        { index: indicesString },
        {
          query: {
            match: {
              content: {
                query,
                operator: "and",
              },
            },
          },
          size: 100,
        },
      ]);

      const msearchResponse = await esClient.msearch({ body: msearchBody });
      const results = [];

      msearchResponse.body.responses.forEach((response, queryIndex) => {
        if (response.hits?.hits) {
          response.hits.hits.forEach((hit) => {
            const source = hit._source;
            const collection = hit._index;
            const content = source.content;
            if (!content || content.trim() === "") return;

            const matchedContent = content
              .split("\n")
              .filter((line) => line.toLowerCase().includes(queries[queryIndex].toLowerCase()))
              .join("\n");

            if (matchedContent) {
              results.push({
                query: queries[queryIndex],
                content: matchedContent,
                fileName: source.fileName || "Unknown File",
                folderName: source.folderName || "Unknown Folder",
                collection,
              });
            }
          });
        }
      });

      if (results.length === 0) return res.status(200).json({ found: false, data: [] });

      res.json({ found: true, data: results });
    } catch (error) {
      logger.error(`Batch search error: ${error.message}`);
      res.status(500).json({ error: "Batch search failed. Please try again later." });
    }
  });

  // Start Server
  app.listen(5000, "0.0.0.0", () => {
    logger.info(`Server running on port 5000`);
  });
})();
