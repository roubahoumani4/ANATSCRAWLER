#!/bin/bash

# Deployment validation script
# This script validates that the deployment is working correctly

set -e

echo "🔍 Validating deployment..."

# Configuration
SERVER_URL="http://localhost:5000"
HEALTH_ENDPOINT="$SERVER_URL/api/health"
TIMEOUT=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "info")
            echo -e "ℹ️  $message"
            ;;
    esac
}

# Check if PM2 is running the application
check_pm2() {
    print_status "info" "Checking PM2 status..."
    
    if ! command -v pm2 &> /dev/null; then
        print_status "error" "PM2 is not installed"
        return 1
    fi
    
    if pm2 show anatscrawler | grep -q "online"; then
        print_status "success" "PM2 process is online"
        return 0
    else
        print_status "error" "PM2 process is not online"
        pm2 ls
        return 1
    fi
}

# Check if port 5000 is listening
check_port() {
    print_status "info" "Checking if port 5000 is listening..."
    
    if netstat -tln | grep -q ":5000"; then
        print_status "success" "Port 5000 is listening"
        return 0
    else
        print_status "error" "Port 5000 is not listening"
        print_status "info" "Current listening ports:"
        netstat -tln | grep LISTEN
        return 1
    fi
}

# Check HTTP response
check_http() {
    print_status "info" "Testing HTTP response..."
    
    # Test root endpoint
    local root_response
    root_response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$SERVER_URL/" || echo "000")
    
    if [[ "$root_response" == "200" ]] || [[ "$root_response" == "404" ]]; then
        print_status "success" "Root endpoint responding (HTTP $root_response)"
    else
        print_status "error" "Root endpoint not responding properly (HTTP $root_response)"
        return 1
    fi
    
    # Test health endpoint
    local health_response
    health_response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$HEALTH_ENDPOINT" || echo "000")
    
    if [[ "$health_response" == "200" ]]; then
        print_status "success" "Health endpoint responding (HTTP $health_response)"
        
        # Get health data
        local health_data
        health_data=$(curl -s --connect-timeout $TIMEOUT "$HEALTH_ENDPOINT" || echo "{}")
        print_status "info" "Health data: $health_data"
    else
        print_status "warning" "Health endpoint not responding (HTTP $health_response)"
    fi
}

# Check static files
check_static_files() {
    print_status "info" "Checking static files..."
    
    local current_dir
    current_dir=$(pwd)
    
    # Check if we're in the deployment directory
    if [[ -f "client/dist/index.html" ]]; then
        print_status "success" "Client build files found"
        ls -la client/dist/index.html
    elif [[ -f "dist/index.js" ]]; then
        print_status "success" "Server build files found"
        ls -la dist/index.js
        
        # Look for client files
        if find . -name "index.html" -type f | head -1 | grep -q .; then
            print_status "info" "Client HTML files found:"
            find . -name "index.html" -type f | head -3
        else
            print_status "warning" "No client HTML files found"
        fi
    else
        print_status "warning" "No build files found in current directory"
        print_status "info" "Current directory: $current_dir"
        print_status "info" "Contents:"
        ls -la | head -10
    fi
}

# Main validation function
main() {
    local exit_code=0
    
    echo "🏥 Deployment Validation Report"
    echo "==============================="
    
    # Run all checks
    check_pm2 || exit_code=1
    echo
    
    check_port || exit_code=1
    echo
    
    check_http || exit_code=1
    echo
    
    check_static_files
    echo
    
    # Final summary
    if [[ $exit_code -eq 0 ]]; then
        print_status "success" "All critical checks passed! 🎉"
        print_status "info" "Deployment appears to be working correctly"
    else
        print_status "error" "Some checks failed! Please review the output above"
        print_status "info" "Check PM2 logs: pm2 logs anatscrawler"
    fi
    
    return $exit_code
}

# Run the validation
main "$@"
