# SpiderFoot Integration Debug Guide

## Issue
The SpiderFoot integration is not showing any scans or results on the page at https://horus.anatsecurity.fr/osint-engine/scans

## Changes Made

### 1. Enhanced Error Handling
- Added comprehensive logging to `server/spiderfoot.service.js`
- Added debugging output to `server/spiderfoot/spiderfoot_wrapper.py`
- Added error handling to frontend components

### 2. Fixed Database Path Issues
- Updated `server/spiderfoot/spiderfoot_wrapper.py` to try multiple database paths
- Added fallback database path handling
- Added database creation if it doesn't exist

### 3. Added Test Endpoints
- Added `/api/spiderfoot/test` endpoint for debugging
- Created `server/spiderfoot/test_python.py` for environment testing
- Added environment test function to service

### 4. Improved Frontend Debugging
- Added console logging to `client/src/components/dashboard/OsintScans.tsx`
- Enhanced error handling in fetch requests
- Added detailed logging for API responses

## Debugging Steps

### 1. Test the Environment
Visit the test endpoint to check the Python environment:
```
https://horus.anatsecurity.fr/api/spiderfoot/test
```

This will show:
- Python version and executable
- Current directory and paths
- Module import status
- Database path and status
- Scan list results

### 2. Check Server Logs
Look at the PM2 logs for SpiderFoot-related messages:
```bash
pm2 logs anatscrawler | grep -i spiderfoot
```

### 3. Test Python Wrapper Directly
SSH into the production VM and test the Python wrapper:
```bash
cd /var/www/anatscrawler/app
python3 server/spiderfoot/spiderfoot_wrapper.py list_scans
```

### 4. Check Database
Verify the SpiderFoot database exists and is accessible:
```bash
ls -la /var/www/anatscrawler/app/spiderfoot.db
```

### 5. Test API Endpoints
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
- **Solution**: Check if `/var/www/anatscrawler/app/spiderfoot.db` exists
- **Alternative**: Create database in current directory

### 3. Module Import Issues
- **Problem**: SpiderFoot modules not found
- **Solution**: Check if `server/spiderfoot/core` and `server/spiderfoot/modules` exist
- **Alternative**: Verify PYTHONPATH is set correctly

### 4. Permission Issues
- **Problem**: File permission errors
- **Solution**: Check file ownership and permissions
- **Command**: `sudo chown -R ituu:ituu /var/www/anatscrawler`

## Expected Behavior

### Successful Integration
1. `/api/spiderfoot/test` returns environment information
2. `/api/spiderfoot/scanlist` returns scan list (empty array if no scans)
3. `/api/spiderfoot/modules` returns available modules
4. Frontend displays scans or "No scans found" message

### Error Indicators
1. Test endpoint returns error details
2. Server logs show Python errors
3. Frontend console shows API errors
4. Database file missing or inaccessible

## Next Steps

1. **Deploy Changes**: Push changes to trigger automatic deployment
2. **Test Environment**: Visit `/api/spiderfoot/test` endpoint
3. **Check Logs**: Monitor PM2 logs for errors
4. **Verify Database**: Ensure SpiderFoot database exists
5. **Test Scans**: Try creating a new scan to verify functionality

## Files Modified

- `server/spiderfoot.service.js` - Enhanced error handling and logging
- `server/spiderfoot/spiderfoot_wrapper.py` - Fixed database path and added debugging
- `server/routes/spiderfoot.ts` - Added test endpoint
- `client/src/components/dashboard/OsintScans.tsx` - Added debugging and error handling
- `server/spiderfoot/test_python.py` - New test script for environment verification
