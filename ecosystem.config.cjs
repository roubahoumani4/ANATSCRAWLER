// PM2 ecosystem configuration for production OSINT Platform

module.exports = {
  apps: [{
    name: 'anatscrawler',
    script: 'dist/index.js',
    instances: process.env.CLUSTER_MODE === 'true' ? (process.env.WORKER_PROCESSES || 2) : 1,
    exec_mode: process.env.CLUSTER_MODE === 'true' ? 'cluster' : 'fork',
    env: {
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PORT: 5000,
      MAX_CONCURRENT_SCANS: 10,
      // SpiderFoot OSINT Engine Environment
      SPIDERFOOT_HOST: '127.0.0.1',
      SPIDERFOOT_PORT: 5001,
      SPIDERFOOT_DIR: '/var/www/anatscrawler/current/server/spiderfoot-4.0',
      SPIDERFOOT_DOCROOT: '/osint',
      SPIDERFOOT_DATA: '/var/www/anatscrawler/data/spiderfoot',
      SPIDERFOOT_CACHE: '/var/www/anatscrawler/data/spiderfoot/cache',
      SPIDERFOOT_LOGS: '/var/www/anatscrawler/data/spiderfoot/logs',
      SPIDERFOOT_DB: '/var/www/anatscrawler/data/spiderfoot/spiderfoot.db',
      // Database and Services
      MONGODB_URL: process.env.MONGODB_URL || 'mongodb://192.168.1.110:27017/anat_security',
      ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || 'http://192.168.1.110:9200',
      REDIS_URL: process.env.REDIS_URL || 'redis://192.168.1.110:6379',
      // Production optimizations
      NODE_OPTIONS: '--max-old-space-size=2048'
    },
    error_file: '/var/www/anatscrawler/logs/error.log',
    out_file: '/var/www/anatscrawler/logs/out.log',
    log_file: '/var/www/anatscrawler/logs/combined.log',
    time: true,
    max_memory_restart: '2G',
    autorestart: true,
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '30s',
    // Health monitoring
    health_check_grace_period: 30000,
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000,
    // Production logging
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
