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

    // Spawn python process
    const python = process.env.PYTHON_BIN || 'python3';
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
      return res.json({
        target,
        exitCode: code,
        stdout: stdout.substring(0, 20000), // cap size
        stderr: stderr.substring(0, 20000),
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
