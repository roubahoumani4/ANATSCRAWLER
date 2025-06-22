# Deployment Summary

This document summarizes the complete CI/CD pipeline setup for the ANATSCRAWLER application.

## Architecture

- **Frontend**: React application built with Vite
- **Backend**: Node.js/Express server with TypeScript
- **Deployment**: PM2 process manager on VM (192.168.1.105:5000)
- **Proxy**: Nginx reverse proxy on separate VM (horus.anatsecurity.fr)
- **CI/CD**: GitHub Actions workflow

## Deployment Flow

1. **Trigger**: Push to `main` branch triggers GitHub Actions
2. **SSH Connection**: GitHub Actions connects to deployment VM via SSH
3. **Deployment Directory**: Creates timestamped directory in `/var/www/`
4. **Code Deployment**: Clones repository and copies files
5. **Build Process**: Runs `npm ci`, builds client and server
6. **PM2 Management**: Stops existing process, starts new one
7. **Validation**: Multiple health checks to ensure deployment success
8. **Symlink Update**: Zero-downtime deployment using symlinks
9. **Cleanup**: Removes old deployments, keeps last 5

## Key Files

### GitHub Actions Workflow
- **File**: `.github/workflows/deploy.yml`
- **Features**:
  - Comprehensive validation at each step
  - Build verification (client and server)
  - PM2 process management
  - Port listening verification
  - HTTP endpoint testing
  - Detailed error reporting on failure

### Server Configuration
- **File**: `server/index.ts`
- **Features**:
  - Serves static files from `client/dist`
  - Health check endpoint at `/api/health`
  - Proper CORS configuration
  - Environment variable handling

### Build Scripts
- **Client Build**: `npm run build:client` → `client/dist/`
- **Server Build**: `npm run build:server` → `dist/index.js`
- **Combined Build**: `npm run build`

### PM2 Configuration
- **Generated dynamically** in deployment script
- **Process name**: `anatscrawler`
- **Port**: 5000
- **Environment**: Production
- **Logging**: Structured logs in `logs/` directory

## Nginx Configuration

### File Location
- **Source**: `docs/nginx-anatscrawler.conf`
- **Deployment**: `/etc/nginx/sites-available/anatscrawler`

### Features
- **SSL/TLS**: Full HTTPS configuration
- **Proxy Pass**: Routes traffic to backend server
- **Static Files**: Optimized caching for assets
- **Health Check**: `/health` endpoint for monitoring
- **Security**: Headers, CORS, rate limiting
- **Performance**: Gzip compression, caching headers

### Setup Commands
```bash
# Copy configuration
sudo cp docs/nginx-anatscrawler.conf /etc/nginx/sites-available/anatscrawler

# Enable site
sudo ln -sf /etc/nginx/sites-available/anatscrawler /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Validation Tools

### Deployment Validation Script
- **File**: `scripts/validate-deployment.sh`
- **Usage**: Run after deployment to verify everything is working
- **Checks**:
  - PM2 process status
  - Port 5000 listening
  - HTTP endpoints responding
  - Static files present
  - Health endpoint functionality

### GitHub Actions Health Check
- **Built-in validation** during deployment
- **Failure handling** with detailed debug information
- **Comprehensive testing** of all components

## Environment Variables

### Required Environment Variables
```bash
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
ELASTICSEARCH_URL=http://192.168.1.110:9200
MONGODB_URL=mongodb://192.168.1.110:27017/anat_security
REDIS_URL=redis://192.168.1.110:6379
VITE_API_URL=/api
JWT_SECRET=NWagPsTDSNKzcgJQvYouOyTwCbQ0ZTG+zE3/8eTPqQM=
COOKIE_SECRET=NnnQPZ8wazuVR26qNCZ9wRXAdUipV/sE/jC+mKizTXg=
```

## GitHub Secrets Required

### SSH Configuration
- **SSH_PRIVATE_KEY**: Private SSH key for deployment server access

### Server Access Details
- **Host**: 46.165.254.175
- **Port**: 50103
- **Username**: ituu
- **Authentication**: SSH key

## Deployment Process

### Automatic Deployment
1. Push changes to `main` branch
2. GitHub Actions automatically triggers
3. Deployment completes with validation
4. Application accessible at https://horus.anatsecurity.fr

### Manual Validation
```bash
# On deployment server
cd /var/www/anatscrawler
./scripts/validate-deployment.sh

# Check PM2 status
pm2 ls
pm2 logs anatscrawler

# Test endpoints
curl http://localhost:5000/api/health
curl -I http://localhost:5000/
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs in GitHub Actions

2. **PM2 Process Issues**
   - Check PM2 logs: `pm2 logs anatscrawler`
   - Verify environment variables
   - Check port conflicts: `netstat -tln | grep 5000`

3. **Static File Serving**
   - Verify `client/dist/index.html` exists after build
   - Check file permissions
   - Review server static file configuration

4. **Nginx Proxy Issues**
   - Test nginx configuration: `sudo nginx -t`
   - Check nginx logs: `sudo tail -f /var/log/nginx/anatscrawler.error.log`
   - Verify backend server is responding

### Debug Commands
```bash
# Check deployment directory
ls -la /var/www/anatscrawler/

# Test local connections
curl http://localhost:5000/api/health

# Check system resources
df -h /var/www
free -h

# View recent system logs
journalctl -n 50 --no-pager
```

## Security Considerations

1. **SSH Access**: Uses SSH keys, no password authentication
2. **SSL/TLS**: Full HTTPS encryption for public access
3. **CORS**: Configured for cross-origin requests
4. **Headers**: Security headers implemented in Nginx
5. **Secrets**: Sensitive data stored in GitHub Secrets
6. **File Permissions**: Proper ownership and permissions set during deployment

## Performance Optimizations

1. **Static File Caching**: Long-term caching for assets
2. **Gzip Compression**: Reduced bandwidth usage
3. **Process Management**: PM2 with memory limits and auto-restart
4. **Zero-Downtime Deployment**: Symlink-based deployment strategy
5. **Old Deployment Cleanup**: Automatic cleanup of old versions

## Monitoring

1. **Health Endpoint**: `/api/health` provides application status
2. **PM2 Monitoring**: Built-in process monitoring
3. **Nginx Logs**: Access and error logging
4. **GitHub Actions**: Deployment success/failure notifications

## Next Steps

1. **Set up monitoring alerts** for deployment failures
2. **Add database migration scripts** if needed
3. **Implement backup strategies** for critical data
4. **Set up log aggregation** for better debugging
5. **Add performance monitoring** tools

---

For questions or issues, refer to the GitHub repository issues section or contact the development team.
