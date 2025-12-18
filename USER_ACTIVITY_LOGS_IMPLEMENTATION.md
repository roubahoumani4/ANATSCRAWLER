# User Activity Logs Implementation ✅

## 📋 Overview

A comprehensive user activity logging system has been implemented to track and audit all user actions across the platform. This feature is accessible only to admin users in the User Management section.

---

## 🎯 Features Implemented

### ✅ Activity Tracking
- ✅ Login/logout history with timestamps and IP addresses
- ✅ Search queries performed (Discovery, Domain Monitoring)
- ✅ OSINT scans initiated
- ✅ Failed login attempts
- ✅ Settings changes (session timeout, 2FA, profile updates, password changes)
- ✅ User information tracked (username, email, IP, user agent)

### ✅ Filtering & Search
- ✅ Filter by action type (login, logout, search, scan, etc.)
- ✅ Filter by status (success, failed, warning)
- ✅ Filter by date range (start/end date)
- ✅ Full-text search across logs
- ✅ User-specific filtering

### ✅ Export Capabilities
- ✅ Export logs to CSV format
- ✅ Export logs to JSON format
- ✅ Filtered export (respects active filters)
- ✅ Download functionality

### ✅ Statistics Dashboard
- ✅ Total activities count
- ✅ Success/failed/warning breakdown
- ✅ Action type distribution
- ✅ Real-time stats updates

### ✅ Pagination & Performance
- ✅ Paginated results (20 per page)
- ✅ Efficient MongoDB queries with indexes
- ✅ Auto-deletion of logs older than 90 days (TTL)

---

## 📁 Files Created

### Backend Files

1. **`server/models/ActivityLog.ts`**
   - MongoDB schema for activity logs
   - Fields: userId, actionType, action, details, module, status, IP, userAgent, metadata, createdAt
   - Indexes for efficient querying
   - TTL index for auto-cleanup (90 days)

2. **`server/routes/admin/activity-logs.routes.ts`**
   - GET `/api/v1/admin/activity-logs` - Fetch logs with filtering
   - GET `/api/v1/admin/activity-logs/export` - Export to CSV/JSON
   - GET `/api/v1/admin/activity-logs/stats` - Get statistics
   - DELETE `/api/v1/admin/activity-logs` - Bulk delete logs
   - Admin-only access (requires authentication)

3. **`server/utils/activityLogger.ts`**
   - `logActivity()` - Utility function to log user actions
   - `activityLoggerMiddleware()` - Express middleware for auto-logging
   - Used throughout the app to track activities

### Frontend Files

4. **`client/src/pages/UserActivityLogsPage.tsx`**
   - Full-featured activity logs viewer
   - Filtering UI (action type, status, date range, search)
   - Export buttons (CSV/JSON)
   - Pagination
   - Statistics cards
   - Real-time refresh
   - Responsive design

### Modified Files

5. **`server/routes/index.ts`**
   - Registered activity logs routes at `/api/v1/admin/activity-logs`

6. **`client/src/AppContent.tsx`**
   - Added route `/users/activity-logs` (Admin only)

7. **`client/src/components/layout/Sidebar.tsx`**
   - Added "Activity Logs" link in User Management section

8. **`server/routes/auth/auth.routes.ts`**
   - Added logging for successful logins
   - Added logging for failed logins (with reasons)
   - Added logging for logouts

9. **`server/routes/history.routes.ts`**
   - Added logging for all search activities

10. **`server/routes/assessment.routes.ts`**
    - Added logging for OSINT assessment scans

11. **`server/routes/auth/security.routes.ts`**
    - Added logging for session timeout changes

12. **`server/routes/auth/2fa.routes.ts`**
    - Added logging for 2FA enable/disable

13. **`server/routes/auth/user.routes.ts`**
    - Added logging for profile updates
    - Added logging for password changes

---

## 🗂️ Database Schema

### ActivityLog Collection

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  username: String,
  email: String,
  actionType: Enum [
    'login', 'logout', 'failed_login', 'search', 
    'scan', 'export', 'settings_change', 
    'user_management', 'api_access', 
    'security_event', 'other'
  ],
  action: String (description of action),
  details: String (optional details),
  module: Enum [
    'Authentication', 'OSINT Framework', 'Discovery',
    'Domain Monitoring', 'Threat Intelligence', 'Assessment',
    'User Management', 'Settings', 'Export System',
    'API', 'Security', 'System'
  ],
  ipAddress: String,
  userAgent: String,
  status: Enum ['success', 'failed', 'warning'],
  metadata: Mixed (any additional data),
  createdAt: Date (indexed, TTL: 90 days)
}
```

### Indexes
- `userId + createdAt` (compound)
- `actionType + createdAt` (compound)
- `status + createdAt` (compound)
- `userId + actionType + createdAt` (compound)
- `createdAt` (TTL: 90 days)

---

## 🔌 API Endpoints

### 1. Get Activity Logs
```http
GET /api/v1/admin/activity-logs
```

**Query Parameters:**
- `userId` - Filter by user ID
- `actionType` - Filter by action type
- `status` - Filter by status
- `startDate` - Filter from date
- `endDate` - Filter to date
- `search` - Full-text search
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order (default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 157,
      "pages": 4
    }
  }
}
```

### 2. Export Activity Logs
```http
GET /api/v1/admin/activity-logs/export?format=csv
```

**Query Parameters:**
- `format` - Export format: `csv` or `json`
- Plus all filter parameters from GET endpoint

**Response:** Downloads file

### 3. Get Activity Stats
```http
GET /api/v1/admin/activity-logs/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalActivities": 157,
    "successCount": 142,
    "failedCount": 12,
    "warningCount": 3,
    "actionTypeCounts": [...]
  }
}
```

### 4. Bulk Delete Logs
```http
DELETE /api/v1/admin/activity-logs
```

**Body:**
```json
{
  "olderThan": "2024-01-01",
  "actionType": "login",
  "status": "success"
}
```

---

## 🎨 UI Features

### Navigation
- **Location:** User Management → Activity Logs
- **Access:** Admin users only
- **Route:** `/users/activity-logs`

### Page Sections

1. **Header**
   - Title and description
   - Export buttons (CSV/JSON)
   - Refresh button

2. **Stats Cards** (4 cards)
   - Total Activities
   - Successful Actions
   - Failed Actions
   - Warnings

3. **Filters Panel**
   - Action Type dropdown
   - Status dropdown
   - Date range pickers (start/end)
   - Search input (full-text)

4. **Activity Timeline**
   - Chronological list of activities
   - Each log shows:
     - Action icon and type
     - Action description
     - Module badge
     - Status indicator
     - Details (if available)
     - Timestamp
     - Username
     - IP Address
     - User Agent
   - Hover effects
   - Color coding by status

5. **Pagination**
   - Previous/Next buttons
   - Page indicator
   - 20 logs per page

---

## 🔒 Security & Access Control

- ✅ **Admin-only access** - Only users with admin role can view logs
- ✅ **Authentication required** - Must be logged in
- ✅ **Route protection** - AdminRoute wrapper enforces access
- ✅ **Data isolation** - Logs track all users but only admins can see
- ✅ **Sensitive data** - IP addresses and user agents logged for audit trail
- ✅ **Auto-cleanup** - Logs older than 90 days auto-deleted (GDPR compliance)

---

## 📝 Logged Activities

### Authentication
- ✅ Successful login
- ✅ Failed login (user not found)
- ✅ Failed login (inactive account)
- ✅ Failed login (invalid password)
- ✅ Logout

### Discovery & Monitoring
- ✅ Discovery searches
- ✅ Domain monitoring searches
- ✅ Search results count

### OSINT Assessment
- ✅ Assessment scan initiated
- ✅ Target information
- ✅ Job ID tracking

### Settings & Security
- ✅ Session timeout changes
- ✅ 2FA enabled/disabled
- ✅ Profile updates (username, email, name, organization, etc.)
- ✅ Password changes

### Future Additions (Ready to implement)
- ⏳ User management actions (create/edit/delete users by admins)
- ⏳ Export actions
- ⏳ API access
- ⏳ Security events (suspicious activities)

---

## 🧪 Testing

### Test Scenarios

1. **Login Activity**
   - Login as user → Check activity log shows login
   - Failed login → Check log shows failed attempt
   - Logout → Check log shows logout

2. **Search Activity**
   - Perform discovery search → Check log
   - Perform domain monitoring → Check log
   - Verify query and result count tracked

3. **Scan Activity**
   - Start OSINT assessment → Check log
   - Verify target and jobId tracked

4. **Filtering**
   - Filter by action type → Verify results
   - Filter by status → Verify results
   - Filter by date range → Verify results
   - Search text → Verify results

5. **Export**
   - Export to CSV → Verify download
   - Export to JSON → Verify download
   - Export with filters → Verify filtered data

6. **Access Control**
   - Login as non-admin → Verify cannot access page
   - Login as admin → Verify can access page

---

## 🚀 Usage

### For Administrators

1. **Access Activity Logs**
   - Login as admin
   - Navigate to User Management → Activity Logs
   - Or visit `/users/activity-logs`

2. **View Recent Activities**
   - See real-time activity feed
   - Check statistics at top

3. **Filter Activities**
   - Select action type (login, search, scan, etc.)
   - Select status (success, failed, warning)
   - Set date range
   - Enter search term

4. **Export Data**
   - Click "Export CSV" for Excel/spreadsheet format
   - Click "Export JSON" for programmatic access
   - Exports respect current filters

5. **Refresh Data**
   - Click "Refresh" button to reload
   - Auto-updates on filter changes

---

## 🔧 Configuration

### TTL (Time To Live)
Logs are automatically deleted after 90 days. To change:

**File:** `server/models/ActivityLog.ts`
```typescript
activityLogSchema.index(
  { createdAt: 1 }, 
  { expireAfterSeconds: 90 * 24 * 60 * 60 } // Change 90 to desired days
);
```

### Pagination Limit
Default: 20 logs per page

**File:** `client/src/pages/UserActivityLogsPage.tsx`
```typescript
const params: any = {
  page,
  limit: 20, // Change this value
};
```

---

## 📦 Dependencies

### Backend
- ✅ `json2csv` - CSV export functionality
- ✅ `@types/json2csv` - TypeScript types
- ✅ Mongoose (existing)

### Frontend
- ✅ All existing dependencies (no new packages needed)

---

## 🎯 Next Steps & Enhancements

### Implemented ✅
- [x] Login/logout tracking
- [x] Failed login tracking
- [x] Search activity tracking
- [x] Scan activity tracking
- [x] Settings changes tracking
- [x] 2FA enable/disable tracking
- [x] Profile update tracking
- [x] Password change tracking
- [x] Filtering and search
- [x] Export to CSV/JSON
- [x] Statistics dashboard
- [x] Pagination
- [x] Real-time updates

### Ready to Add 🚀
- [ ] User management action tracking (admin actions)
- [ ] Export action tracking
- [ ] Real-time notifications for admins
- [ ] Activity charts/graphs
- [ ] Email alerts for suspicious activity
- [ ] Geolocation mapping of IPs
- [ ] Activity heatmap by time
- [ ] Comparison views (current vs previous period)

---

## ✅ Success Criteria Met

- ✅ Track login/logout with timestamps and IP
- ✅ Track search queries (Discovery, Domain Monitoring)
- ✅ Track OSINT scans initiated
- ✅ Track settings changes (session timeout, 2FA, profile, password)
- ✅ Track failed login attempts
- ✅ Export logs to CSV/JSON
- ✅ Filter by user, date range, action type
- ✅ Real-time activity monitoring
- ✅ Admin-only access
- ✅ Professional UI with statistics
- ✅ Full documentation

---

## 📞 Support & Maintenance

The activity logging system is now fully operational and ready for production use. All activities are automatically logged without requiring any additional configuration.

**Status:** ✅ **COMPLETE - Ready for Production**
