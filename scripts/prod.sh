#!/bin/bash
set -e

# Production deployment script
TARGET_HOST="192.168.1.105"
DB_HOST="192.168.1.110"
APP_DIR="/var/www/anatscrawler"

echo "🚀 Starting deployment to VM at ${TARGET_HOST}..."

# SSH into the target VM and execute deployment
ssh ituu@${TARGET_HOST} bash -c "'
    set -e

    echo \"📁 Navigating to application directory...\"
    cd ${APP_DIR}

    echo \"⬇️ Pulling latest changes from GitHub...\"
    git pull origin main

    echo \"📝 Setting up environment file...\"
    cat > .env << EOL
NODE_ENV=production
PORT=5000
ELASTICSEARCH_URL=http://${DB_HOST}:9200
MONGODB_URL=mongodb://${DB_HOST}:27017/anat_security
REDIS_URL=redis://${DB_HOST}:6379
VITE_API_URL=/api
JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}
EOL

    echo \"🔒 Setting proper permissions...\"
    chmod 600 .env
    sudo chown -R ituu:ituu .
    sudo chmod -R 755 .

    echo \"📦 Installing dependencies...\"
    npm ci

    echo \"🔧 Setting up build environment...\"
    export NODE_ENV=production
    export DISPLAY=:99

    echo \"🏗️ Building application...\"
    npm run build

    echo \"⚙️ Updating PM2 configuration...\"
    cat > ecosystem.config.cjs << EOL
module.exports = {
  apps: [{
    name: \"anatscrawler\",
    script: \"dist/index.js\",
    env: {
      NODE_ENV: \"production\",
      PORT: \"5000\",
      ELASTICSEARCH_URL: \"http://${DB_HOST}:9200\",
      MONGODB_URL: \"mongodb://${DB_HOST}:27017/anat_security\",
      REDIS_URL: \"redis://${DB_HOST}:6379\"
    },
    instances: \"max\",
    exec_mode: \"cluster\",
    max_memory_restart: \"1G\",
    watch: false,
    error_file: \"logs/err.log\",
    out_file: \"logs/out.log\",
    merge_logs: true,
    log_date_format: \"YYYY-MM-DD HH:mm:ss\"
  }]
}
EOL

    echo \"🔄 Restarting application with PM2...\"
    if ! command -v pm2 &> /dev/null; then
        echo \"Installing PM2...\"
        npm install -g pm2
    fi

    pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs
    pm2 save

    echo \"📊 Current PM2 status:\"
    pm2 ls
    
    echo \"📝 Last 20 lines of logs:\"
    pm2 logs anatscrawler --lines 20
'"

echo "✅ Deployment completed successfully!"
