const { spawn } = require('child_process');
const path = require('path');

function runPythonCommand(args, waitForOutput = true) {
  return new Promise((resolve, reject) => {
    // Use relative paths that work in both development and production
    // Try multiple possible wrapper paths (including symbolic links)
    const possibleWrapperPaths = [
      path.resolve(__dirname, 'spiderfoot_wrapper.py'),  // Direct path
      path.resolve(process.cwd(), 'spiderfoot_wrapper.py'),  // Root level (symbolic link)
      path.resolve(__dirname, 'spiderfoot', 'spiderfoot_wrapper.py'),  // Subdirectory
    ];
    
    let wrapperPath = null;
    for (const wp of possibleWrapperPaths) {
      if (require('fs').existsSync(wp)) {
        wrapperPath = wp;
        console.log(`[SpiderFoot] Found wrapper path: ${wrapperPath}`);
        break;
      }
    }
    
    if (!wrapperPath) {
      wrapperPath = path.resolve(__dirname, 'spiderfoot_wrapper.py');  // Default fallback
      console.log(`[SpiderFoot] Using default wrapper path: ${wrapperPath}`);
    }

    // Check if we're in production and use the correct Python path
    let pythonPath;
    if (process.env.NODE_ENV === 'production') {
      // Try multiple possible Python paths in production
      const possiblePaths = [
        path.join(process.cwd(), 'maigret-venv', 'bin', 'python3.10'),  // Based on actual structure
        path.join(process.cwd(), 'maigret-venv', 'bin', 'python3'),     // Alternative Python version
        path.join(process.cwd(), 'venv', 'bin', 'python3'),            // Alternative venv
        'python3.10',
        'python3',
        'python'
      ];
      
      // Use the first available Python path
      pythonPath = possiblePaths[0]; // We'll check availability below
    } else {
      pythonPath = 'python3';
    }

    const env = {
      ...process.env,
      PYTHONPATH: path.join(__dirname, 'spiderfoot'),
    };

    console.log(`[SpiderFoot] Running command: ${pythonPath} ${wrapperPath} ${args.join(' ')}`);
    console.log(`[SpiderFoot] Environment: NODE_ENV=${process.env.NODE_ENV}, cwd=${process.cwd()}`);

    const py = spawn(pythonPath, [wrapperPath, ...args], { 
      env,
      cwd: process.cwd() // Ensure we're in the right directory
    });

    if (!waitForOutput) {
      py.unref();
      return resolve({ success: true, message: 'Scan started in background' });
    }

    let data = '';
    let err = '';

    py.stdout.on('data', chunk => {
      data += chunk;
      console.log(`[SpiderFoot] stdout: ${chunk.toString()}`);
    });
    
    py.stderr.on('data', chunk => {
      err += chunk;
      console.log(`[SpiderFoot] stderr: ${chunk.toString()}`);
    });

    py.on('close', code => {
      console.log(`[SpiderFoot] Process exited with code ${code}`);
      if (code !== 0) {
        console.error(`[SpiderFoot] Python Error (exit code ${code}):`, err);
        console.error(`[SpiderFoot] Full stdout:`, data);
        return reject(new Error(err || `SpiderFoot Python error (exit code ${code})`));
      }
      try {
        const result = JSON.parse(data);
        console.log(`[SpiderFoot] Command result:`, result);
        resolve(result);
      } catch (e) {
        console.error(`[SpiderFoot] Invalid JSON response:`, data);
        reject(new Error('Invalid JSON response from SpiderFoot: ' + data));
      }
    });

    py.on('error', (error) => {
      console.error('SpiderFoot spawn error:', error);
      reject(new Error(`Failed to start SpiderFoot process: ${error.message}`));
    });
  });
}

// In-memory cache for scan list
let scanCache = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds

module.exports = {
  // Test function to verify Python environment
  testEnvironment: async () => {
    try {
      console.log('[SpiderFoot] Testing environment...');
      const { spawn } = require('child_process');
      const path = require('path');
      const testScriptPath = path.resolve(__dirname, 'spiderfoot/test_python.py');
      
      console.log('[SpiderFoot] Test script path:', testScriptPath);
      
      const pythonPath = process.env.NODE_ENV === 'production' 
        ? path.join(process.cwd(), 'maigret-venv', 'bin', 'python3.10')
        : 'python3';
      
      const env = {
        ...process.env,
        PYTHONPATH: path.join(__dirname, 'spiderfoot'),
      };
      
      return new Promise((resolve, reject) => {
        const py = spawn(pythonPath, [testScriptPath], { env });
        
        let data = '';
        let err = '';
        
        py.stdout.on('data', chunk => {
          data += chunk;
          console.log(`[SpiderFoot] Test stdout: ${chunk.toString()}`);
        });
        
        py.stderr.on('data', chunk => {
          err += chunk;
          console.log(`[SpiderFoot] Test stderr: ${chunk.toString()}`);
        });
        
        py.on('close', code => {
          if (code !== 0) {
            console.error(`[SpiderFoot] Test failed with code ${code}:`, err);
            reject(new Error(err || `Test failed with code ${code}`));
          } else {
            try {
              const result = JSON.parse(data);
              console.log('[SpiderFoot] Test result:', result);
              resolve(result);
            } catch (e) {
              console.error('[SpiderFoot] Invalid JSON from test:', data);
              reject(new Error('Invalid JSON response from test: ' + data));
            }
          }
        });
        
        py.on('error', (error) => {
          console.error('[SpiderFoot] Test spawn error:', error);
          reject(new Error(`Failed to start test process: ${error.message}`));
        });
      });
    } catch (error) {
      console.error('[SpiderFoot] Test environment error:', error);
      throw error;
    }
  },

  // Delete scan
  deleteScan: async (scanId) => {
    scanCache = null; // Invalidate cache
    try {
      console.log(`[SpiderFoot] Deleting scan: ${scanId}`);
      const result = await runPythonCommand(['delete_scan', scanId]);
      console.log(`[SpiderFoot] Delete scan result:`, result);
      return result;
    } catch (error) {
      console.error(`[SpiderFoot] Error deleting scan ${scanId}:`, error);
      throw error;
    }
  },
  // Abort scan stub
  abortScan: async (scanId) => {
    scanCache = null; // Invalidate cache
    try {
      console.log(`[SpiderFoot] Aborting scan: ${scanId}`);
      const result = await runPythonCommand(['abort_scan', scanId]);
      console.log(`[SpiderFoot] Abort scan result:`, result);
      return result;
    } catch (error) {
      console.error(`[SpiderFoot] Error aborting scan ${scanId}:`, error);
      throw error;
    }
  },
  listScans: async () => {
    const now = Date.now();
    if (scanCache && (now - lastCacheTime < CACHE_TTL_MS)) {
      return scanCache;
    }
    try {
      console.log('[SpiderFoot] Fetching scan list...');
      const result = await runPythonCommand(['list_scans']);
      console.log('[SpiderFoot] Raw scan list result:', result);
      
      let scans = [];
      if (result && result.scans) {
        scans = Array.isArray(result.scans) ? result.scans : [];
      } else if (Array.isArray(result)) {
        scans = result;
      }
      
      console.log('[SpiderFoot] Found scans:', scans.length);
      
      // If no scans, return empty array immediately
      if (!scans || scans.length === 0) {
        scanCache = { scans: [] };
        lastCacheTime = now;
        console.log('[SpiderFoot] Returning empty scan list');
        return scanCache;
      }
      
      const withCorrelations = await Promise.all(scans.map(async (scan) => {
        let corr = { HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
        try {
          if (scan && scan[0]) {
            const corrResult = await runPythonCommand(['scan_correlation_summary', scan[0]]);
            if (corrResult && typeof corrResult === 'object') {
              if (Array.isArray(corrResult)) {
                corr = { HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
              } else {
                corr = {
                  HIGH: corrResult.HIGH || 0,
                  MEDIUM: corrResult.MEDIUM || 0,
                  LOW: corrResult.LOW || 0,
                  INFO: corrResult.INFO || 0
                };
              }
            }
          }
        } catch (e) {
          console.warn(`Failed to get correlation summary for scan ${scan[0]}:`, e.message);
        }
        return [...scan, corr];
      }));
      
      scanCache = { scans: withCorrelations };
      lastCacheTime = now;
      console.log('[SpiderFoot] Returning scan list with correlations:', scanCache);
      return scanCache;
    } catch (error) {
      console.error('Error in listScans:', error);
      // Return empty scans array instead of throwing
      return { scans: [] };
    }
  },
  scanInfo: (scanId) => runPythonCommand(['scan_info', scanId]),
  scanGraph: (scanId) => runPythonCommand(['scan_graph', scanId]),
  scanBrowse: (scanId) => runPythonCommand(['scan_browse', scanId]),
  scanResultSummary: (scanId) => runPythonCommand(['scan_result_summary', scanId]),
  scanCorrelationSummary: (scanId) => runPythonCommand(['scan_correlation_summary', scanId]),
  scanCorrelationList: (scanId) => runPythonCommand(['scan_correlation_list', scanId]),
  scanResultEvent: (scanId) => runPythonCommand(['scan_result_event', scanId]),
  scanLogs: (scanId) => runPythonCommand(['scan_logs', scanId]),
  listModules: () => runPythonCommand(['list_modules']),

  // 🔵 Detached version of scan start (non-blocking)
  startScan: async (target, name) => {
    // Invalidate cache and start scan via wrapper, returning the REAL scanId
    scanCache = null;
    try {
      console.log(`[SpiderFoot] Starting scan via wrapper for target='${target}' name='${name}'`);
      const result = await runPythonCommand(['start_scan', target, name], true);
      // Expecting { success: true, scanId, status, message }
      if (result && result.success && result.scanId) {
        console.log(`[SpiderFoot] Scan started with scanId=${result.scanId}`);
        return { success: true, scanId: result.scanId, message: result.message || 'Scan started' };
      }
      console.error('[SpiderFoot] Unexpected start_scan response:', result);
      throw new Error('Unexpected start_scan response');
    } catch (error) {
      console.error('[SpiderFoot] Failed to start scan:', error);
      throw error;
    }
  }
};
