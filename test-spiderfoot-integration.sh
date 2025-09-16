#!/bin/bash

# Test script for SpiderFoot integration debugging
# Run this script on the server to test SpiderFoot connectivity

echo "🕷️ ANAT Security SpiderFoot Integration Test"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check if SpiderFoot process is running
echo -e "\n${BLUE}Test 1: Checking SpiderFoot process...${NC}"
if pgrep -f "sf.py" > /dev/null; then
    echo -e "${GREEN}✅ SpiderFoot process is running${NC}"
    echo "Process details:"
    ps aux | grep sf.py | grep -v grep
else
    echo -e "${RED}❌ SpiderFoot process not found${NC}"
fi

# Test 2: Check if SpiderFoot port is open
echo -e "\n${BLUE}Test 2: Checking SpiderFoot port (5001)...${NC}"
if netstat -tulpn 2>/dev/null | grep :5001 > /dev/null || ss -tulpn 2>/dev/null | grep :5001 > /dev/null; then
    echo -e "${GREEN}✅ Port 5001 is open${NC}"
    netstat -tulpn 2>/dev/null | grep :5001 || ss -tulpn 2>/dev/null | grep :5001
else
    echo -e "${RED}❌ Port 5001 is not open${NC}"
fi

# Test 3: Direct SpiderFoot connectivity
echo -e "\n${BLUE}Test 3: Testing direct SpiderFoot connectivity...${NC}"
if curl -s --connect-timeout 5 -o /dev/null -w "%{http_code}" http://127.0.0.1:5001/ | grep -q "200"; then
    echo -e "${GREEN}✅ SpiderFoot responds to HTTP requests${NC}"
    echo "Response details:"
    curl -s --connect-timeout 5 http://127.0.0.1:5001/ | head -c 200
    echo ""
else
    echo -e "${RED}❌ SpiderFoot not responding to HTTP requests${NC}"
    echo "Trying with verbose output:"
    curl -v --connect-timeout 5 http://127.0.0.1:5001/ 2>&1 | head -20
fi

# Test 4: ANAT Security proxy connectivity
echo -e "\n${BLUE}Test 4: Testing ANAT Security proxy...${NC}"
if curl -s --connect-timeout 5 -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/osint/ | grep -q "200"; then
    echo -e "${GREEN}✅ ANAT Security proxy responds${NC}"
else
    echo -e "${RED}❌ ANAT Security proxy not responding${NC}"
fi

# Test 5: Check ANAT Security main service
echo -e "\n${BLUE}Test 5: Checking ANAT Security main service...${NC}"
if curl -s --connect-timeout 5 -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/health | grep -q "200"; then
    echo -e "${GREEN}✅ ANAT Security main service is healthy${NC}"
else
    echo -e "${RED}❌ ANAT Security main service not responding${NC}"
fi

# Test 6: Check SpiderFoot diagnostic endpoint
echo -e "\n${BLUE}Test 6: Testing SpiderFoot diagnostic endpoint...${NC}"
DIAG_RESPONSE=$(curl -s --connect-timeout 10 http://127.0.0.1:5000/osint/diagtest 2>/dev/null)
if echo "$DIAG_RESPONSE" | grep -q "SpiderFoot"; then
    echo -e "${GREEN}✅ Diagnostic endpoint working${NC}"
    echo "Diagnostic summary:"
    echo "$DIAG_RESPONSE" | jq -r '.recommendations[]' 2>/dev/null || echo "$DIAG_RESPONSE" | head -c 500
else
    echo -e "${RED}❌ Diagnostic endpoint failed${NC}"
    echo "Response: $DIAG_RESPONSE"
fi

# Test 7: Check nginx configuration
echo -e "\n${BLUE}Test 7: Checking nginx proxy configuration...${NC}"
if nginx -t 2>/dev/null; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${YELLOW}⚠️ Nginx configuration test failed or nginx not installed${NC}"
fi

# Test 8: Check public access through nginx
echo -e "\n${BLUE}Test 8: Testing public access through nginx...${NC}"
PUBLIC_URL="https://horus.anatsecurity.fr/osint/health"
if curl -s --connect-timeout 10 -k "$PUBLIC_URL" | grep -q "ok"; then
    echo -e "${GREEN}✅ Public access through nginx works${NC}"
else
    echo -e "${RED}❌ Public access through nginx failed${NC}"
    echo "Trying HTTP instead of HTTPS:"
    curl -s --connect-timeout 10 "http://horus.anatsecurity.fr/osint/health" | head -200
fi

# Test 9: Check log files for errors
echo -e "\n${BLUE}Test 9: Checking recent log entries...${NC}"
LOG_DIRS=(
    "/var/www/anatscrawler/logs"
    "/var/www/anatscrawler/data/spiderfoot/logs"
    "/var/log/nginx"
)

for log_dir in "${LOG_DIRS[@]}"; do
    if [ -d "$log_dir" ]; then
        echo -e "${BLUE}Logs in $log_dir:${NC}"
        find "$log_dir" -name "*.log" -type f -exec ls -la {} \; 2>/dev/null || echo "No log files found"
        
        # Show recent errors
        find "$log_dir" -name "*.log" -type f -exec grep -l -i "error\|fail\|exception" {} \; 2>/dev/null | head -3 | while read logfile; do
            echo -e "${YELLOW}Recent errors in $logfile:${NC}"
            tail -5 "$logfile" 2>/dev/null | grep -i "error\|fail\|exception" || echo "No recent errors"
        done
    fi
done

# Summary
echo -e "\n${BLUE}=================================================="
echo -e "🏁 Test Summary${NC}"
echo "=================================================="
echo "If SpiderFoot process is running and port 5001 is open,"
echo "but HTTP requests fail, check:"
echo "1. SpiderFoot startup logs"
echo "2. Python virtual environment"
echo "3. SpiderFoot configuration"
echo "4. Firewall settings"
echo ""
echo "If ANAT Security proxy fails, check:"
echo "1. Main application logs"
echo "2. Node.js process status"
echo "3. PM2 status"
echo ""
echo "If public access fails, check:"
echo "1. Nginx configuration"
echo "2. SSL certificates"
echo "3. Firewall rules"
echo "4. DNS resolution"

# Quick fix suggestions
echo -e "\n${YELLOW}Quick fixes to try:${NC}"
echo "1. Restart SpiderFoot: pkill -f sf.py && cd /var/www/anatscrawler/current/server/spiderfoot-4.0 && ./venv/bin/python sf.py -l 127.0.0.1:5001 -r &"
echo "2. Restart ANAT Security: pm2 restart anatscrawler"
echo "3. Restart nginx: sudo systemctl restart nginx"
echo "4. Check firewall: sudo ufw status"
echo "5. Test ports: telnet 127.0.0.1 5001"

echo -e "\n${GREEN}Test completed!${NC}"
