// Abort scan stub
  abortScan: async (scanId) => {
    scanCache = null; // Invalidate cache
    // TODO: Implement actual scan abort logic (signal running scan, update status, etc.)
    return { scanId, aborted: true };
  },
const { spawn } = require('child_process');
const path = require('path');

function runPythonCommand(args, waitForOutput = true) {
  return new Promise((resolve, reject) => {
    // Use relative paths that work in both development and production
    const wrapperPath = path.resolve(__dirname, 'spiderfoot_wrapper.py');
    const pythonPath = process.env.NODE_ENV === 'production' 
      ? path.join(process.cwd(), 'maigret-venv', 'bin', 'python3.10')
      : 'python3';

    const env = {
      ...process.env,
      PYTHONPATH: path.join(__dirname, 'spiderfoot'),
    };

    console.log(`Running SpiderFoot command: ${pythonPath} ${wrapperPath} ${args.join(' ')}`);

    const py = spawn(pythonPath, [wrapperPath, ...args], { env });

    if (!waitForOutput) {
      py.unref();
      return resolve({ success: true, message: 'Scan started in background' });
    }

    let data = '';
    let err = '';

    py.stdout.on('data', chunk => data += chunk);
    py.stderr.on('data', chunk => err += chunk);

    py.on('close', code => {
      if (code !== 0) {
        console.error('SpiderFoot Python Error:', err);
        return reject(new Error(err || 'SpiderFoot Python error'));
      }
      try {
        const result = JSON.parse(data);
        resolve(result);
      } catch (e) {
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
  // Delete scan stub
  deleteScan: async (scanId) => {
    scanCache = null; // Invalidate cache
    // TODO: Implement actual scan deletion logic (remove scan from DB, files, etc.)
    // For now, just return success for frontend integration
    return { scanId, deleted: true };
  },
  // Abort scan stub
  abortScan: async (scanId) => {
    scanCache = null; // Invalidate cache
    // TODO: Implement actual scan abort logic (signal running scan, update status, etc.)
    return { scanId, aborted: true };
  },
  listScans: async () => {
    const now = Date.now();
    if (scanCache && (now - lastCacheTime < CACHE_TTL_MS)) {
      return scanCache;
    }
    try {
      const result = await runPythonCommand(['list_scans']);
      let scans = result.scans || [];
      const withCorrelations = await Promise.all(scans.map(async (scan) => {
        let corr = { HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
        try {
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
        } catch (e) {
          console.warn(`Failed to get correlation summary for scan ${scan[0]}:`, e.message);
        }
        return [...scan, corr];
      }));
      scanCache = { scans: withCorrelations };
      lastCacheTime = now;
      return scanCache;
    } catch (error) {
      console.error('Error in listScans:', error);
      throw error;
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
  startScan: (target, name) => {
    scanCache = null; // Invalidate cache
    return new Promise((resolve, reject) => {
      // Use relative paths that work in both development and production
      const wrapperPath = path.resolve(__dirname, 'spiderfoot_wrapper.py');
      const pythonPath = process.env.NODE_ENV === 'production' 
        ? path.join(process.cwd(), 'maigret-venv', 'bin', 'python3.10')
        : 'python3';
      
      const env = {
        ...process.env,
        PYTHONPATH: path.join(__dirname, 'spiderfoot'),
      };

      let scanId = require('crypto').randomBytes(4).toString('hex').toUpperCase();

      const args = [wrapperPath, 'start_scan', target, name];
      console.log(`Starting SpiderFoot scan: ${pythonPath} ${args.join(' ')}`);
      
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
