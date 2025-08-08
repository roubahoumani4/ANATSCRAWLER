# SpiderFoot Integration Debug Guide

## Issue
The SpiderFoot integration is not showing any scans or results on the page at https://horus.anatsecurity.fr/osint-engine/scans

## Latest Changes (2025-01-27) - Based on Actual Directory Structure

### 1. Enhanced Error Handling
- ✅ Added comprehensive logging to `server/spiderfoot.service.js`
- ✅ Added debugging output to `server/spiderfoot/spiderfoot_wrapper.py`
- ✅ Added error handling to frontend components
- ✅ Added health check endpoint (`/api/spiderfoot/health`)

### 2. Fixed Database Path Issues
- ✅ Updated `server/spiderfoot/spiderfoot_wrapper.py` to use correct database path: `/var/www/anatscrawler/spiderfoot.db`
- ✅ Added fallback database path handling
- ✅ Added automatic database creation if it doesn't exist
- ✅ Added directory creation for database path

### 3. Fixed Module Path Issues
- ✅ Updated module path to handle symbolic link: `/var/www/anatscrawler/modules -> server/spiderfoot/modules/`
- ✅ Added multiple path detection for modules directory
- ✅ Added symbolic link support

### 4. Fixed Wrapper Path Issues
- ✅ Updated wrapper path to handle symbolic link: `/var/www/anatscrawler/spiderfoot_wrapper.py -> server/spiderfoot/spiderfoot_wrapper.py`
- ✅ Added multiple path detection for wrapper
- ✅ Added symbolic link support

### 5. Added Test Endpoints
- ✅ Added `/api/spiderfoot/test` endpoint for debugging
- ✅ Added `/api/spiderfoot/health` endpoint for health checks
- ✅ Created `server/spiderfoot/test_python.py` for environment testing
- ✅ Added environment test function to service

### 6. Improved Frontend Debugging
- ✅ Added console logging to `client/src/components/dashboard/OsintScans.tsx`
- ✅ Enhanced error handling in fetch requests
- ✅ Added health check before fetching scans
- ✅ Better error reporting to users

## Actual Directory Structure (from server)

```
/var/www/anatscrawler/
├── app/                           # Application directory
├── client/                        # Frontend client
├── deploy/                        # Deployment files
├── dist/                          # Build distribution
├── ecosystem.config.cjs           # PM2 configuration
├── index.js                       # Main server file
├── maigret-venv/                  # Python virtual environment
├── modules -> server/spiderfoot/modules/  # Symbolic link to modules
├── node_modules/                  # Node.js dependencies
├── out/                           # Output directory
├── package-lock.json              # Package lock file
├── package.json                   # Package configuration
├── scripts/                       # Scripts directory
├── server/                        # Server directory
├── spiderfoot.db                  # SpiderFoot database (ROOT LEVEL)
└── spiderfoot_wrapper.py -> server/spiderfoot/spiderfoot_wrapper.py  # Symbolic link
```

## Debugging Steps

### 1. Test the Health Check
Visit the health check endpoint to verify the API is running:
```
https://horus.anatsecurity.fr/api/spiderfoot/health
```

Expected response:
```json
{
  "status": "SpiderFoot API is running",
  "timestamp": "2025-01-27T...",
  "environment": "production",
  "wrapperPath": "/var/www/anatscrawler/spiderfoot_wrapper.py"
}
```

### 2. Test the Environment
Visit the test endpoint to check the Python environment:
```
https://horus.anatsecurity.fr/api/spiderfoot/test
```

This will show:
- Python version and executable
- Current directory and paths
- Module import status
- Database path and status
- Symbolic link status
- Scan list results

### 3. Check Server Logs
Look at the PM2 logs for SpiderFoot-related messages:
```bash
pm2 logs anatscrawler | grep -i spiderfoot
```

### 4. Test Python Wrapper Directly
SSH into the production VM and test the Python wrapper:
```bash
cd /var/www/anatscrawler
python3 server/spiderfoot/spiderfoot_wrapper.py list_scans
```

### 5. Check Database
Verify the SpiderFoot database exists and is accessible:
```bash
ls -la /var/www/anatscrawler/spiderfoot.db
```

### 6. Test API Endpoints
Test the API endpoints directly:
```bash
curl https://horus.anatsecurity.fr/api/spiderfoot/scanlist
curl https://horus.anatsecurity.fr/api/spiderfoot/modules
```

## Common Issues

### 1. Python Path Issues
- **Problem**: Python executable not found
- **Solution**: Check if `maigret-venv/bin/python3.10` exists
- **Alternative**: Use system Python (`python3`)

### 2. Database Path Issues
- **Problem**: Database file not found
- **Solution**: Check if `/var/www/anatscrawler/spiderfoot.db` exists (ROOT LEVEL)
- **Alternative**: Create database in current directory

### 3. Module Import Issues
- **Problem**: SpiderFoot modules not found
- **Solution**: Check if `/var/www/anatscrawler/modules` symbolic link exists
- **Alternative**: Verify PYTHONPATH is set correctly

### 4. Permission Issues
- **Problem**: File permission errors
- **Solution**: Check file ownership and permissions
- **Command**: `sudo chown -R ituu:ituu /var/www/anatscrawler`

## Expected Behavior

### Successful Integration
1. `/api/spiderfoot/health` returns health status
2. `/api/spiderfoot/test` returns environment information
3. `/api/spiderfoot/scanlist` returns scan list (empty array if no scans)
4. `/api/spiderfoot/modules` returns available modules
5. Frontend displays scans or "No scans found" message

### Error Indicators
1. Health check endpoint returns error
2. Test endpoint returns error details
3. Server logs show Python errors
4. Frontend console shows API errors
5. Database file missing or inaccessible

## Next Steps

1. **Deploy Changes**: Push changes to trigger automatic deployment
2. **Test Health Check**: Visit `/api/spiderfoot/health` endpoint
3. **Test Environment**: Visit `/api/spiderfoot/test` endpoint
4. **Check Logs**: Monitor PM2 logs for errors
5. **Verify Database**: Ensure SpiderFoot database exists at root level
6. **Test Scans**: Try creating a new scan to verify functionality

## Files Modified

- `server/spiderfoot.service.js` - Enhanced error handling and logging
- `server/spiderfoot/spiderfoot_wrapper.py` - Fixed database and module paths
- `server/routes/spiderfoot.ts` - Added test and health endpoints
- `client/src/components/dashboard/OsintScans.tsx` - Added debugging and error handling
- `server/spiderfoot/test_python.py` - Updated test script for actual structure

## Quick Test Commands

```bash
# Test health check
curl https://horus.anatsecurity.fr/api/spiderfoot/health

# Test scan list
curl https://horus.anatsecurity.fr/api/spiderfoot/scanlist

# Test modules
curl https://horus.anatsecurity.fr/api/spiderfoot/modules

# Test environment
curl https://horus.anatsecurity.fr/api/spiderfoot/test
```
