# SpiderFoot Navigation Fix Deployment Guide

## Issues Fixed

1. **Path Rewriting Problems**: Fixed double `/osint` prefix issues
2. **Navigation Issues**: Corrected SpiderFoot link rewriting for proper navigation
3. **504 Timeout on New Scan**: Improved timeout handling and async scan processing
4. **UI Corruption**: Server-side theme injection for consistent styling

## Changes Made

### 1. SpiderFoot Service (`server/services/spiderfoot.service.ts`)
- Changed docroot from `/osint` to `/` (SpiderFoot serves from root)
- Proxy now handles the `/osint` prefix addition
- Added theme injection capability
- Improved error handling and logging

### 2. SpiderFoot Route (`server/routes/spiderfoot.ts`)
- Fixed path rewriting to strip `/osint` prefix before sending to SpiderFoot
- Added HTML response modification to fix relative links
- Improved async scan handling with proper timeout configuration
- Enhanced diagnostic endpoints

### 3. Configuration (`server/config.ts`)
- Updated OSINT config to reflect new docroot handling
- Added comprehensive timeout configurations

### 4. Theme Injector (`server/utils/spiderfoot-theme-injector.js`)
- New utility for server-side theme injection
- DARKSCRAWLER theme integration
- Navigation fixes built into CSS

### 5. Client Component (`client/src/components/osint/SpiderFootIntegrated.tsx`)
- Removed conflicting CSS injection
- Simplified to basic navigation fixes only
- Reduced iframe interference

## Testing Steps

### 1. Build and Deploy
```bash
# Build the server and client
npm run build

# Test locally first
npm run dev
```

### 2. Test Navigation
1. Navigate to `/osint` in your application
2. Click on SpiderFoot navigation menu items
3. Verify that:
   - New Scan page loads properly
   - Navigation between pages works
   - Forms submit correctly
   - No 504 errors on scan creation

### 3. Test Scan Functionality
1. Go to New Scan page
2. Enter a target (e.g., `example.com`)
3. Select scan modules
4. Start the scan
5. Verify:
   - Scan starts without 504 error
   - Progress can be monitored
   - Results appear properly

### 4. Deploy to Production
```bash
# Commit changes
git add .
git commit -m "Fix SpiderFoot navigation and 504 timeout issues"
git push origin main
```

## Expected Results

✅ **Navigation**: All SpiderFoot pages should load and navigate properly
✅ **New Scan**: Should accept scan requests without 504 errors  
✅ **Theme**: DARKSCRAWLER theme should be applied consistently
✅ **Performance**: Faster page loads with proper timeout handling

## Debugging

If issues persist:

1. **Check server logs**:
```bash
pm2 logs anatscrawler
```

2. **Test SpiderFoot directly**:
```bash
curl -I http://127.0.0.1:5001/
curl -I http://127.0.0.1:5001/newscan
```

3. **Check diagnostic endpoint**:
```bash
curl http://localhost:5000/osint/diagtest
```

4. **Verify proxy rewriting**:
   - Check browser network tab
   - Look for correct path transformations
   - Verify response headers

## Configuration Files Updated

- `server/services/spiderfoot.service.ts`
- `server/routes/spiderfoot.ts`
- `server/config.ts`
- `client/src/components/osint/SpiderFootIntegrated.tsx`
- **New**: `server/utils/spiderfoot-theme-injector.js`

## Production Deployment

The changes will be automatically deployed via GitHub Actions when pushed to main branch. The deployment includes:

1. SpiderFoot dependency installation
2. Virtual environment setup
3. Theme injection
4. Service configuration updates

Monitor the deployment logs for any issues during the automatic setup process.
