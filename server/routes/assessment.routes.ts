import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import net from 'net';

const router = Router();

// Store for in-progress and completed jobs
interface JobStatus {
  id: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: number;
  result?: {
    target: string;
    exitCode: number | null;
    stdout: string;
    stderr: string;
    parsed: any;
  };
  error?: string;
}

const jobs = new Map<string, JobStatus>();

const isValidIPv4 = (ip: string) => {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255;
  });
};

const verifyPortStatus = (ip: string, port: number, timeoutMs: number) =>
  new Promise<{ open: boolean; latencyMs: number; error?: string }>((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    const started = Date.now();

    const conclude = (open: boolean, error?: string) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve({ open, latencyMs: Date.now() - started, error });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => conclude(true));
    socket.once('timeout', () => conclude(false, 'timeout'));
    socket.once('error', (err) => conclude(false, err?.message || 'connection error'));

    try {
      socket.connect(port, ip);
    } catch (err: any) {
      conclude(false, err?.message || 'connection error');
    }
  });

// Helper to generate unique job IDs
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to run the assessment in the background
function runAssessmentBackground(jobId: string, target: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'running';

  const scriptsDir = process.env.SCRIPTS_DIR || '/var/www/anatscrawler/scripts';
  const scriptPath = path.join(scriptsDir, 'osint_pro.py');
  const args = [scriptPath, target];

  const python = process.env.PYTHON_BIN || process.env.SCRIPTS_PYTHON || '/var/www/anatscrawler/.venv/bin/python' || 'python3';
  const child = spawn(python, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  const timeoutMs = Number(process.env.ASSESSMENT_TIMEOUT_MS || 600000); // 10 minutes for background jobs
  const timer = setTimeout(() => {
    child.kill('SIGTERM');
  }, timeoutMs);

  child.on('close', (code) => {
    clearTimeout(timer);

    const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
    const plain = stripAnsi(stdout);

    const parsed: any = {
      ipsDiscovered: null,
      subdomainsFound: null,
      openPorts: null,
      openPortsList: null,
      criticalVulnerabilities: null,
      totalVulnerabilities: null,
      riskLevel: null,
      reportLocation: null,
      summaryLines: [] as string[],
      plainOutput: plain,
      sections: [] as Array<{ title: string; content: string }>,
    };

    try {
      const reportMatch = plain.match(/Report Location:\s*(.+)/i);
      if (reportMatch) parsed.reportLocation = reportMatch[1].trim();

      // Support both legacy "Assessment Summary" and new "Scan Summary" blocks
      const summaryMatch = plain.match(/(Assessment Summary|Scan Summary)[\s\S]*$/i);
      if (summaryMatch) {
        const summary = summaryMatch[0];
        parsed.summaryLines = summary.split(/\n/).map((l) => l.trim()).filter(Boolean);
        const numMatch = (label: string) => {
          const m = summary.match(new RegExp(label + "\\s*:\\s*(\\d+)", 'i'));
          return m ? Number(m[1]) : null;
        };
        parsed.ipsDiscovered = numMatch('IPs Discovered');
        parsed.subdomainsFound = numMatch('Subdomains Found');
        parsed.openPorts = numMatch('Open Ports');
        parsed.criticalVulnerabilities = numMatch('Critical Vulnerabilities');
        parsed.totalVulnerabilities = numMatch('Total Vulnerabilities');
        const rl = summary.match(/Risk Level:\s*([A-Za-z0-9_\- ]+)/i);
        if (rl) parsed.riskLevel = rl[1].trim();
      }

      if (parsed.subdomainsFound == null) {
        const sdMatch = plain.match(/Total unique subdomains found:\s*(\d+)/i);
        if (sdMatch) parsed.subdomainsFound = Number(sdMatch[1]);
      }

      const portsSectionMatch = plain.match(/OPEN PORTS:[\s\S]*?(?:\n{2,}|7\.\s|8\.\s|9\.\s|10\.)/i);
      if (portsSectionMatch) {
        const portsText = portsSectionMatch[0];
        const lines = portsText.split(/\r?\n/);
        const entries: Array<{ ip: string; port: number; service: string; banner: string; status: string }> = [];
        const portSet = new Set<number>();

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || /^IP\s+/i.test(line) || /^-{3,}/.test(line)) continue;

          const fullMatch = line.match(/^(\d{1,3}(?:\.\d{1,3}){3})\s+(\d{1,5})\s+([A-Za-z0-9\-\/\+]+)\s+(.*?)\s+(OPEN|CLOSED|FILTERED)$/i);
          if (fullMatch) {
            const [, ip, portStr, service, banner, status] = fullMatch;
            const port = Number(portStr);
            portSet.add(port);
            entries.push({ ip, port, service, banner: banner.trim(), status: status.toUpperCase() });
            continue;
          }

          const fallback = line.match(/(\d{1,3}(?:\.\d{1,3}){3})\s+(\d{1,5})/);
          if (fallback) {
            const [, ip, portStr] = fallback;
            const port = Number(portStr);
            portSet.add(port);
            entries.push({ ip, port, service: 'unknown', banner: line, status: 'OPEN' });
          }
        }

        if (entries.length) {
          parsed.openPortsList = Array.from(portSet);
          parsed.openPortsEntries = entries;
          if (parsed.openPorts == null) parsed.openPorts = entries.length;
        }
      }

      const lines = plain.split(/\r?\n/);
      let currentTitle = '';
      let buffer: string[] = [];
      const pushSection = () => {
        if (buffer.length) {
          parsed.sections.push({ title: currentTitle || 'Output', content: buffer.join('\n') });
        }
        buffer = [];
      };

      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (/^\d+\.\s+/.test(l)) {
          pushSection();
          currentTitle = l.trim();
          continue;
        }
        if (/^={3,}$/.test(l) || /^-{3,}$/.test(l)) {
          pushSection();
          const next = (lines[i + 1] || '').trim();
          if (next) { currentTitle = next; i++; continue; }
        }
        buffer.push(l);
      }
      pushSection();
    } catch (e) {
      // parsing best-effort
    }

    job.status = 'completed';
    job.result = {
      target,
      exitCode: code,
      stdout,
      stderr,
      parsed,
    };
  });

  child.on('error', (err) => {
    clearTimeout(timer);
    job.status = 'failed';
    job.error = String(err);
  });
}

// POST /run - Start an assessment job (returns immediately with job ID)
router.post('/run', async (req: Request, res: Response) => {
  try {
    const { target } = req.body || {};
    if (!target || typeof target !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid target' });
    }

    const jobId = generateJobId();
    const job: JobStatus = {
      id: jobId,
      target,
      status: 'pending',
      startTime: Date.now(),
    };

    jobs.set(jobId, job);

    // Start the assessment in the background (non-blocking)
    setImmediate(() => {
      runAssessmentBackground(jobId, target);
    });

    // Return immediately with job ID
    return res.json({
      jobId,
      status: 'started',
      message: 'Assessment job started. Use /status/{jobId} to check progress.',
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message || 'Unknown error' });
  }
});

// GET /status/:jobId - Check status of an assessment job
router.get('/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status === 'completed') {
      return res.json({
        jobId,
        status: 'completed',
        result: job.result,
      });
    }

    if (job.status === 'failed') {
      return res.status(500).json({
        jobId,
        status: 'failed',
        error: job.error,
      });
    }

    // Still running or pending
    const elapsedSecs = Math.floor((Date.now() - job.startTime) / 1000);
    return res.json({
      jobId,
      status: job.status,
      elapsedSeconds: elapsedSecs,
      message: `Assessment ${job.status}. Running for ${elapsedSecs}s...`,
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message || 'Unknown error' });
  }
});

// Cleanup old jobs (remove after 1 hour)
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour
  for (const [jobId, job] of jobs.entries()) {
    if (job.status === 'completed' || job.status === 'failed') {
      if (now - job.startTime > maxAge) {
        jobs.delete(jobId);
      }
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

router.post('/verify-port', async (req: Request, res: Response) => {
  try {
    const { ip, port } = req.body || {};
    if (typeof ip !== 'string' || !isValidIPv4(ip)) {
      return res.status(400).json({ error: 'Invalid IP address' });
    }
    const portNum = Number(port);
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      return res.status(400).json({ error: 'Invalid port' });
    }
    const timeoutMs = Number(process.env.PORT_VERIFY_TIMEOUT_MS || 4000);
    const result = await verifyPortStatus(ip, portNum, timeoutMs);
    return res.json({
      ip,
      port: portNum,
      open: result.open,
      latencyMs: result.latencyMs,
      error: result.error,
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message || 'Verification failed' });
  }
});

export default router;

// GET /download/:jobId - Download the report artifact for a completed job (if available)
router.get('/download/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = jobs.get(jobId);
    if (!job || !job.result || !job.result.parsed || !job.result.parsed.reportLocation) {
      return res.status(404).json({ error: 'Report not found for this job' });
    }

    const rawLocation: string = job.result.parsed.reportLocation;
    const scriptsDir = process.env.SCRIPTS_DIR || '/var/www/anatscrawler/scripts';

    // If report path is relative, resolve it under the scripts dir; otherwise use as-is
    let resolved = rawLocation;
    if (!path.isAbsolute(rawLocation)) {
      resolved = path.resolve(scriptsDir, rawLocation);
    }

    // Ensure file exists and is underneath the scriptsDir for safety
    const real = path.resolve(resolved);
    if (!real.startsWith(path.resolve(scriptsDir))) {
      return res.status(400).json({ error: 'Invalid report path' });
    }

    if (!fs.existsSync(real)) {
      return res.status(404).json({ error: 'Report file not found on disk' });
    }

    // Convert markdown to PDF and send
    try {
      const mdContent = fs.readFileSync(real, 'utf-8');
      const pdfFilename = `assessment_${jobId}.pdf`;
      
      // Try to use pandoc if available, otherwise use a simple markdown-to-PDF conversion
      const pandocAvailable = await new Promise<boolean>((resolve) => {
        exec('which pandoc', (err) => {
          resolve(!err);
        });
      });

      if (pandocAvailable) {
        // Use pandoc for better markdown to PDF conversion
        const tempMd = path.join(scriptsDir, `temp_${jobId}.md`);
        const tempPdf = path.join(scriptsDir, `temp_${jobId}.pdf`);
        
        fs.writeFileSync(tempMd, mdContent);
        
        return new Promise<void>((resolvePromise, rejectPromise) => {
          exec(`pandoc "${tempMd}" -o "${tempPdf}"`, (error) => {
            if (error) {
              // Fallback: send markdown file as plain text
              fs.unlinkSync(tempMd);
              return res.download(real, path.basename(real));
            }
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
            
            const stream = fs.createReadStream(tempPdf);
            stream.pipe(res);
            
            stream.on('end', () => {
              // Cleanup temp files
              try {
                fs.unlinkSync(tempMd);
                fs.unlinkSync(tempPdf);
              } catch (e) {
                // Ignore cleanup errors
              }
              resolvePromise();
            });
            
            stream.on('error', (err) => {
              rejectPromise(err);
            });
          });
        });
      } else {
        // Fallback: send markdown file directly
        return res.download(real, path.basename(real));
      }
    } catch (convErr) {
      // Fallback: send original file
      return res.download(real, path.basename(real));
    }
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message || 'Unknown error' });
  }
});
