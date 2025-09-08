# 🛠️ ANATSCRAWLER Operations Scripts

This directory contains consolidated scripts for deployment, maintenance, and SpiderFoot integration management.

## 🚀 Quick Start

### Main Operations Script
Use the consolidated operations script for most tasks:

```bash
# Check system health
./ops.sh health

# Fix SpiderFoot issues  
./ops.sh spiderfoot-fix

# Test SpiderFoot functionality
./ops.sh spiderfoot-test

# Clean system
./ops.sh clean

# Show all commands
./ops.sh help
```

## 📁 Directory Structure

### 🔧 Core Scripts
Essential operational scripts:
- `check-deployment.sh` - Deployment verification
- `diagnose-spiderfoot-issues.sh` - Comprehensive diagnostics  
- `fix-spiderfoot-integration.sh` - Development environment fixes
- `fix-production-spiderfoot.sh` - Production environment fixes

### 🗄️ Database Scripts  
Database-specific operations:
- `fix-spiderfoot-database-location.sh` - Fix database location conflicts
- `fix-spiderfoot-database-production.sh` - Production database fixes
- `fix-spiderfoot-database-schema.sh` - Schema initialization
- `fix-spiderfoot-db.py` - Python database utilities

### 🔧 Maintenance Scripts
System maintenance utilities:
- `fix-spiderfoot-dependencies.sh` - Install Python dependencies
- `disable-spiderfoot-auth.sh` - Disable SpiderFoot authentication
- Various Python test and check scripts

### 📦 Deployment Scripts
Production deployment utilities:
- `deploy.sh` - Main deployment script
- `setup_spiderfoot_db.py` - Database initialization

### 📚 Archive Directory
Archived scripts organized by category:
- `archive/legacy/` - Old master fix scripts
- `archive/redundant/` - Duplicate functionality scripts  
- `archive/obsolete/` - Outdated or no longer needed scripts

## 🎯 Recommended Usage

### For Development
```bash
# Health check
./ops.sh health

# Fix issues
./ops.sh spiderfoot-fix

# Test functionality  
./ops.sh spiderfoot-test
```

### For Production Deployment
```bash
# On production server
./core/fix-production-spiderfoot.sh

# Or use consolidated script
./ops.sh spiderfoot-fix
```

### For Troubleshooting
```bash
# Comprehensive diagnostics
./ops.sh diagnose

# Specific issue fixes
./database/fix-spiderfoot-database-schema.sh
./maintenance/fix-spiderfoot-dependencies.sh
```

## 📋 Script Consolidation Summary

### ✅ Kept (Essential)
- 4 core operational scripts
- 4 database-specific scripts  
- 6 maintenance utilities
- 1 consolidated operations script (`ops.sh`)
- Deployment scripts in `deployment/` subdirectory

### 📚 Archived (42 scripts)
- 8 legacy master fix scripts → `archive/legacy/`
- 9 redundant fix scripts → `archive/redundant/`  
- 10 obsolete test/debug scripts → `archive/obsolete/`

### 🗑️ Benefits
- Reduced complexity (from 50+ scripts to 15 essential ones)
- Clear organization by function
- Single entry point for common operations
- Maintained backward compatibility through archives

---

**🎯 For most operations, use `./ops.sh <command>` - it consolidates the functionality of most scripts into a single, well-tested interface.**
