import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { registerRoutes } from "./routes";
import path from 'path';
import cors from 'cors';
import cookieParser from "cookie-parser";
import { ENVIRONMENT_CONFIG } from './config/environment';

// Enhanced environment loading for both development and production
import dotenv from 'dotenv';

// Load environment variables in this order:
// 1) Root .env written by CI/CD into deployment "current" directory
// 2) config.env (legacy) next to compiled dist
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Load environment variables from config files (prefer source config over dist to avoid stale env in dev)
const isProd = process.env.NODE_ENV === 'production';
// Candidate order: explicit CONFIG_FILE -> source server/config.*.env -> dist/config.*.env
const sourceConfig = path.resolve(process.cwd(), 'server', isProd ? 'config.env' : 'config.dev.env');
const distConfig = path.resolve(__dirname, isProd ? 'config.env' : 'config.dev.env');
const configFile = process.env.CONFIG_FILE
  || ((() => { try { return require('fs').existsSync(sourceConfig) ? sourceConfig : null; } catch { return null; } })())
  || distConfig;
dotenv.config({ path: configFile });

console.log(`🔧 Loading configuration from: ${configFile}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Ensure critical environment variables are set
const requiredEnvVars = {
  OSINT_MODE: process.env.OSINT_MODE || 'production',
  ENABLE_REAL_OSINT: process.env.ENABLE_REAL_OSINT || 'false', // Disabled by default until OSINT engine is configured
};

// Log configuration
console.log(`🎯 OSINT Configuration:`);
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`);
  process.env[key] = value; // Ensure they're set in process.env
});

// Debug startup if flag is set
if (process.env.DEBUG_STARTUP === 'true') {
  console.log('🔍 Debug mode: Environment variables:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   HOST: ${process.env.HOST}`);
  console.log(`   PORT: ${process.env.PORT}`);
  console.log(`   PWD: ${process.cwd()}`);
  console.log(`   __dirname: ${__dirname}`);
}

// Import MongoDB client after environment is loaded
let mongodb: any;

const app = express();

// Initialize login attempts tracking for rate limiting
app.locals.loginAttempts = {};

// Use cookie parser for reading cookies
app.use(cookieParser());

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Environment-aware static file serving
if (!ENVIRONMENT_CONFIG.IS_PRODUCTION) {
  // In development, no static file serving (handled by Vite dev server)
  console.log(`🔧 Development mode: Static files handled by Vite dev server`);
}

// Use environment-aware CORS configuration
const corsOptions = {
  origin: !ENVIRONMENT_CONFIG.IS_PRODUCTION
    ? ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]
    : ["https://horus.anatsecurity.fr"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle CORS preflight for static assets
app.options('*', cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;
  console.log(`[${new Date().toLocaleTimeString()}] Incoming ${req.method} ${requestPath}`);

  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && !requestPath.includes('password')) {
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
    // Always try to connect to MongoDB, but don't fail if it's not available
    try {
      // Dynamically import MongoDB client after environment is loaded
      const { mongodb: mongodbClient } = await import('./lib/mongodb');
      mongodb = mongodbClient;

      // Initialize database connection
      if (!await mongodb.connect()) {
        console.warn('⚠️ MongoDB connection failed, continuing without MongoDB');
        mongodb = { connect: async () => true }; // Mock MongoDB client
      } else {
        console.log('✅ MongoDB connected successfully');
      }
    } catch (error) {
      console.warn('⚠️ MongoDB not available, continuing without MongoDB:', error instanceof Error ? error.message : 'Unknown error');
      mongodb = { connect: async () => true }; // Mock MongoDB client
    }

    // Create HTTP server
    httpServer = createServer(app);

  // Register API routes first
    await registerRoutes(app);
    
  // OSINT engine integration - accessible at /osint (not /api/v1/osint)
  console.log('🔍 OSINT engine routes are registered under /osint');

    // Handle static files and client routing
    const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
      // In development, just serve a simple message - Vite dev server runs separately
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/osint')) {
          return next(); // Let API routes be handled by the API router
        }

        res.json({
          message: 'Development server running. Use Vite dev server for frontend.',
          api: 'API endpoints available at /api/*',
          health: '/api/health',
          osint: '/api/v1/osint/health'
        });
      });
    } else {
      // In production, serve static files - find the correct client directory
      // Get the deployment root directory (where the server is running from)
      const deploymentRoot = process.cwd();

      const possibleClientPaths = [
        path.resolve(deploymentRoot, 'client/dist'),      // Expected build output (primary)
        path.resolve(deploymentRoot, 'dist/client'),      // Alternative build location  
        path.resolve(deploymentRoot, 'client'),           // Fallback location
        // Add absolute paths for common deployment scenarios
        '/var/www/anatscrawler/current/client/dist',      // Current deployment path (lowercase)
        '/var/www/ANATSCRAWLER/current/client/dist',      // Current deployment path (uppercase)
        '/var/www/anatscrawler/dist/client',              // Alternative production path (lowercase)
        '/var/www/ANATSCRAWLER/dist/client',              // Alternative production path (uppercase)
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
        console.warn('⚠️ Client build files not found! Server will run in API-only mode.');
        console.warn('Searched in:');
        possibleClientPaths.forEach(p => console.warn(`  - ${p}`));
        console.warn(`Deployment root: ${deploymentRoot}`);
        console.warn(`Server location: ${__dirname}`);

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

          // Also check the parent directory
          const parentDir = path.dirname(deploymentRoot);
          if (fs.existsSync(parentDir)) {
            console.log(`Contents of parent directory (${parentDir}):`);
            fs.readdirSync(parentDir).forEach((file: string) => {
              console.log(`  ${file}`);
            });
          }
        } catch (e) {
          console.error('Could not list directory contents:', e);
        }

        // Continue in API-only mode instead of failing
        console.warn('⚠️ Continuing in API-only mode without client files');
        
        // Serve a simple message for all non-API routes
        app.get('*', (req, res, next) => {
          if (req.path.startsWith('/api') || req.path.startsWith('/osint') || req.path.startsWith('/health')) {
            return next(); // Let API routes be handled by the API router
          }

          res.json({
            status: 'api-only',
            message: 'Server running in API-only mode. Client files not found.',
            api: 'API endpoints available at /api/*',
            health: '/health',
            osint: '/osint/health',
            timestamp: new Date().toISOString()
          });
        });
      } else {

      console.log('Serving static files from:', clientDistPath);

      // Serve static files with caching headers and proper MIME types
      app.use(express.static(clientDistPath, {
        index: false, // Don't immediately serve index.html for '/'
        maxAge: '1d', // Cache static assets for 1 day
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
          // Set proper MIME types for JavaScript modules
          if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          }
          // Ensure CSS is served with correct content-type to satisfy X-Content-Type-Options: nosniff
          if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
          }

          // Add cache headers for static assets
          if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }

          // Set Cross-Origin-Resource-Policy headers for security
          if (filePath.endsWith('.ico') || filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.gif') || filePath.endsWith('.svg')) {
            // Allow cross-origin access to images and icons
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Access-Control-Allow-Origin', '*');
          } else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
            // Restrict cross-origin access to scripts and stylesheets
            res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
          } else {
            // Default policy for other resources
            res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
          }

          // Additional security headers
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
        }
      }));

      // Handle SPA routing - serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
        if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/scan') ||
      req.path.startsWith('/osint')
        ) {
          return next(); // Let API routes be handled by the API router
        }

        // Special handling for favicon.ico
        if (req.path === '/favicon.ico') {
          const faviconPath = path.join(clientDistPath, 'favicon.ico');
          try {
            const fs = require('fs');
            if (fs.existsSync(faviconPath)) {
              res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              res.setHeader('Content-Type', 'image/x-icon');
              res.sendFile(faviconPath);
              return;
            }
          } catch (e) {
            // Continue to fallback if favicon not found
          }
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
    }

    const port = parseInt(process.env.PORT || '5000', 10);
    const host = process.env.HOST || '0.0.0.0';
    console.log(`🚀 Starting server on ${host}:${port}...`);
    httpServer.listen({ port, host }, () => {
      console.log(`✅ Server successfully started at http://${host}:${port}`);
      console.log('You can access the server at:');
      console.log(`- Local: http://localhost:${port}`);
      console.log(`- Network: http://${host}:${port}`);
      console.log(`Environment: ${isDev ? 'development' : 'production'}`);
      console.log(`🏥 Health check: http://localhost:${port}/health`);
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
      // Only close MongoDB if it's a real connection (not a mock)
      if (mongodb && typeof mongodb.close === 'function') {
        mongodb.close().catch(console.error);
      } else if (mongodb && typeof mongodb.disconnect === 'function') {
        mongodb.disconnect().catch(console.error);
      }
    });
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  if (httpServer) {
    httpServer.close(() => {
      console.log('HTTP server closed');
      // Only close MongoDB if it's a real connection (not a mock)
      if (mongodb && typeof mongodb.close === 'function') {
        mongodb.close().catch(console.error);
      } else if (mongodb && typeof mongodb.disconnect === 'function') {
        mongodb.disconnect().catch(console.error);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

startServer();
