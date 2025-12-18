#!/bin/bash

# User Activity Isolation - Test Script
# This script helps verify that user data isolation is working correctly

echo "=================================================="
echo "User Activity Isolation - Test Verification"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Check if server is running${NC}"
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not running. Please start the server first.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Testing Analytics Endpoints${NC}"
echo ""

# You'll need to replace these with actual JWT tokens from two different users
echo "Please provide test credentials:"
echo ""
read -p "Enter User A's JWT token: " TOKEN_A
read -p "Enter User B's JWT token: " TOKEN_B

echo ""
echo -e "${YELLOW}Testing User A's Analytics${NC}"
echo "-----------------------------------"

# Test threat distribution for User A
echo "Testing /api/v1/analytics/threat-distribution"
RESPONSE_A_THREAT=$(curl -s -H "Authorization: Bearer $TOKEN_A" http://localhost:5000/api/v1/analytics/threat-distribution)
echo "Response: $RESPONSE_A_THREAT"
echo ""

# Test security score for User A
echo "Testing /api/v1/analytics/security-score"
RESPONSE_A_SCORE=$(curl -s -H "Authorization: Bearer $TOKEN_A" http://localhost:5000/api/v1/analytics/security-score)
echo "Response: $RESPONSE_A_SCORE"
echo ""

echo -e "${YELLOW}Testing User B's Analytics${NC}"
echo "-----------------------------------"

# Test threat distribution for User B
echo "Testing /api/v1/analytics/threat-distribution"
RESPONSE_B_THREAT=$(curl -s -H "Authorization: Bearer $TOKEN_B" http://localhost:5000/api/v1/analytics/threat-distribution)
echo "Response: $RESPONSE_B_THREAT"
echo ""

# Test security score for User B
echo "Testing /api/v1/analytics/security-score"
RESPONSE_B_SCORE=$(curl -s -H "Authorization: Bearer $TOKEN_B" http://localhost:5000/api/v1/analytics/security-score)
echo "Response: $RESPONSE_B_SCORE"
echo ""

echo "=================================================="
echo -e "${GREEN}Manual Verification Required:${NC}"
echo "=================================================="
echo ""
echo "1. Compare the responses above"
echo "2. User A's data should be DIFFERENT from User B's data"
echo "3. Each user should only see their own searches"
echo "4. The counts/metrics should reflect only that user's activity"
echo ""
echo -e "${YELLOW}Additional Tests to Perform in Browser:${NC}"
echo "-----------------------------------"
echo "1. Login as User A"
echo "2. Navigate to Dark Web Monitoring page"
echo "3. Note the threat distribution and security scores"
echo "4. Perform some searches"
echo "5. Verify the analytics update"
echo "6. Logout and login as User B"
echo "7. Verify User B sees DIFFERENT analytics (or empty if new user)"
echo "8. User B should NOT see User A's searches in Recent Activity"
echo ""
echo "=================================================="
