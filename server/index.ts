import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { registerRoutes } from "./routes";
import { mongodb } from "./lib/mongodb";
import path from 'path';
import cors from 'cors';

// Simple environment loading that works with bundlers
if (process.env.NODE_ENV !== 'production') {
  try {
    // Only try to load dotenv in development
    const dotenv = require('dotenv');
    dotenv.config();
  } catch (e) {
    console.log('dotenv not available, using environment variables');
  }
}

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Use more permissive CORS configuration
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true
};

app.use(cors(corsOptions));

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

// Logging function
function log(message: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
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

    // Register API routes first
    await registerRoutes(app);

    // Handle static files and client routing
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (isDev) {
      // In development, dynamically import and setup Vite
      const { setupDevServer } = await import('./middleware/devServer');
      await setupDevServer(app, httpServer);
    } else {
      // In production, serve static files from the client/dist directory
      const clientDistPath = path.resolve(process.cwd(), 'client/dist');
      console.log('Serving static files from:', clientDistPath);
      
      // Serve static files with caching headers
      app.use(express.static(clientDistPath, {
        index: false, // Don't immediately serve index.html for '/'
        maxAge: '1d', // Cache static assets for 1 day
        etag: true,
        lastModified: true
      }));

      // Handle SPA routing - serve index.html for all non-API routes
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next(); // Let API routes be handled by the API router
        }
        
        // Send the index.html file for client-side routing
        const indexPath = path.join(clientDistPath, 'index.html');
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error('Error sending index.html:', err);
            next(err);
          }
        });
      });
    }

    const port = parseInt(process.env.PORT || '5000', 10);
    const host = '0.0.0.0';
    httpServer.listen({ port, host }, () => {
      console.log(`Server running at http://${host}:${port}`);
      console.log('You can access the server at:');
      console.log(`- Local: http://localhost:${port}`);
      console.log(`- Network: http://${host}:${port}`);
      console.log(`Environment: ${isDev ? 'development' : 'production'}`);
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
