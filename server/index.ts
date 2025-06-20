import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { mongodb } from "./lib/mongodb";
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: 'http://127.0.0.1:5000',
  credentials: true
}));

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
      if (capturedJsonResponse && !path.includes('password')) {
        logLine += ` - Response: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

let httpServer: Server | null = null;

async function startServer() {
  try {
    // Initialize database connection
    if (!await mongodb.connect()) {
      throw new Error('Failed to connect to MongoDB');
    }

    // Create HTTP server
    httpServer = createServer(app);

    // Register all routes
    await registerRoutes(app);

    // In development, set up Vite
    if (process.env.NODE_ENV !== 'production') {
      console.log('Setting up Vite development server...');
      await setupVite(app, httpServer);
    } else {
      // In production, serve static files from the dist/client directory
      const clientDistPath = path.resolve(__dirname, '../dist/client');
      console.log('Serving static files from:', clientDistPath);
      
      // Serve static files
      app.use(express.static(clientDistPath, {
        index: false, // Don't immediately serve index.html for '/'
        maxAge: '1d' // Cache static assets for 1 day
      }));

      // Handle SPA routing - serve index.html for all non-API routes
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next(); // Let API routes be handled by the API router
        }
        
        // Send the index.html file for client-side routing
        const indexPath = path.join(clientDistPath, 'index.html');
        console.log('Serving index.html for:', req.path);
        res.sendFile(indexPath);
      });
    }

    const port = process.env.PORT || 5000;
    httpServer.listen(port, () => {
      console.log(`Server running at http://127.0.0.1:${port}`);
    });

    httpServer.on('error', console.error);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Cleanup on exit
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (httpServer) {
    httpServer.close(() => {
      console.log('HTTP server closed');
      mongodb.close().catch(console.error);
    });
  }
});

startServer();
