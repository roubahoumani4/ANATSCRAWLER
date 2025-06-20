import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { mongodb } from "./lib/mongodb";
import authenticate from './middleware/auth';
import path from 'path';
import cors from 'cors';

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Secure routes that require authentication
app.use('/api/secure', authenticate);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  console.log(`[${new Date().toLocaleTimeString()}] Incoming ${req.method} ${path}`);
  
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` - Response: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

let server: Server | null = null;

async function startServer() {
  try {
    if (server) {
      log('Server is already running');
      return;
    }

    // Test MongoDB connection first
    const mongoConnection = await mongodb.testConnection();
    if (!mongoConnection.connected) {
      throw new Error(`MongoDB connection failed: ${mongoConnection.error}`);
    }
    log('MongoDB connected successfully');

    // Register API routes first
    await registerRoutes(app);
    log('API routes registered');

    // Create HTTP server
    server = createServer(app);

    // Development setup - after API routes
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
      log('Vite middleware setup completed');
    } else {
      app.use('/', express.static(path.join(process.cwd(), 'dist/client')));
    }

    // Start server
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      log(`Server running on port ${port}`);
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Server startup error: ${errorMessage}`);
    process.exit(1);
  }
}

startServer();
