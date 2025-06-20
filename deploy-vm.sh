#!/bin/bash
set -e

# Change to the application directory
cd /var/www/anatscrawler

# Pull latest changes
git pull origin main

# Ensure proper permissions
echo 'Klapauciusa12' | sudo -S chown -R ituu:ituu .
echo 'Klapauciusa12' | sudo -S chmod -R 755 .

# Setup environment file
cat > .env << EOL
NODE_ENV=production
PORT=5000
ELASTICSEARCH_URL=http://192.168.1.110:9200
MONGODB_URL=mongodb://192.168.1.110:27017/anat_security
REDIS_URL=redis://192.168.1.110:6379
VITE_API_URL=/api
EOL

chmod 600 .env

# Install dependencies (including dev dependencies for build)
npm ci

# Set environment for headless build
export DISPLAY=:0
export QT_QPA_PLATFORM=minimal
export NODE_ENV=production

# Build the application
npm run build

# Setup PM2 configuration
cat > ecosystem.config.cjs << 'EOL'
module.exports = {
  apps: [{
    name: 'anatscrawler',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: '5000',
      ELASTICSEARCH_URL: 'http://192.168.1.110:9200',
      MONGODB_URL: 'mongodb://192.168.1.110:27017/anat_security',
      REDIS_URL: 'redis://192.168.1.110:6379'
    }
  }]
}
EOL

# Install and setup PM2
npm install -g pm2
pm2 stop anatscrawler || true
pm2 delete anatscrawler || true
pm2 start ecosystem.config.cjs
pm2 save

# Show deployment status
echo "Deployment completed. Showing PM2 status:"
pm2 ls
echo "Last 20 lines of logs:"
pm2 logs anatscrawler --lines 20
