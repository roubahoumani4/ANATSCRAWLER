# ANAT Security OSINT Platform - SpiderFoot Integration

This document describes the native SpiderFoot integration within the ANAT Security OSINT Platform, providing comprehensive OSINT capabilities as a core feature.

## Overview

The platform integrates SpiderFoot 4.0 as a native OSINT engine, allowing users to perform comprehensive intelligence gathering through a unified web interface. SpiderFoot runs as an embedded service within the platform, accessible through the `/osint` endpoint.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 ANAT Security OSINT Platform                │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)          │  Backend (Node.js/Express)     │
│  ┌──────────────────────┐  │  ┌──────────────────────────┐  │
│  │ OSINT Dashboard      │◄─┼──┤ API Routes              │  │
│  │ Scan Results         │  │  │ /api/*                   │  │
│  │ User Management      │  │  │                          │  │
│  └──────────────────────┘  │  └──────────────────────────┘  │
│                             │                               │
│  ┌──────────────────────┐  │  ┌──────────────────────────┐  │
│  │ SpiderFoot UI        │◄─┼──┤ OSINT Proxy              │  │
│  │ (Embedded)           │  │  │ /osint/*                 │  │
│  └──────────────────────┘  │  └──────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   SpiderFoot OSINT Engine                   │
│  ┌─────────────────────────────────────────────────────────┤
│  │ SpiderFoot 4.0 (Python)                                │
│  │ • Web UI (CherryPy)                                     │
│  │ • Scanning Engine                                       │
│  │ • 200+ OSINT Modules                                    │
│  │ • Data Correlation                                      │
│  │ • Export/Reporting                                      │
│  └─────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────┘
```

## Integration Details

### 1. Service Management

The `SpiderFootService` class manages the lifecycle of the SpiderFoot process:

- **Automatic Startup**: SpiderFoot starts automatically when accessed
- **Health Monitoring**: Continuous health checks and status monitoring
- **Process Management**: Graceful startup, restart, and shutdown
- **Error Handling**: Comprehensive error detection and recovery

### 2. Proxy Configuration

All requests to `/osint/*` are proxied to the SpiderFoot instance:

```typescript
// Route: /osint/* → SpiderFoot instance
// Example: /osint/newscan → SpiderFoot new scan page
// Example: /osint/scanlist → SpiderFoot scan list
```

### 3. Environment Configuration

```bash
# SpiderFoot OSINT Engine Configuration
SPIDERFOOT_HOST=0.0.0.0              # Bind to all interfaces
SPIDERFOOT_PORT=5001                 # Internal port
SPIDERFOOT_DIR=/path/to/spiderfoot-4.0
SPIDERFOOT_DOCROOT=/osint            # URL prefix
SPIDERFOOT_DATA=/path/to/data        # Persistent data
SPIDERFOOT_CACHE=/path/to/cache      # Cache directory
SPIDERFOOT_LOGS=/path/to/logs        # Log directory
SPIDERFOOT_DB=/path/to/spiderfoot.db # Database file
```

## Directory Structure

```
server/
├── spiderfoot-4.0/          # SpiderFoot installation
│   ├── sf.py                # Main SpiderFoot script
│   ├── requirements.txt     # Python dependencies
│   ├── modules/             # OSINT modules
│   └── spiderfoot/          # Core SpiderFoot code
├── services/
│   └── spiderfoot.service.ts # SpiderFoot integration service
└── routes/
    └── spiderfoot.ts        # OSINT API routes and proxy

data/
└── spiderfoot/              # Persistent SpiderFoot data
    ├── cache/               # Module cache
    ├── logs/                # SpiderFoot logs
    └── spiderfoot.db        # Scan database
```

## Production Deployment

### 1. Environment Setup

The platform automatically configures SpiderFoot for production deployment:

```bash
# Production paths (deployed via GitHub Actions)
BASE_PATH=/var/www/anatscrawler/current
SPIDERFOOT_DIR=/var/www/anatscrawler/current/server/spiderfoot-4.0
SPIDERFOOT_DATA=/var/www/anatscrawler/data/spiderfoot
```

### 2. Python Environment

SpiderFoot runs in an isolated Python virtual environment:

```bash
# Virtual environment setup
cd /var/www/anatscrawler/current/server/spiderfoot-4.0
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 3. Process Management

PM2 manages the main Node.js application, which internally manages SpiderFoot:

```bash
# PM2 configuration includes SpiderFoot environment
pm2 start ecosystem.config.cjs
```

### 4. Network Configuration

The platform is designed to run behind nginx with proper SSL termination:

```nginx
# Main application
location / {
    proxy_pass http://127.0.0.1:5000;
}

# SpiderFoot OSINT (with longer timeouts)
location /osint/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_read_timeout 120s;
}
```

## Usage

### 1. Accessing SpiderFoot

- **Web Interface**: Navigate to `https://your-domain.com/osint`
- **API Health Check**: `GET /osint/health`
- **Status Information**: `GET /osint/status`

### 2. Starting Scans

SpiderFoot provides a comprehensive web interface for:

- **Target Selection**: Domains, IPs, names, etc.
- **Module Configuration**: Choose from 200+ OSINT modules
- **Scan Monitoring**: Real-time progress tracking
- **Results Analysis**: Interactive data visualization

### 3. Data Management

All scan data is persistently stored:

- **Database**: SQLite database with scan results
- **Cache**: Module-specific cached data
- **Logs**: Detailed operation logs
- **Exports**: Multiple export formats (JSON, CSV, etc.)

## Security Considerations

### 1. Network Isolation

- SpiderFoot binds to `127.0.0.1` internally
- Only accessible through the main application proxy
- No direct external access to SpiderFoot port

### 2. Authentication

- Access controlled through main application authentication
- SpiderFoot inherits security context from platform
- Session management handled by main application

### 3. Data Protection

- All data stored in protected directories
- Regular backup of scan databases
- Secure handling of sensitive OSINT data

## Monitoring and Logging

### 1. Health Checks

```bash
# Application health
curl http://localhost:5000/health

# OSINT engine health
curl http://localhost:5000/osint/health
```

### 2. Log Files

```bash
# Main application logs
tail -f /var/www/anatscrawler/logs/combined.log

# SpiderFoot specific logs
tail -f /var/www/anatscrawler/data/spiderfoot/logs/spiderfoot.log
```

### 3. Process Monitoring

```bash
# PM2 status
pm2 status anatscrawler

# Detailed logs
pm2 logs anatscrawler --lines 100
```

## Troubleshooting

### 1. SpiderFoot Won't Start

```bash
# Check Python environment
cd /var/www/anatscrawler/current/server/spiderfoot-4.0
.venv/bin/python sf.py --help

# Check dependencies
.venv/bin/pip list

# Manual start for debugging
.venv/bin/python sf.py -l 127.0.0.1:5001
```

### 2. Proxy Issues

- Verify SpiderFoot is running on correct port
- Check firewall rules for internal communication
- Review nginx proxy configuration

### 3. Permission Issues

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/anatscrawler

# Fix permissions
sudo chmod -R 755 /var/www/anatscrawler/data
```

## Module Configuration

SpiderFoot includes 200+ OSINT modules organized by category:

### 1. Core Modules
- DNS resolution and enumeration
- WHOIS information gathering
- Certificate transparency logs
- Social media intelligence

### 2. Threat Intelligence
- Malware analysis integration
- Blacklist checking
- Reputation scoring
- IOC correlation

### 3. Data Sources
- Public databases
- Search engines
- Social networks
- Leak databases

## Performance Optimization

### 1. Concurrent Scans

```bash
# Limit concurrent scans to prevent resource exhaustion
MAX_CONCURRENT_SCANS=10
```

### 2. Module Selection

- Disable unnecessary modules for faster scans
- Configure module-specific settings
- Use targeted scanning strategies

### 3. Resource Management

- Monitor memory usage during large scans
- Configure appropriate timeouts
- Implement scan result cleanup policies

## Backup and Recovery

### 1. Data Backup

```bash
# Backup SpiderFoot database
cp /var/www/anatscrawler/data/spiderfoot/spiderfoot.db \
   /var/www/anatscrawler/data/backups/spiderfoot-$(date +%Y%m%d).db
```

### 2. Configuration Backup

```bash
# Backup environment configuration
cp /var/www/anatscrawler/current/.env \
   /var/www/anatscrawler/data/backups/env-$(date +%Y%m%d).backup
```

## Support and Maintenance

### 1. Updates

SpiderFoot updates are included in the platform deployment process:

1. Updated SpiderFoot code is included in releases
2. Dependencies are updated automatically
3. Database migrations handled transparently

### 2. Monitoring

Regular monitoring should include:

- SpiderFoot process health
- Database size and performance
- Module update status
- Security vulnerability scanning

This integration provides a powerful, enterprise-ready OSINT platform combining the flexibility of SpiderFoot with the security and management capabilities of the ANAT Security platform.
