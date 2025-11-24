import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

// POST /run - run the OSINT script against a target
router.post('/run', async (req: Request, res: Response) => {
  try {
    const { target, deepScan, checkBreaches } = req.body || {};
    if (!target || typeof target !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid target' });
    }

    // Path to script - allow override from env for testing
    const scriptsDir = process.env.SCRIPTS_DIR || '/var/www/anatscrawler/scripts';
    const scriptPath = path.join(scriptsDir, 'osint_pro.py');

    // Build args
    const args: string[] = [scriptPath, target];
    if (deepScan) args.push('--deep-scan');
    if (checkBreaches) args.push('--check-breaches');

  // Spawn python process - prefer configured PYTHON_BIN or the deployment venv
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

    // Limit execution time to avoid runaway processes
    const timeoutMs = Number(process.env.ASSESSMENT_TIMEOUT_MS || 120000); // 2 minutes default
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);

      // Remove ANSI escape sequences to produce a readable plain output
      const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
      const plain = stripAnsi(stdout);

      // Best-effort parsing for summary metrics
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

        const summaryMatch = plain.match(/Assessment Summary:[\s\S]*$/i);
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

        const portsSection = plain.match(/OPEN PORTS:[\s\S]*?\n\n/);
        if (portsSection) {
          const portsText = portsSection[0];
          const portNums = Array.from(portsText.matchAll(/^(\d+)\s+/gm)).map((m) => Number(m[1]));
          parsed.openPortsList = portNums;
          if (parsed.openPorts == null) parsed.openPorts = portNums.length;
        }

        // Split into sections by common heading patterns
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
          // Headings like '1. TITLE' or lines made of === or ---
          if (/^\d+\.\s+/.test(l)) {
            pushSection();
            currentTitle = l.trim();
            continue;
          }
          if (/^={3,}$/.test(l) || /^-{3,}$/.test(l)) {
            pushSection();
            // next line may be the title
            const next = (lines[i + 1] || '').trim();
            if (next) { currentTitle = next; i++; continue; }
          }
          buffer.push(l);
        }
        pushSection();
      } catch (e) {
        // parsing best-effort
      }

      return res.json({
        target,
        exitCode: code,
        stdout, // raw stdout (may contain ANSI)
        stderr,
        parsed,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      return res.status(500).json({ error: String(err) });
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message || 'Unknown error' });
  }
});

export default router;
