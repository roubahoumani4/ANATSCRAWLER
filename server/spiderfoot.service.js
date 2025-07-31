const { spawn } = require('child_process');
const path = require('path');

function runPythonCommand(args) {
  return new Promise((resolve, reject) => {
    
    // Use absolute path to the real script
    const actualPath = '/var/www/anatscrawler/app/server/spiderfoot/spiderfoot_wrapper.py';

    // Use the correct Python inside the virtual environment
    const pythonPath = path.join(process.cwd(), 'maigret-venv/bin/python3.10');
    
    const py = spawn(pythonPath, [actualPath, ...args]);

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
  startScan: (target, name) => runPythonCommand(['start_scan', target, name]),
  listModules: () => runPythonCommand(['list_modules']),
};
