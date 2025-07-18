import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { registerRoutes } from "./routes";
import { mongodb } from "./lib/mongodb";
import path from 'path';
import cors from 'cors';
import cookieParser from "cookie-parser";

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

// Initialize login attempts tracking for rate limiting
app.locals.loginAttempts = {};

// Use cookie parser for reading cookies
app.use(cookieParser());

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the client/dist directory with proper MIME types
app.use(express.static(path.join(__dirname, '../client/dist'), {
  setHeaders: (res, path) => {
    // Set proper MIME types for JavaScript modules
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // Add cache headers for static assets
    if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Use more restrictive CORS configuration for production
const corsOptions = {
  origin: ["https://horus.anatsecurity.fr"],
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
      // In development, just serve a simple message - Vite dev server runs separately
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next(); // Let API routes be handled by the API router
        }
        
        res.json({
          message: 'Development server running. Use Vite dev server for frontend.',
          api: 'API endpoints available at /api/*',
          health: '/api/health'
        });
      });
    } else {
      // In production, serve static files - find the correct client directory
      // Get the deployment root directory (where the server is running from)
      const deploymentRoot = process.cwd();
      
      const possibleClientPaths = [
        path.resolve(deploymentRoot, 'client/dist'),  // Expected build output
        path.resolve(deploymentRoot, 'client'),       // Fallback location
        path.resolve(deploymentRoot, 'dist/client'),  // Alternative build location
        path.resolve(__dirname, '../client/dist'),    // Relative to bundled server
        path.resolve(__dirname, '../client'),         // Relative to bundled server fallback
        path.resolve(deploymentRoot, 'client-dist'),  // <-- Add this line for your deployment
      ];
      
      let clientDistPath: string | null = null;
      let indexHtmlPath: string | null = null;
      
      console.log(`🔍 Looking for client files from deployment root: ${deploymentRoot}`);
      console.log(`📁 Server location: ${__dirname}`);
      
      // Find the correct client path
      for (const clientPath of possibleClientPaths) {
        const potentialIndexPath = path.join(clientPath, 'index.html');
        try {
          const fs = require('fs');
          if (fs.existsSync(potentialIndexPath)) {
            clientDistPath = clientPath;
            indexHtmlPath = potentialIndexPath;
            console.log(`✅ Found client files at: ${clientDistPath}`);
            break;
          } else {
            console.log(`❌ Not found: ${potentialIndexPath}`);
          }
        } catch (e) {
          console.log(`❌ Error checking ${clientPath}:`, e instanceof Error ? e.message : String(e));
        }
      }
      
      if (!clientDistPath || !indexHtmlPath) {
        console.error('❌ Client build files not found!');
        console.error('Searched in:');
        possibleClientPaths.forEach(p => console.error(`  - ${p}`));
        console.error(`Deployment root: ${deploymentRoot}`);
        console.error(`Server location: ${__dirname}`);
        
        // List contents for debugging
        try {
          const fs = require('fs');
          console.log('Contents of deployment root:');
          fs.readdirSync(deploymentRoot).forEach((file: string) => {
            console.log(`  ${file}`);
          });
          
          if (fs.existsSync(path.join(deploymentRoot, 'client'))) {
            console.log('Contents of client directory:');
            fs.readdirSync(path.join(deploymentRoot, 'client')).forEach((file: string) => {
              console.log(`  client/${file}`);
            });
          }
        } catch (e) {
          console.error('Could not list directory contents:', e);
        }
        
        console.error('❌ Cannot start production server without client files');
        throw new Error('Client build files not found');
      }
      
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
        res.sendFile(indexHtmlPath!, (err) => {
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
