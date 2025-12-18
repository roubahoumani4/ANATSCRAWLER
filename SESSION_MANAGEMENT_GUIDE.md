# Session Management Feature

## Overview

The Session Management feature provides comprehensive monitoring and control of active user sessions across the ANAT Security platform. This feature is available exclusively to administrators and enables them to:

- **View all active sessions** across all users
- **Monitor session details** including device, browser, IP, location, and activity
- **Force logout/terminate** specific sessions
- **Block suspicious sessions** to prevent future access
- **Enforce session timeout** and concurrent session limits
- **Track device fingerprints** for enhanced security

## Features

### 1. Session Monitoring
- Real-time view of all active sessions
- Session statistics dashboard with key metrics
- Filter by user, device type, status, and more
- Search by IP address, location, browser, etc.

### 2. Session Details
Each session displays:
- **User Information**: Username and email
- **Device Type**: Desktop, mobile, tablet, or unknown
- **Browser**: Browser name and version
- **Operating System**: OS name and version
- **IP Address**: Current IP address
- **Location**: City and country (if available)
- **Device Fingerprint**: Unique identifier for the device
- **Last Activity**: Time since last activity
- **Created Date**: When the session was created
- **Status**: Active, inactive, suspicious, or blocked

### 3. Session Actions
Administrators can:
- **Terminate Session**: Immediately log out a user from a specific session
- **Block Session**: Block a session to prevent future access from that device/IP
- **Terminate All User Sessions**: Log out a user from all their active sessions

### 4. Security Features
- **Suspicious Session Detection**: Automatically flags sessions with unusual patterns:
  - Multiple sessions from the same IP address
  - Too many concurrent sessions (>5)
  - Login from different countries within a short time
- **Session Timeout**: Sessions expire after 30 days of inactivity
- **Concurrent Session Limits**: Enforces a maximum of 5 active sessions per user
- **Device Fingerprinting**: Tracks unique device identifiers

## Usage

### Accessing Session Management
1. Log in as an administrator
2. Navigate to **User Management** > **Session Management** in the sidebar
3. The Session Management page will load with all active sessions

### Viewing Sessions
- The main table displays all sessions with key information
- Use the **Stats Cards** at the top to see:
  - Total Sessions
  - Active Sessions
  - Suspicious Sessions
  - Blocked Sessions

### Filtering Sessions
Use the filter section to narrow down sessions:
- **User**: Filter by specific user
- **Device Type**: Desktop, mobile, tablet, or unknown
- **Status**: Active or inactive
- **Search**: Search by IP, location, browser, etc.
- **Show Suspicious Only**: Toggle to show only flagged sessions

### Terminating a Session
1. Find the session you want to terminate
2. Click the **Terminate** button
3. Confirm the action in the dialog
4. The user will be immediately logged out from that session

### Blocking a Session
1. Find the session you want to block
2. Click the **Block** button
3. Confirm the action in the dialog
4. The session will be blocked and terminated
5. Future login attempts from that device/IP combination will be prevented

## API Endpoints

### Get All Sessions
```
GET /api/v1/admin/sessions
```
Query parameters:
- `userId`: Filter by user ID
- `deviceType`: Filter by device type
- `isActive`: Filter by active status
- `isSuspicious`: Filter by suspicious flag
- `search`: Search term
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### Get Session Statistics
```
GET /api/v1/admin/sessions/stats
```
Query parameters:
- `userId`: Filter stats by user ID (optional)

### Get Session Details
```
GET /api/v1/admin/sessions/:sessionId
```

### Terminate Session
```
POST /api/v1/admin/sessions/:sessionId/terminate
```

### Block Session
```
POST /api/v1/admin/sessions/:sessionId/block
```
Body:
```json
{
  "reason": "Optional reason for blocking"
}
```

### Terminate All User Sessions
```
POST /api/v1/admin/sessions/user/:userId/terminate-all
```

### Get User Sessions
```
GET /api/v1/admin/sessions/user/:userId
```

### Cleanup Expired Sessions
```
DELETE /api/v1/admin/sessions/cleanup
```

## Database Schema

### Session Model
```typescript
{
  userId: ObjectId,              // Reference to User
  deviceType: String,            // 'desktop' | 'mobile' | 'tablet' | 'unknown'
  browser: String,               // Browser name
  browserVersion: String,        // Browser version
  os: String,                    // Operating system
  osVersion: String,             // OS version
  ipAddress: String,             // IP address
  location: {                    // Geographic location
    country: String,
    city: String,
    region: String,
    latitude: Number,
    longitude: Number
  },
  deviceFingerprint: String,     // Unique device identifier
  token: String,                 // Session token
  lastActivity: Date,            // Last activity timestamp
  createdAt: Date,               // Session creation time
  expiresAt: Date,               // Session expiration time
  isActive: Boolean,             // Active status
  isSuspicious: Boolean,         // Suspicious flag
  suspiciousReason: String,      // Reason for suspicion
  isBlocked: Boolean,            // Blocked status
  blockedAt: Date,               // Block timestamp
  blockedReason: String          // Reason for blocking
}
```

## Security Considerations

1. **Admin Access Only**: Session Management is restricted to administrators
2. **Audit Trail**: All session terminations and blocks are logged
3. **Device Fingerprinting**: Uses SHA-256 hash of user agent and IP
4. **Automatic Cleanup**: Expired sessions are automatically deleted
5. **Suspicious Detection**: Built-in heuristics detect unusual patterns
6. **Session Limits**: Enforces maximum concurrent sessions per user

## Integration with Authentication

The Session Management system integrates with the authentication flow:

1. **Login**: Creates a new session when user logs in
2. **Activity Tracking**: Updates `lastActivity` on each request
3. **Logout**: Marks session as inactive
4. **Token Validation**: Checks if session is valid, active, and not blocked
5. **Session Cleanup**: Automatically removes expired sessions

## Future Enhancements

Potential improvements for future versions:
- [ ] IP-based geolocation lookup
- [ ] Email notifications for suspicious sessions
- [ ] Session analytics and reporting
- [ ] User self-service session management
- [ ] Two-factor authentication integration
- [ ] Risk scoring for sessions
- [ ] Session recording and playback
- [ ] Machine learning for anomaly detection

## Troubleshooting

### Sessions Not Appearing
- Ensure the user is logged in
- Check database connection
- Verify session creation in authentication flow

### Unable to Terminate Session
- Confirm admin privileges
- Check session ID is valid
- Verify API endpoint is accessible

### Suspicious Sessions Not Flagged
- Check suspicious detection logic in Session model
- Verify pre-save hooks are executing
- Review threshold values for detection

## Related Features

- **User Management**: Manage user accounts and permissions
- **Activity Logs**: View detailed user activity history
- **User Activity Dashboard**: Individual user activity overview

## Support

For issues or questions about Session Management, please contact the development team or refer to the main documentation.
