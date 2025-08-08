const { spawn } = require('child_process');
const path = require('path');

function runPythonCommand(args, waitForOutput = true) {
  return new Promise((resolve, reject) => {
    const actualPath = '/var/www/anatscrawler/app/server/spiderfoot/spiderfoot_wrapper.py';
    const pythonPath = path.join(process.cwd(), 'maigret-venv/bin/python3.10');

    const env = {
      ...process.env,
      PYTHONPATH: '/var/www/anatscrawler/app/server/spiderfoot',
    };

    const py = spawn(pythonPath, [actualPath, ...args], { env });

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
        console.error('PYTHON ERROR:', err);
        return reject(err || 'Python error');
      }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject('Invalid JSON: ' + data);
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
    // TODO: Implement actual scan abort logic (signal running scan, update status, etc.)
    return { scanId, aborted: true };
  },
  listScans: async () => {
    // Get the basic scan list (array of arrays)
    const result = await runPythonCommand(['list_scans']);
    let scans = result.scans || [];
    // For each scan, fetch correlation summary and append as 9th element
    // If correlation summary fails, use default empty object
    const withCorrelations = await Promise.all(scans.map(async (scan) => {
      let corr = { HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
      try {
        const corrResult = await runPythonCommand(['scan_correlation_summary', scan[0]]);
        if (corrResult && typeof corrResult === 'object') {
          // Accept both array and object
          if (Array.isArray(corrResult)) {
            // Not expected, but fallback
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
      } catch (e) {
        // ignore, use default
      }
      return [...scan, corr];
    }));
    return { scans: withCorrelations };
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
  startScan: (target, name) => {
    scanCache = null; // Invalidate cache
    return new Promise((resolve, reject) => {
      const actualPath = '/var/www/anatscrawler/app/server/spiderfoot/spiderfoot_wrapper.py';
      const pythonPath = path.join(process.cwd(), 'maigret-venv/bin/python3.10');
      const env = {
        ...process.env,
        PYTHONPATH: path.join(__dirname, 'spiderfoot'),
      };
      let scanId = require('crypto').randomBytes(4).toString('hex').toUpperCase();

      const args = [actualPath, 'start_scan', target, name];
      // Pipe stdout/stderr to parent so pm2 logs capture output
      const py = spawn(pythonPath, args, {
        env,
        detached: true,
        stdio: ['ignore', process.stdout, process.stderr]
      });
      py.unref(); // fire and forget
      resolve({ success: true, scanId, message: 'Scan started in background' });
    });
  }
};
