import path from 'path';
import fs from 'fs';
import { spawn, SpawnOptionsWithoutStdio, ChildProcessWithoutNullStreams } from 'child_process';
import fetch from 'node-fetch';

type StartResult = { ok: boolean; reason?: string };

interface SpiderFootConfig {
  host: string;
  port: number;
  dir: string;
  docroot: string;
  dataDir: string;
  cacheDir: string;
  logsDir: string;
  dbPath: string;
}

class SpiderFootService {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private starting = false;
  private config: SpiderFootConfig;

  constructor() {
    this.config = {
      host: process.env.SPIDERFOOT_HOST || '0.0.0.0',
      port: parseInt(process.env.SPIDERFOOT_PORT || '5001', 10),
      dir: process.env.SPIDERFOOT_DIR || path.resolve(process.cwd(), 'server', 'spiderfoot-4.0'),
      docroot: process.env.SPIDERFOOT_DOCROOT || '/osint',
      dataDir: process.env.SPIDERFOOT_DATA || path.resolve(process.cwd(), 'data', 'spiderfoot'),
      cacheDir: process.env.SPIDERFOOT_CACHE || path.resolve(process.cwd(), 'data', 'spiderfoot', 'cache'),
      logsDir: process.env.SPIDERFOOT_LOGS || path.resolve(process.cwd(), 'data', 'spiderfoot', 'logs'),
      dbPath: process.env.SPIDERFOOT_DB || path.resolve(process.cwd(), 'data', 'spiderfoot', 'spiderfoot.db')
    };
  }

  private findSpiderfootDir(): string | null {
    const candidates = [
      this.config.dir,
      path.resolve(process.cwd(), 'server', 'spiderfoot-4.0'),
      path.resolve(process.cwd(), 'spiderfoot-4.0'),
    ];

    for (const p of candidates) {
      try {
        if (fs.existsSync(path.join(p, 'sf.py'))) {
          console.log(`✅ Found SpiderFoot at: ${p}`);
          return p;
        }
      } catch (e) {
        console.warn(`❌ Could not access ${p}:`, (e as Error).message);
      }
    }
    return null;
  }

  private getVenvPython(dir: string): string | null {
    const bin = process.platform === 'win32' ? 'Scripts' : 'bin';
    const py = path.join(dir, '.venv', bin, process.platform === 'win32' ? 'python.exe' : 'python');
    return fs.existsSync(py) ? py : null;
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [this.config.dataDir, this.config.cacheDir, this.config.logsDir];
    for (const dir of dirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
          console.log(`📁 Created directory: ${dir}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not create directory ${dir}:`, error);
      }
    }
  }

  private async ensureVenv(dir: string): Promise<void> {
    const have = this.getVenvPython(dir);
    if (have) {
      console.log(`✅ Found Python venv at: ${have}`);
      return;
    }

    console.log('🐍 Creating Python virtual environment...');
    await this.exec('python3', ['-m', 'venv', '.venv'], { cwd: dir });

    const pip = process.platform === 'win32'
      ? path.join(dir, '.venv', 'Scripts', 'pip.exe')
      : path.join(dir, '.venv', 'bin', 'pip');

    if (!fs.existsSync(pip)) {
      throw new Error('Virtualenv pip not found after creation');
    }

    // Upgrade pip first
    console.log('📦 Upgrading pip...');
    await this.exec(pip, ['install', '--upgrade', 'pip'], { cwd: dir });

    // Install requirements; tolerate failure if already installed system-wide
    const reqFile = path.join(dir, 'requirements.txt');
    if (fs.existsSync(reqFile)) {
      try {
        console.log('📦 Installing SpiderFoot requirements...');
        await this.exec(pip, ['install', '-r', 'requirements.txt'], { cwd: dir });
        console.log('✅ SpiderFoot dependencies installed successfully');
      } catch (e) {
        console.warn('⚠️ SpiderFoot requirements install encountered an issue (continuing):', (e as Error).message);
      }
    }
  }

  private async patchSpiderFootConfig(dir: string): Promise<void> {
    const sfPath = path.join(dir, 'sf.py');
    try {
      let content = fs.readFileSync(sfPath, 'utf-8');
      
      // Check if already patched
      if (content.includes('SPIDERFOOT_DOCROOT')) {
        console.log('✅ SpiderFoot already patched for integration');
        return;
      }

      console.log('🔧 Patching SpiderFoot for native integration...');
      
      // Insert after sfWebUiConfig definition
      const needle = "sfWebUiConfig = {";
      const idx = content.indexOf(needle);
      if (idx !== -1) {
        const insertAfter = content.indexOf('}', idx);
        if (insertAfter !== -1) {
          const addition = `\n\n    # ANAT Security OSINT Platform Integration\n    # Allow overriding host/port/docroot via environment for embedding\n    sfWebUiConfig['root'] = os.getenv('SPIDERFOOT_DOCROOT', sfWebUiConfig.get('root', '/'))\n    env_host = os.getenv('SPIDERFOOT_HOST')\n    env_port = os.getenv('SPIDERFOOT_PORT')\n    if env_host: sfWebUiConfig['host'] = env_host\n    if env_port: sfWebUiConfig['port'] = int(env_port)\n    \n    # Enable CORS for ANAT Security integration\n    sfWebUiConfig['cors_origins'] = ['*']  # Allow all origins for native integration\n`;
          content = content.slice(0, insertAfter + 1) + addition + content.slice(insertAfter + 1);
          fs.writeFileSync(sfPath, content, 'utf-8');
          console.log('✅ SpiderFoot successfully patched for native integration');
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not patch SpiderFoot config (will try proxy-only mode):', (e as Error).message);
    }
  }

  private async waitReady(timeoutMs = 120000): Promise<boolean> {
    const start = Date.now();
    console.log(`⏳ Waiting for SpiderFoot to be ready on ${this.config.host}:${this.config.port}...`);
    
    // Try a few likely readiness endpoints
    const candidates = [
      `${this.config.docroot}`,
      `${this.config.docroot}/`,
      '/',
    ];
    
    while (Date.now() - start < timeoutMs) {
      try {
        for (const p of candidates) {
          const url = `http://${this.config.host}:${this.config.port}${p}`;
          const resp = await fetch(url, { 
            method: 'GET',
            timeout: 5000,
            headers: {
              'User-Agent': 'ANAT-Security-OSINT-Platform/2.0'
            }
          });
          if (resp.ok || resp.status === 404) { // 404 is also okay, means server is up
            console.log(`✅ SpiderFoot is ready and responding`);
            return true;
          }
        }
      } catch (e) {
        // Not ready yet, continue waiting
      }
      await new Promise(r => setTimeout(r, 2000));
      
      // Log progress every 20 seconds
      if ((Date.now() - start) % 20000 < 2000) {
        console.log(`⏳ Still waiting for SpiderFoot... (${Math.round((Date.now() - start) / 1000)}s elapsed)`);
      }
    }
    return false;
  }

  private exec(cmd: string, args: string[], opts: SpawnOptionsWithoutStdio): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🔧 Executing: ${cmd} ${args.join(' ')}`);
      const p = spawn(cmd, args, { ...opts });
      let stderr = '';
      let stdout = '';
      
      p.stdout?.on('data', d => { 
        stdout += d.toString(); 
        console.log(`[${cmd}] ${d.toString().trim()}`);
      });
      p.stderr?.on('data', d => { 
        stderr += d.toString(); 
        console.warn(`[${cmd}] ${d.toString().trim()}`);
      });
      
      p.on('close', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${cmd} exited with code ${code}: ${stderr}`));
        }
      });
    });
  }

  async ensureStarted(): Promise<StartResult> {
    if (this.proc && !this.proc.killed) {
      console.log('✅ SpiderFoot is already running');
      return { ok: true };
    }
    
    if (this.starting) {
      console.log('⏳ SpiderFoot is already starting...');
      return { ok: true };
    }
    
    this.starting = true;
    console.log('🚀 Starting SpiderFoot OSINT Engine...');

    try {
      const dir = this.findSpiderfootDir();
      if (!dir) {
        return { 
          ok: false, 
          reason: 'SpiderFoot directory not found. Ensure spiderfoot-4.0 is in the correct location.' 
        };
      }

      // Ensure all required directories exist
      await this.ensureDirectories();

      // Patch SpiderFoot for native integration
      await this.patchSpiderFootConfig(dir);

      // Best-effort venv setup; skip if disabled
      if (process.env.SPIDERFOOT_NO_VENV !== '1') {
        await this.ensureVenv(dir);
      }

      const py = this.getVenvPython(dir) || 'python3';

      const env = {
        ...process.env,
        // SpiderFoot data persistence
        SPIDERFOOT_DATA: this.config.dataDir,
        SPIDERFOOT_CACHE: this.config.cacheDir,
        SPIDERFOOT_LOGS: this.config.logsDir,
        SPIDERFOOT_DB: this.config.dbPath,
        // Host/port configuration
        SPIDERFOOT_HOST: this.config.host,
        SPIDERFOOT_PORT: String(this.config.port),
        SPIDERFOOT_DOCROOT: this.config.docroot,
        // Python environment
        PYTHONPATH: dir,
        PYTHONUNBUFFERED: '1'
      } as NodeJS.ProcessEnv;

      const args = [
        'sf.py', 
        '-l', 
        `${this.config.host}:${this.config.port}`,
        '-r'  // Enable web UI
      ];
      
      console.log(`🚀 Starting SpiderFoot with: ${py} ${args.join(' ')}`);
      console.log(`📂 Working directory: ${dir}`);
      console.log(`🌐 Will be available at: http://${this.config.host}:${this.config.port}${this.config.docroot}`);

      const child = spawn(py, args, { 
        cwd: dir, 
        env,
        stdio: ['ignore', 'pipe', 'pipe']
      } as SpawnOptionsWithoutStdio);
      
      this.proc = child;

      child.stdout.on('data', d => {
        const output = d.toString().trim();
        if (output) {
          console.log(`[SpiderFoot] ${output}`);
        }
      });
      
      child.stderr.on('data', d => {
        const output = d.toString().trim();
        if (output) {
          console.warn(`[SpiderFoot] ${output}`);
        }
      });
      
      child.on('exit', (code, signal) => {
        console.log(`[SpiderFoot] Process exited with code ${code}, signal ${signal}`);
        this.proc = null;
        this.starting = false;
      });

      child.on('error', (error) => {
        console.error(`[SpiderFoot] Process error:`, error);
        this.proc = null;
        this.starting = false;
      });

      const ok = await this.waitReady();
      if (!ok) {
        if (this.proc) {
          this.proc.kill('SIGTERM');
          this.proc = null;
        }
        return { 
          ok: false, 
          reason: 'SpiderFoot did not become ready within the timeout period.' 
        };
      }
      
      console.log('🎉 SpiderFoot OSINT Engine started successfully!');
      return { ok: true };
    } catch (e) {
      console.error('❌ Failed to start SpiderFoot:', (e as Error).message);
      return { ok: false, reason: (e as Error).message };
    } finally {
      this.starting = false;
    }
  }

  async stop(): Promise<void> {
    if (this.proc && !this.proc.killed) {
      console.log('🛑 Stopping SpiderFoot...');
      this.proc.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise(resolve => {
        if (!this.proc) return resolve(void 0);
        
        const timeout = setTimeout(() => {
          if (this.proc && !this.proc.killed) {
            console.warn('⚠️ Force killing SpiderFoot (SIGKILL)');
            this.proc.kill('SIGKILL');
          }
          resolve(void 0);
        }, 10000);
        
        this.proc.on('exit', () => {
          clearTimeout(timeout);
          resolve(void 0);
        });
      });
      
      this.proc = null;
      console.log('✅ SpiderFoot stopped');
    }
  }

  getStatus(): { running: boolean; config: SpiderFootConfig } {
    return {
      running: this.proc !== null && !this.proc.killed,
      config: this.config
    };
  }
}

export const spiderFootService = new SpiderFootService();
