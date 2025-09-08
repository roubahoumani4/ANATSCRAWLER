/**
 * Environment-aware configuration
 * - Adapts automatically for local development on macOS or production Linux
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

  // Production-specific config loading can be added here if needed
  // (SpiderFoot-related code has been removed)
} catch {
  // Non-fatal in dev
}

// Environment detection
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';

// Resolve base path
// - In production default to /var/www/anatscrawler unless BASE_PATH is set
// - In development default to current working directory
const defaultBase = process.env.BASE_PATH || (IS_PRODUCTION ? '/var/www/anatscrawler' : process.cwd());
const repoRootCandidate = path.resolve(defaultBase);
export const BASE_PATH = repoRootCandidate;

// Base configuration - previous spiderfoot code removed

// Compute paths for application data
const dataDirDefault = path.resolve(BASE_PATH, 'data');

// Configuration for application (spiderfoot config removed)

export const PATHS = {
  DATA_DIR: path.resolve(BASE_PATH, 'data'),
  LOGS_DIR: path.resolve(BASE_PATH, 'logs'),
  BACKUPS_DIR: path.resolve(BASE_PATH, 'data', 'backups'),
  CLIENT_BUILD: path.resolve(BASE_PATH, 'client', 'dist'),
  SERVER_DIR: path.resolve(BASE_PATH, 'server'),
  SCRIPTS_DIR: path.resolve(BASE_PATH, 'scripts'),
};

// App DB path
export function getDatabasePath(): string {
  return path.resolve(PATHS.DATA_DIR, 'anatscrawler.db');
}

// Ensure required directories exist
export function ensureDirectories(): void {
  const dirs = [PATHS.DATA_DIR, PATHS.LOGS_DIR, PATHS.BACKUPS_DIR];
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
};
