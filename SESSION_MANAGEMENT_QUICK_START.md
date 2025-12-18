# Session Management - Quick Start Guide

## Prerequisites

- Admin user account
- Development environment set up
- MongoDB running
- Node.js and npm installed

## Installation Steps

### 1. No Additional Dependencies Required
All code uses existing dependencies. No new packages need to be installed.

### 2. Database Setup
The Session model will automatically create the collection and indexes on first use.

## Starting the Application

### Development Mode

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd client
   npm run dev
   ```

3. **Access the application:**
   ```
   http://localhost:5173
   ```

## Quick Test Guide

### Step 1: Login as Admin
1. Navigate to `http://localhost:5173/login`
2. Enter admin credentials
3. Click "Sign In"

### Step 2: Navigate to Session Management
1. Click on "User Management" in the sidebar
2. Click on "Session Management"
3. You should see the Session Management page

### Step 3: View Sessions
- Check if the statistics cards display correctly
- Verify the session list is empty (or shows existing sessions)

### Step 4: Test Filters
1. Try selecting different users from the User dropdown
2. Select different device types
3. Toggle between Active/Inactive status
4. Use the search box to search by IP or browser
5. Click "Show Suspicious Only" toggle

### Step 5: Test Pagination
- If you have more than 20 sessions, test pagination
- Click "Next" and "Previous" buttons
- Click specific page numbers

### Step 6: Create Test Sessions (Manual)

Since session creation is integrated with login, you can:

**Option A: Login from different browsers**
1. Open the app in Chrome
2. Open the app in Firefox (or incognito mode)
3. Open the app on mobile device
4. Login with the same user in each

**Option B: Use API to create test session**
```bash
# This requires authentication token
curl -X POST http://localhost:3000/api/v1/admin/sessions/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "token": "test-token-123",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
  }'
```

### Step 7: Test Session Actions

**Terminate Session:**
1. Find an active session
2. Click "Terminate" button
3. Confirm in the dialog
4. Verify session becomes inactive
5. Refresh the page to see updated stats

**Block Session:**
1. Find an active session
2. Click "Block" button
3. Confirm in the dialog
4. Verify session is blocked
5. Check that the session shows "Blocked" badge

### Step 8: Test Search and Refresh
1. Click the "Refresh" button to reload data
2. Use search to find specific sessions
3. Clear filters and verify all sessions appear

## API Testing with Postman/cURL

### Get All Sessions
```bash
curl -X GET "http://localhost:3000/api/v1/admin/sessions?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Session Stats
```bash
curl -X GET "http://localhost:3000/api/v1/admin/sessions/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Terminate a Session
```bash
curl -X POST "http://localhost:3000/api/v1/admin/sessions/SESSION_ID/terminate" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Block a Session
```bash
curl -X POST "http://localhost:3000/api/v1/admin/sessions/SESSION_ID/block" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing block functionality"}'
```

### Terminate All User Sessions
```bash
curl -X POST "http://localhost:3000/api/v1/admin/sessions/user/USER_ID/terminate-all" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing Checklist

### Frontend Tests
- [ ] Page loads without errors
- [ ] Statistics cards display correctly
- [ ] Filters work as expected
- [ ] Search functionality works
- [ ] Session cards display all information
- [ ] Device icons show correctly
- [ ] Status badges display properly
- [ ] Terminate dialog opens and works
- [ ] Block dialog opens and works
- [ ] Pagination functions correctly
- [ ] Refresh button updates data
- [ ] Loading states show correctly
- [ ] Empty state displays when no sessions
- [ ] Mobile responsive layout works

### Backend Tests
- [ ] GET /sessions returns sessions
- [ ] GET /sessions/stats returns statistics
- [ ] POST /sessions/:id/terminate works
- [ ] POST /sessions/:id/block works
- [ ] POST /sessions/user/:id/terminate-all works
- [ ] Filters work correctly
- [ ] Pagination works correctly
- [ ] Admin-only access enforced
- [ ] Error handling works properly

### Database Tests
- [ ] Session collection created
- [ ] Indexes created correctly
- [ ] TTL index works (test with short expiry)
- [ ] Suspicious detection logic works
- [ ] Session cleanup works

## Common Issues and Solutions

### Issue: Sessions not appearing
**Solution:**
- Check if sessions are being created on login
- Verify database connection
- Check MongoDB for Session collection
- Review backend logs for errors

### Issue: Cannot terminate/block session
**Solution:**
- Verify you're logged in as admin
- Check authentication token is valid
- Review network tab for API errors
- Check backend logs

### Issue: Statistics showing zeros
**Solution:**
- Create some test sessions
- Verify aggregation queries work
- Check MongoDB connection
- Review backend stats endpoint

### Issue: Filters not working
**Solution:**
- Check query parameters in network tab
- Verify backend query building logic
- Test API directly with cURL
- Check for JavaScript errors in console

### Issue: Page styling broken
**Solution:**
- Verify Tailwind CSS is working
- Check if all imports are correct
- Clear browser cache
- Rebuild frontend

## Sample Test Data

### Create Sample Sessions via MongoDB

```javascript
// Connect to MongoDB
use anatdb;

// Insert sample sessions
db.sessions.insertMany([
  {
    userId: ObjectId("YOUR_USER_ID"),
    deviceType: "desktop",
    browser: "Chrome",
    browserVersion: "120.0.0",
    os: "Windows",
    osVersion: "11",
    ipAddress: "192.168.1.100",
    location: {
      country: "United States",
      city: "New York",
      region: "NY"
    },
    deviceFingerprint: "abc123def456",
    token: "test-token-1",
    lastActivity: new Date(),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30*24*60*60*1000),
    isActive: true,
    isSuspicious: false,
    isBlocked: false
  },
  {
    userId: ObjectId("YOUR_USER_ID"),
    deviceType: "mobile",
    browser: "Safari",
    browserVersion: "17.0",
    os: "iOS",
    osVersion: "17.1",
    ipAddress: "192.168.1.101",
    location: {
      country: "United States",
      city: "San Francisco",
      region: "CA"
    },
    deviceFingerprint: "def789ghi012",
    token: "test-token-2",
    lastActivity: new Date(Date.now() - 3600000),
    createdAt: new Date(Date.now() - 86400000),
    expiresAt: new Date(Date.now() + 29*24*60*60*1000),
    isActive: true,
    isSuspicious: true,
    suspiciousReason: "Different country login",
    isBlocked: false
  }
]);
```

## Performance Testing

### Load Testing
1. Create 1000+ sessions
2. Test pagination performance
3. Verify query speed with indexes
4. Test filter combinations

### Stress Testing
1. Rapid filter changes
2. Quick page navigation
3. Multiple concurrent requests
4. Bulk session termination

## Security Testing

### Access Control
- [ ] Verify non-admin cannot access page
- [ ] Check API endpoints require admin role
- [ ] Test with expired token
- [ ] Test with invalid token

### Data Validation
- [ ] Test with invalid session IDs
- [ ] Test with invalid user IDs
- [ ] Test with malicious input
- [ ] Verify SQL injection protection

## Next Steps After Testing

1. **Integration with Auth Flow**
   - Update login to create sessions
   - Update auth middleware to track activity
   - Update logout to terminate sessions

2. **Session Validation**
   - Check session validity in auth middleware
   - Block access for blocked sessions
   - Enforce session timeouts

3. **Monitoring**
   - Set up session cleanup cron job
   - Monitor suspicious sessions
   - Alert on unusual patterns

4. **Documentation**
   - Update user manual
   - Create admin training materials
   - Document security policies

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Review server logs
3. Verify MongoDB connection
4. Check authentication token
5. Review the implementation documentation

## Useful Commands

### Clear All Sessions
```bash
# MongoDB Shell
use anatdb;
db.sessions.deleteMany({});
```

### Count Sessions
```bash
# MongoDB Shell
db.sessions.countDocuments({isActive: true});
```

### Find Suspicious Sessions
```bash
# MongoDB Shell
db.sessions.find({isSuspicious: true}).pretty();
```

### View Recent Sessions
```bash
# MongoDB Shell
db.sessions.find().sort({createdAt: -1}).limit(10).pretty();
```

## Success Criteria

The Session Management feature is working correctly if:
- ✅ Page loads without errors
- ✅ Statistics display accurate counts
- ✅ Filters reduce the session list appropriately
- ✅ Terminate action logs out the user
- ✅ Block action prevents future access
- ✅ Suspicious sessions are flagged correctly
- ✅ Pagination works smoothly
- ✅ UI matches Activity Logs page style
- ✅ All API endpoints respond correctly
- ✅ Admin-only access is enforced

Happy testing! 🚀
