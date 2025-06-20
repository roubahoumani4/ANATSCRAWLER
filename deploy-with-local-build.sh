#!/bin/bash

# Build locally
echo "Building application locally..."
rm -rf dist client
NODE_ENV=production VITE_API_URL=/api npm run build

# Deploy to server
echo "Deploying to server..."
ssh -p 50103 ituu@46.165.254.175 "cd /var/www/anatscrawler && pm2 stop anatscrawler || true && pm2 delete anatscrawler || true"

# Copy build files
echo "Copying build files..."
scp -P 50103 -r client dist ituu@46.165.254.175:/var/www/anatscrawler/

# Setup and start on server
ssh -p 50103 ituu@46.165.254.175 "cd /var/www/anatscrawler && \
  sudo chown -R ituu:ituu . && \
  sudo chmod -R 755 . && \
  cat > .env << 'EOL' && \
NODE_ENV=production
PORT=5000
ELASTICSEARCH_URL=http://192.168.1.110:9200
MONGODB_URL=mongodb://192.168.1.110:27017/anat_security
REDIS_URL=redis://192.168.1.110:6379
VITE_API_URL=/api
EOL
  chmod 600 .env && \
  npm ci --omit=dev && \
  cat > ecosystem.config.cjs << 'EOL' && \
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
  pm2 start ecosystem.config.cjs && \
  pm2 save && \
  sleep 2 && \
  pm2 logs anatscrawler --lines 50"
