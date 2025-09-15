import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spiderFootService } from '../services/spiderfoot.service';
import { OSINT_CONFIG } from '../config';
import authenticate from '../middleware/auth';

const router = Router();

const SPIDERFOOT_TARGET = `http://127.0.0.1:${OSINT_CONFIG.SPIDERFOOT.PORT}`;
const DOCROOT = OSINT_CONFIG.SPIDERFOOT.DOCROOT;

console.log(`🕷️ SpiderFoot OSINT Route initialized:`);
console.log(`   Target: ${SPIDERFOOT_TARGET}`);
console.log(`   DocRoot: ${DOCROOT}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

// Health endpoint to ensure underlying OSINT service is up
router.get('/health', async (_req, res) => {
  try {
    console.log('🔍 OSINT health check requested');
    
    // Get current service status first
    const serviceStatus = spiderFootService.getStatus();
    console.log(`📊 Current SpiderFoot status: running=${serviceStatus.running}, config=${JSON.stringify(serviceStatus.config)}`);
    
    const result = await spiderFootService.ensureStarted();
    if (!result.ok) {
      console.error(`❌ SpiderFoot health check failed: ${result.reason}`);
      return res.status(503).json({ 
        ok: false, 
        service: 'SpiderFoot OSINT Engine',
        error: result.reason,
        status: serviceStatus.running ? 'running' : 'stopped',
        config: serviceStatus.config,
        timestamp: new Date().toISOString(),
        debug: {
          processRunning: !!serviceStatus.running,
          configHost: serviceStatus.config.host,
          configPort: serviceStatus.config.port,
          targetUrl: `http://${serviceStatus.config.host}:${serviceStatus.config.port}`
        }
      });
    }
    
    const currentStatus = spiderFootService.getStatus();
    res.json({ 
      ok: true, 
      service: 'SpiderFoot OSINT Engine',
      status: currentStatus.running ? 'running' : 'stopped',
      config: {
        host: currentStatus.config.host,
        port: currentStatus.config.port,
        docroot: currentStatus.config.docroot
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ SpiderFoot health check error:', error);
    res.status(500).json({ 
      ok: false, 
      service: 'SpiderFoot OSINT Engine',
      error: 'Internal server error during health check',
      timestamp: new Date().toISOString()
    });
  }
});

// Status endpoint for detailed information
router.get('/status', async (_req, res) => {
  try {
    const status = spiderFootService.getStatus();
    res.json({
      osint_engine: 'SpiderFoot',
      version: '4.0',
      status: status.running ? 'running' : 'stopped',
      config: status.config,
      integration: 'native',
      endpoints: {
        health: `${DOCROOT}/health`,
        web_ui: `${DOCROOT}/`,
        api: `${DOCROOT}/api`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ SpiderFoot status error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve OSINT engine status',
      timestamp: new Date().toISOString()
    });
  }
});

// Conditional authentication - health and status are public, everything else requires auth
router.use((req, res, next) => {
  const path = req.path;
  
  // Public endpoints - no authentication required
  if (path === '/health' || path === '/status' || path === '/' || path === '') {
    return next();
  }
  
  // All other endpoints require authentication
  return authenticate(req, res, next);
});

// Middleware to ensure SpiderFoot is running before proxying
router.use(async (req, res, next) => {
  try {
    console.log(`🔍 OSINT request: ${req.method} ${req.originalUrl}`);
    
    const result = await spiderFootService.ensureStarted();
    if (!result.ok) {
      console.error(`❌ Failed to start SpiderFoot: ${result.reason}`);
      return res.status(503).json({ 
        error: 'OSINT engine unavailable',
        reason: result.reason,
        service: 'SpiderFoot',
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  } catch (error) {
    console.error('❌ OSINT middleware error:', error);
    res.status(500).json({ 
      error: 'OSINT service error',
      timestamp: new Date().toISOString()
    });
  }
});

// Proxy everything under /osint to SpiderFoot, preserving path
const proxyMiddleware = createProxyMiddleware({
  target: SPIDERFOOT_TARGET,
  changeOrigin: true,
  ws: true, // Enable WebSocket support
  secure: false,
  
  // Path rewriting for native integration
  pathRewrite: (path) => {
    // We expose SpiderFoot under /osint but upstream expects to be at '/'
    const p = path || '/';
    if (p.startsWith(DOCROOT)) {
      const stripped = p.slice(DOCROOT.length);
      const rewritten = stripped.startsWith('/') ? stripped : `/${stripped}`;
      console.log(`🔄 Path rewrite: ${p} -> ${rewritten}`);
      return rewritten;
    }
    return p;
  }
});

// Add error handling and logging middleware
router.use('*', (req, res, next) => {
  // Log proxy requests in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`➡️ Proxying ${req.method} ${req.url} to SpiderFoot`);
  }
  
  // Handle proxy errors
  const originalSend = res.send;
  res.send = function(data) {
    // Add CORS headers for browser compatibility
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Allow iframe embedding for same origin
    res.header('X-Frame-Options', 'SAMEORIGIN');
    
    // Set minimal permissions policy (avoid unsupported features)
    res.header('Permissions-Policy', 'fullscreen=(self)');
    
    // Add service identification header
    res.header('X-OSINT-Engine', 'SpiderFoot-4.0');
    res.header('X-Service', 'ANAT-Security-OSINT-Platform');
    
    return originalSend.call(this, data);
  };
  
  next();
}, proxyMiddleware);

// Error handler for proxy failures
router.use('*', (err: any, req: any, res: any, next: any) => {
  console.error(`❌ SpiderFoot proxy error for ${req.url}:`, err.message);
  if (!res.headersSent) {
    res.status(502).json({
      error: 'OSINT engine proxy error',
      message: 'Unable to communicate with SpiderFoot service',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
