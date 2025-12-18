#!/bin/bash

# Test Elasticsearch Connection
# This script tests if Elasticsearch is accessible

echo "🔍 Testing Elasticsearch Connection..."
echo ""

ELASTICSEARCH_URL="http://192.168.1.110:9200"

# Test 1: Check if Elasticsearch is reachable
echo "Test 1: Checking if Elasticsearch is reachable..."
if curl -s -o /dev/null -w "%{http_code}" "$ELASTICSEARCH_URL" | grep -q "200"; then
    echo "✅ Elasticsearch is reachable!"
else
    echo "❌ Elasticsearch is NOT reachable at $ELASTICSEARCH_URL"
    echo "   Please check:"
    echo "   - Is Elasticsearch running?"
    echo "   - Is the IP address correct?"
    echo "   - Are firewall rules allowing connection?"
    exit 1
fi

echo ""

# Test 2: Get cluster health
echo "Test 2: Checking cluster health..."
HEALTH=$(curl -s "$ELASTICSEARCH_URL/_cluster/health" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ -n "$HEALTH" ]; then
    echo "✅ Cluster Health: $HEALTH"
else
    echo "❌ Could not get cluster health"
fi

echo ""

# Test 3: List indices
echo "Test 3: Listing all indices..."
INDICES=$(curl -s "$ELASTICSEARCH_URL/_cat/indices?format=json" | grep -o '"index":"[^"]*"' | cut -d'"' -f4)
if [ -n "$INDICES" ]; then
    echo "✅ Found indices:"
    echo "$INDICES" | while read -r index; do
        echo "   - $index"
    done
else
    echo "⚠️  No indices found (or could not retrieve them)"
fi

echo ""
echo "🎉 Connection test complete!"
echo ""
echo "You can now access Index Management at:"
echo "   http://localhost:5000/index/management"
echo ""
echo "Note: You must be logged in as an admin user!"
