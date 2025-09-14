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
      host: process.env.SPIDERFOOT_HOST || '127.0.0.1', // Use 127.0.0.1 for internal communication (security)
      port: parseInt(process.env.SPIDERFOOT_PORT || '5001', 10),
      dir: process.env.SPIDERFOOT_DIR || path.resolve(process.cwd(), 'server', 'spiderfoot-4.0'),
      docroot: process.env.SPIDERFOOT_DOCROOT || '/osint',
      dataDir: process.env.SPIDERFOOT_DATA || path.resolve(process.cwd(), 'data', 'spiderfoot'),
      cacheDir: process.env.SPIDERFOOT_CACHE || path.resolve(process.cwd(), 'data', 'spiderfoot', 'cache'),
      logsDir: process.env.SPIDERFOOT_LOGS || path.resolve(process.cwd(), 'data', 'spiderfoot', 'logs'),
      dbPath: process.env.SPIDERFOOT_DB || path.resolve(process.cwd(), 'data', 'spiderfoot', 'spiderfoot.db')
    };
    
    console.log('🕷️ SpiderFoot Service Configuration:');
    console.log(`   Host: ${this.config.host}:${this.config.port}`);
    console.log(`   Directory: ${this.config.dir}`);
    console.log(`   Data Dir: ${this.config.dataDir}`);
    console.log(`   Doc Root: ${this.config.docroot}`);
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
    
    for (const dirPath of dirs) {
      try {
        if (!fs.existsSync(dirPath)) {
          console.log(`📁 Creating directory: ${dirPath}`);
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Check if we can write to the directory
        const testFile = path.join(dirPath, '.write_test');
        try {
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          console.log(`✅ Directory writable: ${dirPath}`);
        } catch (writeError) {
          console.error(`❌ Cannot write to directory ${dirPath}:`, writeError);
          throw new Error(`Permission denied: Cannot write to ${dirPath}`);
        }
      } catch (error) {
        console.error(`❌ Failed to ensure directory ${dirPath}:`, error);
        throw error;
      }
    }
    
    // Ensure authentication is disabled by creating/clearing passwd file
    try {
      const passwdFile = path.join(this.config.dataDir, 'passwd');
      console.log(`🔒 Ensuring no authentication: ${passwdFile}`);
      
      // Create empty passwd file to explicitly disable authentication
      fs.writeFileSync(passwdFile, '', 'utf8');
      console.log(`✅ Authentication disabled: empty passwd file created`);
    } catch (error) {
      console.warn(`⚠️ Could not create passwd file:`, error);
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
      if (content.includes('ANAT Security OSINT Platform Integration')) {
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
          const addition = `

    # ANAT Security OSINT Platform Integration
    # Allow overriding host/port/docroot via environment for embedding
    import os
    sfWebUiConfig['root'] = os.getenv('SPIDERFOOT_DOCROOT', sfWebUiConfig.get('root', '/'))
    env_host = os.getenv('SPIDERFOOT_HOST')
    env_port = os.getenv('SPIDERFOOT_PORT')
    if env_host: 
        sfWebUiConfig['host'] = env_host
    if env_port: 
        sfWebUiConfig['port'] = int(env_port)
    
    # Enable CORS for ANAT Security integration
    sfWebUiConfig['cors_origins'] = ['*']  # Allow all origins for native integration
    
    # Production logging
    if os.getenv('NODE_ENV') == 'production':
        print(f"🕷️  SpiderFoot OSINT Engine starting on {sfWebUiConfig['host']}:{sfWebUiConfig['port']}")
        print(f"📁 Data directory: {os.getenv('SPIDERFOOT_DATA', './data')}")
        print(f"🌐 Document root: {sfWebUiConfig['root']}")
`;
          content = content.slice(0, insertAfter + 1) + addition + content.slice(insertAfter + 1);
          fs.writeFileSync(sfPath, content, 'utf-8');
          console.log('✅ SpiderFoot successfully patched for native integration');
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not patch SpiderFoot config (will try proxy-only mode):', (e as Error).message);
    }
  }

  private async killExistingSpiderFoot(): Promise<void> {
    try {
      console.log('🔍 Checking for existing SpiderFoot processes...');
      
      // Kill any processes using our port
      const { exec } = require('child_process');
      const killCmd = process.platform === 'win32' 
        ? `netstat -ano | findstr :${this.config.port}` 
        : `lsof -ti:${this.config.port}`;
      
      return new Promise((resolve) => {
        exec(killCmd, (error: any, stdout: string) => {
          if (error || !stdout.trim()) {
            console.log('✅ No existing processes found on port', this.config.port);
            resolve();
            return;
          }
          
          const pids = stdout.trim().split('\n').map(line => {
            if (process.platform === 'win32') {
              return line.trim().split(/\s+/).pop();
            } else {
              return line.trim();
            }
          }).filter(pid => pid && !isNaN(Number(pid)));
          
          if (pids.length === 0) {
            console.log('✅ No processes to kill');
            resolve();
            return;
          }
          
          console.log(`🔪 Killing existing processes: ${pids.join(', ')}`);
          const killPidCmd = process.platform === 'win32' 
            ? `taskkill /F /PID ${pids.join(' /PID ')}`
            : `kill -9 ${pids.join(' ')}`;
            
          exec(killPidCmd, (killError: any) => {
            if (killError) {
              console.warn('⚠️ Could not kill some processes:', killError.message);
            } else {
              console.log('✅ Killed existing SpiderFoot processes');
            }
            
            // Wait a moment for processes to fully terminate
            setTimeout(resolve, 2000);
          });
        });
      });
    } catch (error) {
      console.warn('⚠️ Could not check for existing processes:', error);
    }
  }

  private async checkPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.listen(port, '127.0.0.1', () => {
        server.once('close', () => {
          resolve(true); // Port is available
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false); // Port is in use
      });
    });
  }

  private async waitReady(timeoutMs = 180000): Promise<boolean> { // Increased to 3 minutes
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

      // Kill any existing SpiderFoot processes on our port
      await this.killExistingSpiderFoot();

      // Patch SpiderFoot for native integration
      await this.patchSpiderFootConfig(dir);

      // Best-effort venv setup; skip if disabled
      if (process.env.SPIDERFOOT_NO_VENV !== '1') {
        await this.ensureVenv(dir);
      }

      // Check if port is available after cleanup
      try {
        const isPortAvailable = await this.checkPortAvailable(this.config.port);
        if (!isPortAvailable) {
          console.error(`❌ Port ${this.config.port} is still in use after cleanup attempt`);
          return { 
            ok: false, 
            reason: `Port ${this.config.port} is still in use. Try waiting a few moments and retry, or restart the server.` 
          };
        }
        console.log(`✅ Port ${this.config.port} is available`);
      } catch (portError) {
        console.warn(`⚠️ Could not check port availability: ${(portError as Error).message}`);
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
          console.error(`[SpiderFoot ERROR] ${output}`);
        }
      });

      child.on('exit', (code, signal) => {
        console.log(`[SpiderFoot] Process exited with code ${code}, signal ${signal}`);
        if (code !== 0 && code !== null) {
          console.error(`❌ SpiderFoot failed with exit code ${code}`);
          if (code === 70) {
            console.error(`💡 Exit code 70 suggests a software/configuration error. Common causes:
              - Port ${this.config.port} already in use
              - Permission denied accessing data directory: ${this.config.dataDir}
              - Database file permissions: ${this.config.dbPath}
              - Python module import errors`);
          }
        }
        this.proc = null;
      });

      child.on('error', (error) => {
        console.error(`❌ SpiderFoot process error:`, error);
        this.proc = null;
      });      const ok = await this.waitReady();
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
      
      try {
        // Try graceful shutdown first
        this.proc.kill('SIGTERM');
        
        // Wait for graceful shutdown
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            if (this.proc && !this.proc.killed) {
              console.log('⚡ Force killing SpiderFoot...');
              this.proc.kill('SIGKILL');
            }
            resolve();
          }, 5000);
          
          if (this.proc) {
            this.proc.on('exit', () => {
              clearTimeout(timeout);
              resolve();
            });
          } else {
            clearTimeout(timeout);
            resolve();
          }
        });
        
        console.log('✅ SpiderFoot stopped');
      } catch (error) {
        console.error('❌ Error stopping SpiderFoot:', error);
      } finally {
        this.proc = null;
      }
    }
    
    // Also kill any lingering processes on our port
    await this.killExistingSpiderFoot();
  }

  getStatus(): { running: boolean; config: SpiderFootConfig } {
    return {
      running: this.proc !== null && !this.proc.killed,
      config: this.config
    };
  }
}

export const spiderFootService = new SpiderFootService();
