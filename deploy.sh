#!/bin/bash
set -e

cd /var/www/anatscrawler

# Ensure proper permissions
echo 'Klapauciusa12' | sudo -S chown -R ituu:ituu .
echo 'Klapauciusa12' | sudo -S chmod -R 755 .

# Create/update .env file with proper permissions
touch .env
echo 'Klapauciusa12' | sudo -S chown ituu:ituu .env
echo 'Klapauciusa12' | sudo -S chmod 600 .env

# Create proper .env file
cat > .env << EOL
NODE_ENV=production
PORT=5000
ELASTICSEARCH_URL=http://192.168.1.110:9200
MONGODB_URL=mongodb://192.168.1.110:27017/anat_security
REDIS_URL=redis://192.168.1.110:6379
VITE_API_URL=/api
JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}
EOL

# Install dependencies
npm ci

# Build the application
npm run build

# Install PM2 globally if not installed
which pm2 || npm install -g pm2

# Start/Restart the application using PM2
pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs

# Save PM2 process list
pm2 save

# Show running processes
pm2 ls
