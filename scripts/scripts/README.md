# 🛠️ ANATSCRAWLER Operations Scripts

This directory contains consolidated scripts for deployment, maintenance, and OSINT engine management.

## 🚀 Quick Start

### Main Operations Script
Use the consolidated operations script for most tasks:

```bash
# Check system health
./ops.sh health

# Fix system issues
./ops.sh fix

# Test OSINT functionality
./ops.sh test

# Clean system
./ops.sh clean

# Show all commands
./ops.sh help
```

## 📁 Directory Structure

### 🔧 Core Scripts
Essential operational scripts:
- `check-deployment.sh` - Deployment verification
- `diagnose-issues.sh` - Comprehensive diagnostics
- `fix-integration.sh` - Development environment fixes
- `fix-production.sh` - Production environment fixes

### 🗄️ Database Scripts  
Database-specific operations:
- `fix-database-location.sh` - Fix database location conflicts
- `fix-database-production.sh` - Production database fixes
- `fix-database-schema.sh` - Schema initialization
- `db_utils.py` - Python database utilities

### 🔧 Maintenance Scripts
System maintenance utilities:
- `install-dependencies.sh` - Install runtime dependencies
- `disable-auth.sh` - Disable embedded engine authentication (if applicable)
- Various Python test and check scripts

### 📦 Deployment Scripts
Production deployment utilities:
- `deploy.sh` - Main deployment script
- `setup_db.py` - Database initialization

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
./ops.sh fix

# Test functionality  
./ops.sh test
```

# For Production Deployment
```bash
# On production server
./core/fix-production.sh

# Or use consolidated script
./ops.sh fix
```

### For Troubleshooting
```bash
# Comprehensive diagnostics
./ops.sh diagnose

# Specific issue fixes
./database/fix-database-schema.sh
./maintenance/install-dependencies.sh
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
