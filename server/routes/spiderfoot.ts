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

// Diagnostic endpoint to test direct SpiderFoot connectivity
router.get('/diagnostic', async (_req, res) => {
  try {
    console.log('🔍 Running SpiderFoot diagnostic...');
    const status = spiderFootService.getStatus();
    
    if (!status.running) {
      return res.json({
        diagnostic: 'SpiderFoot service not running',
        status: 'error',
        timestamp: new Date().toISOString()
      });
    }

    // Test direct connectivity to SpiderFoot with multiple paths
    const fetch = require('node-fetch');
    const baseUrl = `http://${status.config.host}:${status.config.port}`;
    const testPaths = ['/', '/index', '/static/spiderfoot.png', '/opts', '/newscan'];
    
    console.log(`🔍 Testing SpiderFoot connectivity: ${baseUrl}`);
    
    const results: any[] = [];
    
    for (const path of testPaths) {
      const testUrl = `${baseUrl}${path}`;
      try {
        console.log(`🔍 Testing path: ${testUrl}`);
        const response = await fetch(testUrl, { 
          timeout: 5000,
          headers: {
            'User-Agent': 'ANAT-Security-Diagnostic/1.0'
          }
        });
        
        const isOk = response.ok;
        const statusCode = response.status;
        const contentType = response.headers.get('content-type') || 'unknown';
        const contentLength = response.headers.get('content-length') || 'unknown';
        
        // Try to get a small sample of the content
        let contentSample = '';
        try {
          const text = await response.text();
          contentSample = text.slice(0, 100) + (text.length > 100 ? '...' : '');
        } catch (e) {
          contentSample = 'Could not read response body';
        }
        
        results.push({
          path,
          url: testUrl,
          status_code: statusCode,
          ok: isOk,
          content_type: contentType,
          content_length: contentLength,
          content_sample: contentSample.replace(/\n/g, ' ').trim()
        });
        
      } catch (fetchError: any) {
        console.error(`❌ Path ${path} test failed:`, fetchError?.message);
        results.push({
          path,
          url: testUrl,
          status_code: 'ERROR',
          ok: false,
          error: fetchError?.message || String(fetchError)
        });
      }
    }
    
    const successfulPaths = results.filter(r => r.ok);
    
    return res.json({
      diagnostic: 'Multi-path SpiderFoot connectivity test',
      status: successfulPaths.length > 0 ? 'success' : 'error',
      summary: {
        total_paths: testPaths.length,
        successful_paths: successfulPaths.length,
        working_paths: successfulPaths.map(r => r.path)
      },
      results,
      service_config: status.config,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ SpiderFoot diagnostic error:', error);
    res.status(500).json({ 
      diagnostic: 'Diagnostic test failed',
      error: error?.message || String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Conditional authentication - temporarily disable ALL authentication for debugging
router.use((req, res, next) => {
  const path = req.path;
  console.log(`🔐 Authentication check for path: "${path}" (originalUrl: "${req.originalUrl}")`);
  
  // Temporarily allow all requests without authentication for debugging
  console.log(`✅ Skipping authentication for debugging purposes`);
  return next();
  
  // Original authentication logic (disabled for debugging):
  // Public endpoints - no authentication required
  // if (path === '/health' || path === '/status' || path === '/' || path === '') {
  //   return next();
  // }
  // 
  // // All other endpoints require authentication
  // return authenticate(req, res, next);
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
    console.log(`🔄 Path rewrite input: "${p}", DOCROOT: "${DOCROOT}"`);
    
    if (p.startsWith(DOCROOT)) {
      const stripped = p.slice(DOCROOT.length);
      const rewritten = stripped.startsWith('/') ? stripped : `/${stripped}`;
      console.log(`🔄 Path rewrite: ${p} -> ${rewritten} (stripped: "${stripped}")`);
      return rewritten;
    }
    
    console.log(`🔄 Path rewrite: ${p} -> ${p} (no rewriting needed)`);
    return p;
  }
});

// Add error handling and logging middleware
router.use('*', (req, res, next) => {
  // Log proxy requests in development and temporarily in production for debugging
  console.log(`➡️ Proxying ${req.method} ${req.url} to SpiderFoot (originalUrl: ${req.originalUrl}, path: ${req.path})`);
  
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
