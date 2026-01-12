#!/bin/bash

# Search Performance Validation Script
# Run this to verify that the optimized search is working at expected speeds

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ELASTICSEARCH_HOST="${ELASTICSEARCH_HOST:-localhost:9200}"
API_BASE_URL="${API_BASE_URL:-http://localhost:5000}"
TEST_QUERY="gmabis@yahoo.com"
TIMEOUT_THRESHOLD=1500  # 1.5 seconds is acceptable

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Search Performance Validation${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Test 1: Elasticsearch Direct Search (baseline)
echo -e "${YELLOW}Test 1: Elasticsearch Direct Search (Baseline)${NC}"
echo "Command: curl -X GET \"http://${ELASTICSEARCH_HOST}/collection1/_search?pretty\""
echo ""

START_TIME=$(date +%s%N)

response=$(curl -s -X GET "http://${ELASTICSEARCH_HOST}/collection1/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "_source": ["file_name", "file_path"],
    "query": {
      "match_phrase": {
        "content": "'${TEST_QUERY}'"
      }
    }
  }')

END_TIME=$(date +%s%N)
ELAPSED=$((($END_TIME - $START_TIME) / 1000000))

hits=$(echo "$response" | grep -o '"value" : [0-9]*' | grep -o '[0-9]*' | head -1)
took=$(echo "$response" | grep -o '"took" : [0-9]*' | grep -o '[0-9]*' | head -1)

echo -e "Results: ${GREEN}${hits} hits${NC} in ${took}ms (network: ${ELAPSED}ms total)"
echo ""

# Test 2: API Search via Optimized Endpoint
echo -e "${YELLOW}Test 2: API Search (Optimized Endpoint)${NC}"
echo "POST ${API_BASE_URL}/api/v1/search/darkweb-search"
echo ""

START_TIME=$(date +%s%N)

api_response=$(curl -s -X POST "${API_BASE_URL}/api/v1/search/darkweb-search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "'${TEST_QUERY}'",
    "limit": 100
  }')

END_TIME=$(date +%s%N)
API_ELAPSED=$((($END_TIME - $START_TIME) / 1000000))

api_hits=$(echo "$api_response" | grep -o '"results":\s*\[' | wc -l)
api_total=$(echo "$api_response" | grep -o '"id"' | wc -l)

if [ $API_ELAPSED -lt $TIMEOUT_THRESHOLD ]; then
  STATUS="${GREEN}PASS${NC}"
else
  STATUS="${RED}FAIL${NC}"
fi

echo -e "Results: ${GREEN}${api_total} results${NC} in ${API_ELAPSED}ms"
echo -e "Status: ${STATUS} (threshold: ${TIMEOUT_THRESHOLD}ms)"
echo ""

# Test 3: Search All Indices
echo -e "${YELLOW}Test 3: Search All Indices (darkweb_structured + files_index + collection1)${NC}"
echo ""

START_TIME=$(date +%s%N)

all_indices_response=$(curl -s -X POST "${API_BASE_URL}/api/v1/search/darkweb-search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "'${TEST_QUERY}'",
    "limit": 100
  }')

END_TIME=$(date +%s%N)
ALL_ELAPSED=$((($END_TIME - $START_TIME) / 1000000))

all_total=$(echo "$all_indices_response" | grep -o '"id"' | wc -l)

if [ $ALL_ELAPSED -lt $TIMEOUT_THRESHOLD ]; then
  STATUS="${GREEN}PASS${NC}"
else
  STATUS="${RED}FAIL${NC}"
fi

echo -e "Results: ${GREEN}${all_total} total results${NC} from all indices in ${ALL_ELAPSED}ms"
echo -e "Status: ${STATUS} (threshold: ${TIMEOUT_THRESHOLD}ms)"
echo ""

# Test 4: Performance Comparison
echo -e "${BLUE}Performance Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ES_RATIO=$(echo "scale=2; $ELAPSED / $took" | bc)
API_RATIO=$(echo "scale=2; $API_ELAPSED / $ELAPSED" | bc)

echo -e "Elasticsearch (curl):     ${took}ms"
echo -e "API Endpoint Total:       ${API_ELAPSED}ms"
echo -e "Overhead:                 $((API_ELAPSED - ELAPSED))ms"
echo ""

if [ $API_ELAPSED -lt 1000 ]; then
  echo -e "${GREEN}✓ Search is FAST (< 1 second)${NC}"
elif [ $API_ELAPSED -lt 3000 ]; then
  echo -e "${YELLOW}⚠ Search is ACCEPTABLE (1-3 seconds)${NC}"
else
  echo -e "${RED}✗ Search is SLOW (> 3 seconds)${NC}"
  echo "   Consider checking Elasticsearch performance or network latency"
fi

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Validation Complete${NC}"
echo -e "${BLUE}================================${NC}"
