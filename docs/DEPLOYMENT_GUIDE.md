# ANAT Security OSINT Platform - Deployment Guide

## Overview

This guide covers the complete deployment of the ANAT Security OSINT Platform for production environments.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                    │
├─────────────────────────────────────────────────────────────┤
│  Nginx (SSL Termination)  →  ANAT Platform                       │
│  Port 443/80              →  Port 5000                            │
│  horus.anatsecurity.fr                                          │
└─────────────────────────────────────────────────────────────┘

External Services (192.168.1.110):
├── MongoDB (Port 27017)
├── Elasticsearch (Port 9200)
└── Redis (Port 6379)
```

## Deployment Process

### 1. Pre-Deployment Setup

**Run the production setup script on your server:**

```bash
# On your production server
wget https://raw.githubusercontent.com/roubahoumani4/ANATSCRAWLER/main/scripts/production-setup.sh
chmod +x production-setup.sh
sudo ./production-setup.sh
```

This script:
- Creates directory structure
- Installs system dependencies
- Configures PM2 and systemd
- Sets up log rotation
- Creates configuration templates

### 2. GitHub Actions Deployment

**Configure GitHub Secrets:**

Navigate to your repository → Settings → Secrets and Variables → Actions

```bash
# Required Secrets
DEPLOY_HOST=your-server-ip
DEPLOY_USER=your-ssh-user
SSH_PRIVATE_KEY=your-ssh-private-key
DEPLOY_PORT=22

# Application Configuration
APP_PORT=5000
JWT_SECRET=your-jwt-secret-here
COOKIE_SECRET=your-cookie-secret-here

# Database Services
MONGODB_URL=mongodb://192.168.1.110:27017/anat_security
ELASTICSEARCH_URL=http://192.168.1.110:9200
REDIS_URL=redis://192.168.1.110:6379

# Optional MISP Integration
MISP_URL=
MISP_API_KEY=
MISP_VERIFY_TLS=true
MISP_TIMEOUT_MS=30000

# Frontend Configuration
VITE_API_URL=/api
```

### 3. Deployment Trigger

**Automatic Deployment:**
Push to the `main` branch triggers automatic deployment.

**Manual Deployment:**
1. Go to Actions tab in GitHub
2. Select "Production Deploy" workflow
3. Click "Run workflow"

### 4. Post-Deployment Configuration

#### SSL Certificate Setup

```bash
# Install SSL certificate (example with Let's Encrypt)
sudo certbot --nginx -d horus.anatsecurity.fr
```

#### Nginx Configuration

```bash
# Copy the template and configure SSL paths
sudo cp /var/www/anatscrawler/nginx.conf.template /etc/nginx/sites-available/anatscrawler
sudo ln -s /etc/nginx/sites-available/anatscrawler /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Environment Variables

### Production Environment (.env)

```bash
# Core Application
NODE_ENV=production
HOST=0.0.0.0
PORT=5000
BASE_PATH=/var/www/anatscrawler/current

# Database Services
ELASTICSEARCH_URL=http://192.168.1.110:9200
MONGODB_URL=mongodb://192.168.1.110:27017/anat_security
REDIS_URL=redis://192.168.1.110:6379

<!-- Embedded OSINT engine integration removed; no engine-specific environment variables required -->

# Security
JWT_SECRET=your-jwt-secret-here
COOKIE_SECRET=your-cookie-secret-here

# Production Optimization
CORS_ORIGIN=https://horus.anatsecurity.fr
MAX_CONCURRENT_SCANS=10
CLUSTER_MODE=true
WORKER_PROCESSES=2
```

## Directory Structure

```
/var/www/anatscrawler/
├── current/                     # Current deployment
│   ├── dist/                   # Built Node.js application
│   ├── client/dist/            # Built React frontend
│   ├── server/                 # Server application
│   ├── package.json
│   ├── ecosystem.config.cjs
│   └── .env
├── data/                       # Persistent data
│   ├── data/                  # Application data (no embedded OSINT-specific files)
│   └── backups/               # Application backups
├── logs/                      # Application logs
│   ├── combined.log
│   ├── error.log
│   └── out.log
├── server -> current/server   # Stable symlink
└── client -> current/client   # Stable symlink
```

## Service Management

### PM2 Process Management

```bash
# Check status
pm2 status anatscrawler

# View logs
pm2 logs anatscrawler

# Restart application
pm2 restart anatscrawler

# Monitor in real-time
pm2 monit
```

### Systemd Service

```bash
# Start/stop/restart via systemd
sudo systemctl start anatscrawler
sudo systemctl stop anatscrawler
sudo systemctl restart anatscrawler

# Check status
sudo systemctl status anatscrawler

# Enable auto-start on boot
sudo systemctl enable anatscrawler
```

## Health Checks

### Application Health

```bash
# Main application
curl -f http://localhost:5000/health

# Public endpoint (with SSL)
curl -f https://horus.anatsecurity.fr/health
```

### Expected Response

```json
{
  "ok": true,
  "timestamp": "2025-09-14T12:00:00.000Z",
   "services": {
      "database": "connected"
   }
}
```

## Monitoring and Logging

### Log Files

```bash
# Application logs
tail -f /var/www/anatscrawler/logs/combined.log

# PM2 logs
pm2 logs anatscrawler --lines 100

<!-- Embedded OSINT-specific logs removed -->
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Performance Monitoring

```bash
# CPU and Memory usage
pm2 monit

# System resources
htop

# Network connections
netstat -tulpn | grep :5000
```

## Backup Strategy

### Database Backup

```bash
<!-- Embedded OSINT database backup removed -->

# MongoDB backup (if applicable)
mongodump --host 192.168.1.110:27017 --db anat_security \
          --out /var/www/anatscrawler/data/backups/mongodb-$(date +%Y%m%d)
```

### Configuration Backup

```bash
# Environment configuration
cp /var/www/anatscrawler/current/.env \
   /var/www/anatscrawler/data/backups/env-$(date +%Y%m%d).backup

# Nginx configuration
sudo cp /etc/nginx/sites-available/anatscrawler \
        /var/www/anatscrawler/data/backups/nginx-$(date +%Y%m%d).conf
```

## Troubleshooting

### Common Issues

<!-- Embedded OSINT troubleshooting removed -->

#### 2. Permission Issues

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/anatscrawler

# Fix permissions
sudo chmod -R 755 /var/www/anatscrawler/data
sudo chmod -R 755 /var/www/anatscrawler/logs
```

#### 3. Service Connectivity

```bash
# Test database connections
telnet 192.168.1.110 27017  # MongoDB
telnet 192.168.1.110 9200   # Elasticsearch
telnet 192.168.1.110 6379   # Redis
```

#### 4. SSL Certificate Issues

```bash
# Check certificate validity
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run
```

### Performance Optimization

#### 1. Resource Limits

```bash
# Increase PM2 memory limit if needed
pm2 restart anatscrawler --max-memory-restart 4G
```

<!-- Embedded OSINT module configuration removed -->

#### 3. Database Optimization

<!-- Embedded OSINT database monitoring and cleanup instructions removed -->

## Security Considerations

### 1. Network Security

<!-- Embedded OSINT-specific network notes removed -->
- SSL/TLS encryption for all external communication

### 2. Data Protection

- All sensitive data stored in protected directories
- Regular backup of scan databases
- Secure handling of OSINT intelligence

### 3. Access Control

- Application-level authentication required
- Role-based access control for platform features

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Check log file sizes
   - Verify health endpoints
   - Monitor resource usage

2. **Monthly:**
   - Update system packages
   - Backup databases
   - Review scan data retention

3. **Quarterly:**
   - Security audit
   - Performance optimization
   - Update dependencies

### Update Process

Application updates are handled automatically through GitHub Actions. Manual intervention is only required for:

- Environment variable changes
- SSL certificate renewal
- System-level updates

## Support

For issues or questions:

1. Check application logs first
2. Verify service connectivity
3. Review configuration settings
4. Test with minimal configuration

The platform provides comprehensive logging and monitoring to help diagnose issues quickly and maintain optimal performance.
