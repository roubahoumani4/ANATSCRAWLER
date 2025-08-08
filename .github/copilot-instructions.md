# Copilot Instructions for darkscrawler1

## Purpose
This document provides actionable instructions for AI agents (e.g., GitHub Copilot, Copilot Chat) working in the `darkscrawler1` codebase. It covers conventions, integration points, and best practices for frontend, backend, and Python modules.

---

## 🚨 CRITICAL DEPLOYMENT CONSIDERATIONS

**IMPORTANT**: This project deploys to a remote VM (not this local machine). Every change must consider deployment implications:

### Quick Reference
- **Application Server**: 192.168.1.105 (Internal) / 46.165.254.175:50103 (External SSH)
- **Database Server**: 192.168.1.110 (MongoDB, Redis, Elasticsearch)
- **Deployment User**: `ituu`
- **Deployment Directory**: `/var/www/anatscrawler/app`
- **CI/CD**: GitHub Actions on push to `main` branch

### Documentation
- **Quick Reference**: [`docs/DEPLOYMENT_QUICK_REFERENCE.md`](../docs/DEPLOYMENT_QUICK_REFERENCE.md)
- **Full Considerations**: [`docs/DEPLOYMENT_CONSIDERATIONS.md`](../docs/DEPLOYMENT_CONSIDERATIONS.md)
- **Troubleshooting**: [`docs/DEPLOYMENT_TROUBLESHOOTING.md`](../docs/DEPLOYMENT_TROUBLESHOOTING.md)

### Deployment Process
1. **Automatic**: Push to `main` branch triggers GitHub Actions CI/CD
2. **Manual**: Use `scripts/prod.sh` for manual deployment
3. **Validation**: Use `scripts/validate-deployment.sh` to verify deployment

### Environment Variables (Production)
```bash
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

### Key Deployment Files
- **CI/CD**: `.github/workflows/deploy.yml`
- **PM2 Config**: `ecosystem.config.cjs`
- **Nginx Config**: `docs/nginx-anatscrawler.conf`
- **Validation**: `scripts/validate-deployment.sh`

### Deployment Checklist (Before Every Change)
- [ ] Does the change require environment variables? (Update deployment scripts)
- [ ] Does the change affect build process? (Test `npm run build`)
- [ ] Does the change require new dependencies? (Update `package.json`/`requirements.txt`)
- [ ] Does the change affect static file serving? (Check `client/dist/`)
- [ ] Does the change require database migrations? (Update migration scripts)
- [ ] Does the change affect API endpoints? (Update documentation)
- [ ] Does the change require system dependencies? (Update deployment scripts)

### Common Deployment Issues
1. **Build Failures**: Check Node.js version compatibility (v20)
2. **Permission Issues**: Ensure proper file ownership on VM
3. **Port Conflicts**: Verify port 5000 is available
4. **Static Files**: Ensure `client/dist/` is built and copied
5. **Environment Variables**: Check all required vars are set in GitHub Secrets

### Validation Commands (After Deployment)
```bash
# Check PM2 status
pm2 ls
pm2 logs anatscrawler

# Test endpoints
curl http://192.168.1.105:5000/api/health
curl -I http://192.168.1.105:5000/

# Check static files
ls -la client/dist/
```

---

## General Conventions
- Use TypeScript for frontend code in `client/src`.
- Use Express/Node.js for backend code in `server/`.
- Use Python for SpiderFoot modules in `server/spiderfoot/`.
- Use absolute imports in Python modules.
- Use flexible data parsing in frontend to handle both array and object API responses.
- All API routes should be documented in `server/routes/`.
- Use PM2 for backend process management.

---

## Frontend (React/TypeScript)
- Main scan list UI: `client/src/pages/ScanListPage.tsx`.
- Dashboard scan list: `client/src/components/dashboard/OsintScans.tsx`.
- Fetch scan data from `/api/spiderfoot/scanlist` and `/osint-engine/scans`.
- Always handle both array and object responses from backend APIs.
- Fix lint errors by adding explicit type annotations (avoid implicit `any`).
- Use context providers in `client/src/context/` for authentication, theme, and language.

---

## Backend (Express/Node.js)
- Main API routes: `server/routes/spiderfoot.ts`.
- Proxy legacy routes as needed (e.g., `/osint-engine/scans`).
- Integrate with SpiderFoot Python modules via API endpoints.
- Use JWT and CSRF tokens for authentication.
- Document new routes and integration points in `server/routes/`.

---

## Python (SpiderFoot Modules)
- Modules located in `server/spiderfoot/modules/`.
- Use absolute imports (e.g., `from spiderfoot import sflib`).
- Ensure all dependencies are listed in `server/spiderfoot/requirements.txt`.
- Install dependencies with `pip install -r requirements.txt`.
- For new modules, update `requirements.txt` and test imports.

---

## Dependency Management
- Node.js: Use `package.json` for dependencies. Run `npm install` after updates.
- Python: Use `requirements.txt` for dependencies. Run `pip install -r requirements.txt` after updates.

---

## Troubleshooting
- If frontend scan list does not display, check API route and response format.
- If Python module import fails, check import path and `requirements.txt`.
- For lint errors, add explicit type annotations in TypeScript files.
- For backend errors, check logs and ensure all environment variables are set.

---

## Onboarding AI Agents
- Always analyze both frontend and backend code for integration issues.
- When updating scan list logic, ensure both `/api/spiderfoot/scanlist` and `/osint-engine/scans` are supported.
- Document any new conventions or integration points in this file.
- **CRITICAL**: Always consider deployment implications for remote VM.
- Ask for user feedback on unclear or incomplete sections and iterate as needed.

---

## Last Updated
- [Date: 2025-01-27] - Added comprehensive deployment considerations

---

## Feedback
If any section is unclear or incomplete, ask the user for clarification and update this file accordingly.
