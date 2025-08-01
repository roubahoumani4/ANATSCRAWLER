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

    py.stdout.on('data', chunk => data += chunk);
    py.stderr.on('data', chunk => err += chunk);

    py.on('close', code => {
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
  });
}

module.exports = {
  listScans: () => runPythonCommand(['list_scans']),
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
    return new Promise((resolve, reject) => {
      const actualPath = '/var/www/anatscrawler/app/server/spiderfoot/spiderfoot_wrapper.py';
      const pythonPath = path.join(process.cwd(), 'maigret-venv/bin/python3.10');
      const env = {
        ...process.env,
        PYTHONPATH: '/var/www/anatscrawler/app/server/spiderfoot',
      };

      let scanId = require('crypto').randomBytes(4).toString('hex').toUpperCase();

      const args = [actualPath, 'start_scan', target, name];
      const py = spawn(pythonPath, args, {
        env,
        detached: true,
        stdio: 'ignore'
      });

      py.unref(); // fire and forget

      resolve({ success: true, scanId, message: 'Scan started in background' });
    });
  }
};
