#!/bin/bash
set -e

echo "🚀 Deploying ANATSCRAWLER - Production OSINT Platform"

# Build application
echo "📦 Building application..."
npm run build

# Deploy with PM2
echo "🔄 Restarting application..."
pm2 restart anatscrawler

# Health check
echo "🔍 Performing health check..."
sleep 5

# Try multiple times with timeout
for i in {1..10}; do
  if curl -f -m 10 https://horus.anatsecurity.fr/health; then
    echo "✅ Health check successful"
    break
  else
    echo "⚠️ Health check attempt $i failed, retrying..."
    sleep 3
    
    if [ $i -eq 10 ]; then
      echo "❌ Health check failed after 10 attempts"
      exit 1
    fi
  fi
done

echo "✅ OSINT Platform Deployed Successfully"
echo "🌐 Application available at: https://horus.anatsecurity.fr"
