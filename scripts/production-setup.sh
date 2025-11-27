#!/bin/bash
set -e

echo "🏗️ ANAT Security OSINT Platform - Production Server Setup"
echo "================================================="

# Configuration
BASE_DIR="/var/www/anatscrawler"
DATA_DIR="$BASE_DIR/data"
LOGS_DIR="$BASE_DIR/logs"
USER="www-data"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    log_error "This script should not be run as root"
    exit 1
fi

# Create directory structure
log_info "Creating directory structure..."
sudo mkdir -p "$BASE_DIR"/{current,releases,shared,data,logs}
sudo mkdir -p "$DATA_DIR"/{backups}
sudo mkdir -p "$LOGS_DIR"

# Set proper ownership and permissions
log_info "Setting up permissions..."
sudo chown -R $USER:$USER "$BASE_DIR"
sudo chmod -R 755 "$BASE_DIR"
sudo chmod -R 755 "$DATA_DIR"
sudo chmod -R 755 "$LOGS_DIR"

log_success "Directory structure created"

# Check system requirements
log_info "Checking system requirements..."

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js found: $NODE_VERSION"
    
    # Check if version is >= 20
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 20 ]; then
        log_warning "Node.js version should be >= 20. Current: $NODE_VERSION"
    fi
else
    log_error "Node.js not found. Please install Node.js >= 20"
    exit 1
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_success "npm found: $NPM_VERSION"
else
    log_error "npm not found"
    exit 1
fi

# Python and pip are optional; embedded OSINT engine integration has been removed
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    log_info "Python 3 found: $PYTHON_VERSION"
fi
if command -v pip3 &> /dev/null || command -v pip &> /dev/null; then
    log_info "pip found"
fi

# PM2
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    log_success "PM2 found: $PM2_VERSION"
else
    log_warning "PM2 not found. Installing globally..."
    npm install -g pm2
    log_success "PM2 installed"
fi

# Check services connectivity
log_info "Checking service connectivity..."

# MongoDB
if curl -s --max-time 5 "mongodb://192.168.1.110:27017" &> /dev/null; then
    log_success "MongoDB connectivity verified"
else
    log_warning "Cannot connect to MongoDB at 192.168.1.110:27017"
fi

# Elasticsearch
if curl -s --max-time 5 "http://192.168.1.110:9200" &> /dev/null; then
    log_success "Elasticsearch connectivity verified"
else
    log_warning "Cannot connect to Elasticsearch at 192.168.1.110:9200"
fi

# Redis
if timeout 5 bash -c "</dev/tcp/192.168.1.110/6379" &> /dev/null; then
    log_success "Redis connectivity verified"
else
    log_warning "Cannot connect to Redis at 192.168.1.110:6379"
fi

# (Embedded OSINT engine removed) No special Python system dependencies required by default

# Create symbolic links for stable paths
log_info "Setting up symbolic links..."
if [ -L "$BASE_DIR/server" ]; then
    sudo rm -f "$BASE_DIR/server"
fi
if [ -L "$BASE_DIR/client" ]; then
    sudo rm -f "$BASE_DIR/client"
fi

# These will be created during deployment
log_success "Symbolic link structure prepared"

# Create environment template
log_info "Creating environment template..."
cat > "$BASE_DIR/.env.template" << 'EOF'
# ANAT Security OSINT Platform - Production Environment
NODE_ENV=production
HOST=0.0.0.0
PORT=5000
BASE_PATH=/var/www/anatscrawler/current

# Database and Services
ELASTICSEARCH_URL=http://192.168.1.110:9200
MONGODB_URL=mongodb://192.168.1.110:27017/anat_security
REDIS_URL=redis://192.168.1.110:6379

# Security (set these via GitHub Secrets)
JWT_SECRET=your-jwt-secret-here
COOKIE_SECRET=your-cookie-secret-here

# Optional MISP Integration
MISP_URL=
MISP_API_KEY=
MISP_VERIFY_TLS=true
MISP_TIMEOUT_MS=30000

# Production Configuration
CORS_ORIGIN=https://horus.anatsecurity.fr
MAX_CONCURRENT_SCANS=10
CLUSTER_MODE=true
WORKER_PROCESSES=2
EOF

log_success "Environment template created at $BASE_DIR/.env.template"

# Create nginx configuration template
log_info "Creating nginx configuration template..."
cat > "$BASE_DIR/nginx.conf.template" << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name horus.anatsecurity.fr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name horus.anatsecurity.fr;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.pem;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Proxy to ANAT Security OSINT Platform
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for OSINT operations
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Additional locations can be added here for proxied services
}
EOF

log_success "Nginx configuration template created at $BASE_DIR/nginx.conf.template"

# Create systemd service template
log_info "Creating systemd service template..."
sudo tee /etc/systemd/system/anatscrawler.service > /dev/null << 'EOF'
[Unit]
Description=ANAT Security OSINT Platform
Documentation=https://github.com/roubahoumani4/ANATSCRAWLER
After=network.target

[Service]
Type=forking
User=www-data
WorkingDirectory=/var/www/anatscrawler/current
ExecStart=/usr/bin/pm2 start ecosystem.config.cjs --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.cjs --env production
ExecStop=/usr/bin/pm2 stop ecosystem.config.cjs
PIDFile=/var/www/anatscrawler/.pm2/pm2.pid

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/www/anatscrawler
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
log_success "Systemd service created"

# Setup logrotate
log_info "Setting up log rotation..."
sudo tee /etc/logrotate.d/anatscrawler > /dev/null << 'EOF'
/var/www/anatscrawler/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        /usr/bin/pm2 reloadLogs
    endscript
}
EOF

log_success "Log rotation configured"

# Final setup information
echo ""
echo "🎉 Production server setup completed successfully!"
echo "================================================="
echo ""
echo "📋 Next Steps:"
echo "1. Deploy your application using GitHub Actions"
echo "2. Configure SSL certificates for nginx"
echo "3. Update /var/www/anatscrawler/.env with production secrets"
echo "4. Configure firewall rules to allow ports 80 and 443"
echo "5. Start nginx and enable it: sudo systemctl enable --now nginx"
echo ""
echo "📁 Important Paths:"
echo "   • Application: $BASE_DIR/current"
echo "   • Data: $DATA_DIR"
echo "   • Logs: $LOGS_DIR"
echo ""
echo "🔧 Configuration Templates:"
echo "   • Environment: $BASE_DIR/.env.template"
echo "   • Nginx: $BASE_DIR/nginx.conf.template"
echo "   • Systemd: /etc/systemd/system/anatscrawler.service"
echo ""
echo "🌐 Service URLs (after deployment):"
echo "   • Main Application: https://horus.anatsecurity.fr"
echo "   • OSINT Engine: https://horus.anatsecurity.fr/osint"
echo "   • Health Check: https://horus.anatsecurity.fr/health"
echo ""
echo "📊 Monitoring:"
echo "   • View logs: pm2 logs anatscrawler"
echo "   • Check status: pm2 status"
echo "   • System service: sudo systemctl status anatscrawler"
