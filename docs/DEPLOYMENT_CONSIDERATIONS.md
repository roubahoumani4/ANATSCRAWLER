# Deployment Considerations for Remote VM

## Overview
This document outlines critical considerations that must be evaluated before making any changes to the codebase, as the project deploys to a remote VM environment.

## 🚨 Critical Deployment Architecture

### VM Infrastructure
- **Application Server**: 192.168.1.105 (Internal Network)
  - External SSH: 46.165.254.175:50103
  - User: `ituu`
  - Directory: `/var/www/anatscrawler/app`
  - Port: 5000

- **Database Server**: 192.168.1.110
  - MongoDB: Port 27017
  - Redis: Port 6379
  - Elasticsearch: Port 9200

- **Reverse Proxy**: Nginx on separate VM
  - Domain: horus.anatsecurity.fr
  - SSL/TLS termination
  - Load balancing

### Deployment Process
1. **Automatic Deployment**: GitHub Actions CI/CD on push to `main`
2. **Manual Deployment**: `scripts/prod.sh`
3. **Validation**: `scripts/validate-deployment.sh`

## 🔍 Pre-Change Checklist

Before making ANY changes to the codebase, consider:

### Environment Variables
- [ ] Does the change require new environment variables?
- [ ] Are the variables already set in GitHub Secrets?
- [ ] Do deployment scripts need updating?
- [ ] Are default values provided for development?

### Dependencies
- [ ] Are new Node.js dependencies added to `package.json`?
- [ ] Are new Python dependencies added to `requirements.txt`?
- [ ] Do system dependencies need to be installed on VM?
- [ ] Are all dependencies compatible with production environment?

### Build Process
- [ ] Does the change affect the build process?
- [ ] Are all build artifacts properly generated?
- [ ] Is the client build (`client/dist/`) complete?
- [ ] Is the server build (`dist/index.js`) complete?

### Static Files
- [ ] Are static files properly served from `client/dist/`?
- [ ] Are file paths relative to deployment directory?
- [ ] Are assets properly referenced in production?

### Database
- [ ] Are database migrations required?
- [ ] Are migration scripts updated?
- [ ] Is database connectivity tested in production?

### API Endpoints
- [ ] Are new API endpoints documented?
- [ ] Are endpoints compatible with existing frontend?
- [ ] Are CORS settings updated if needed?

### Security
- [ ] Are sensitive data properly handled?
- [ ] Are environment variables secure?
- [ ] Are API endpoints properly protected?

## 🛠️ Common Deployment Issues

### Build Failures
**Symptoms**: GitHub Actions build fails
**Solutions**:
- Check Node.js version compatibility (v20)
- Verify all dependencies are in `package.json`
- Test build locally: `npm run build`

### Permission Issues
**Symptoms**: File permission errors on VM
**Solutions**:
- Ensure proper file ownership: `sudo chown -R ituu:ituu /var/www/anatscrawler`
- Check directory permissions: `sudo chmod -R 755 /var/www/anatscrawler`

### Port Conflicts
**Symptoms**: Port 5000 already in use
**Solutions**:
- Check running processes: `netstat -tln | grep :5000`
- Stop conflicting services: `pm2 delete anatscrawler`

### Static File Issues
**Symptoms**: Frontend not loading
**Solutions**:
- Verify `client/dist/` exists after build
- Check file permissions on static files
- Test static file serving: `curl -I http://192.168.1.105:5000/`

### Environment Variable Issues
**Symptoms**: Application fails to start
**Solutions**:
- Check all required variables in GitHub Secrets
- Verify `.env` file is created during deployment
- Test environment variable loading

## 📋 Validation Commands

### After Deployment
```bash
# Check PM2 status
pm2 ls
pm2 logs anatscrawler

# Test endpoints
curl http://192.168.1.105:5000/api/health
curl -I http://192.168.1.105:5000/

# Check static files
ls -la client/dist/
find . -name "index.html" -type f

# Check port listening
netstat -tln | grep :5000

# Check process status
ps aux | grep node
```

### Manual Validation Script
```bash
# Run validation script
./scripts/validate-deployment.sh
```

## 🔧 Deployment Scripts

### Key Scripts
- **`scripts/prod.sh`**: Manual production deployment
- **`scripts/validate-deployment.sh`**: Deployment validation
- **`scripts/dev.sh`**: Development environment setup
- **`.github/workflows/deploy.yml`**: CI/CD pipeline

### Environment Setup
```bash
# Development
export NODE_ENV=development
export PORT=5000
export ELASTICSEARCH_URL=http://192.168.1.110:9200
export MONGODB_URL=mongodb://192.168.1.110:27017/anat_security
export REDIS_URL=redis://192.168.1.110:6379

# Production (set in GitHub Secrets)
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
ELASTICSEARCH_URL=http://192.168.1.110:9200
MONGODB_URL=mongodb://192.168.1.110:27017/anat_security
REDIS_URL=redis://192.168.1.110:6379
VITE_API_URL=/api
JWT_SECRET=<from-github-secrets>
COOKIE_SECRET=<from-github-secrets>
```

## 🚀 Deployment Best Practices

### Code Changes
1. **Test Locally First**: Always test changes locally before pushing
2. **Incremental Changes**: Make small, incremental changes
3. **Documentation**: Update documentation for any new features
4. **Backward Compatibility**: Ensure changes don't break existing functionality

### Deployment Strategy
1. **Zero-Downtime**: Use symlink-based deployment
2. **Rollback Plan**: Keep previous deployments for quick rollback
3. **Health Checks**: Implement comprehensive health checks
4. **Monitoring**: Monitor application performance and logs

### Security Considerations
1. **Environment Variables**: Never commit sensitive data
2. **Access Control**: Use SSH keys for deployment
3. **Network Security**: Restrict access to internal services
4. **SSL/TLS**: Use HTTPS for all external communication

## 📞 Troubleshooting Resources

### Logs and Monitoring
- **PM2 Logs**: `pm2 logs anatscrawler`
- **Nginx Logs**: `/var/log/nginx/anatscrawler.error.log`
- **System Logs**: `journalctl -n 50 --no-pager`

### Documentation
- **Deployment Summary**: `docs/DEPLOYMENT_SUMMARY.md`
- **Troubleshooting Guide**: `docs/DEPLOYMENT_TROUBLESHOOTING.md`
- **Deployment Fixes**: `docs/DEPLOYMENT_FIXES.md`

### Support
- **GitHub Actions**: Check workflow runs for detailed error information
- **Server Access**: SSH to 46.165.254.175:50103 as `ituu`
- **Validation**: Use `scripts/validate-deployment.sh` for comprehensive checks

## 🔄 Update Process

This document should be updated whenever:
1. New deployment considerations are identified
2. Infrastructure changes occur
3. New deployment scripts are added
4. Common issues are discovered and resolved

**Last Updated**: 2025-01-27
**Next Review**: 2025-02-27
