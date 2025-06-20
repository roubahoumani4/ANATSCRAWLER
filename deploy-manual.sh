#!/bin/bash
set -e

# Navigate to project directory
cd /var/www/anatscrawler

# Pull latest changes
git pull origin main

# Ensure proper permissions
echo 'Klapauciusa12' | sudo -S chown -R ituu:ituu .
echo 'Klapauciusa12' | sudo -S chmod -R 755 .

# Setup environment file
cat > .env << 'EOL'
NODE_ENV=production
PORT=5000
ELASTICSEARCH_URL=http://192.168.1.110:9200
MONGODB_URL=mongodb://192.168.1.110:27017/anat_security
REDIS_URL=redis://192.168.1.110:6379
VITE_API_URL=/api
EOL

chmod 600 .env

# Install Xvfb if not present
echo 'Klapauciusa12' | sudo -S apt-get update
echo 'Klapauciusa12' | sudo -S apt-get install -y xvfb

# Clean install all dependencies (including dev dependencies)
rm -rf node_modules client dist
npm ci

# Set environment for build
export NODE_ENV=production
export DISPLAY=:99

# Start Xvfb
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
sleep 3

# Build the application
npm run build

# Create PM2 configuration
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

# Install PM2 if not already installed
which pm2 || npm install -g pm2

# Stop any existing instances
pm2 stop anatscrawler || true
pm2 delete anatscrawler || true

# Start the application
pm2 start ecosystem.config.cjs

# Save PM2 process list
pm2 save

# Show logs
pm2 logs anatscrawler --lines 50
