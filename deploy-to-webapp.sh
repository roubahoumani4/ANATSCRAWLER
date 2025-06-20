#!/bin/bash

# Build locally to avoid GUI/Qt issues
echo "Building application locally..."
rm -rf dist
NODE_ENV=production VITE_API_URL=https://horus.anatsecurity.fr/api npm run build

# Deploy to webapp VM
echo "Deploying to webapp VM..."
ssh root@192.168.1.105 "mkdir -p /var/www/darkscrawler && pm2 stop darkscrawler || true && pm2 delete darkscrawler || true"

# Copy build files
echo "Copying build files..."
scp -r dist package*.json root@192.168.1.105:/var/www/darkscrawler/

# Setup and start on server
ssh root@192.168.1.105 "cd /var/www/darkscrawler && \
  chmod -R 755 . && \
  cat > .env << 'EOL' && \
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
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
    name: 'darkscrawler',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: '5000',
      HOST: '0.0.0.0',
      ELASTICSEARCH_URL: 'http://192.168.1.110:9200',
      MONGODB_URL: 'mongodb://192.168.1.110:27017/anat_security',
      REDIS_URL: 'redis://192.168.1.110:6379'
    }
  }]
}
EOL
  pm2 start ecosystem.config.cjs && \
  pm2 save"

# Create nginx configuration
echo "Creating nginx configuration..."
ssh root@192.168.1.105 "cat > /etc/nginx/sites-available/horus.anatsecurity.fr << 'EOL'
server {
    listen 443 ssl;
    server_name horus.anatsecurity.fr;

    ssl_certificate /etc/letsencrypt/live/horus.anatsecurity.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/horus.anatsecurity.fr/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Backend API
    location ^~ /api/ {
        proxy_pass http://192.168.1.105:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        add_header Access-Control-Allow-Origin \"https://horus.anatsecurity.fr\" always;
        add_header Access-Control-Allow-Credentials \"true\" always;
    }

    # Frontend
    location / {
        proxy_pass http://192.168.1.105:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOL"

# Enable the site and restart nginx
ssh root@192.168.1.105 "ln -sf /etc/nginx/sites-available/horus.anatsecurity.fr /etc/nginx/sites-enabled/ && \
  nginx -t && \
  systemctl restart nginx"

echo "Deployment complete! The application should be accessible at https://horus.anatsecurity.fr"
