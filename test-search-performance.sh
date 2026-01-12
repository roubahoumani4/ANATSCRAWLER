#!/bin/bash

# Test Script for Optimized Search Performance
# This tests the API endpoint with the same query you used in curl

API_PORT=${API_PORT:-5000}
API_HOST=${API_HOST:-localhost}
ELASTICSEARCH_PORT=${ELASTICSEARCH_PORT:-9200}
ELASTICSEARCH_HOST=${ELASTICSEARCH_HOST:-localhost}

echo "======================================"
echo "Search Performance Test"
echo "======================================"
echo ""

# Test Query
QUERY="gmabis@yahoo.com"

echo "Test 1: Elasticsearch Direct (Port $ELASTICSEARCH_PORT)"
echo "Command: curl -X GET http://$ELASTICSEARCH_HOST:$ELASTICSEARCH_PORT/collection1/_search"
echo ""

ES_START=$(date +%s%N)
ES_RESULT=$(curl -s -X GET "http://$ELASTICSEARCH_HOST:$ELASTICSEARCH_PORT/collection1/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d '{
    "_source": ["file_name", "file_path"],
    "query": {
      "match_phrase": {
        "content": "'$QUERY'"
      }
    }
  }')
ES_END=$(date +%s%N)

ES_TIME=$(( ($ES_END - $ES_START) / 1000000 ))
ES_HITS=$(echo "$ES_RESULT" | grep -o '"value" : [0-9]*' | head -1 | grep -o '[0-9]*')
ES_TOOK=$(echo "$ES_RESULT" | grep -o '"took" : [0-9]*' | grep -o '[0-9]*')

echo "Results: $ES_HITS hits"
echo "Elasticsearch took: ${ES_TOOK}ms"
echo "Total time (network): ${ES_TIME}ms"
echo ""

echo "======================================"
echo "Test 2: API Endpoint (Port $API_PORT)"
echo "Command: curl -X POST http://$API_HOST:$API_PORT/api/v1/search/darkweb-search"
echo ""

API_START=$(date +%s%N)
API_RESULT=$(curl -s -X POST "http://$API_HOST:$API_PORT/api/v1/search/darkweb-search" \
  -H 'Content-Type: application/json' \
  -d '{"query": "'$QUERY'", "limit": 100}')
API_END=$(date +%s%N)

API_TIME=$(( ($API_END - $API_START) / 1000000 ))

# Parse results
if echo "$API_RESULT" | grep -q '"success": true'; then
  API_HITS=$(echo "$API_RESULT" | grep -o '"id"' | wc -l)
  echo "API Status: SUCCESS"
  echo "Results returned: $API_HITS"
  echo "Total time: ${API_TIME}ms"
else
  echo "API Status: FAILED or NO RESPONSE"
  echo "Response: $API_RESULT"
  echo ""
  echo "⚠️  Make sure the API server is running on port $API_PORT"
  echo "   npm run dev   # For development"
  echo "   npm run build && npm run start  # For production"
fi

echo ""
echo "======================================"
echo "Summary"
echo "======================================"
if [ ! -z "$ES_TOOK" ]; then
  echo "✓ Elasticsearch: ${ES_TOOK}ms - WORKING"
else
  echo "✗ Elasticsearch: NO RESPONSE"
fi

if echo "$API_RESULT" | grep -q '"success": true'; then
  DIFF=$((API_TIME - ES_TIME))
  echo "✓ API: ${API_TIME}ms - WORKING (overhead: ${DIFF}ms)"
  
  if [ $API_TIME -lt 1000 ]; then
    echo "✓ PERFORMANCE: EXCELLENT (< 1 second)"
  elif [ $API_TIME -lt 3000 ]; then
    echo "⚠️  PERFORMANCE: ACCEPTABLE (1-3 seconds)"
  else
    echo "✗ PERFORMANCE: SLOW (> 3 seconds)"
  fi
else
  echo "✗ API: NO RESPONSE - Server may not be running"
fi

echo ""
