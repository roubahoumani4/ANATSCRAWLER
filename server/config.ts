import dotenv from 'dotenv';
import path from 'path';
import { ENVIRONMENT_CONFIG, ensureDirectories } from './config/environment';

// Load environment variables - support both production and development configs
const isDev = process.env.NODE_ENV === 'development';
const configFile =
  process.env.CONFIG_FILE || path.resolve(__dirname, isDev ? 'config.dev.env' : 'config.env');
dotenv.config({ path: configFile });

// Ensure required directories exist
ensureDirectories();

console.log(`🔧 Loading configuration from: ${configFile}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Timeout configurations to prevent hanging
export const TIMEOUT_CONFIG = {
  // Database timeout settings
  DB_QUERY_TIMEOUT: parseInt(process.env.DB_QUERY_TIMEOUT || '5000'),
  DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  
  // Client timeout settings
  CLIENT_FETCH_TIMEOUT: parseInt(process.env.CLIENT_FETCH_TIMEOUT || '30000'),
  CLIENT_RETRY_DELAY: parseInt(process.env.CLIENT_RETRY_DELAY || '1000'),
  CLIENT_MAX_RETRIES: parseInt(process.env.CLIENT_MAX_RETRIES || '2'),
  
  // MISP integration timeout removed
};

// External service configurations
export const ELASTICSEARCH_URI = process.env.ELASTICSEARCH_URL || 'http://192.168.1.110:9200';
export const MONGODB_URI = process.env.MONGODB_URL || 'mongodb://192.168.1.110:27017/anat_security';
export const REDIS_URI = process.env.REDIS_URL || 'redis://192.168.1.110:6379';

// Log configuration for debugging
console.log(`🔍 Elasticsearch URI: ${ELASTICSEARCH_URI}`);
console.log(`🗄️ MongoDB URI: ${MONGODB_URI}`);
console.log(`🔴 Redis URI: ${REDIS_URI}`);

// Server configuration
export const PORT = process.env.PORT || 5000;
export const HOST = process.env.HOST || '0.0.0.0';
export const NODE_ENV = process.env.NODE_ENV || 'development';

// OSINT configuration
export const OSINT_CONFIG = {
  // Use environment-aware paths from centralized config
  DB_PATH: ENVIRONMENT_CONFIG.DATABASE_PATH,
};

// Add debug logging for OSINT configuration
console.log(`� OSINT Configuration:`);
console.log(`   DB_PATH: ${OSINT_CONFIG.DB_PATH}`);

// Re-export environment configuration for convenience
export { ENVIRONMENT_CONFIG, PATHS } from './config/environment';