// PM2 ecosystem configuration for production

module.exports = {
  apps: [{
    name: 'anatscrawler',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      MAX_CONCURRENT_SCANS: 10
    },
  error_file: '/var/www/anatscrawler/logs/error.log',
  out_file: '/var/www/anatscrawler/logs/out.log',
  log_file: '/var/www/anatscrawler/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    autorestart: true
  }]
};
