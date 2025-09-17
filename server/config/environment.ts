/**
 * Environment-aware configuration for ANAT Security OSINT Platform
 * - Adapts automatically for local development on macOS or production Linux
 * - Handles SpiderFoot OSINT engine integration
 */

import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load env as early as possible with preference for source configs over dist
try {
  // 1) Root .env
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });

  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProdEarly = nodeEnv === 'production';

  // 2) Prefer source server/config.*.env over dist/* when available
  const sourceConfig = path.resolve(process.cwd(), 'server', isProdEarly ? 'config.env' : 'config.dev.env');
  const distConfig = path.resolve(__dirname, isProdEarly ? 'config.env' : 'config.dev.env');
  const selectedConfig = process.env.CONFIG_FILE && process.env.CONFIG_FILE.trim() !== ''
    ? path.resolve(process.env.CONFIG_FILE)
    : ((() => { try { return require('fs').existsSync(sourceConfig) ? sourceConfig : distConfig; } catch { return distConfig; } })());
  dotenv.config({ path: selectedConfig });

  console.log(`🔧 Loaded environment config from: ${selectedConfig}`);
} catch (e) {
  console.warn('⚠️ Environment config loading error (non-fatal in dev):', (e as Error).message);
}

// Environment detection
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';

// Resolve base path
// - In production default to /var/www/anatscrawler unless BASE_PATH is set
// - In development default to current working directory
const defaultBase = process.env.BASE_PATH || (IS_PRODUCTION ? '/var/www/anatscrawler/current' : process.cwd());
const repoRootCandidate = path.resolve(defaultBase);
export const BASE_PATH = repoRootCandidate;

console.log(`🏠 Base path: ${BASE_PATH}`);
console.log(`🌍 Environment: ${NODE_ENV} (Production: ${IS_PRODUCTION})`);

// Compute paths for application data
const dataDirDefault = path.resolve(BASE_PATH, 'data');

// OSINT/SpiderFoot Configuration
const spiderFootConfig = {
  DIR: process.env.SPIDERFOOT_DIR || path.resolve(BASE_PATH, 'server', 'spiderfoot-4.0'),
  DATA_DIR: process.env.SPIDERFOOT_DATA || path.resolve(dataDirDefault, 'spiderfoot'),
  CACHE_DIR: process.env.SPIDERFOOT_CACHE || path.resolve(dataDirDefault, 'spiderfoot', 'cache'),
  LOGS_DIR: process.env.SPIDERFOOT_LOGS || path.resolve(dataDirDefault, 'spiderfoot', 'logs'),
  DB_PATH: process.env.SPIDERFOOT_DB || path.resolve(dataDirDefault, 'spiderfoot', 'spiderfoot.db'),
  HOST: process.env.SPIDERFOOT_HOST || '0.0.0.0',
  PORT: parseInt(process.env.SPIDERFOOT_PORT || '5001', 10),
  DOCROOT: process.env.SPIDERFOOT_DOCROOT || '/osint'
};

export const PATHS = {
  DATA_DIR: dataDirDefault,
  LOGS_DIR: path.resolve(BASE_PATH, 'logs'),
  BACKUPS_DIR: path.resolve(dataDirDefault, 'backups'),
  CLIENT_BUILD: path.resolve(BASE_PATH, 'client', 'dist'),
  SERVER_DIR: path.resolve(BASE_PATH, 'server'),
  SCRIPTS_DIR: path.resolve(BASE_PATH, 'scripts'),
  // SpiderFoot OSINT paths
  SPIDERFOOT: spiderFootConfig
};

// App DB path
export function getDatabasePath(): string {
  return path.resolve(PATHS.DATA_DIR, 'anatscrawler.db');
}

// Ensure required directories exist
export function ensureDirectories(): void {
  const dirs = [
    PATHS.DATA_DIR, 
    PATHS.LOGS_DIR, 
    PATHS.BACKUPS_DIR,
    // SpiderFoot OSINT directories
    PATHS.SPIDERFOOT.DATA_DIR,
    PATHS.SPIDERFOOT.CACHE_DIR,
    PATHS.SPIDERFOOT.LOGS_DIR
  ];
  
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

// Environment configuration object
export const ENVIRONMENT_CONFIG = {
  NODE_ENV,
  IS_PRODUCTION,
  BASE_PATH,
  PATHS,
  DATABASE_PATH: getDatabasePath(),
  ensureDirectories,
  // OSINT Engine Configuration
  SPIDERFOOT: spiderFootConfig
};

// Log configuration summary
console.log(`🔍 OSINT Configuration:`);
console.log(`   SpiderFoot Dir: ${spiderFootConfig.DIR}`);
console.log(`   Data Dir: ${spiderFootConfig.DATA_DIR}`);
console.log(`   Host:Port: ${spiderFootConfig.HOST}:${spiderFootConfig.PORT}`);
console.log(`   Doc Root: ${spiderFootConfig.DOCROOT}`);
