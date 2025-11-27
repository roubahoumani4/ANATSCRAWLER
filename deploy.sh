#!/bin/bash
set -e

echo "🚀 Deploying ANAT Security OSINT Platform"

# Production environment setup
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=5000

# Build application
echo "📦 Building OSINT Platform..."
npm run build

# (Embedded OSINT engine integration removed) skipping engine verification and Python checks

# Deploy with PM2
echo "🔄 Restarting OSINT Platform..."
pm2 restart anatscrawler

# Wait for application to start
echo "⏳ Waiting for application to initialize..."
sleep 10

# Health check - Main application
echo "🔍 Performing health checks..."
for i in {1..15}; do
  if curl -f -m 10 -s "http://localhost:5000/health" > /dev/null; then
    echo "✅ Main application health check successful"
    break
  else
    echo "⚠️ Main application health check attempt $i failed, retrying..."
    sleep 3
    
    if [ $i -eq 15 ]; then
      echo "❌ Main application health check failed after 15 attempts"
      pm2 logs anatscrawler --lines 50 --nostream
      exit 1
    fi
  fi
done

# (Embedded OSINT engine integration removed) skipping engine health checks

# Production health check if available
if [ ! -z "$PRODUCTION_URL" ]; then
  echo "🌐 Checking production endpoint..."
  for i in {1..10}; do
    if curl -f -m 10 "$PRODUCTION_URL/health" > /dev/null; then
      echo "✅ Production health check successful"
      break
    else
      echo "⚠️ Production health check attempt $i failed, retrying..."
      sleep 3
      
      if [ $i -eq 10 ]; then
        echo "❌ Production health check failed after 10 attempts"
        exit 1
      fi
    fi
  done
fi

echo "🎉 ANAT Security OSINT Platform Deployed Successfully"
echo "🌐 Main Application: http://localhost:5000"
if [ ! -z "$PRODUCTION_URL" ]; then
  echo "🚀 Production URL: $PRODUCTION_URL"
fi
echo ""
echo "📊 Platform Features Available:"
echo "   • Web-based OSINT Investigation Interface"
echo "   • Real-time Scan Results and Reporting"
echo "   • Multi-module OSINT Data Collection"
echo "   • Advanced Correlation and Analysis"
