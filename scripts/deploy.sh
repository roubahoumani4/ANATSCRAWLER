#!/bin/bash
# scripts/deploy.sh - Build client and server for production deployment
set -e

# Build client
cd client
npm ci --only=production
npm run build
cd ..

# Install server dependencies (production only)
npm ci --only=production

# Restart server with pm2 (uncomment and adjust if needed)
if command -v pm2 >/dev/null 2>&1; then
  pm2 reload anatscrawler || pm2 start index.js --name anatscrawler
  echo "Server restarted with pm2."
else
  echo "pm2 not found. Please restart the server process manually if needed."
fi

echo "Deployment build complete. Client and server are ready."
