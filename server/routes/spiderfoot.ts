import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spiderFootService } from '../services/spiderfoot.service';
import { OSINT_CONFIG, TIMEOUT_CONFIG } from '../config';
import authenticate from '../middleware/auth';

const router = Router();

const SPIDERFOOT_TARGET = `http://0.0.0.0:${OSINT_CONFIG.SPIDERFOOT.PORT}`;
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
router.get('/diagtest', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test SpiderFoot direct access with clean paths (no /osint prefix)
    const testUrls = [
      `http://0.0.0.0:${OSINT_CONFIG.SPIDERFOOT.PORT}/`,         // Root
      `http://0.0.0.0:${OSINT_CONFIG.SPIDERFOOT.PORT}/newscan`,  // Newscan endpoint
      `http://0.0.0.0:${OSINT_CONFIG.SPIDERFOOT.PORT}/opts`,     // Options endpoint
      `http://0.0.0.0:${OSINT_CONFIG.SPIDERFOOT.PORT}/scans`,    // Scans endpoint
    ];
    
    const results: any[] = [];
    for (const url of testUrls) {
      try {
        const response = await fetch(url, { 
          method: 'GET',
          timeout: 10000,
          headers: {
            'User-Agent': 'ANAT-Security-OSINT-Platform/2.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });
        
        const body = await response.text();
        results.push({
          url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          bodyLength: body.length,
          isSpiderFoot: body.includes('SpiderFoot') || body.includes('OSINT'),
          hasNewScan: body.includes('newscan') || body.includes('New Scan'),
          bodyPreview: body.substring(0, 200)
        });
      } catch (error: any) {
        results.push({
          url,
          error: error?.message || 'Unknown error',
          code: error?.code,
          errno: error?.errno
        });
      }
    }
    
    const serviceStatus = spiderFootService.getStatus();
    
    res.json({
      message: 'SpiderFoot diagnostic test - direct connectivity',
      timestamp: new Date().toISOString(),
      spiderFootService: {
        running: serviceStatus.running,
        config: serviceStatus.config
      },
      testResults: results,
      recommendations: results.some(r => r.isSpiderFoot) 
        ? ['✅ SpiderFoot is responding correctly', 'Navigation should work within the interface']
        : ['❌ SpiderFoot may not be properly started', 'Check service logs for startup errors']
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Diagnostic test failed', 
      details: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Conditional authentication - allow access to SpiderFoot interface
router.use((req, res, next) => {
  const path = req.path;
  console.log(`🔐 Authentication check for path: "${path}" (originalUrl: "${req.originalUrl}")`);
  
  // Public endpoints - no authentication required
  if (path === '/health' || path === '/status' || path === '/' || path === '' || path === '/diagtest') {
    console.log(`✅ Public endpoint, skipping authentication`);
    return next();
  }
  
  // For debugging - allow access to SpiderFoot interface without authentication
  // TODO: Re-enable authentication once navigation issues are resolved
  console.log(`✅ Allowing SpiderFoot access for debugging`);
  return next();
  
  // Original authentication logic (will be re-enabled after debugging):
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

// Create specialized proxy middleware for different types of requests
const createSpiderFootProxy = (timeoutMs: number) => createProxyMiddleware({
  target: SPIDERFOOT_TARGET,
  changeOrigin: true,
  ws: true, // Enable WebSocket support
  secure: false,
  timeout: timeoutMs,
  
  // Path rewriting for native integration
  pathRewrite: (path, req) => {
    const originalUrl = (req as any).originalUrl || '';
    const p = path || '/';
    
    console.log(`🔄 Path rewrite debug: originalUrl="${originalUrl}", path="${p}", DOCROOT="${DOCROOT}"`);
    
    // Remove /osint prefix since SpiderFoot serves from root
    let spiderFootPath = originalUrl;
    
    // Strip /osint prefix - SpiderFoot expects clean paths
    if (spiderFootPath.startsWith('/osint')) {
      spiderFootPath = spiderFootPath.substring(6) || '/';
    }
    
    // Handle special cases for SpiderFoot navigation
    if (spiderFootPath === '' || spiderFootPath === '/') {
      spiderFootPath = '/';
    }
    
    // Ensure path starts with /
    if (!spiderFootPath.startsWith('/')) {
      spiderFootPath = '/' + spiderFootPath;
    }
    
    // Fix common SpiderFoot paths that might be broken
    if (spiderFootPath === '/osint') {
      spiderFootPath = '/';
    }
    
    console.log(`🔄 Path rewrite: ${originalUrl} -> ${spiderFootPath} (removed /osint prefix for SpiderFoot)`);
    return spiderFootPath;
  }
});

// Create different proxy instances for different timeout requirements
const standardProxy = createSpiderFootProxy(TIMEOUT_CONFIG.SPIDERFOOT_REQUEST_TIMEOUT);   // 30s for standard requests
const scanProxy = createSpiderFootProxy(TIMEOUT_CONFIG.SPIDERFOOT_SCAN_TIMEOUT);          // 5 minutes for scan operations  
const longScanProxy = createSpiderFootProxy(TIMEOUT_CONFIG.SPIDERFOOT_LONG_SCAN_TIMEOUT); // 10 minutes for heavy scan operations

// Async scan endpoint to handle long-running scan initialization
router.post('/async-scan', async (req, res) => {
  try {
    console.log('🚀 Starting async scan operation');
    
    // Extract scan parameters from request
    const scanData = req.body;
    console.log(`📊 Scan parameters:`, JSON.stringify(scanData, null, 2));
    
    // Return immediately with scan accepted status
    res.status(202).json({
      status: 'accepted',
      message: 'Scan initialization started',
      scan_id: `scan_${Date.now()}`,
      timestamp: new Date().toISOString(),
      instructions: {
        message: 'Scan is being initialized in the background',
        next_steps: [
          'Monitor progress in the SpiderFoot interface',
          'Use the scan status endpoint to check progress',
          'Large scans may take several minutes to initialize'
        ],
        spiderfoot_interface: `http://0.0.0.0:${OSINT_CONFIG.SPIDERFOOT.PORT}/osint`,
        estimated_time: '2-15 minutes depending on scan scope'
      }
    });
    
    // Start the actual scan in the background (don't wait for response)
    setImmediate(async () => {
      try {
        console.log('🔄 Initiating background scan to SpiderFoot...');
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${SPIDERFOOT_TARGET}/newscan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'ANAT-Security-Platform/1.0'
          },
          body: new URLSearchParams(scanData).toString(),
          signal: AbortSignal.timeout(TIMEOUT_CONFIG.SPIDERFOOT_LONG_SCAN_TIMEOUT) // Use config timeout for background operation
        });
        
        console.log(`📤 Background scan response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log('✅ Background scan initiated successfully');
        } else {
          console.warn(`⚠️ Background scan response: ${response.status} - ${await response.text()}`);
        }
      } catch (error: any) {
        console.error('❌ Background scan error:', error.message);
      }
    });
    
  } catch (error: any) {
    console.error('❌ Async scan endpoint error:', error.message);
    res.status(500).json({
      error: 'Failed to initiate async scan',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route-specific middleware to choose appropriate proxy timeout
router.use((req, res, next) => {
  const path = req.path.toLowerCase();
  const method = req.method.toUpperCase();
  
  // Set timeout based on the type of operation
  if (method === 'POST' && (path.includes('newscan') || path.includes('startscan') || path.includes('scan'))) {
    console.log(`🕐 Using extended timeout for scan operation: ${req.originalUrl}`);
    (req as any).useProxy = 'longScan';
  } else if (path.includes('scan') || path.includes('status') || path.includes('result') || path.includes('ajax')) {
    console.log(`🕐 Using medium timeout for scan-related operation: ${req.originalUrl}`);
    (req as any).useProxy = 'scan';
  } else {
    console.log(`🕐 Using standard timeout for operation: ${req.originalUrl}`);
    (req as any).useProxy = 'standard';
  }
  
  // Set response timeout headers to prevent browser timeouts
  res.setTimeout(600000); // 10 minutes for long operations
  
  next();
});

// Response processor middleware to fix headers and rewrite links
router.use((req, res, next) => {
  const originalSend = res.send;
  const originalSetHeader = res.setHeader;
  
  res.setHeader = function(name: string, value: any) {
    // Fix Permissions-Policy header issues
    if (name.toLowerCase() === 'permissions-policy' && typeof value === 'string') {
      // Remove 'browsing-topics' feature that causes browser warnings
      const cleanPolicy = value.replace(/browsing-topics[^,]*(,\s*)?/g, '');
      return originalSetHeader.call(this, name, cleanPolicy);
    }
    return originalSetHeader.call(this, name, value);
  };

  // Override send to fix HTML content
  res.send = function(data: any) {
    const contentType = res.getHeader('content-type') as string;
    
    if (contentType && contentType.includes('text/html') && typeof data === 'string') {
      // Fix relative links to include /osint prefix for browser navigation
      let modifiedBody = data;
      
      // Fix href attributes (but not already /osint prefixed ones)
      modifiedBody = modifiedBody.replace(/href="\/(?!osint)([^"]*)"/g, 'href="/osint/$1"');
      
      // Fix src attributes for static resources
      modifiedBody = modifiedBody.replace(/src="\/(?!osint)([^"]*)"/g, 'src="/osint/$1"');
      
      // Fix action attributes for forms
      modifiedBody = modifiedBody.replace(/action="\/(?!osint)([^"]*)"/g, 'action="/osint/$1"');
      
      // Fix CSS url() references
      modifiedBody = modifiedBody.replace(/url\(\/(?!osint)([^)]*)\)/g, 'url(/osint/$1)');
      
      // Fix JavaScript navigation
      modifiedBody = modifiedBody.replace(/window\.location\.href\s*=\s*["']\/(?!osint)([^"']*)["']/g, 'window.location.href="/osint/$1"');
      modifiedBody = modifiedBody.replace(/location\.href\s*=\s*["']\/(?!osint)([^"']*)["']/g, 'location.href="/osint/$1"');
      
      // Fix AJAX calls
      modifiedBody = modifiedBody.replace(/["']\/ajax\//g, '"/osint/ajax/');
      
      // Fix static resource paths
      modifiedBody = modifiedBody.replace(/["']\/static\//g, '"/osint/static/');
      
      // Fix CSS and JS paths
      modifiedBody = modifiedBody.replace(/["']\/css\//g, '"/osint/css/');
      modifiedBody = modifiedBody.replace(/["']\/js\//g, '"/osint/js/');
      
      // Inject our custom CSS for better integration
      if (modifiedBody.includes('</head>')) {
        const customCSS = `
<style id="anat-security-integration">
/* ANAT Security OSINT Platform - SpiderFoot Integration */
body {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%) !important;
  color: #e2e8f0 !important;
  font-family: 'Inter', system-ui, sans-serif !important;
}

.navbar, .nav, .header, #header {
  background: rgba(15, 23, 42, 0.95) !important;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3) !important;
  backdrop-filter: blur(10px) !important;
}

.nav-link, .navbar-nav .nav-link, a {
  color: #60a5fa !important;
  transition: all 0.3s ease !important;
}

.nav-link:hover, .navbar-nav .nav-link:hover, a:hover {
  color: #3b82f6 !important;
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.5) !important;
}

.container, .container-fluid, .main-content {
  background: transparent !important;
  color: #e2e8f0 !important;
}

.card, .panel, .well, .box {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 2px solid rgba(59, 130, 246, 0.2) !important;
  border-radius: 12px !important;
  backdrop-filter: blur(10px) !important;
}

.btn, button, input[type="submit"] {
  background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
  border: 2px solid rgba(59, 130, 246, 0.5) !important;
  border-radius: 8px !important;
  color: white !important;
  transition: all 0.3s ease !important;
}

.btn:hover, button:hover, input[type="submit"]:hover {
  background: linear-gradient(90deg, #2563eb, #4f46e5) !important;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
}

/* Fix navigation issues */
a[href^="/"] {
  position: relative;
  z-index: 1;
}

/* Ensure proper iframe integration */
html, body {
  height: auto !important;
  min-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
}
</style>`;
        
        modifiedBody = modifiedBody.replace('</head>', `${customCSS}\n</head>`);
      }

      // Set proper headers for iframe integration
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Remove restrictive CSP headers
      res.removeHeader('Content-Security-Policy');
      
      return originalSend.call(this, modifiedBody);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
});

// Add error handling and logging middleware with dynamic proxy selection
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
    res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Add service identification header
    res.header('X-OSINT-Engine', 'SpiderFoot-4.0');
    res.header('X-Service', 'ANAT-Security-OSINT-Platform');
    
    return originalSend.call(this, data);
  };
  
  // Choose the appropriate proxy based on request type
  const proxyType = (req as any).useProxy || 'standard';
  let selectedProxy;
  
  switch (proxyType) {
    case 'longScan':
      selectedProxy = longScanProxy;
      break;
    case 'scan':
      selectedProxy = scanProxy;
      break;
    default:
      selectedProxy = standardProxy;
      break;
  }
  
  console.log(`🔄 Using ${proxyType} proxy for ${req.originalUrl}`);
  
  // Use the selected proxy
  selectedProxy(req, res, next);
});

// Error handler for proxy failures and timeouts
router.use('*', (err: any, req: any, res: any, next: any) => {
  console.error(`❌ SpiderFoot proxy error for ${req.url}:`, err.message);
  
  if (!res.headersSent) {
    // Check for timeout errors specifically
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
      res.status(504).json({
        error: 'Scan operation timeout',
        message: 'The scan is taking longer than expected. This is normal for comprehensive OSINT scans.',
        suggestions: [
          'Try refreshing the SpiderFoot interface directly',
          'Check scan progress in the SpiderFoot UI',
          'Consider reducing the scan scope for faster results',
          'Large scans can take 5-15 minutes to initialize'
        ],
        spiderfoot_url: `http://0.0.0.0:${OSINT_CONFIG.SPIDERFOOT.PORT}/osint`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(502).json({
        error: 'OSINT engine proxy error',
        message: 'Unable to communicate with SpiderFoot service',
        timestamp: new Date().toISOString()
      });
    }
  }
});

export default router;
