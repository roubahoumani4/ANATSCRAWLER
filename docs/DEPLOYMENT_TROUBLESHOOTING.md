# Deployment Troubleshooting Guide

This guide helps troubleshoot common deployment issues with the DarkScrawler application.

## Common Issues and Solutions

### 1. Health Check Failures

**Symptoms:**
- `❌ Health check failed`
- Health endpoint returns non-200 status code

**Troubleshooting Steps:**
1. Check if the server is running:
   ```bash
   pm2 ls
   pm2 show anatscrawler
   ```

2. Check server logs:
   ```bash
   pm2 logs anatscrawler --lines 50
   ```

3. Test the health endpoint manually:
   ```bash
   curl -v http://192.168.1.110:5000/api/health
   ```

4. Check if the port is being used:
   ```bash
   netstat -tln | grep :5000
   lsof -i :5000
   ```

### 2. PM2 Process Issues

**Symptoms:**
- `❌ PM2 process failed to start`
- Process shows as `errored` in `pm2 ls`

**Solutions:**
1. Check the application logs for startup errors
2. Verify environment variables are correctly set
3. Ensure all dependencies are installed
4. Check file permissions on the deployment directory

### 3. Static File Serving Issues

**Symptoms:**
- `⚠️ Root endpoint returns 404`
- Client application not loading

**Troubleshooting:**
1. Verify client build files exist:
   ```bash
   ls -la client/dist/
   find . -name "index.html" -type f
   ```

2. Check server logs for static file errors:
   ```bash
   pm2 logs anatscrawler | grep -i "client\|static\|index.html"
   ```

3. Test static file serving:
   ```bash
   curl -I http://192.168.1.110:5000/
   ```

### 4. Permission Issues

**Symptoms:**
- `Warning: Could not create symlink`
- `Warning: Could not remove old deployment directory`

**Solutions:**
1. Check directory ownership:
   ```bash
   ls -la /var/www/
   ```

2. Ensure deployment user has proper permissions:
   ```bash
   sudo chown -R deployuser:deployuser /var/www
   sudo chmod 755 /var/www
   ```

### 5. Build Issues

**Symptoms:**
- `❌ Build failed: dist/index.js not found`
- `❌ Client build failed: index.html not found`

**Solutions:**
1. Check build logs for errors
2. Verify all dependencies are installed:
   ```bash
   npm ci
   ```

3. Test build locally:
   ```bash
   npm run build
   ```

## Deployment Script Improvements Made

### 1. Removed Sudo Usage
- Replaced `sudo` commands with graceful error handling
- Added warning messages when permissions are insufficient
- Improved rollback process without requiring elevated privileges

### 2. Enhanced Static File Path Resolution
- Added multiple fallback locations for client files
- Improved debugging output for path resolution
- Better error messages when client files are not found

### 3. Improved ESBuild Configuration
- Automated external module detection for Node.js built-ins
- Better build error handling and logging
- Proper handling of binary dependencies

### 4. Streamlined Deployment Process
- Removed redundant code sections
- Cleaner script structure with logical flow
- Better separation of concerns between deployment steps

## Manual Recovery Steps

If deployment fails completely, you can manually recover:

1. **Check current deployment:**
   ```bash
   ls -la /var/www/anatscrawler*
   readlink /var/www/anatscrawler
   ```

2. **Rollback to previous version:**
   ```bash
   PREV_DEPLOY=$(ls -1dt /var/www/anatscrawler-* | head -n 1)
   ln -sf "$PREV_DEPLOY" /var/www/anatscrawler
   cd "$PREV_DEPLOY"
   pm2 delete anatscrawler
   pm2 start dist/index.js --name anatscrawler
   ```

3. **Check application status:**
   ```bash
   pm2 ls
   curl http://192.168.1.110:5000/api/health
   ```

## Best Practices

1. **Pre-deployment Checks:**
   - Test builds locally before deployment
   - Verify all environment variables are set
   - Check server resources (disk space, memory)

2. **Monitoring:**
   - Set up proper application monitoring
   - Monitor PM2 logs regularly
   - Set up alerts for deployment failures

3. **Backup Strategy:**
   - Keep multiple deployment versions
   - Regular database backups
   - Configuration file backups

## Environment Setup

Ensure your deployment environment has:

1. **System Dependencies:**
   ```bash
   sudo apt-get update
   sudo apt-get install -y nodejs npm curl xvfb
   ```

2. **PM2 Setup:**
   ```bash
   npm install -g pm2
   pm2 startup
   ```

3. **Directory Structure:**
   ```bash
   sudo mkdir -p /var/www
   sudo chown -R deployuser:deployuser /var/www
   ```

4. **Firewall Configuration:**
   ```bash
   sudo ufw allow 5000
   sudo ufw reload
   ```

This guide should help resolve most common deployment issues. For persistent problems, check the server logs and GitHub Actions output for more detailed error information.
