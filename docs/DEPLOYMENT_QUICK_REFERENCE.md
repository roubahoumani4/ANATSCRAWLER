# Deployment Quick Reference

## 🚨 CRITICAL: Remote VM Deployment

**Every change affects remote VM, not local machine!**

## Infrastructure
- **App Server**: 192.168.1.105 (Internal) / 46.165.254.175:50103 (SSH)
- **DB Server**: 192.168.1.110 (MongoDB:27017, Redis:6379, ES:9200)
- **User**: `ituu`
- **Directory**: `/var/www/anatscrawler/app`
- **Port**: 5000

## Pre-Change Checklist
- [ ] Environment variables needed?
- [ ] Dependencies added to `package.json`/`requirements.txt`?
- [ ] Build process affected?
- [ ] Static files (`client/dist/`) impacted?
- [ ] Database migrations required?
- [ ] API endpoints documented?
- [ ] Security considerations addressed?

## Common Issues
1. **Build fails**: Check Node.js v20 compatibility
2. **Permission errors**: `sudo chown -R ituu:ituu /var/www/anatscrawler`
3. **Port conflicts**: `netstat -tln | grep :5000`
4. **Static files missing**: Check `client/dist/` after build
5. **Env vars missing**: Check GitHub Secrets

## Validation Commands
```bash
# Check deployment
pm2 ls
pm2 logs anatscrawler
curl http://192.168.1.105:5000/api/health
./scripts/validate-deployment.sh

# Check files
ls -la client/dist/
netstat -tln | grep :5000
```

## Key Files
- **CI/CD**: `.github/workflows/deploy.yml`
- **Deploy**: `scripts/prod.sh`
- **Validate**: `scripts/validate-deployment.sh`
- **Config**: `ecosystem.config.cjs`

## Environment Variables (Production)
```bash
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
ELASTICSEARCH_URL=http://192.168.1.110:9200
MONGODB_URL=mongodb://192.168.1.110:27017/anat_security
REDIS_URL=redis://192.168.1.110:6379
VITE_API_URL=/api
JWT_SECRET=<github-secret>
COOKIE_SECRET=<github-secret>
```

## Deployment Process
1. **Automatic**: Push to `main` → GitHub Actions
2. **Manual**: `./scripts/prod.sh`
3. **Validate**: `./scripts/validate-deployment.sh`

---
**Full documentation**: [`DEPLOYMENT_CONSIDERATIONS.md`](DEPLOYMENT_CONSIDERATIONS.md)
