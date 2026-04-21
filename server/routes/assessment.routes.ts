import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { Scan } from '../models/Scan';
import { logActivity } from '../utils/activityLogger';

const router = Router();

// Store for in-progress and completed jobs
interface JobStatus {
  id: string;
  target: string;
  status: 'pending' | 'running' | 'finished' | 'failed' | 'aborted';
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

// Helper to generate unique job IDs
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to clean unwanted lines from scan output
function cleanScanOutput(output: string): string {
  const lines = output.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    // Remove lines related to report generation footer
    if (trimmed === 'GENERATING COMPREHENSIVE OSINT REPORT') return false;
    if (trimmed.startsWith('[+] Professional report generated:')) return false;
    if (trimmed.startsWith('Report Location:')) return false;
    if (trimmed === 'Enhanced scan completed successfully!') return false;
    if (trimmed.startsWith("Check the '") && trimmed.includes("' directory for complete results")) return false;
    // Remove standalone separator lines at the end
    if (/^={3,}$/.test(trimmed)) {
      const lineIndex = lines.indexOf(line);
      const remainingLines = lines.slice(lineIndex + 1).filter(l => l.trim() !== '');
      // Only remove if it's one of the last few separators
      if (remainingLines.length < 3) return false;
    }
    return true;
  });
  return filtered.join('\n').trim();
}

// Helper to run the assessment in the background
function runAssessmentBackground(jobId: string, target: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'running';

  // Update DB scan status to running
  try {
    Scan.findOneAndUpdate({ jobId }, { status: 'running' }).catch(() => {});
  } catch (e) {
    // ignore
  }

  const scriptsDir = process.env.SCRIPTS_DIR || '/var/www/anatscrawler/scripts';
  const scriptPath = path.join(scriptsDir, 'osint_pro.py');

  // Deterministic, absolute output directory per job so the download route
  // can locate artifacts reliably (no more cwd-dependent relative paths).
  const scansRoot = process.env.SCANS_DIR || '/var/www/anatscrawler/scans';
  const sanitizedTarget = String(target).replace('://', '_').replace(/\//g, '_');
  const artifactDir = path.join(scansRoot, `osint_${sanitizedTarget}_${jobId}`);
  try {
    fs.mkdirSync(artifactDir, { recursive: true });
  } catch (e) {
    console.error('Failed to create artifact dir', artifactDir, e);
  }

  const args = [scriptPath, target, '-o', artifactDir];

  const python = process.env.PYTHON_BIN || process.env.SCRIPTS_PYTHON || '/var/www/anatscrawler/.venv/bin/python' || 'python3';
  const child = spawn(python, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: scriptsDir,
  });

  // Persist the artifact dir upfront so diagnose/download can always find it,
  // even if the scan crashes mid-run.
  try {
    Scan.findOneAndUpdate(
      { jobId },
      { $set: { 'parsed.artifactDir': artifactDir } },
      { upsert: true }
    ).catch(() => {});
  } catch {}

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
    const plain = cleanScanOutput(stripAnsi(stdout));

    const parsed: any = {
      ipsDiscovered: null,
      subdomainsFound: null,
      openPorts: null,
      openPortsList: null,
      criticalVulnerabilities: null,
      totalVulnerabilities: null,
      riskLevel: null,
      reportLocation: null,
      artifactDir,
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

  job.status = 'finished';
    job.result = {
      target,
      exitCode: code,
      stdout,
      stderr,
      parsed,
    };

    // Persist final scan result to DB
    try {
      Scan.findOneAndUpdate(
        { jobId },
        {
          status: 'finished',
          endTime: new Date(),
          exitCode: code,
          stdout,
          stderr,
          parsed,
          reportLocation: parsed.reportLocation || null,
        },
        { upsert: true }
      ).catch(() => {});
    } catch (e) {
      // ignore
    }
  });

  child.on('error', (err) => {
    clearTimeout(timer);
    job.status = 'failed';
    job.error = String(err);
    try {
      Scan.findOneAndUpdate({ jobId }, { status: 'failed', endTime: new Date(), error: String(err) }).catch(() => {});
    } catch (e) {
      // ignore
    }
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

    // Persist a scan document for this user
    try {
      const ownerId = (req as any).user && (req as any).user._id ? (req as any).user._id : null;
      if (ownerId) {
        await Scan.create({ jobId, owner: ownerId, target, status: 'pending', startTime: new Date() });
        
        // Log scan activity
        await logActivity(
          ownerId,
          'scan',
          'OSINT assessment initiated',
          'Assessment',
          `Started assessment for target: ${target}`,
          'success',
          { target, jobId },
          req
        );
      }
    } catch (e) {
      // ignore persistence errors to not block job start
      console.error('Failed to persist scan record:', e);
    }

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
      // If the in-memory job is gone, try to find a persisted Scan document
      try {
        const scanDoc = await Scan.findOne({ jobId }).lean();
        if (scanDoc) {
          if (scanDoc.status === 'finished') {
            const result = {
              target: scanDoc.target,
              exitCode: scanDoc.exitCode ?? null,
              stdout: scanDoc.stdout || '',
              stderr: scanDoc.stderr || '',
              parsed: scanDoc.parsed || null,
            };
            return res.json({ jobId, status: 'finished', result, scan: scanDoc });
          }

          if (scanDoc.status === 'failed') {
            return res.status(500).json({ jobId, status: 'failed', error: scanDoc.error || 'Scan failed', scan: scanDoc });
          }

          // pending or running
          const start = scanDoc.startTime ? new Date(scanDoc.startTime).getTime() : Date.now();
          const elapsedSecs = Math.floor((Date.now() - start) / 1000);
          return res.json({ jobId, status: scanDoc.status || 'pending', elapsedSeconds: elapsedSecs, scan: scanDoc });
        }
      } catch (e) {
        // ignore DB lookup errors and fallthrough to 404
        console.error('Error looking up persisted scan for status:', e);
      }

      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status === 'finished') {
      // Optionally include DB-persisted scan info if available
      try {
        const scanDoc = await Scan.findOne({ jobId: jobId }).lean();
        if (scanDoc) {
          return res.json({
            jobId,
            status: 'finished',
            result: job.result,
            scan: scanDoc,
          });
        }
      } catch (e) {
        // ignore
      }
      return res.json({
        jobId,
        status: 'finished',
        result: job.result,
      });
    }

    if (job.status === 'failed') {
      try {
        const scanDoc = await Scan.findOne({ jobId: jobId }).lean();
        if (scanDoc) {
          return res.status(500).json({ jobId, status: 'failed', error: job.error, scan: scanDoc });
        }
      } catch (e) {
        // ignore
      }
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

  // GET /scans - list scans for authenticated user (paginated)
  router.get('/scans', async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user && (req as any).user._id ? (req as any).user._id : null;
      if (!ownerId) return res.status(401).json({ error: 'User not authenticated' });

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Number(req.query.limit) || 20);
      const skip = (page - 1) * limit;

      const total = await Scan.countDocuments({ owner: ownerId });
      const scans = await Scan.find({ owner: ownerId }).sort({ startTime: -1 }).skip(skip).limit(limit).lean();

      return res.json({ total, page, limit, scans });
    } catch (err) {
      console.error('Failed to list scans:', err);
      return res.status(500).json({ error: (err as Error).message || 'Failed to list scans' });
    }
  });

  // GET /scans/:jobId - fetch a single scan (owner only)
  router.get('/scans/:jobId', async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user && (req as any).user._id ? (req as any).user._id : null;
      if (!ownerId) return res.status(401).json({ error: 'User not authenticated' });

      const { jobId } = req.params;
      const scan = await Scan.findOne({ jobId }).lean();
      if (!scan) return res.status(404).json({ error: 'Scan not found' });
      if (scan.owner.toString() !== ownerId.toString()) return res.status(403).json({ error: 'Not allowed' });

      return res.json(scan);
    } catch (err) {
      console.error('Failed to fetch scan:', err);
      return res.status(500).json({ error: (err as Error).message || 'Failed to fetch scan' });
    }
  });

  // DELETE /scans/:jobId - delete (clear) a scan for the owner
  router.delete('/scans/:jobId', async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user && (req as any).user._id ? (req as any).user._id : null;
      if (!ownerId) return res.status(401).json({ error: 'User not authenticated' });

      const { jobId } = req.params;
      const scan = await Scan.findOne({ jobId }).lean();
      if (!scan) return res.status(404).json({ error: 'Scan not found' });
      if (scan.owner.toString() !== ownerId.toString()) return res.status(403).json({ error: 'Not allowed' });

      // If the scan is running, mark it as aborted instead of deleting
      if (scan.status === 'running') {
        await Scan.updateOne({ jobId }, { 
          status: 'aborted',
          endTime: new Date()
        });
        
        // Also abort the in-memory job if it exists
        const job = jobs.get(jobId);
        if (job) {
          job.status = 'aborted';
        }
        
        return res.json({ success: true, message: 'Scan aborted', status: 'aborted' });
      }

      // For finished/failed/aborted scans, delete them
      await Scan.deleteOne({ jobId });
      return res.json({ success: true, message: 'Scan deleted' });
    } catch (err) {
      console.error('Failed to delete scan:', err);
      return res.status(500).json({ error: (err as Error).message || 'Failed to delete scan' });
    }
  });

// GET /dashboard/stats - Get aggregated dashboard statistics for the authenticated user
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user && (req as any).user._id ? (req as any).user._id : null;
    if (!ownerId) return res.status(401).json({ error: 'User not authenticated' });

    // Fetch all scans for this user
    const allScans = await Scan.find({ owner: ownerId }).lean();

    // Calculate basic metrics
    const totalScans = allScans.length;
    const completedScans = allScans.filter(s => s.status === 'finished').length;
    const runningScans = allScans.filter(s => s.status === 'running').length;
    const failedScans = allScans.filter(s => s.status === 'failed').length;
    const uniqueTargets = new Set(allScans.map(s => s.target)).size;

    // Calculate total vulnerabilities
    let totalVulnerabilities = 0;
    let criticalVulnerabilities = 0;
    allScans.forEach(scan => {
      if (scan.parsed?.totalVulnerabilities) {
        totalVulnerabilities += scan.parsed.totalVulnerabilities;
      }
      if (scan.parsed?.criticalVulnerabilities) {
        criticalVulnerabilities += scan.parsed.criticalVulnerabilities;
      }
    });

    // Calculate average scan duration (in seconds)
    let totalDuration = 0;
    let durationCount = 0;
    allScans.forEach(scan => {
      if (scan.startTime && scan.endTime) {
        const duration = (new Date(scan.endTime).getTime() - new Date(scan.startTime).getTime()) / 1000;
        totalDuration += duration;
        durationCount++;
      }
    });
    const avgScanDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

    // Status distribution
    const statusCounts: Record<string, number> = {};
    allScans.forEach(scan => {
      statusCounts[scan.status] = (statusCounts[scan.status] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: name === 'finished' ? '#10b981' : 
             name === 'running' ? '#f59e0b' : 
             name === 'failed' ? '#ef4444' : 
             name === 'aborted' ? '#8b5cf6' : '#6b7280'
    }));

    // Scans over time (last 30 days)
    const scansOverTime: Array<{ date: string; count: number }> = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = allScans.filter(scan => {
        if (!scan.startTime) return false;
        const scanDate = new Date(scan.startTime).toISOString().split('T')[0];
        return scanDate === dateStr;
      }).length;
      scansOverTime.push({ 
        date: `${date.getMonth() + 1}/${date.getDate()}`, 
        count 
      });
    }

    // Risk levels distribution
    const riskCounts: Record<string, number> = {};
    allScans.forEach(scan => {
      if (scan.parsed?.riskLevel) {
        const level = scan.parsed.riskLevel;
        riskCounts[level] = (riskCounts[level] || 0) + 1;
      }
    });
    const riskLevels = Object.entries(riskCounts).map(([level, count]) => ({ level, count }));

    // Top targets
    const targetCounts: Record<string, { count: number; lastScan: Date | string }> = {};
    allScans.forEach(scan => {
      if (!targetCounts[scan.target]) {
        targetCounts[scan.target] = { count: 0, lastScan: scan.startTime || '' };
      }
      targetCounts[scan.target].count++;
      if (scan.startTime) {
        const currentLast = targetCounts[scan.target].lastScan;
        if (!currentLast || new Date(scan.startTime).getTime() > new Date(currentLast).getTime()) {
          targetCounts[scan.target].lastScan = scan.startTime;
        }
      }
    });
    const topTargets = Object.entries(targetCounts)
      .map(([target, data]) => ({ target, scans: data.count, lastScan: data.lastScan.toString() }))
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 5);

    // Vulnerability trends (last 10 scans with vulnerabilities)
    const scansWithVulns = allScans
      .filter(s => s.parsed?.totalVulnerabilities && s.startTime)
      .sort((a, b) => new Date(b.startTime!).getTime() - new Date(a.startTime!).getTime())
      .slice(0, 10)
      .reverse();
    
    const vulnerabilityTrends = scansWithVulns.map(scan => {
      const date = new Date(scan.startTime!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date,
        critical: scan.parsed?.criticalVulnerabilities || 0,
        high: scan.parsed?.highVulnerabilities || 0,
        medium: scan.parsed?.mediumVulnerabilities || 0,
        low: scan.parsed?.lowVulnerabilities || 0,
      };
    });

    // Recent activity (last 10 scans)
    const recentActivity = allScans
      .sort((a, b) => {
        const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
        const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10)
      .map(scan => ({
        jobId: scan.jobId,
        target: scan.target,
        status: scan.status,
        startTime: scan.startTime || '',
        vulnerabilities: scan.parsed?.totalVulnerabilities
      }));

    return res.json({
      totalScans,
      completedScans,
      runningScans,
      failedScans,
      totalTargets: uniqueTargets,
      totalVulnerabilities,
      criticalVulnerabilities,
      avgScanDuration,
      scansOverTime,
      statusDistribution,
      riskLevels,
      topTargets,
      vulnerabilityTrends,
      recentActivity,
    });
  } catch (err) {
    console.error('Failed to fetch dashboard stats:', err);
    return res.status(500).json({ error: (err as Error).message || 'Failed to fetch dashboard stats' });
  }
});

// Cleanup old jobs (remove after 1 hour)
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour
  for (const [jobId, job] of jobs.entries()) {
    if (job.status === 'finished' || job.status === 'failed' || job.status === 'aborted') {
      if (now - job.startTime > maxAge) {
        jobs.delete(jobId);
      }
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

export default router;

// GET /diagnose/:jobId - Return a JSON report of PDF-generation readiness
// (used when the download button unexpectedly returns a .txt).
router.get('/diagnose/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const scan = await Scan.findOne({ jobId }).lean();
  if (!scan) return res.status(404).json({ error: 'Scan not found' });

  const scriptsDir = process.env.SCRIPTS_DIR || '/var/www/anatscrawler/scripts';
  const pythonBin =
    process.env.PYTHON_BIN ||
    process.env.SCRIPTS_PYTHON ||
    '/var/www/anatscrawler/.venv/bin/python';

  const reportLocation: string | undefined = scan.parsed?.reportLocation;
  const savedArtifactDir: string | undefined = scan.parsed?.artifactDir;
  const sanitizedTarget = String(scan.target || '').replace('://', '_').replace(/\//g, '_');
  const scansRoot = process.env.SCANS_DIR || '/var/www/anatscrawler/scans';
  const candidateArtifactDirs = [
    savedArtifactDir,
    reportLocation ? path.dirname(reportLocation) : undefined,
    path.join(scansRoot, `osint_${sanitizedTarget}_${jobId}`),
    path.join(scriptsDir, `osint_${sanitizedTarget}`),
    path.join(scriptsDir, '..', `osint_${sanitizedTarget}`),
    path.join('/var/www/anatscrawler', `osint_${sanitizedTarget}`),
    path.join(process.cwd(), `osint_${sanitizedTarget}`),
  ].filter(Boolean) as string[];

  const pdfScriptCandidates = [
    path.join(scriptsDir, 'generate_osint_pdf_report.py'),
    path.join(__dirname, '..', '..', 'scripts', 'generate_osint_pdf_report.py'),
    path.join(__dirname, '..', 'scripts', 'generate_osint_pdf_report.py'),
  ];

  const info = {
    jobId,
    target: scan.target,
    scan: {
      status: scan.status,
      reportLocation: reportLocation || null,
      reportLocationExists: reportLocation ? fs.existsSync(reportLocation) : false,
      reportLocationIsPdf: reportLocation ? reportLocation.toLowerCase().endsWith('.pdf') : false,
    },
    env: { scriptsDir, pythonBin, cwd: process.cwd() },
    pdfScript: {
      candidates: pdfScriptCandidates.map((p) => ({ path: p, exists: fs.existsSync(p) })),
      resolved: pdfScriptCandidates.find((p) => fs.existsSync(p)) || null,
    },
    artifactDirs: candidateArtifactDirs.map((d) => ({
      path: d,
      exists: fs.existsSync(d),
      files: fs.existsSync(d) && fs.statSync(d).isDirectory()
        ? fs.readdirSync(d).slice(0, 30)
        : null,
    })),
    python: { reportlabVersion: null as string | null, pythonOk: false, pythonError: null as string | null },
    generator: { stdout: null as string | null, stderr: null as string | null, exitCode: null as number | null },
  };

  // Check python / reportlab availability
  try {
    const { stdout, stderr, code } = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
      const child = spawn(pythonBin, ['-c', 'import reportlab, sys; print(reportlab.Version); print(sys.version)'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let so = '';
      let se = '';
      child.stdout.on('data', (d) => (so += d.toString()));
      child.stderr.on('data', (d) => (se += d.toString()));
      child.on('close', (c) => resolve({ stdout: so, stderr: se, code: c ?? -1 }));
      child.on('error', (e) => resolve({ stdout: '', stderr: String(e), code: -1 }));
      setTimeout(() => { try { child.kill('SIGKILL'); } catch {} resolve({ stdout: so, stderr: se + '\n[TIMEOUT]', code: -1 }); }, 10000);
    });
    info.python.pythonOk = code === 0;
    info.python.reportlabVersion = stdout.trim().split('\n')[0] || null;
    if (stderr) info.python.pythonError = stderr.trim();
  } catch (e: any) {
    info.python.pythonError = String(e?.message || e);
  }

  // Try to actually run the generator
  const pdfScript = info.pdfScript.resolved;
  const artifactDir = info.artifactDirs.find((d) => d.exists && d.files && d.files.length > 0)?.path;
  if (pdfScript && artifactDir) {
    try {
      const { stdout, stderr, code } = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
        const child = spawn(pythonBin, [pdfScript, artifactDir], { stdio: ['ignore', 'pipe', 'pipe'] });
        let so = '';
        let se = '';
        child.stdout.on('data', (d) => (so += d.toString()));
        child.stderr.on('data', (d) => (se += d.toString()));
        child.on('close', (c) => resolve({ stdout: so, stderr: se, code: c ?? -1 }));
        child.on('error', (e) => resolve({ stdout: '', stderr: String(e), code: -1 }));
        setTimeout(() => { try { child.kill('SIGKILL'); } catch {} resolve({ stdout: so, stderr: se + '\n[TIMEOUT]', code: -1 }); }, 60000);
      });
      info.generator.stdout = stdout.trim() || null;
      info.generator.stderr = stderr.trim() || null;
      info.generator.exitCode = code;
    } catch (e: any) {
      info.generator.stderr = String(e?.message || e);
    }
  }

  return res.json(info);
});

// GET /download/:jobId - Download the report artifact for a completed job (if available)
router.get('/download/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    // Try to get scan data from database
    const scan = await Scan.findOne({ jobId }).lean();
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    
    // Check if there's a report file location
    let reportLocation: string | undefined = scan.parsed?.reportLocation;

    const scriptsDirEarly = process.env.SCRIPTS_DIR || '/var/www/anatscrawler/scripts';
    const pythonBinEarly =
      process.env.PYTHON_BIN ||
      process.env.SCRIPTS_PYTHON ||
      '/var/www/anatscrawler/.venv/bin/python';

    // Collect diagnostic reasons so callers can inspect why a PDF wasn't served
    const pdfFailureReasons: string[] = [];

    // If no report location, try to locate the artifact directory on disk
    // (osint_pro.py writes outputs to `osint_<target>` under its cwd) and
    // generate a PDF on the fly. Only fall back to a plain-text dump when
    // the artifact directory truly no longer exists.
    if (!reportLocation) {
      const sanitizedTarget = String(scan.target || '')
        .replace('://', '_')
        .replace(/\//g, '_');
      const savedArtifactDir: string | undefined = scan.parsed?.artifactDir;
      const scansRoot = process.env.SCANS_DIR || '/var/www/anatscrawler/scans';
      const candidateDirs = [
        savedArtifactDir,
        path.join(scansRoot, `osint_${sanitizedTarget}_${jobId}`),
        path.join(scriptsDirEarly, `osint_${sanitizedTarget}`),
        path.join(scriptsDirEarly, '..', `osint_${sanitizedTarget}`),
        path.join('/var/www/anatscrawler', `osint_${sanitizedTarget}`),
        path.join(process.cwd(), `osint_${sanitizedTarget}`),
      ].filter(Boolean) as string[];
      const artifactDir = candidateDirs.find(
        (d) => fs.existsSync(d) && fs.statSync(d).isDirectory()
      );

      if (artifactDir) {
        const pdfScriptCandidates = [
          path.join(scriptsDirEarly, 'generate_osint_pdf_report.py'),
          path.join(__dirname, '..', '..', 'scripts', 'generate_osint_pdf_report.py'),
          path.join(__dirname, '..', 'scripts', 'generate_osint_pdf_report.py'),
        ];
        const pdfScript = pdfScriptCandidates.find((p) => fs.existsSync(p));
        if (pdfScript) {
          try {
            const generatedPath = await new Promise<string>((resolve, reject) => {
              const child = spawn(pythonBinEarly, [pdfScript, artifactDir], {
                stdio: ['ignore', 'pipe', 'pipe'],
              });
              let out = '';
              let err = '';
              child.stdout.on('data', (d) => (out += d.toString()));
              child.stderr.on('data', (d) => (err += d.toString()));
              child.on('error', reject);
              child.on('close', (code) => {
                if (code === 0 && out.trim()) {
                  const last = out.trim().split('\n').pop() as string;
                  return resolve(last.trim());
                }
                reject(new Error(err || `PDF generator exited with code ${code}`));
              });
              setTimeout(() => {
                try {
                  child.kill('SIGKILL');
                } catch {}
                reject(new Error('PDF generator timed out'));
              }, 120000);
            });

            if (generatedPath && fs.existsSync(generatedPath)) {
              try {
                await Scan.findOneAndUpdate(
                  { jobId },
                  { $set: { 'parsed.reportLocation': generatedPath, reportLocation: generatedPath } }
                ).catch(() => {});
              } catch {}
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader(
                'Content-Disposition',
                `attachment; filename="OSINT_REPORT_${scan.target}_${jobId.slice(0, 8)}.pdf"`
              );
              return res.download(generatedPath, path.basename(generatedPath));
            }
          } catch (genErr) {
            console.error('On-demand PDF generation (no reportLocation) failed:', genErr);
            pdfFailureReasons.push(`no-reportLocation-generation-failed: ${(genErr as Error).message}`);
            // fall through to text dump
          }
        } else {
          pdfFailureReasons.push(`no-reportLocation: pdf-script-not-found in ${pdfScriptCandidates.join(', ')}`);
        }
      } else {
        pdfFailureReasons.push(`no-reportLocation: artifact-dir-not-found (tried: ${candidateDirs.join(', ')})`);
      }
    }

    // If no report location, generate a comprehensive report from scan data
    if (!reportLocation) {
      if (pdfFailureReasons.length) {
        res.setHeader('X-PDF-Failure-Reason', pdfFailureReasons.join(' | ').slice(0, 500));
      }
      // Generate comprehensive report content
      let reportContent = `
================================================================================
                    ANAT SECURITY - OSINT Assessment Report
================================================================================

SCAN INFORMATION
================================================================================
Job ID:         ${jobId}
Target:         ${scan.target}
Status:         ${scan.status.toUpperCase()}
Start Time:     ${scan.startTime ? new Date(scan.startTime).toLocaleString() : 'N/A'}
End Time:       ${scan.endTime ? new Date(scan.endTime).toLocaleString() : 'N/A'}
Duration:       ${scan.startTime && scan.endTime ? 
                  Math.round((new Date(scan.endTime).getTime() - new Date(scan.startTime).getTime()) / 1000) + ' seconds' : 
                  'N/A'}

`;

      // Add summary metrics if available
      if (scan.parsed) {
        reportContent += `
ASSESSMENT SUMMARY
================================================================================
`;
        if (scan.parsed.ipsDiscovered != null) reportContent += `IPs Discovered:          ${scan.parsed.ipsDiscovered}\n`;
        if (scan.parsed.subdomainsFound != null) reportContent += `Subdomains Found:        ${scan.parsed.subdomainsFound}\n`;
        if (scan.parsed.openPorts != null) reportContent += `Open Ports:              ${scan.parsed.openPorts}\n`;
        if (scan.parsed.totalVulnerabilities != null) reportContent += `Total Vulnerabilities:   ${scan.parsed.totalVulnerabilities}\n`;
        if (scan.parsed.criticalVulnerabilities != null) reportContent += `Critical Vulnerabilities: ${scan.parsed.criticalVulnerabilities}\n`;
        if (scan.parsed.riskLevel) reportContent += `Risk Level:              ${scan.parsed.riskLevel}\n`;
        reportContent += '\n';
      }

      // Add full scan output sections
      if (scan.parsed?.sections && scan.parsed.sections.length > 0) {
        reportContent += `
DETAILED SCAN OUTPUT
================================================================================

`;
        scan.parsed.sections.forEach((section: any) => {
          const cleanedContent = cleanScanOutput(section.content);
          reportContent += `
${section.title}
${'='.repeat(section.title.length)}

${cleanedContent}

`;
        });
      } else {
        // Fallback to plain output if sections not available
        const cleanedOutput = cleanScanOutput(scan.parsed?.plainOutput || scan.stdout || 'No output available');
        reportContent += `
FULL SCAN OUTPUT
================================================================================

${cleanedOutput}

`;
      }

      reportContent += `
================================================================================
                        End of Assessment Report
================================================================================
`;
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="assessment_${scan.target}_${jobId.slice(0, 8)}.txt"`);
      return res.send(reportContent);
    }

    const rawLocation: string = reportLocation;
    const scriptsDir = process.env.SCRIPTS_DIR || '/var/www/anatscrawler/scripts';

    // If report path is relative, resolve it under the scripts dir; otherwise use as-is
    let resolved = rawLocation;
    if (!path.isAbsolute(rawLocation)) {
      resolved = path.resolve(scriptsDir, rawLocation);
    }

    // Path-traversal guard: the resolved file must live somewhere sane
    // (under scriptsDir, the deploy root, or /tmp). We do NOT require it
    // to be strictly under scriptsDir because osint_pro.py writes outputs
    // to its current-working directory.
    const real = path.resolve(resolved);
    const allowedRoots = [
      path.resolve(scriptsDir),
      path.resolve(process.cwd()),
      '/var/www/anatscrawler',
      '/tmp',
    ];
    const underAllowed = allowedRoots.some((root) => real.startsWith(root + path.sep) || real === root);
    if (!underAllowed) {
      return res.status(400).json({ error: 'Invalid report path' });
    }

    // If the report file is a PDF we can just stream it
    if (fs.existsSync(real) && real.toLowerCase().endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="OSINT_REPORT_${scan.target}_${jobId.slice(0, 8)}.pdf"`
      );
      return res.download(real, path.basename(real));
    }

    // reportLocation points to a .md (legacy) — prefer a sibling PDF if present,
    // otherwise generate one on the fly from the artifact directory.
    const artifactDir = path.dirname(real);
    const siblingPdfCandidates = [
      path.join(artifactDir, path.basename(real, path.extname(real)) + '.pdf'),
      ...(fs.existsSync(artifactDir)
        ? fs.readdirSync(artifactDir)
            .filter((f) => f.toLowerCase().endsWith('.pdf'))
            .map((f) => path.join(artifactDir, f))
        : []),
    ];
    const siblingPdf = siblingPdfCandidates.find((p) => fs.existsSync(p));
    if (siblingPdf) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="OSINT_REPORT_${scan.target}_${jobId.slice(0, 8)}.pdf"`
      );
      return res.download(siblingPdf, path.basename(siblingPdf));
    }

    // No sibling PDF — try to generate it if the artifact directory still exists
    if (fs.existsSync(artifactDir) && fs.statSync(artifactDir).isDirectory()) {
      const pdfScriptCandidates = [
        path.join(scriptsDir, 'generate_osint_pdf_report.py'),
        path.join(__dirname, '..', '..', 'scripts', 'generate_osint_pdf_report.py'),
        path.join(__dirname, '..', 'scripts', 'generate_osint_pdf_report.py'),
      ];
      const pdfScript = pdfScriptCandidates.find((p) => fs.existsSync(p));
      const pythonBin =
        process.env.PYTHON_BIN ||
        process.env.SCRIPTS_PYTHON ||
        '/var/www/anatscrawler/.venv/bin/python';

      if (pdfScript) {
        try {
          const generatedPath = await new Promise<string>((resolve, reject) => {
            const child = spawn(pythonBin, [pdfScript, artifactDir], { stdio: ['ignore', 'pipe', 'pipe'] });
            let out = '';
            let err = '';
            child.stdout.on('data', (d) => (out += d.toString()));
            child.stderr.on('data', (d) => (err += d.toString()));
            child.on('error', reject);
            child.on('close', (code) => {
              if (code === 0 && out.trim()) {
                const last = out.trim().split('\n').pop() as string;
                return resolve(last.trim());
              }
              reject(new Error(err || `PDF generator exited with code ${code}`));
            });
            // safety timeout
            setTimeout(() => {
              try {
                child.kill('SIGKILL');
              } catch {}
              reject(new Error('PDF generator timed out'));
            }, 120000);
          });

          if (generatedPath && fs.existsSync(generatedPath)) {
            // Persist the new reportLocation so future downloads are instant
            try {
              await Scan.findOneAndUpdate(
                { jobId },
                { $set: { 'parsed.reportLocation': generatedPath, reportLocation: generatedPath } }
              ).catch(() => {});
            } catch {}
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
              'Content-Disposition',
              `attachment; filename="OSINT_REPORT_${scan.target}_${jobId.slice(0, 8)}.pdf"`
            );
            return res.download(generatedPath, path.basename(generatedPath));
          }
        } catch (genErr) {
          console.error('On-demand PDF generation failed:', genErr);
          pdfFailureReasons.push(`md-path-generation-failed: ${(genErr as Error).message}`);
          // fall through to legacy markdown/pandoc path
        }
      } else {
        pdfFailureReasons.push(`md-path: pdf-script-not-found`);
      }
    }

    // If report file doesn't exist, generate report from scan data instead
    if (!fs.existsSync(real)) {
      console.log(`Report file not found at ${real}, generating from scan data instead`);
      
      // Generate comprehensive report content
      let reportContent = `
================================================================================
                    ANAT SECURITY - OSINT Assessment Report
================================================================================

SCAN INFORMATION
================================================================================
Job ID:         ${jobId}
Target:         ${scan.target}
Status:         ${scan.status.toUpperCase()}
Start Time:     ${scan.startTime ? new Date(scan.startTime).toLocaleString() : 'N/A'}
End Time:       ${scan.endTime ? new Date(scan.endTime).toLocaleString() : 'N/A'}
Duration:       ${scan.startTime && scan.endTime ? 
                  Math.round((new Date(scan.endTime).getTime() - new Date(scan.startTime).getTime()) / 1000) + ' seconds' : 
                  'N/A'}

`;

      // Add summary metrics if available
      if (scan.parsed) {
        reportContent += `
ASSESSMENT SUMMARY
================================================================================
`;
        if (scan.parsed.ipsDiscovered != null) reportContent += `IPs Discovered:          ${scan.parsed.ipsDiscovered}\n`;
        if (scan.parsed.subdomainsFound != null) reportContent += `Subdomains Found:        ${scan.parsed.subdomainsFound}\n`;
        if (scan.parsed.openPorts != null) reportContent += `Open Ports:              ${scan.parsed.openPorts}\n`;
        if (scan.parsed.totalVulnerabilities != null) reportContent += `Total Vulnerabilities:   ${scan.parsed.totalVulnerabilities}\n`;
        if (scan.parsed.criticalVulnerabilities != null) reportContent += `Critical Vulnerabilities: ${scan.parsed.criticalVulnerabilities}\n`;
        if (scan.parsed.riskLevel) reportContent += `Risk Level:              ${scan.parsed.riskLevel}\n`;
        reportContent += '\n';
      }

      // Add full scan output sections
      if (scan.parsed?.sections && scan.parsed.sections.length > 0) {
        reportContent += `
DETAILED SCAN OUTPUT
================================================================================

`;
        scan.parsed.sections.forEach((section: any) => {
          const cleanedContent = cleanScanOutput(section.content);
          reportContent += `
${section.title}
${'='.repeat(section.title.length)}

${cleanedContent}

`;
        });
      } else {
        // Fallback to plain output if sections not available
        const cleanedOutput = cleanScanOutput(scan.parsed?.plainOutput || scan.stdout || 'No output available');
        reportContent += `
FULL SCAN OUTPUT
================================================================================

${cleanedOutput}

`;
      }

      reportContent += `
================================================================================
                        End of Assessment Report
================================================================================
`;
      
      res.setHeader('Content-Type', 'text/plain');
      if (pdfFailureReasons.length) {
        res.setHeader('X-PDF-Failure-Reason', pdfFailureReasons.join(' | ').slice(0, 500));
      }
      res.setHeader('Content-Disposition', `attachment; filename="assessment_${scan.target}_${jobId.slice(0, 8)}.txt"`);
      return res.send(reportContent);
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
    const e = err as Error;
    console.error('[/download/:jobId] fatal error:', e);
    if (res.headersSent) return;
    return res.status(500).json({
      error: e.message || 'Unknown error',
      name: e.name,
      stack: (e.stack || '').split('\n').slice(0, 6).join(' | '),
    });
  }
});
