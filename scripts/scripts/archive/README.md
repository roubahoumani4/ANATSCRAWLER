# 📚 Archived Scripts

This directory contains scripts that have been consolidated into the main `ops.sh` script or are no longer needed.

## Directory Structure

### `legacy/` - Legacy Master Fix Scripts
These scripts were early attempts at comprehensive fixes for embedded OSINT integrations:
- Multiple "master fix" scripts with overlapping functionality
- Consolidated into `ops.sh fix`

### `redundant/` - Redundant Fix Scripts  
Scripts that duplicate functionality now available in core scripts:
- Various specific fix scripts
- Most functionality moved to `ops.sh` and core scripts

### `obsolete/` - Obsolete Scripts
Scripts that are no longer needed or relevant:
- Old test scripts
- Debug scripts for resolved issues
- Deployment scripts replaced by GitHub Actions

## Using Archived Scripts

If you need to use an archived script:

```bash
# Make executable and run
chmod +x archive/legacy/script-name.sh
./archive/legacy/script-name.sh
```

**⚠️ Warning**: Archived scripts may not work with the current codebase and are kept for reference only.

## Migration Information

These scripts were archived during the consolidation process that:
- Reduced script count from 50+ to 15 essential ones
- Created the unified `ops.sh` interface  
- Organized remaining scripts by function
- Maintained all functionality in consolidated form

**💡 Tip**: Use `ops.sh help` to see all available consolidated operations.
