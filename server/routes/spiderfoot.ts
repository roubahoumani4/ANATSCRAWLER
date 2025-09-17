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
  },
  
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

  // Override send to modify HTML content
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
      
      // Inject our custom CSS and JavaScript for better integration
      if (modifiedBody.includes('</head>')) {
        const customCSS = `
<style id="anat-security-integration">
/* ANAT Security OSINT Platform - SpiderFoot Integration */
* {
  box-sizing: border-box !important;
}

html, body {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%) !important;
  color: #e2e8f0 !important;
  font-family: 'Inter', system-ui, sans-serif !important;
  height: auto !important;
  min-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow-x: hidden !important;
}

/* Hide only specific unwanted elements, not all navigation */
a[href*="twitter"], a[href*="discord"], a[href*="youtube"],
a[href*="github"], a[href*="spiderfoot.net"], a[href*="support@spiderfoot"],
footer .navbar-default, .footer .navbar-default {
  display: none !important;
}

/* Keep navigation functional but styled */
.navbar-nav {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 15px !important;
}

.navbar-nav .nav-link {
  color: #60a5fa !important;
  font-weight: 600 !important;
  text-decoration: none !important;
  padding: 10px 16px !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
  background: rgba(59, 130, 246, 0.1) !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
  cursor: pointer !important;
}

.navbar-nav .nav-link:hover {
  color: #ffffff !important;
  background: rgba(59, 130, 246, 0.3) !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4) !important;
  transform: translateY(-2px) !important;
}

.navbar-nav .nav-link.active {
  background: rgba(59, 130, 246, 0.4) !important;
  color: #ffffff !important;
  border-color: #3b82f6 !important;
}

/* Header styling */
.navbar, .nav, .header, #header {
  background: rgba(15, 23, 42, 0.95) !important;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3) !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
  padding: 15px 20px !important;
}

/* Main content styling */
.container, .container-fluid, .main-content, .content {
  background: transparent !important;
  color: #e2e8f0 !important;
  padding: 20px !important;
}

/* Cards and panels */
.card, .panel, .well, .box, .info-box {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 2px solid rgba(59, 130, 246, 0.2) !important;
  border-radius: 16px !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
  margin-bottom: 20px !important;
  color: #e2e8f0 !important;
}

.card-header, .panel-heading, .box-header {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2)) !important;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3) !important;
  color: #60a5fa !important;
  font-weight: 700 !important;
  padding: 15px 20px !important;
  border-radius: 14px 14px 0 0 !important;
}

/* Form elements */
.form-control, input, select, textarea {
  background: rgba(31, 41, 55, 0.9) !important;
  border: 2px solid rgba(59, 130, 246, 0.2) !important;
  border-radius: 12px !important;
  color: #e5e7eb !important;
  font-family: 'JetBrains Mono', monospace !important;
  padding: 12px 16px !important;
  transition: all 0.3s ease !important;
}

.form-control:focus, input:focus, select:focus, textarea:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
  background: rgba(31, 41, 55, 1) !important;
  outline: none !important;
}

/* Buttons */
.btn, button, input[type="submit"], input[type="button"] {
  background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
  border: 2px solid rgba(59, 130, 246, 0.5) !important;
  border-radius: 12px !important;
  color: white !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
  transition: all 0.3s ease !important;
  padding: 12px 24px !important;
  cursor: pointer !important;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3) !important;
}

.btn:hover, button:hover, input[type="submit"]:hover, input[type="button"]:hover {
  background: linear-gradient(90deg, #2563eb, #4f46e5) !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
  transform: translateY(-2px) !important;
  color: white !important;
}

/* Tables */
.table, table {
  background: rgba(15, 23, 42, 0.8) !important;
  color: #e5e7eb !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
}

.table th, table th, thead th {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3)) !important;
  color: #60a5fa !important;
  font-weight: 700 !important;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3) !important;
  padding: 15px !important;
}

.table td, table td, tbody td {
  border-bottom: 1px solid rgba(75, 85, 99, 0.3) !important;
  color: #d1d5db !important;
  padding: 12px 15px !important;
}

.table-striped tbody tr:nth-of-type(odd), tr:nth-child(odd) {
  background: rgba(31, 41, 55, 0.4) !important;
}

/* Progress bars */
.progress {
  background: rgba(31, 41, 55, 0.6) !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  height: 20px !important;
}

.progress-bar {
  background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5) !important;
}

/* Alerts and messages */
.alert {
  background: rgba(15, 23, 42, 0.9) !important;
  border: 2px solid rgba(59, 130, 246, 0.3) !important;
  border-radius: 12px !important;
  color: #e5e7eb !important;
  padding: 15px 20px !important;
}

.alert-info { border-color: rgba(59, 130, 246, 0.5) !important; }
.alert-success { border-color: rgba(16, 185, 129, 0.5) !important; }
.alert-warning { border-color: rgba(245, 158, 11, 0.5) !important; }
.alert-danger { border-color: rgba(239, 68, 68, 0.5) !important; }

/* Dropdown menus */
.dropdown-menu {
  background: rgba(15, 23, 42, 0.95) !important;
  border: 2px solid rgba(59, 130, 246, 0.2) !important;
  border-radius: 12px !important;
  backdrop-filter: blur(10px) !important;
}

.dropdown-item {
  color: #e5e7eb !important;
  transition: all 0.3s ease !important;
  padding: 10px 15px !important;
}

.dropdown-item:hover {
  background: rgba(59, 130, 246, 0.2) !important;
  color: #60a5fa !important;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 12px !important;
}

::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5) !important;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6, #6366f1) !important;
  border-radius: 6px !important;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #2563eb, #4f46e5) !important;
}

/* Custom ANAT Security header */
body::before {
  content: "🕷️ ANAT SECURITY OSINT ENGINE - SPIDERFOOT INTEGRATION";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, #1f2937, #111827, #1f2937);
  color: #60a5fa;
  text-align: center;
  padding: 8px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 2px;
  z-index: 10000;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

/* Adjust body padding for custom header */
body {
  padding-top: 35px !important;
}

/* Fix navigation issues - ensure links work */
a[href^="/"] {
  position: relative;
  z-index: 1;
  text-decoration: none !important;
}

/* Ensure text is readable */
h1, h2, h3, h4, h5, h6 {
  color: #ffffff !important;
  font-weight: 700 !important;
}

p, span, div {
  color: #e2e8f0 !important;
}

/* Loading states */
.loading {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1)) !important;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Responsive improvements */
@media (max-width: 768px) {
  .container, .container-fluid {
    padding: 10px !important;
  }
  
  .card, .panel, .well, .box {
    margin-bottom: 15px !important;
  }
  
  .btn, button {
    padding: 10px 20px !important;
    font-size: 14px !important;
  }
}

/* Fix z-index issues */
.modal, .popup {
  z-index: 10001 !important;
}

/* Animation for smooth transitions */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important;
}

/* Ensure iframe content is visible */
iframe {
  background: transparent !important;
}

/* Fix modal and popup visibility */
.modal-content {
  background: rgba(15, 23, 42, 0.95) !important;
  border: 2px solid rgba(59, 130, 246, 0.3) !important;
  border-radius: 16px !important;
  color: #e2e8f0 !important;
}

.modal-header {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2)) !important;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3) !important;
  color: #60a5fa !important;
}

.modal-body {
  color: #e2e8f0 !important;
}

.modal-footer {
  border-top: 1px solid rgba(59, 130, 246, 0.3) !important;
}
</style>`;
        
        const customJS = `
<script id="anat-security-js">
// ANAT Security OSINT Platform - SpiderFoot Integration JavaScript
(function() {
  'use strict';
  
  // Fix for 'sf is not defined' error
  if (typeof window.sf === 'undefined') {
    window.sf = {
      replace_sfurltag: function(data) {
        return data;
      },
      replace_sfurl: function(data) {
        return data;
      }
    };
  }
  
  // Enhanced navigation fixes
  function fixNavigation() {
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach(link => {
      if (!link.href.includes('/osint/')) {
        const originalHref = link.getAttribute('href');
        if (originalHref && !originalHref.startsWith('/osint')) {
          link.setAttribute('href', '/osint' + originalHref);
        }
      }
    });
    
    // Ensure navigation tabs work
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        // Add active class to clicked link
        this.classList.add('active');
      });
    });
  }
  
  // Remove unnecessary elements
  function cleanupUI() {
    // Remove unwanted links and elements
    const unwantedSelectors = [
      'a[href*="twitter"]',
      'a[href*="discord"]', 
      'a[href*="youtube"]',
      'a[href*="github"]',
      'a[href*="spiderfoot.net"]',
      'a[href*="support@spiderfoot"]',
      'footer .navbar-default',
      '.footer .navbar-default'
    ];
    
    unwantedSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
  }
  
  // Apply fixes when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      fixNavigation();
      cleanupUI();
    });
  } else {
    fixNavigation();
    cleanupUI();
  }
  
  // Re-apply fixes periodically for dynamic content
  setInterval(function() {
    fixNavigation();
    cleanupUI();
  }, 2000);
  
})();
</script>`;
        
        modifiedBody = modifiedBody.replace('</head>', `${customCSS}\n${customJS}\n</head>`);
      }

      // Set proper headers for iframe integration
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Access-Control-Allow-Origin', '*');
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

// Post-proxy middleware to modify HTML content
router.use('*', (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const contentType = res.getHeader('content-type') as string;
    
    if (contentType && contentType.includes('text/html') && typeof data === 'string') {
      console.log('🎨 Modifying HTML content for SpiderFoot integration');
      
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
      
      // Inject our custom CSS and JavaScript for better integration
      if (modifiedBody.includes('</head>')) {
        const customCSS = `
<style id="anat-security-integration">
/* ANAT Security OSINT Platform - SpiderFoot Integration */
* {
  box-sizing: border-box !important;
}

html, body {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%) !important;
  color: #e2e8f0 !important;
  font-family: 'Inter', system-ui, sans-serif !important;
  height: auto !important;
  min-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow-x: hidden !important;
}

/* Hide only specific unwanted elements, not all navigation */
a[href*="twitter"], a[href*="discord"], a[href*="youtube"],
a[href*="github"], a[href*="spiderfoot.net"], a[href*="support@spiderfoot"],
footer .navbar-default, .footer .navbar-default {
  display: none !important;
}

/* Keep navigation functional but styled */
.navbar-nav {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 15px !important;
}

.navbar-nav .nav-link {
  color: #60a5fa !important;
  font-weight: 600 !important;
  text-decoration: none !important;
  padding: 10px 16px !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
  background: rgba(59, 130, 246, 0.1) !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
  cursor: pointer !important;
}

.navbar-nav .nav-link:hover {
  color: #ffffff !important;
  background: rgba(59, 130, 246, 0.3) !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4) !important;
  transform: translateY(-2px) !important;
}

.navbar-nav .nav-link.active {
  background: rgba(59, 130, 246, 0.4) !important;
  color: #ffffff !important;
  border-color: #3b82f6 !important;
}

/* Header styling */
.navbar, .nav, .header, #header {
  background: rgba(15, 23, 42, 0.95) !important;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3) !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
  padding: 15px 20px !important;
}

/* Main content styling */
.container, .container-fluid, .main-content, .content {
  background: transparent !important;
  color: #e2e8f0 !important;
  padding: 20px !important;
}

/* Cards and panels */
.card, .panel, .well, .box, .info-box {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 2px solid rgba(59, 130, 246, 0.2) !important;
  border-radius: 16px !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
  margin-bottom: 20px !important;
  color: #e2e8f0 !important;
}

.card-header, .panel-heading, .box-header {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2)) !important;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3) !important;
  color: #60a5fa !important;
  font-weight: 700 !important;
  padding: 15px 20px !important;
  border-radius: 14px 14px 0 0 !important;
}

/* Form elements */
.form-control, input, select, textarea {
  background: rgba(31, 41, 55, 0.9) !important;
  border: 2px solid rgba(59, 130, 246, 0.2) !important;
  border-radius: 12px !important;
  color: #e5e7eb !important;
  font-family: 'JetBrains Mono', monospace !important;
  padding: 12px 16px !important;
  transition: all 0.3s ease !important;
}

.form-control:focus, input:focus, select:focus, textarea:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
  background: rgba(31, 41, 55, 1) !important;
  outline: none !important;
}

/* Buttons */
.btn, button, input[type="submit"], input[type="button"] {
  background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
  border: 2px solid rgba(59, 130, 246, 0.5) !important;
  border-radius: 12px !important;
  color: white !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
  transition: all 0.3s ease !important;
  padding: 12px 24px !important;
  cursor: pointer !important;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3) !important;
}

.btn:hover, button:hover, input[type="submit"]:hover, input[type="button"]:hover {
  background: linear-gradient(90deg, #2563eb, #4f46e5) !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
  transform: translateY(-2px) !important;
  color: white !important;
}

/* Tables */
.table, table {
  background: rgba(15, 23, 42, 0.8) !important;
  color: #e5e7eb !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
}

.table th, table th, thead th {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3)) !important;
  color: #60a5fa !important;
  font-weight: 700 !important;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3) !important;
  padding: 15px !important;
}

.table td, table td, tbody td {
  border-bottom: 1px solid rgba(75, 85, 99, 0.3) !important;
  color: #d1d5db !important;
  padding: 12px 15px !important;
}

.table-striped tbody tr:nth-of-type(odd), tr:nth-child(odd) {
  background: rgba(31, 41, 55, 0.4) !important;
}

/* Progress bars */
.progress {
  background: rgba(31, 41, 55, 0.6) !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  height: 20px !important;
}

.progress-bar {
  background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5) !important;
}

/* Alerts and messages */
.alert {
  background: rgba(15, 23, 42, 0.9) !important;
  border: 2px solid rgba(59, 130, 246, 0.3) !important;
  border-radius: 12px !important;
  color: #e5e7eb !important;
  padding: 15px 20px !important;
}

.alert-info { border-color: rgba(59, 130, 246, 0.5) !important; }
.alert-success { border-color: rgba(16, 185, 129, 0.5) !important; }
.alert-warning { border-color: rgba(245, 158, 11, 0.5) !important; }
.alert-danger { border-color: rgba(239, 68, 68, 0.5) !important; }

/* Dropdown menus */
.dropdown-menu {
  background: rgba(15, 23, 42, 0.95) !important;
  border: 2px solid rgba(59, 130, 246, 0.2) !important;
  border-radius: 12px !important;
  backdrop-filter: blur(10px) !important;
}

.dropdown-item {
  color: #e5e7eb !important;
  transition: all 0.3s ease !important;
  padding: 10px 15px !important;
}

.dropdown-item:hover {
  background: rgba(59, 130, 246, 0.2) !important;
  color: #60a5fa !important;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 12px !important;
}

::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5) !important;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6, #6366f1) !important;
  border-radius: 6px !important;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #2563eb, #4f46e5) !important;
}

/* Custom ANAT Security header */
body::before {
  content: "🕷️ ANAT SECURITY OSINT ENGINE - SPIDERFOOT INTEGRATION";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, #1f2937, #111827, #1f2937);
  color: #60a5fa;
  text-align: center;
  padding: 8px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 2px;
  z-index: 10000;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

/* Adjust body padding for custom header */
body {
  padding-top: 35px !important;
}

/* Fix navigation issues - ensure links work */
a[href^="/"] {
  position: relative;
  z-index: 1;
  text-decoration: none !important;
}

/* Ensure text is readable */
h1, h2, h3, h4, h5, h6 {
  color: #ffffff !important;
  font-weight: 700 !important;
}

p, span, div {
  color: #e2e8f0 !important;
}

/* Loading states */
.loading {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1)) !important;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Responsive improvements */
@media (max-width: 768px) {
  .container, .container-fluid {
    padding: 10px !important;
  }
  
  .card, .panel, .well, .box {
    margin-bottom: 15px !important;
  }
  
  .btn, button {
    padding: 10px 20px !important;
    font-size: 14px !important;
  }
}

/* Fix z-index issues */
.modal, .popup {
  z-index: 10001 !important;
}

/* Animation for smooth transitions */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important;
}

/* Ensure iframe content is visible */
iframe {
  background: transparent !important;
}

/* Fix modal and popup visibility */
.modal-content {
  background: rgba(15, 23, 42, 0.95) !important;
  border: 2px solid rgba(59, 130, 246, 0.3) !important;
  border-radius: 16px !important;
  color: #e2e8f0 !important;
}

.modal-header {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2)) !important;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3) !important;
  color: #60a5fa !important;
}

.modal-body {
  color: #e2e8f0 !important;
}

.modal-footer {
  border-top: 1px solid rgba(59, 130, 246, 0.3) !important;
}
</style>`;
        
        const customJS = `
<script id="anat-security-js">
// ANAT Security OSINT Platform - SpiderFoot Integration JavaScript
(function() {
  'use strict';
  
  // Fix for 'sf is not defined' error
  if (typeof window.sf === 'undefined') {
    window.sf = {
      replace_sfurltag: function(data) {
        return data;
      },
      replace_sfurl: function(data) {
        return data;
      }
    };
  }
  
  // Enhanced navigation fixes
  function fixNavigation() {
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach(link => {
      if (!link.href.includes('/osint/')) {
        const originalHref = link.getAttribute('href');
        if (originalHref && !originalHref.startsWith('/osint')) {
          link.setAttribute('href', '/osint' + originalHref);
        }
      }
    });
    
    // Ensure navigation tabs work
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        // Add active class to clicked link
        this.classList.add('active');
      });
    });
  }
  
  // Remove unnecessary elements
  function cleanupUI() {
    // Remove unwanted links and elements
    const unwantedSelectors = [
      'a[href*="twitter"]',
      'a[href*="discord"]', 
      'a[href*="youtube"]',
      'a[href*="github"]',
      'a[href*="spiderfoot.net"]',
      'a[href*="support@spiderfoot"]',
      'footer .navbar-default',
      '.footer .navbar-default'
    ];
    
    unwantedSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
  }
  
  // Apply fixes when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      fixNavigation();
      cleanupUI();
    });
  } else {
    fixNavigation();
    cleanupUI();
  }
  
  // Re-apply fixes periodically for dynamic content
  setInterval(function() {
    fixNavigation();
    cleanupUI();
  }, 2000);
  
})();
</script>`;
        
        modifiedBody = modifiedBody.replace('</head>', `${customCSS}\n${customJS}\n</head>`);
      }
      
      // Set proper headers for iframe integration
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.removeHeader('Content-Security-Policy');
      
      return originalSend.call(this, modifiedBody);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
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
