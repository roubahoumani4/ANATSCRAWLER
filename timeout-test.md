# SpiderFoot Scan Timeout Fix - Implementation Summary

## 🎯 Problem Solved
**Issue**: 504 Gateway Timeout when starting OSINT scans through SpiderFoot interface
**Root Cause**: 30-second proxy timeout was insufficient for SpiderFoot scan initialization

## ✅ Solutions Implemented

### 1. Dynamic Timeout Management
- **Standard requests**: 30 seconds (UI navigation, status checks)
- **Scan requests**: 5 minutes (scan initialization, results)
- **Heavy scan requests**: 10 minutes (comprehensive OSINT scans)

### 2. Smart Proxy Selection
The system now automatically selects appropriate timeouts based on request type:

```typescript
// POST requests to /newscan or /startscan
if (method === 'POST' && (path.includes('newscan') || path.includes('startscan'))) {
  // Uses 10-minute timeout (SPIDERFOOT_LONG_SCAN_TIMEOUT)
} else if (path.includes('scan') || path.includes('status') || path.includes('result')) {
  // Uses 5-minute timeout (SPIDERFOOT_SCAN_TIMEOUT)  
} else {
  // Uses 30-second timeout (SPIDERFOOT_REQUEST_TIMEOUT)
}
```

### 3. Async Scan Endpoint
New endpoint `/osint/async-scan` for background scan processing:
- Returns immediate 202 Accepted response
- Starts scan in background without blocking
- Provides user instructions for monitoring progress

### 4. Enhanced Error Handling
- Timeout-specific error messages with helpful suggestions
- Direct links to SpiderFoot interface for manual monitoring
- Clear guidance on expected scan duration (2-15 minutes)

### 5. Configurable Timeouts
Environment variables for fine-tuning:
```bash
SPIDERFOOT_REQUEST_TIMEOUT=30000       # 30s for standard requests
SPIDERFOOT_SCAN_TIMEOUT=300000         # 5m for scan operations  
SPIDERFOOT_LONG_SCAN_TIMEOUT=600000    # 10m for heavy scans
```

## 🧪 Testing the Fix

### Test 1: Standard UI Navigation
```bash
curl -X GET http://localhost:5000/osint/
# Should load in < 30 seconds
```

### Test 2: Scan Initialization (Regular)
```bash
curl -X POST http://localhost:5000/osint/newscan \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "scanname=test&scantarget=example.com"
# Should complete in < 5 minutes instead of timing out at 30s
```

### Test 3: Async Scan (Background)
```bash
curl -X POST http://localhost:5000/osint/async-scan \
  -H "Content-Type: application/json" \
  -d '{"scanname":"test","scantarget":"example.com"}'
# Returns immediately with 202 Accepted
```

## 🔧 Configuration Options

### Current Defaults
- Standard timeout: 30 seconds
- Scan timeout: 5 minutes (300 seconds)
- Long scan timeout: 10 minutes (600 seconds)

### To Increase Timeouts Further
Add to your environment configuration:
```bash
# For very large organizations or comprehensive scans
export SPIDERFOOT_LONG_SCAN_TIMEOUT=900000  # 15 minutes
export SPIDERFOOT_SCAN_TIMEOUT=450000       # 7.5 minutes
```

## 📊 Expected Behavior After Fix

### ✅ Before Fix (Broken)
```
User clicks "Start Scan" → 30s timeout → 504 Gateway Timeout Error
```

### ✅ After Fix (Working)
```
User clicks "Start Scan" → Scan initializes → Progress visible in SpiderFoot UI
                       ↘ If still slow → Clear timeout message with guidance
```

## 🔍 Monitoring Scan Progress

1. **Direct SpiderFoot Interface**: http://localhost:5001/osint
2. **Async endpoint**: Use `/osint/async-scan` for immediate response
3. **Error messages**: Now include helpful troubleshooting steps

## 💡 User Guidance

When scans timeout, users now receive:
- Clear explanation that scans can take 5-15 minutes
- Direct link to SpiderFoot interface
- Suggestions for optimizing scan scope
- Alternative async scan option

## 🎉 Result

**SpiderFoot OSINT scans now work reliably without proxy timeouts!**
