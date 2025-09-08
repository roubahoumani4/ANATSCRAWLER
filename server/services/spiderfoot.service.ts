import path from 'path';
import fs from 'fs';
import { spawn, SpawnOptionsWithoutStdio, ChildProcessWithoutNullStreams } from 'child_process';
import fetch from 'node-fetch';

type StartResult = { ok: boolean; reason?: string };

class SpiderFootService {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private starting = false;
  private readonly defaultPort = parseInt(process.env.SPIDERFOOT_PORT || '5001', 10);
  private readonly defaultHost = process.env.SPIDERFOOT_HOST || '127.0.0.1';
  private readonly docroot = process.env.SPIDERFOOT_DOCROOT || '/osint';

  private findSpiderfootDir(): string | null {
    const candidates = [
      process.env.SPIDERFOOT_DIR,
      path.resolve(process.cwd(), 'server', 'spiderfoot-4.0'),
      path.resolve(process.cwd(), 'spiderfoot-4.0'),
    ].filter(Boolean) as string[];

    for (const p of candidates) {
      try {
        if (p && fs.existsSync(path.join(p, 'sf.py'))) return p;
      } catch { /* ignore */ }
    }
    return null;
  }

  private getVenvPython(dir: string): string | null {
    const bin = process.platform === 'win32' ? 'Scripts' : 'bin';
    const py = path.join(dir, '.venv', bin, process.platform === 'win32' ? 'python.exe' : 'python');
    return fs.existsSync(py) ? py : null;
  }

  private async ensureVenv(dir: string): Promise<void> {
    const have = this.getVenvPython(dir);
    if (have) return;

    await this.exec('python3', ['-m', 'venv', '.venv'], { cwd: dir });

    const pip = process.platform === 'win32'
      ? path.join(dir, '.venv', 'Scripts', 'pip.exe')
      : path.join(dir, '.venv', 'bin', 'pip');

    if (!fs.existsSync(pip)) {
      throw new Error('Virtualenv pip not found after creation');
    }

    // Install requirements; tolerate failure if already installed system-wide
    const reqFile = path.join(dir, 'requirements.txt');
    if (fs.existsSync(reqFile)) {
      try {
        await this.exec(pip, ['install', '-r', 'requirements.txt'], { cwd: dir });
      } catch (e) {
        console.warn('SpiderFoot requirements install encountered an issue (continuing):', (e as Error).message);
      }
    }
  }

  private async patchDocrootIfNeeded(dir: string): Promise<void> {
    const sfPath = path.join(dir, 'sf.py');
    try {
      let content = fs.readFileSync(sfPath, 'utf-8');
      if (!content.includes('SPIDERFOOT_DOCROOT')) {
        // Insert after sfWebUiConfig definition
        const needle = "sfWebUiConfig = {";
        const idx = content.indexOf(needle);
        if (idx !== -1) {
          const insertAfter = content.indexOf('}', idx);
          if (insertAfter !== -1) {
            const addition = `\n\n    # Allow overriding host/port/docroot via environment for embedding\n    sfWebUiConfig['root'] = os.getenv('SPIDERFOOT_DOCROOT', sfWebUiConfig.get('root', '/'))\n    env_host = os.getenv('SPIDERFOOT_HOST')\n    env_port = os.getenv('SPIDERFOOT_PORT')\n    if env_host: sfWebUiConfig['host'] = env_host\n    if env_port: sfWebUiConfig['port'] = env_port\n`;
            // Put addition after initial config block (insertAfter points at closing brace)
            content = content.slice(0, insertAfter + 1) + addition + content.slice(insertAfter + 1);
            fs.writeFileSync(sfPath, content, 'utf-8');
          }
        }
      }
    } catch (e) {
      console.warn('Could not patch SpiderFoot docroot (will try proxy-only mode):', (e as Error).message);
    }
  }

  private async waitReady(timeoutMs = 60000): Promise<boolean> {
    const start = Date.now();
    // Try a few likely readiness endpoints; treat any 2xx as ready
    const candidates = [
      `${this.docroot}`,
      `${this.docroot}/`,
      '/',
    ];
    while (Date.now() - start < timeoutMs) {
      try {
        for (const p of candidates) {
          const url = `http://${this.defaultHost}:${this.defaultPort}${p}`;
          const resp = await fetch(url, { method: 'GET' });
          if (resp.ok) return true;
        }
      } catch { /* not ready yet */ }
      await new Promise(r => setTimeout(r, 1000));
    }
    return false;
  }

  private exec(cmd: string, args: string[], opts: SpawnOptionsWithoutStdio): Promise<void> {
    return new Promise((resolve, reject) => {
      const p = spawn(cmd, args, { ...opts });
      let stderr = '';
      p.stderr.on('data', d => { stderr += d.toString(); });
      p.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`${cmd} exited with code ${code}: ${stderr}`));
      });
    });
  }

  async ensureStarted(): Promise<StartResult> {
    if (this.proc && !this.proc.killed) return { ok: true };
    if (this.starting) return { ok: true };
    this.starting = true;

    try {
      const dir = this.findSpiderfootDir();
      if (!dir) {
        return { ok: false, reason: 'SpiderFoot directory not found. Place spiderfoot-4.0 in project root or server/.' };
      }

  // No vendor patching; we proxy /osint to SpiderFoot root via Express proxy

      // Best-effort venv setup; skip if disabled
      if (process.env.SPIDERFOOT_NO_VENV !== '1') {
        await this.ensureVenv(dir);
      }

      const py = this.getVenvPython(dir) || 'python3';

      const env = {
        ...process.env,
        // SpiderFoot reads these for data persistence if provided
        SPIDERFOOT_DATA: process.env.SPIDERFOOT_DATA,
        SPIDERFOOT_CACHE: process.env.SPIDERFOOT_CACHE,
        SPIDERFOOT_LOGS: process.env.SPIDERFOOT_LOGS,
        // Host/port for web UI
        SPIDERFOOT_HOST: this.defaultHost,
        SPIDERFOOT_PORT: String(this.defaultPort),
      } as NodeJS.ProcessEnv;

      const args = ['sf.py', '-l', `${this.defaultHost}:${this.defaultPort}`];
      const child = spawn(py, args, { cwd: dir, env } as SpawnOptionsWithoutStdio);
      this.proc = child;

      child.stdout.on('data', d => process.stdout.write(`[spiderfoot] ${d.toString()}`));
      child.stderr.on('data', d => process.stderr.write(`[spiderfoot] ${d.toString()}`));
      child.on('exit', code => {
        console.log(`[spiderfoot] process exited with code ${code}`);
        this.proc = null;
      });

      const ok = await this.waitReady();
      if (!ok) {
        return { ok: false, reason: 'SpiderFoot did not become ready in time.' };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    } finally {
      this.starting = false;
    }
  }
}

export const spiderFootService = new SpiderFootService();
