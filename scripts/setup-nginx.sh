#!/bin/bash

# Nginx Setup Script for ANATSCRAWLER
# Run this script on the Nginx proxy server (192.168.1.104)
# This will configure Nginx to proxy requests to the web app server (192.168.1.105:5000)

set -e

# Configuration
NGINX_SITE_NAME="anatscrawler"
NGINX_CONFIG_SOURCE="./nginx-anatscrawler.conf"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        print_status "error" "This script must be run as root or with sudo"
        exit 1
    fi
}

# Check if nginx is installed
check_nginx() {
    if ! command -v nginx &> /dev/null; then
        print_status "error" "Nginx is not installed. Please install nginx first:"
        echo "  sudo apt update && sudo apt install nginx"
        exit 1
    fi
    print_status "success" "Nginx is installed"
}

# Check if configuration file exists
check_config_file() {
    if [[ ! -f "$NGINX_CONFIG_SOURCE" ]]; then
        print_status "error" "Configuration file not found: $NGINX_CONFIG_SOURCE"
        print_status "info" "Make sure you're running this script from the docs/ directory"
        print_status "info" "Or update NGINX_CONFIG_SOURCE variable to point to the correct path"
        exit 1
    fi
    print_status "success" "Configuration file found: $NGINX_CONFIG_SOURCE"
}

# Backup existing configuration if it exists
backup_existing_config() {
    local config_path="$NGINX_SITES_AVAILABLE/$NGINX_SITE_NAME"
    
    if [[ -f "$config_path" ]]; then
        local backup_path="$config_path.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$config_path" "$backup_path"
        print_status "success" "Existing configuration backed up to: $backup_path"
    fi
}

# Copy new configuration
install_config() {
    local target_path="$NGINX_SITES_AVAILABLE/$NGINX_SITE_NAME"
    
    cp "$NGINX_CONFIG_SOURCE" "$target_path"
    chmod 644 "$target_path"
    print_status "success" "Configuration copied to: $target_path"
}

# Enable site
enable_site() {
    local config_path="$NGINX_SITES_AVAILABLE/$NGINX_SITE_NAME"
    local enabled_path="$NGINX_SITES_ENABLED/$NGINX_SITE_NAME"
    
    # Remove existing symlink if it exists
    if [[ -L "$enabled_path" ]]; then
        rm "$enabled_path"
        print_status "info" "Removed existing symlink"
    fi
    
    # Create new symlink
    ln -sf "$config_path" "$enabled_path"
    print_status "success" "Site enabled: $enabled_path"
}

# Test nginx configuration
test_config() {
    print_status "info" "Testing nginx configuration..."
    
    if nginx -t; then
        print_status "success" "Nginx configuration test passed"
    else
        print_status "error" "Nginx configuration test failed"
        print_status "info" "Please check the configuration and fix any errors"
        exit 1
    fi
}

# Reload nginx
reload_nginx() {
    print_status "info" "Reloading nginx..."
    
    if systemctl reload nginx; then
        print_status "success" "Nginx reloaded successfully"
    else
        print_status "error" "Failed to reload nginx"
        print_status "info" "Check nginx status: systemctl status nginx"
        exit 1
    fi
}

# Show status information
show_status() {
    print_status "info" "Deployment status:"
    
    # Check if nginx is running
    if systemctl is-active --quiet nginx; then
        print_status "success" "Nginx is running"
    else
        print_status "error" "Nginx is not running"
    fi
    
    # Show enabled sites
    print_status "info" "Enabled sites:"
    ls -la "$NGINX_SITES_ENABLED/"
    
    echo ""
    print_status "info" "Configuration summary:"
    echo "  - Site: $NGINX_SITE_NAME"
    echo "  - Config: $NGINX_SITES_AVAILABLE/$NGINX_SITE_NAME"
    echo "  - Domain: horus.anatsecurity.fr"
    echo "  - Proxy Server: 192.168.1.104 (this server)"
    echo "  - Backend Server: 192.168.1.105:5000"
    echo "  - SSL: Configured (certificates required)"
    
    echo ""
    print_status "info" "Next steps:"
    echo "  1. Ensure SSL certificates are installed:"
    echo "     - /etc/ssl/certs/horus.anatsecurity.fr.crt"
    echo "     - /etc/ssl/private/horus.anatsecurity.fr.key"
    echo "  2. Test the site: https://horus.anatsecurity.fr"
    echo "  3. Monitor logs: tail -f /var/log/nginx/anatscrawler.error.log"
}

# Main function
main() {
    echo "🔧 ANATSCRAWLER Nginx Setup"
    echo "=========================="
    
    check_permissions
    check_nginx
    check_config_file
    
    print_status "info" "Installing nginx configuration for $NGINX_SITE_NAME..."
    
    backup_existing_config
    install_config
    enable_site
    test_config
    reload_nginx
    
    echo ""
    print_status "success" "Nginx configuration completed successfully!"
    
    show_status
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -c, --config   Specify config file path (default: ./nginx-anatscrawler.conf)"
    echo ""
    echo "Examples:"
    echo "  $0                                  # Use default config file"
    echo "  $0 -c /path/to/custom/config.conf  # Use custom config file"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--config)
            NGINX_CONFIG_SOURCE="$2"
            shift 2
            ;;
        *)
            print_status "error" "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main
