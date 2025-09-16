#!/bin/bash

# Quick SpiderFoot connectivity test script
# Run this on the server to test SpiderFoot directly

echo "🕷️ SpiderFoot Direct Connectivity Test"
echo "======================================"

# Test the correct docroot URLs that SpiderFoot should serve
echo "Testing SpiderFoot with docroot '/osint'..."

echo "1. Testing root endpoint with docroot:"
curl -v -m 10 http://127.0.0.1:5001/osint

echo -e "\n\n2. Testing newscan endpoint:"
curl -v -m 10 http://127.0.0.1:5001/osint/newscan

echo -e "\n\n3. Testing without docroot (should fail):"
curl -v -m 10 http://127.0.0.1:5001/

echo -e "\n\n4. Testing startscan endpoint:"
curl -v -m 10 http://127.0.0.1:5001/osint/startscan

echo -e "\n\n5. SpiderFoot process status:"
ps aux | grep sf.py | grep -v grep

echo -e "\n\n6. Port 5001 status:"
netstat -tulpn | grep :5001 || ss -tulpn | grep :5001

echo -e "\n\nTest completed!"
