# User Activity Isolation - Testing Checklist

## ✅ Pre-Testing Setup

- [ ] Server is running (`npm run dev` in server directory)
- [ ] Database connection is active (MongoDB)
- [ ] At least 2 test user accounts exist
- [ ] Test users have performed different searches

---

## 🧪 Test Scenarios

### Test 1: Basic Data Isolation
**Objective**: Verify each user sees only their own data

1. **Setup**:
   - [ ] Login as User A
   - [ ] Perform 3-5 discovery searches
   - [ ] Note the search queries performed

2. **Verify User A's View**:
   - [ ] Navigate to `/dark-web-monitoring`
   - [ ] Check "Recent Activity" section
   - [ ] Verify it shows ONLY User A's searches
   - [ ] Note the threat distribution values

3. **Switch to User B**:
   - [ ] Logout from User A
   - [ ] Login as User B
   - [ ] Navigate to `/dark-web-monitoring`

4. **Verify User B's View**:
   - [ ] Check "Recent Activity" section
   - [ ] Verify it does NOT show User A's searches
   - [ ] Verify it shows only User B's searches (if any)
   - [ ] Note threat distribution values are different from User A

**Expected Result**: ✅ Each user sees only their own activity

---

### Test 2: Analytics Endpoints
**Objective**: Verify analytics API returns user-specific data

**Test 2.1 - Threat Distribution**:
```bash
# Login as User A and get token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"userA@test.com","password":"password"}' \
  | jq -r '.token' > tokenA.txt

# Get User A's threat distribution
curl -H "Authorization: Bearer $(cat tokenA.txt)" \
  http://localhost:5000/api/v1/analytics/threat-distribution \
  | jq '.'

# Login as User B and get token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"userB@test.com","password":"password"}' \
  | jq -r '.token' > tokenB.txt

# Get User B's threat distribution
curl -H "Authorization: Bearer $(cat tokenB.txt)" \
  http://localhost:5000/api/v1/analytics/threat-distribution \
  | jq '.'
```

- [ ] User A's response contains threat data
- [ ] User B's response is different from User A's
- [ ] Values reflect only respective user's searches

**Test 2.2 - Security Score**:
```bash
# Get User A's security score
curl -H "Authorization: Bearer $(cat tokenA.txt)" \
  http://localhost:5000/api/v1/analytics/security-score \
  | jq '.'

# Get User B's security score
curl -H "Authorization: Bearer $(cat tokenB.txt)" \
  http://localhost:5000/api/v1/analytics/security-score \
  | jq '.'
```

- [ ] User A's score is calculated from their searches only
- [ ] User B's score is different and independent
- [ ] Scores reflect respective user activity levels

**Expected Result**: ✅ Each API call returns user-specific data

---

### Test 3: New User (Empty State)
**Objective**: Verify new users with no activity see empty/zero values

1. **Setup**:
   - [ ] Create a brand new user account (User C)
   - [ ] User C has performed ZERO searches

2. **Test**:
   - [ ] Login as User C
   - [ ] Navigate to `/dark-web-monitoring`

3. **Verify**:
   - [ ] Threat Distribution shows all zeros or empty chart
   - [ ] Security Score shows default/empty values
   - [ ] Recent Activity section shows "No recent activity"
   - [ ] No data from other users is visible

**Expected Result**: ✅ New user sees empty state, not other users' data

---

### Test 4: Cross-User Privacy
**Objective**: Ensure User A cannot access User B's data via API

**Test via Browser DevTools**:
1. [ ] Login as User A
2. [ ] Open browser DevTools → Network tab
3. [ ] Navigate to `/dark-web-monitoring`
4. [ ] Find the analytics API calls
5. [ ] Copy User A's authentication token
6. [ ] Attempt to manually query for User B's data (try to bypass)

**Test via API**:
```bash
# Get User A's token
USER_A_TOKEN="<User A's JWT token>"

# Try to access User B's data using User A's token
# (Should fail or return only User A's data)
curl -H "Authorization: Bearer $USER_A_TOKEN" \
  http://localhost:5000/api/v1/analytics/threat-distribution \
  | jq '.'
```

- [ ] Cannot access other users' data with your token
- [ ] API only returns data belonging to the token owner

**Expected Result**: ✅ No way to access other users' data

---

### Test 5: Unauthenticated Access
**Objective**: Verify authentication is required

```bash
# Try to access analytics without authentication
curl http://localhost:5000/api/v1/analytics/threat-distribution

# Try with invalid token
curl -H "Authorization: Bearer invalid_token_here" \
  http://localhost:5000/api/v1/analytics/threat-distribution
```

- [ ] Returns 401 Unauthorized
- [ ] Error message: "User not authenticated"
- [ ] No data is returned

**Expected Result**: ✅ Unauthenticated requests are rejected

---

### Test 6: Activity Updates in Real-Time
**Objective**: Verify analytics update when user performs new searches

1. **Setup**:
   - [ ] Login as User A
   - [ ] Navigate to `/dark-web-monitoring`
   - [ ] Note current threat distribution values

2. **Perform Action**:
   - [ ] Go to Discovery page
   - [ ] Perform a new search
   - [ ] Return to Dark Web Monitoring dashboard

3. **Verify**:
   - [ ] Click refresh or reload the page
   - [ ] Threat distribution values have updated
   - [ ] Recent Activity shows the new search
   - [ ] Changes reflect ONLY User A's new activity

**Expected Result**: ✅ Analytics update with user's new activity only

---

### Test 7: Historical Data Integrity
**Objective**: Ensure existing data wasn't corrupted

1. **Setup**:
   - [ ] Login as User A (who had previous searches)

2. **Verify**:
   - [ ] Navigate to `/osint/assessment/history`
   - [ ] All previous scans are still visible
   - [ ] Navigate to `/dark-web-monitoring`
   - [ ] Historical analytics reflect User A's past activity

3. **Database Check**:
```bash
# Connect to MongoDB and verify data
mongo
use your_database_name
db.search_history.count({ userId: ObjectId("user_a_id") })
db.search_history.find({ userId: ObjectId("user_a_id") }).limit(5)
```

- [ ] All historical data is intact
- [ ] userId fields are properly populated
- [ ] No data loss occurred

**Expected Result**: ✅ Historical data is preserved and properly filtered

---

## 📊 Final Verification Matrix

| Component | Test | Result | Notes |
|-----------|------|--------|-------|
| `/api/v1/analytics/threat-distribution` | User isolation | ⬜ | |
| `/api/v1/analytics/security-score` | User isolation | ⬜ | |
| Dark Web Monitoring Dashboard | UI reflects user data only | ⬜ | |
| Recent Activity Feed | Shows only user's searches | ⬜ | |
| New User Experience | Empty state correctly shown | ⬜ | |
| Cross-user privacy | Cannot see other users | ⬜ | |
| Authentication | Required and enforced | ⬜ | |
| Historical data | Intact and accessible | ⬜ | |

---

## 🐛 Common Issues & Solutions

### Issue 1: "All zeros even though I have searches"
**Solution**: Check if the searches have `hasResults: true` flag. Only successful searches appear in analytics.

### Issue 2: "Still seeing other users' data"
**Solution**: 
1. Clear browser cache and cookies
2. Logout and login again to get a fresh token
3. Check server logs for any errors
4. Verify the fix was properly deployed

### Issue 3: "Cannot access analytics - 401 error"
**Solution**: 
1. Ensure you're logged in
2. Check if JWT token is valid
3. Verify authentication middleware is working

### Issue 4: "API returns empty data but I have searches"
**Solution**:
1. Check MongoDB to verify searches exist with your userId
2. Ensure searches have proper schema fields (hasResults, results)
3. Check server logs for query errors

---

## ✅ Sign-Off Checklist

- [ ] All 7 test scenarios passed
- [ ] Verification matrix completed
- [ ] No cross-user data visible
- [ ] Authentication properly enforced
- [ ] Empty states work correctly
- [ ] Historical data intact
- [ ] No errors in server logs
- [ ] No errors in browser console
- [ ] Performance is acceptable
- [ ] Ready for production deployment

---

## 📝 Test Results Summary

**Tester**: ___________________  
**Date**: ___________________  
**Environment**: ___________________  

**Overall Result**: [ ] PASS  [ ] FAIL  

**Notes**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

**Issues Found**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
