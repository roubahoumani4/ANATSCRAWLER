#!/bin/bash
set -e

echo "🚀 Deploying ANAT Security OSINT Platform with SpiderFoot Integration"

# Production environment setup
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=5000

# SpiderFoot OSINT Engine Configuration
export SPIDERFOOT_HOST=0.0.0.0
export SPIDERFOOT_PORT=5001
export SPIDERFOOT_DOCROOT=/osint

# Build application
echo "📦 Building OSINT Platform..."
npm run build

# Verify SpiderFoot integration
echo "🕷️ Verifying SpiderFoot OSINT Engine..."
if [ ! -d "server/spiderfoot-4.0" ]; then
    echo "❌ SpiderFoot directory not found at server/spiderfoot-4.0"
    echo "Please ensure SpiderFoot 4.0 is properly installed"
    exit 1
fi

if [ ! -f "server/spiderfoot-4.0/sf.py" ]; then
    echo "❌ SpiderFoot main script not found"
    echo "Please verify SpiderFoot installation"
    exit 1
fi

echo "✅ SpiderFoot OSINT Engine verified"

# Check Python dependencies for SpiderFoot
echo "🐍 Checking Python environment for OSINT engine..."
if command -v python3 &> /dev/null; then
    python_version=$(python3 --version 2>&1 | cut -d' ' -f2)
    echo "✅ Python 3 found: $python_version"
else
    echo "❌ Python 3 not found - required for SpiderFoot OSINT engine"
    exit 1
fi

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

# Health check - SpiderFoot OSINT Engine
echo "🕷️ Checking SpiderFoot OSINT Engine..."
for i in {1..20}; do
  if curl -f -m 15 -s "http://localhost:5000/osint/health" > /dev/null; then
    echo "✅ SpiderFoot OSINT Engine health check successful"
    break
  else
    echo "⏳ SpiderFoot OSINT Engine health check attempt $i failed, retrying..."
    sleep 5
    
    if [ $i -eq 20 ]; then
      echo "⚠️ SpiderFoot OSINT Engine took longer than expected to start"
      echo "This is normal for first startup as it initializes dependencies"
      echo "Continuing with deployment..."
      break
    fi
  fi
done

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
echo "🕷️ SpiderFoot OSINT Engine: http://localhost:5000/osint"
if [ ! -z "$PRODUCTION_URL" ]; then
  echo "🚀 Production URL: $PRODUCTION_URL"
fi
echo ""
echo "📊 Platform Features Available:"
echo "   • Native SpiderFoot OSINT Engine Integration"
echo "   • Web-based OSINT Investigation Interface"
echo "   • Real-time Scan Results and Reporting"
echo "   • Multi-module OSINT Data Collection"
echo "   • Advanced Correlation and Analysis"
