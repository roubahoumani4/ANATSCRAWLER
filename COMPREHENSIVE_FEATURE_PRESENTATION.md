# 🚀 ANAT Security Platform - Comprehensive Feature Presentation

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production-success.svg)

**A Professional OSINT & Cybersecurity Intelligence Platform**

</div>

---

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Core Features](#core-features)
3. [OSINT Assessment Platform](#osint-assessment-platform)
4. [Dark Web Monitoring Suite](#dark-web-monitoring-suite)
5. [Threat Intelligence](#threat-intelligence)
6. [User Management System](#user-management-system)
7. [Index & Data Management](#index--data-management)
8. [Security & Session Management](#security--session-management)
9. [Performance & Optimization](#performance--optimization)
10. [Technical Stack](#technical-stack)
11. [Access Control](#access-control)

---

## 🎯 Platform Overview

**ANAT Security Platform** is a comprehensive, enterprise-grade Open Source Intelligence (OSINT) and cybersecurity intelligence platform designed for security professionals, researchers, and organizations. The platform provides advanced reconnaissance, threat intelligence, dark web monitoring, and vulnerability assessment capabilities in a unified, user-friendly interface.

### Key Highlights

- 🔍 **Comprehensive OSINT Scanning**: Domain, subdomain, DNS, SSL, port scanning, and technology detection
- 🌐 **Dark Web Intelligence**: Real-time monitoring and search across dark web databases
- 🛡️ **Threat Intelligence Feeds**: Live global breach data and threat indicators
- 📊 **Advanced Analytics**: Interactive dashboards with real-time visualizations
- 👥 **Multi-User Support**: Role-based access control with admin and user roles
- 🔐 **Enterprise Security**: Session management, activity logging, and audit trails
- 📈 **Elasticsearch Integration**: Powerful search, indexing, and data management
- 🎨 **Modern UI/UX**: Dark theme with responsive design and smooth animations

---

## 🎯 Core Features

### 1. Authentication & Landing Page

#### Enhanced Login System
- **Secure Authentication**: JWT-based authentication with HTTP-only cookies
- **Session Management**: Automatic session tracking and timeout enforcement
- **Remember Me**: Persistent login capability
- **Error Handling**: Clear error messages and validation
- **Rate Limiting**: Protection against brute force attacks

#### Public Landing Page
- **Dark Web Search**: Public search interface for demonstrating capabilities
- **Real-time Search**: Elasticsearch integration for instant results
- **Results Display**: Professional table layout with scoring and highlights
- **Responsive Design**: Mobile-friendly interface
- **Marketing Focus**: Showcase platform capabilities to potential users

**Routes:**
- `/` - Landing page (public)
- `/login` - Login page
- `/dashboard` - Main dashboard (authenticated)

---

## 🔍 OSINT Assessment Platform

### Overview
The OSINT Platform is the core feature set providing comprehensive reconnaissance and vulnerability assessment capabilities.

### 2.1 OSINT Dashboard

**Route:** `/osint`

A comprehensive dashboard that visualizes and aggregates data from all OSINT assessments, providing actionable security intelligence at a glance.

#### Key Metrics (4 Cards)
1. **Total Scans** - Overall scan count with completed/failed breakdown
2. **Active Scans** - Currently running assessments with pulse animation
3. **Total Vulnerabilities** - Discovered vulnerabilities with critical count
4. **Average Duration** - Average scan completion time

#### Interactive Visualizations (4 Charts)

**1. Scan Status Distribution (Pie Chart)**
- Visual breakdown of scan statuses
- Color-coded: Completed (Green), Running (Amber), Failed (Red), Aborted (Purple)
- Percentage distribution

**2. Scans Over Time (Area Chart)**
- 30-day trend of scan activity
- Gradient area visualization
- Identify scanning patterns

**3. Risk Level Distribution (Bar Chart)**
- Distribution of discovered risk levels
- Color-coded severity indicators (Critical/High/Medium/Low)
- Based on assessment results

**4. Vulnerability Trends (Line Chart)**
- Multi-line chart tracking vulnerability types over time
- Separate lines for: Critical, High, Medium, Low
- Last 10 scans with vulnerabilities
- Track security posture improvement/degradation

#### Additional Features
- **Top Targets**: Most frequently scanned domains/IPs (Top 5)
- **Recent Activity Feed**: Last 10 scan activities with status
- **Quick Actions**: New Assessment, View History, View Output
- **Refresh Button**: Manual data refresh
- **User-Specific Data**: Each user sees only their own scans

**API Endpoint:** `GET /api/v1/assessment/dashboard/stats`

---

### 2.2 Assessment Page (Scan Configuration)

**Route:** `/osint/assessment`

Create and configure comprehensive OSINT assessments for targets.

#### Scan Types Supported
- **Domain Assessment**: Full domain reconnaissance
- **IP Address Assessment**: Network-level analysis
- **URL Assessment**: Web application analysis
- **Email Assessment**: Email infrastructure analysis

#### Assessment Modules

**Basic Information**
- WHOIS lookup with detailed parsing
- Domain registration information
- Registrar and contact details
- Name server information

**DNS Enumeration**
- A, AAAA, MX, TXT, NS, CNAME, SOF records
- SPF policy analysis
- DMARC configuration check
- DNSSEC validation
- DNS security assessment

**Subdomain Discovery**
- Comprehensive subdomain enumeration
- Multiple discovery techniques
- HTTP/HTTPS availability checking
- IP resolution for subdomains
- Subdomain takeover detection

**Port Scanning**
- Top 1000 ports scanning
- Service detection and banner grabbing
- Version identification
- Protocol detection (TCP/UDP)
- Open port analysis

**SSL/TLS Analysis**
- Certificate information extraction
- Issuer and subject details
- Validity period checking
- Signature algorithm analysis
- Certificate chain validation
- SSL security rating

**Web Technology Detection**
- Server identification (Apache, Nginx, IIS, etc.)
- Framework detection (ASP.NET, PHP, Django, etc.)
- CMS identification (WordPress, Joomla, Drupal, etc.)
- JavaScript libraries (jQuery, React, Angular, etc.)
- Analytics tools (Google Analytics, Tag Manager, etc.)
- CDN detection (Cloudflare, Akamai, AWS CloudFront, etc.)

**WAF Detection**
- Web Application Firewall identification
- WAF vendor detection
- Security product fingerprinting

**Security Headers Analysis**
- Strict-Transport-Security
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

**Live Vulnerability Scanning**
- CVE database integration
- Known vulnerability checking
- Outdated software detection
- Security patch recommendations
- NVD (National Vulnerability Database) queries
- Real-time threat assessment

**Business Intelligence**
- Social media presence detection
- LinkedIn company profiles
- Twitter/X accounts
- Facebook pages
- Professional network mapping

**Cloud Infrastructure Detection**
- AWS resource identification
- Azure services detection
- Google Cloud Platform detection
- S3 bucket discovery
- Cloud storage enumeration

**Email Pattern Discovery**
- Common email patterns
- Email format detection
- Organizational email structure

**Breach Data Checking** (Optional)
- HaveIBeenPwned API integration
- Historical breach detection
- Compromised credential alerts

#### Scan Configuration Options
- **Target Input**: Domain, IP, URL, or email
- **Deep Scan Mode**: Extended reconnaissance
- **Breach Check**: Optional breach database lookup
- **Scan Naming**: Custom scan identification
- **Priority Setting**: Scan queue management

#### Scan Execution
- **Real-time Progress**: Live progress updates via WebSocket
- **Status Updates**: Stage-by-stage execution tracking
- **Error Handling**: Graceful failure handling
- **Result Streaming**: Progressive result display
- **Scan Queue**: Multiple concurrent scans support

**API Endpoint:** `POST /api/v1/assessment/run`

---

### 2.3 Output Page (Results Viewer)

**Route:** `/osint/assessment/output`

Comprehensive visualization and analysis of assessment results.

#### Results Organization

**Accordion-Based Layout**
Each scan module is displayed in an expandable accordion with:
- Module name and icon
- Result count badge
- Color-coded status indicator
- Expandable content section

#### Module Sections

**1. WHOIS Information**
- Registrar details
- Registration and expiration dates
- Name servers
- Contact information
- Domain status

**2. DNS Records**
- A/AAAA records with IP addresses
- MX records with mail servers
- TXT records (SPF, DMARC, verification)
- NS records
- CNAME mappings

**3. Subdomains**
- Discovered subdomain list
- HTTP/HTTPS status
- IP address resolution
- Subdomain count
- Takeover vulnerability warnings

**4. Open Ports**
- Port number and protocol
- Service identification
- Banner information
- Version details
- Security assessment

**5. SSL Certificate**
- Subject and issuer
- Validity period
- Signature algorithm
- Certificate chain
- Security rating

**6. Web Technologies**
- Detected technologies list
- Version information
- Framework identification
- Third-party services
- Technology stack visualization

**7. Security Headers**
- Present headers (Green)
- Missing headers (Red/Yellow)
- Header values
- Security recommendations

**8. WAF Detection**
- WAF vendor
- Detection method
- Protection level
- Bypass possibilities

**9. Vulnerabilities**
- Critical/High/Medium/Low classification
- CVE identifiers
- Vulnerability descriptions
- Affected services/software
- Remediation recommendations
- CVSS scores

**10. Business Intelligence**
- Social media accounts
- LinkedIn profiles
- Company information
- Professional networks

**11. Cloud Infrastructure**
- Identified cloud providers
- Resource types
- S3 buckets
- Cloud services in use

**12. Email Patterns**
- Discovered email formats
- Common patterns
- Key personnel emails

**13. Breach Data** (if checked)
- Breach database hits
- Compromised accounts
- Breach dates
- Exposed data types

#### Export Options
- **JSON Export**: Complete raw data
- **PDF Report**: Professional formatted report
- **CSV Export**: Tabular data export
- **Markdown Report**: Human-readable documentation

#### Interactive Features
- **Search**: Find specific results within scan
- **Filter**: Filter by severity, type, or module
- **Sort**: Sort results by various criteria
- **Copy**: Copy individual results
- **Share**: Share specific findings

**API Endpoint:** `GET /api/v1/assessment/results/:scanId`

---

### 2.4 History Page

**Route:** `/osint/assessment/history`

Complete audit trail and management of all past assessments.

#### History Features

**Scan List Display**
- Target domain/IP/URL
- Scan status (Completed/Running/Failed/Aborted)
- Start and end timestamps
- Duration
- Vulnerability count
- Risk level indicator
- Owner (user who initiated scan)

**Status Indicators**
- 🟢 **Completed**: Successful scan
- 🟡 **Running**: In progress
- 🔴 **Failed**: Scan error
- 🟣 **Aborted**: User-terminated
- ⚪ **Pending**: Queued

**Actions**
- **View Results**: Navigate to output page
- **Re-run Scan**: Execute same scan again
- **Delete Scan**: Remove from history
- **Export Data**: Download scan results

**Filtering & Search**
- Search by target
- Filter by status
- Filter by date range
- Filter by user (admin only)
- Sort by various criteria

**Pagination**
- Configurable page size (10, 25, 50, 100)
- Page navigation
- Total count display

**API Endpoint:** `GET /api/v1/assessment/history`

---

## 🌐 Dark Web Monitoring Suite

### Overview
Comprehensive dark web intelligence and monitoring capabilities integrated with Elasticsearch for powerful search and analytics.

### 3.1 Dark Web Analytics Dashboard

**Route:** `/analytics`

Centralized hub for all dark web intelligence and threat monitoring activities.

#### Dashboard Components

**Quick Statistics (4 Cards)**
1. **Active Threats** - Current threat count with trending indicator (Orange)
2. **Discovery Searches** - Total searches performed with count (Red)
3. **Monitored Domains** - Domains under monitoring (Blue)
4. **Total Searches** - Complete search history with success rate (Purple)

**Weekly Activity Overview (Area Chart)**
- Multi-series area chart showing 7-day trends
- Threat detection trends (Orange gradient)
- Discovery search activity (Red gradient)
- Domain monitoring events (Cyan gradient)
- Interactive tooltips with detailed metrics

**Threat Distribution (Pie Chart)**
- Critical threats (Red - #ef4444)
- High severity (Orange - #f97316)
- Medium severity (Yellow - #eab308)
- Low severity (Blue - #3b82f6)

**Search Type Distribution (Pie Chart)**
- Email Discovery (Purple - #8b5cf6)
- Domain Monitoring (Cyan - #06b6d4)
- Threat Intelligence (Amber - #f59e0b)

**Security Score Radar (5-Axis)**
- Threat Detection (85%)
- Data Protection (78%)
- Monitoring Coverage (92%)
- Response Time (88%)
- Intelligence Quality (80%)

**Recent Activity Feed**
- Real-time activity stream
- Color-coded severity indicators
- Activity types: Threat, Discovery, Domain, Search
- Timestamps and descriptions

**Module Access Cards (4 Cards)**
Each module card includes:
- Icon with gradient background
- Current statistics with trend indicator
- Brief description
- Key highlights (3 bullet points)
- "Access Module" button

**System Status Panel**
- API Services: Operational status
- Database: Connection status
- Monitoring: Activity status
- Updates: Version status

**Design Features**
- Dark theme with gradient backgrounds
- Glass-morphism card effects
- Smooth animations (Framer Motion)
- Responsive grid layouts
- Professional color scheme

---

### 3.2 Discovery Page

**Route:** `/discovery`

Search for exposed credentials, emails, and sensitive data across dark web databases.

#### Features

**Dark Web Intelligence Search**
- Real-time search against Elasticsearch `darkweb_structured` index
- Comprehensive breach database coverage
- Instant search results
- Search by email, username, phone, or keyword

**Search Interface**
- Clean, focused search input
- Search button with loading states
- Keyboard support (Enter key)
- Clear button to reset
- Status indicators (Terminal mode, Surveillance mode)

**Results Display**
- Professional table layout with:
  - **Score**: Relevance score (0-1)
  - **Name**: Individual or entity name
  - **Phone**: Contact numbers
  - **Location**: Geographic information
  - **Link**: Source or reference URL
  - **Matched Terms**: Highlighted search terms
  - **Context**: Snippet showing matched content
- Sortable columns
- Result count display
- Pagination support

**Search Tracking**
- Automatic search history recording
- Query type tracking
- Results count logging
- Success/failure status
- Duration tracking
- Metadata capture

**Query Persistence**
- Automatic localStorage saving
- Persists across page refreshes
- Survives navigation
- Browser restart persistence
- Easy clear functionality

**Empty States**
- No search performed: Helpful guidelines
- No results found: Informative message
- Search suggestions

**API Endpoint:** `POST /api/v1/search/darkweb-search`

---

### 3.3 Domain Monitoring Page

**Route:** `/domain-monitoring`

Track domain-level exposures and security posture across breach databases.

#### Features

**Domain Search**
- Search by domain name
- Organization-wide exposure tracking
- Multi-database breach checking
- Risk scoring system (0-100)

**Breach Database Coverage**
- Compilation of Many Breaches (COMB) - 3.2B accounts
- Collection #1 - 773M accounts
- LinkedIn Breach - 700M accounts
- Facebook Breach - 533M accounts
- Yahoo Breach - 500M accounts
- And 20+ other major breach databases

**Risk Assessment**
- **Risk Score**: 0-100 scale with color coding
  - 0-30: Low (Green)
  - 31-60: Medium (Yellow)
  - 61-85: High (Orange)
  - 86-100: Critical (Red)
- **Total Databases**: Number of breaches found
- **Password Strength Analysis**: Weak/Medium/Strong distribution

**Results Display**
- Affected email addresses
- Breach database names
- Exposure dates
- Data types compromised
- Password strength indicators

**Breach Information Panels**
- **Comprehensive Details** for each breach:
  - Breach name and description
  - Date of breach
  - Number of affected accounts
  - What happened (incident details)
  - Data compromised (specific fields)
  - Security recommendations
  - Source verification

**Statistics Cards**
- Total exposures found
- Unique databases affected
- Average risk score
- Critical exposures count

**Search Tracking**
- Automatic history recording
- Enhanced metadata:
  - Risk score
  - Database count
  - Password strength breakdown
- Duration tracking
- Success/failure status

**Query Persistence**
- Domain searches saved to localStorage
- Persists across sessions
- Easy clearing

**API Endpoint:** `POST /api/v1/search/domain-search`

---

### 3.4 Search History Page

**Route:** `/search-history`

Comprehensive logs and analytics for all dark web searches.

#### Features

**Complete Audit Trail**
- All Discovery searches
- All Domain Monitoring searches
- Timestamp tracking
- User attribution
- Query type identification

**Search Details**
- Search query
- Search type (Discovery/Domain Monitoring)
- Query type (dark-web-search/domain-search)
- Results count
- Status (Success/No Results/Failed)
- Duration
- Metadata (risk scores, database counts, etc.)
- Top 10 results preview

**Filtering & Search**
- Filter by search type
- Filter by status
- Filter by date range
- Search within queries
- Sort by date, results, duration

**Analytics**
- Total searches performed
- Success rate percentage
- Average results per search
- Most searched terms
- Search trends over time

**Actions**
- Re-run search
- View full results
- Delete from history
- Export search data

**Data Management**
- Auto-deletion after 30 days (configurable)
- Privacy-focused data handling
- User-specific isolation

**API Endpoint:** `GET /api/v1/history/searches`

---

## 🛡️ Threat Intelligence

### 4. Threat Intelligence Feed

**Route:** `/threat-intelligence`

Real-time monitoring of global security breaches using industry-leading threat intelligence sources.

#### Features

**Live Feed Tab**
- **600+ Verified Breaches** from HaveIBeenPwned
- **12+ Billion Compromised Accounts** tracked
- **Auto-refresh** every 5 minutes (configurable)
- Interactive breach cards with detailed information
- Click to view full breach details in sidebar

**Timeline Tab**
- **Historical View** of breaches over last 12 months
- **Monthly Aggregation** showing breach count and account impact
- Visual progress bars indicating breach volume
- Sample breach names for each month
- Trend analysis capability

**Trending Databases Tab**
- **Top 20** most impactful and recent breaches
- Intelligent sorting algorithm (recency + impact)
- Severity ratings for each database
- Quick comparison cards with key metrics
- Data type diversity indicators

**Geographic Distribution Tab**
- **Country-Based** threat origin analysis
- Percentage distribution visualization
- Top 9 countries + "Other" category
- Visual progress bars showing relative threat levels
- Based on domain TLD and pattern analysis

#### Live Statistics Dashboard (6 Cards)
1. **Total Breaches**: Complete database count
2. **Accounts Compromised**: 12.8+ billion tracked
3. **Recent Breaches**: Last 30 days discoveries
4. **Critical Breaches**: Highest severity count
5. **Verified Breaches**: Confirmed by HIBP
6. **Verification Rate**: Data quality metric

#### Breach Severity System
**4-Tier Classification:**
- 🔴 **Critical**: >100M accounts, sensitive data, recent
- 🟠 **High**: 10M-100M accounts, verified breaches
- 🟡 **Medium**: 1M-10M accounts, moderate impact
- 🔵 **Low**: <1M accounts, limited scope

**Severity Algorithm Considers:**
- Number of affected accounts
- Sensitive data exposure (passwords, financial data, etc.)
- Data classes compromised
- Verification status
- Recency of discovery

#### Breach Detail Sidebar
- Breach name and logo
- Breach date and discovery date
- Affected accounts count
- Data classes exposed
- Description and incident details
- Verification status
- Sensitivity indicators
- Spam list detection
- Fabrication detection
- Retirement status

#### Interactive Features
- **Auto-refresh Toggle**: Control automatic updates
- **Manual Refresh**: Force data update
- **Tab Navigation**: Switch between views
- **Hover Effects**: Interactive cards
- **Click for Details**: Expand breach information
- **Smooth Animations**: Framer Motion transitions

#### Data Sources
**Primary:** HaveIBeenPwned API (HIBP)
**Secondary (Free APIs):**
- AlienVault OTX (Open Threat Exchange)
- MalwareBazaar (abuse.ch)
- PhishTank
- URLScan.io
- BreachDirectory

**Mock Data Fallback:** Realistic sample data when API unavailable

#### API Endpoints
- `GET /api/v1/threat-intel/recent-breaches` - Latest 50 breaches
- `GET /api/v1/threat-intel/breach-timeline?days=365` - Historical data
- `GET /api/v1/threat-intel/trending-databases` - Top 20 trending
- `GET /api/v1/threat-intel/geographic-distribution` - Country stats
- `GET /api/v1/threat-intel/live-stats` - Real-time metrics

#### Design Features
- Modern dark theme with gradient backgrounds
- Glass-morphism card effects
- Smooth hover animations
- Professional typography
- Responsive grid layouts
- Color-coded severity system
- Touch-friendly controls

#### Security & Privacy
- No storage of breach data (fetched on-demand)
- API keys secured in environment variables
- Authentication required
- HIBP terms of use compliance
- Graceful error handling

---

## 👥 User Management System

### Overview
Comprehensive user administration and monitoring system for multi-user environments.

### 5.1 User Management Dashboard

**Route:** `/users`

Unified view of all user management activities with analytics and quick access.

#### Quick Statistics (4 Cards)
1. **Total Users**
   - Active/inactive breakdown
   - Admin/user counts
   - Recent registrations indicator

2. **Active Sessions**
   - Total active sessions
   - Suspicious sessions count
   - Blocked sessions count

3. **Activity Today**
   - Today's activity count
   - Weekly activity count
   - Total activities

4. **New Users**
   - Last 7 days registrations
   - Registration trend
   - Growth percentage

#### Interactive Charts

**User Distribution Pie Chart**
- Admins (percentage)
- Regular Users (percentage)
- Inactive Users (percentage)
- Color-coded segments
- Interactive tooltips

**Activity Trend Line Chart**
- Last 7 days user activity
- Daily activity counts
- Trend identification
- Peak time analysis
- Smooth line visualization

#### Recent Activity Sections

**Recent Registrations**
- 5 most recent users
- Username and email
- Role badge
- Registration date
- Click to view user details

**Session Statistics**
- Active sessions count
- Suspicious sessions alert
- Blocked sessions warning
- Device breakdown:
  - Desktop sessions
  - Mobile sessions
  - Tablet sessions

**Activity Summary**
- Today's total activity
- This week's activity
- All-time activities
- Top action types:
  - Login/Logout
  - Profile updates
  - Settings changes
  - Data access

#### Quick Navigation Buttons
1. **Manage Users** - Create, edit, delete users
2. **Session Management** - Monitor and control sessions
3. **Activity Logs** - View detailed activity logs

**API Endpoints:**
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/sessions/stats`
- `GET /api/v1/admin/activity-logs/stats`

---

### 5.2 Manage Users Page

**Route:** `/users/management`

Complete user CRUD operations and management.

#### Features

**User List Display**
- Username and email
- Role (Admin/User)
- Status (Active/Inactive)
- Last login timestamp
- Account creation date
- Action buttons

**User Operations**
- **Create User**: Add new user accounts
  - Username, email, password
  - Role assignment (Admin/User)
  - Initial status setting
- **Edit User**: Modify user details
  - Update username, email
  - Change role
  - Toggle active status
  - Reset password
- **Delete User**: Remove user accounts
  - Confirmation dialog
  - Cascade deletion handling
- **View Activity**: User-specific activity logs

**Search & Filter**
- Search by username or email
- Filter by role (All/Admin/User)
- Filter by status (All/Active/Inactive)
- Sort by various criteria

**User Details Modal**
- Complete user information
- Activity statistics
- Session history
- Recent actions

**Bulk Operations**
- Select multiple users
- Bulk role assignment
- Bulk status update
- Bulk deletion (with safety checks)

**API Endpoints:**
- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users`
- `PUT /api/v1/admin/users/:id`
- `DELETE /api/v1/admin/users/:id`

---

### 5.3 Activity Logs Page

**Route:** `/users/activity-logs`

Detailed audit trail of all user activities across the platform.

#### Activity Tracking

**Logged Actions**
- User login/logout
- Profile updates
- Settings changes
- Scan creation/deletion
- Search operations
- Data access
- Administrative actions
- Failed login attempts
- Password changes
- Session terminations

**Log Entry Details**
- Timestamp (precise)
- User (username and ID)
- Action type
- Action description
- IP address
- User agent (browser/device)
- Success/failure status
- Additional metadata

**Filtering & Search**
- Filter by user
- Filter by action type
- Filter by date range
- Filter by success/failure
- Search in descriptions
- IP address filter

**Export Options**
- Export to CSV
- Export to JSON
- Export to PDF
- Custom date range export
- Filtered export

**Pagination**
- Configurable page size
- Fast navigation
- Total count display

**Real-time Updates**
- Auto-refresh option
- Live activity feed
- Notification for critical actions

**API Endpoint:** `GET /api/v1/admin/activity-logs`

---

### 5.4 Session Management Page

**Route:** `/users/sessions`

Monitor and control all active user sessions with advanced security features.

#### Session Features

**Session List Display**
Each session card shows:
- **User Information**
  - Username and email
  - User role badge
- **Device Details**
  - Device type (Desktop/Mobile/Tablet/Unknown)
  - Browser and version
  - Operating system
  - Device fingerprint (SHA-256)
- **Network Information**
  - IP address
  - Location (city, country)
- **Session Metadata**
  - Last activity time
  - Creation date
  - Status badge (Active/Suspicious/Blocked)

**Session Status Indicators**
- 🟢 **Active**: Normal session
- 🟡 **Suspicious**: Flagged for review
- 🔴 **Blocked**: Access denied

**Automatic Suspicious Detection**
Sessions are flagged as suspicious when:
- ⚠️ Multiple sessions from same IP (≥3)
- ⚠️ Too many concurrent sessions (≥5)
- ⚠️ Different country within 1 hour
- ⚠️ Unusual device fingerprint

**Session Actions**
- **Terminate Session**: Force logout
  - Single session termination
  - Confirmation dialog
  - Immediate effect
- **Block Session**: Prevent access
  - Block specific session
  - Reason logging
  - Permanent until unblocked
- **Terminate All**: Kill all user sessions
  - Emergency action
  - Multi-session termination
  - Admin confirmation required

**Filtering & Search**
- Filter by user
- Filter by device type
- Filter by status (Active/Suspicious/Blocked)
- Search by IP address
- Search by browser
- Search by location
- Toggle suspicious sessions only

**Statistics Dashboard (4 Cards)**
1. **Total Sessions**: All sessions count
2. **Active Sessions**: Currently active
3. **Suspicious Sessions**: Flagged sessions
4. **Blocked Sessions**: Denied access count

**Session Security**
- 🔐 SHA-256 device fingerprinting
- ⏱️ 30-day automatic expiration (TTL)
- 🚫 Session blocking capability
- 🔄 Concurrent session limits (max 5)
- 🔍 Admin-only access

**Database Schema**
Collection: `sessions`
- Indexed fields: userId, ipAddress, deviceFingerprint, token
- TTL index on expiresAt for auto-cleanup
- Compound indexes for performance

**API Endpoints:**
- `GET /api/v1/admin/sessions` - List sessions
- `GET /api/v1/admin/sessions/stats` - Statistics
- `GET /api/v1/admin/sessions/:id` - Session details
- `POST /api/v1/admin/sessions/:id/terminate` - Terminate
- `POST /api/v1/admin/sessions/:id/block` - Block
- `POST /api/v1/admin/sessions/user/:id/terminate-all` - Terminate all
- `DELETE /api/v1/admin/sessions/cleanup` - Cleanup expired

---

### 5.5 User Activity Dashboard (Individual)

**Route:** `/users/activity/:userId`

Detailed activity analysis for individual users.

#### Features

**User Profile Summary**
- Username and email
- Role and status
- Account creation date
- Last login
- Total activity count

**Activity Timeline**
- Chronological activity feed
- Visual timeline with icons
- Action type grouping
- Date separators

**Activity Charts**
- Activity by time of day
- Activity by day of week
- Activity by action type
- Monthly activity trends

**Top Actions**
- Most frequent actions
- Action counts
- Percentage distribution

**Security Events**
- Failed login attempts
- Password changes
- Suspicious activities
- Session anomalies

**Export Options**
- Export user activity report
- PDF summary
- CSV data export

---

## 📊 Index & Data Management

### Overview
Comprehensive Elasticsearch management tools for administrators.

### 6.1 Index Management Dashboard

**Route:** `/index`

Overview of all index management capabilities.

#### Features
- Quick access to index management tools
- Cluster health overview
- Index statistics summary
- Quick navigation cards

---

### 6.2 Manage Indices Page

**Route:** `/index/management`

Real-time Elasticsearch index management interface.

#### Cluster Health Monitoring (4 Cards)
1. **Cluster Status**
   - Green/Yellow/Red indicator
   - Health score
   - Status description

2. **Total Indices**
   - Index count
   - System vs. user indices
   - Index size total

3. **Active Shards**
   - Total shards
   - Primary shards
   - Replica shards
   - Shard health percentage

4. **Nodes**
   - Total nodes
   - Data nodes
   - Master nodes
   - Node status

#### Index List Table
**Columns:**
- **Index Name**: Full index identifier
- **Health**: Green/Yellow/Red status indicator
- **Status**: Open/Close state
- **Documents**: Document count
- **Size**: Storage size
- **Primaries**: Primary shard count
- **Replicas**: Replica shard count
- **Actions**: View/Delete/Refresh buttons

**Features:**
- Real-time auto-refresh (5-second intervals, toggleable)
- Search indices by name
- Sort by any column
- Health status filtering
- System index protection (`.` prefix indices can't be deleted)

#### Index Operations

**Create Index**
- Index name input with validation
  - Lowercase only
  - Special characters: `-` and `_` allowed
  - No spaces or special symbols
- Default shard configuration
- Default replica configuration
- Confirmation and success feedback

**Delete Index**
- System index protection
- Confirmation modal
- Irreversible action warning
- Success/error feedback

**Refresh Index**
- Force index refresh
- Immediate data visibility
- Real-time synchronization

**View Details**
- Navigate to detailed index page
- Comprehensive index information

#### API Endpoints:**
- `GET /api/v1/admin/elasticsearch/indices`
- `GET /api/v1/admin/elasticsearch/cluster/health`
- `POST /api/v1/admin/elasticsearch/indices`
- `DELETE /api/v1/admin/elasticsearch/indices/:indexName`
- `POST /api/v1/admin/elasticsearch/indices/:indexName/refresh`

---

### 6.3 Index Details Page

**Route:** `/index/details/:indexName`

Comprehensive information for individual indices.

#### Tabbed Interface

**Statistics Tab**
- **General Information**
  - Index name
  - Health status
  - Status (Open/Close)
  - UUID
  - Creation date
  
- **Document Metrics**
  - Total documents
  - Deleted documents
  - Active documents
  
- **Storage Metrics**
  - Primary size
  - Total size (with replicas)
  - Average document size
  
- **Shard Information**
  - Primary shards count
  - Replica shards count
  - Total shards
  - Shard health percentage
  
- **Performance Metrics**
  - Query count
  - Fetch count
  - Indexing rate
  - Search rate

**Mapping Tab**
- Complete field mappings in JSON format
- Syntax-highlighted display
- Field types and properties
- Nested object structure
- Array field definitions
- Copy button for easy sharing

**Settings Tab**
- Index configuration in JSON format
- Syntax-highlighted display
- Number of shards
- Number of replicas
- Refresh interval
- Codec settings
- Analysis settings
- Copy button

#### Features
- Auto-refresh for live statistics
- Responsive JSON viewers
- Pretty-printed formatting
- Collapsible JSON sections
- Search within JSON

**API Endpoints:**
- `GET /api/v1/admin/elasticsearch/indices/:indexName/stats`
- `GET /api/v1/admin/elasticsearch/indices/:indexName/mapping`
- `GET /api/v1/admin/elasticsearch/indices/:indexName/settings`

---

### 6.4 Query & Search Page

**Route:** `/index/query`

Advanced Elasticsearch querying interface with two modes.

#### Mode 1: Data Browser

Simple, user-friendly interface for browsing documents.

**Features:**
- **Index Selection**: Choose from available indices
- **Full-Text Search**: Search across all fields
- **Field Filtering**: Filter by specific field values
- **Pagination**: Configurable page sizes (10, 25, 50, 100)
- **Export Options**: Download as JSON or CSV
- **Real-time Stats**: Result count and execution time
- **Score Display**: Relevance scores for results

**Search Interface:**
- Search input with instant search
- Field filter builder
- Sort options
- Page navigation
- Result count display

**Results Display:**
- Tabular format
- All document fields
- Source data preview
- Relevance scores
- Document IDs

#### Mode 2: DSL Console

Advanced interface for Elasticsearch DSL queries.

**Features:**
- **Syntax Highlighted Editor**: JSON editor for queries
- **Query Execution**: Run complex DSL queries
- **Performance Metrics**: 
  - Query execution time
  - Elasticsearch processing time
  - Network latency
- **Result Visualization**: Pretty-printed JSON results
- **Full Response**: Complete Elasticsearch response including:
  - Hits
  - Aggregations
  - Metadata
  - Shards information

**Query Management:**

**Saved Queries**
- Create named queries with descriptions
- Organize queries by index
- Quick load from saved queries panel
- Edit saved queries
- Delete unwanted saved queries
- Share queries with team

**Query History**
- Automatic tracking of all executed queries
- Timestamp and performance data
- Result count for each query
- Click to reload historical query
- Auto-deletion after 30 days (configurable)
- Export query history

**DSL Editor Features:**
- Syntax highlighting
- Auto-indentation
- Bracket matching
- Error detection
- Query validation
- Example queries

**API Endpoints:**
- `POST /api/v1/admin/elasticsearch/search` - Execute search
- `POST /api/v1/admin/elasticsearch/query` - Execute DSL query
- `GET /api/v1/admin/elasticsearch/queries/saved` - Get saved queries
- `POST /api/v1/admin/elasticsearch/queries/save` - Save query
- `GET /api/v1/admin/elasticsearch/queries/history` - Get history

---

### 6.5 Data Management Page

**Route:** `/index/data-management`

Comprehensive data lifecycle management tools.

#### Feature Categories

**1. Index Lifecycle Management (ILM)**

Automate index lifecycle through hot, warm, cold, and delete phases.

**Capabilities:**
- **Define Lifecycle Policies**: Custom policies for data tiers
- **Automated Rollover**: Based on age, size, or document count
- **Automated Deletion**: Remove old data
- **Shrinking**: Reduce shard count for older data
- **Storage Tier Transitions**: Move between hot/warm/cold/frozen
- **Force Merge**: Optimize segment count

**Policy Phases:**
- **Hot Phase** 🔥: Active data, fastest hardware
- **Warm Phase** 🌡️: Less frequent queries, read-only
- **Cold Phase** ❄️: Infrequent access, minimal replicas
- **Frozen Phase** 🧊: Rarely accessed, searchable snapshots
- **Delete Phase** 🗑️: Automatic removal

**ILM Operations:**
- Create policy
- Edit policy
- Delete policy
- Apply policy to index
- View policy status
- Policy execution monitoring

**2. Snapshot & Restore**

Backup and recovery capabilities for Elasticsearch data.

**Features:**
- **Create Snapshots**: Full or incremental backups
- **Restore Snapshots**: Point-in-time recovery
- **Repository Management**: Multiple backup locations
- **Snapshot Scheduling**: Automated backup schedules
- **Retention Policies**: Automatic old snapshot deletion

**Snapshot Operations:**
- Create snapshot
- Restore from snapshot
- Delete snapshot
- Verify snapshot
- Clone snapshot
- Get snapshot status

**Repository Types:**
- Filesystem
- S3
- Azure Blob Storage
- Google Cloud Storage
- HDFS

**3. Data Purging**

Automated and manual data deletion tools.

**Capabilities:**
- **Date-Based Purging**: Delete data older than X days
- **Size-Based Purging**: Remove data when size threshold reached
- **Manual Index Deletion**: Selective index removal
- **Bulk Operations**: Delete multiple indices
- **Safety Checks**: Prevent accidental deletion

**Purge Options:**
- Purge by date range
- Purge by index pattern
- Purge by size
- Purge by document count
- Dry-run mode for testing

#### UI Components

**Policy Builder**
- Visual policy creation
- Drag-and-drop phase configuration
- Validation and preview
- JSON export

**Snapshot Browser**
- List all snapshots
- Filter by repository
- View snapshot details
- Restore wizard

**Purge Scheduler**
- Schedule recurring purges
- Cron expression builder
- Notification on completion
- Execution history

#### Security Considerations
- ⚠️ **Admin Only**: All operations require admin role
- ⚠️ **Audit Logging**: All operations logged
- ⚠️ **Irreversible Actions**: Deletions can't be undone without snapshots
- ⚠️ **Access Control**: Proper Elasticsearch security
- ⚠️ **Backup Encryption**: Encrypted snapshot repositories

**API Endpoints:**
- ILM: `/api/v1/admin/elasticsearch/ilm/*`
- Snapshots: `/api/v1/admin/elasticsearch/snapshot/*`
- Purge: `/api/v1/admin/elasticsearch/purge/*`

---

## 🔐 Security & Session Management

### Overview
Enterprise-grade security features ensuring platform integrity and user safety.

### Session Security

**Features:**
- JWT-based authentication
- HTTP-only secure cookies
- Session fingerprinting (SHA-256)
- Device tracking
- IP address monitoring
- Geo-location tracking
- Concurrent session limits (max 5)
- Automatic session expiration (30 days)
- Suspicious activity detection
- Session blocking capability

**Detection Algorithms:**
- Multiple sessions from same IP
- Too many concurrent sessions
- Geographic anomalies (different country < 1 hour)
- Browser/device inconsistencies
- Unusual access patterns

### Activity Tracking

**Logged Events:**
- Authentication events (login/logout)
- User management actions
- Data access operations
- Configuration changes
- Administrative actions
- Failed access attempts
- Security events

**Tracking Details:**
- Precise timestamps
- User identification
- Action type and description
- IP address and geolocation
- User agent (browser/device)
- Request parameters
- Success/failure status

### Data Security

**Encryption:**
- Data in transit: TLS/SSL
- Data at rest: Elasticsearch encryption
- Sensitive fields: Field-level encryption
- Password storage: bcrypt hashing

**Access Control:**
- Role-based access (RBAC)
- Resource-level permissions
- API authentication (JWT)
- Rate limiting
- CORS protection

---

## 📈 Performance & Optimization

### 7. Performance Optimization Page

**Route:** `/index/performance`

Comprehensive tools for monitoring and optimizing Elasticsearch cluster performance.

#### 7.1 Index Optimization Dashboard

**Segment Merging**
- **Real-time Segment Monitoring**: View segments per index and shard
- **Segment Memory Tracking**: Monitor memory usage
- **Committed/Searchable Status**: Check segment states
- **Force Merge Operations**: Manual segment merging
  - Configurable max segments count
  - Background execution
  - Progress monitoring
  - Reduces fragmentation
  - Improves search performance

**Cache Statistics & Management**
- **Cache Hit Rate Monitoring**: Query/Request/Fielddata cache effectiveness
- **Memory Usage Visualization**: Memory consumption per cache type
- **Cache Clearing**: Clear specific or all caches
  - Query cache
  - Request cache
  - Fielddata cache
  - All caches
- **Performance Charts**: Visual cache hits vs misses

**Memory Usage Per Index**
- **Per-Index Memory Breakdown**: Detailed memory statistics
- **Pie Chart Visualization**: Memory distribution
- **Memory Types Tracked**:
  - Segment memory
  - Query cache memory
  - Field data memory
  - Total memory usage
- **Top memory consumers**: Identify problematic indices

#### 7.2 Performance Analyzer

**Query Performance Metrics**
- **Average Execution Time**: Track query performance over time
- **Min/Max Execution Time**: Identify outliers
- **Query Count Tracking**: Monitor query volume
- **Time-Series Charts**: Interactive line charts
- **Configurable Time Ranges**:
  - Last 15 minutes
  - Last hour
  - Last 24 hours
  - Last 7 days
  - Last 30 days

**Slow Query Logs**
- **Query Identification**: Auto-detect slow queries
- **Execution Time Highlighting**: Color-coded severity
  - 🟢 Green: < 2 seconds
  - 🟡 Yellow: 2-5 seconds
  - 🔴 Red: > 5 seconds
- **Full Query Details**: Complete DSL query for analysis
- **Timestamp Tracking**: When slow queries occurred
- **Index Attribution**: Which index was queried

**Bottleneck Identification**
- **High Latency Detection**: Queries exceeding thresholds
- **Memory Pressure Alerts**: High memory usage warnings
- **Cache Efficiency Analysis**: Low cache hit rates
- **Shard Balance Issues**: Uneven distribution
- **Hot Threads**: CPU-intensive operations
- **Long-running Tasks**: Tasks exceeding time limits

#### 7.3 Shard Management

**Shard Allocation Viewer**
- **Comprehensive Shard Listing**: All shards across cluster
- **Shard Details**:
  - Index name
  - Shard number
  - Type (Primary/Replica)
  - State (STARTED/RELOCATING/INITIALIZING/UNASSIGNED)
  - Document count
  - Size (bytes/KB/MB/GB)
  - Node assignment
- **Real-time Refresh**: Update on demand
- **State Filtering**: Filter by shard state
- **Node Filtering**: Filter by assigned node

**Reroute Shards Manually**
- **Manual Shard Relocation**: Move shards between nodes
- **Node Selection**: Dropdown for source/target nodes
- **State-Aware Operations**: Only reroute when appropriate
- **Cluster Rebalancing**: Distribute load evenly
- **Safety Checks**: Prevent invalid operations

**Shard Size Distribution**
- **Visual Bar Chart**: Compare shard sizes across indices
- **Document Count Tracking**: Data distribution
- **Top 15 Shards**: Focus on largest shards
- **Balance Analysis**: Identify oversized shards
- **Color-Coded Bars**: Easy visual comparison

**Hot/Warm/Cold Tier Management**
- **Three-Tier Architecture**:
  - **Hot Tier** 🔥: Active, frequently accessed (Red)
  - **Warm Tier** 🌡️: Less frequent access (Orange)
  - **Cold Tier** ❄️: Infrequent, archived (Blue)
- **Per-Tier Statistics**:
  - Number of indices
  - Total shard count
  - Total storage size
  - Index listing
- **Visual Tier Indicators**: Color-coded displays
- **Tier Migration**: Move indices between tiers
- **Tier Configuration**: Set tier preferences

#### Performance Tips

**ILM Performance:**
- Use rollover to prevent oversized indices
- Force merge in warm phase
- Set appropriate priorities

**Snapshot Performance:**
- Incremental snapshots are faster
- Use SSD storage for repositories
- Avoid snapshots during peak times

**Purge Performance:**
- Use date-based index names
- Delete entire indices vs. documents
- Run purges during low-traffic periods
- Monitor task API for progress

**Query Performance:**
- Use filters instead of queries when possible
- Avoid deep pagination
- Use index aliases for zero-downtime reindexing
- Optimize mapping (disable unused features)

**API Endpoints:**
- `GET /api/v1/admin/elasticsearch/performance/segments`
- `GET /api/v1/admin/elasticsearch/performance/caches`
- `POST /api/v1/admin/elasticsearch/performance/cache/clear`
- `POST /api/v1/admin/elasticsearch/performance/forcemerge`
- `GET /api/v1/admin/elasticsearch/performance/shards`
- `POST /api/v1/admin/elasticsearch/performance/reroute`

---

## 🎨 Technical Stack

### Frontend Technologies

**Core Framework:**
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server

**UI Components:**
- **Radix UI**: Accessible component primitives
  - Dialogs, Dropdowns, Tooltips, etc.
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Lucide React**: Icon library

**Data Visualization:**
- **Recharts**: Composable charting library
  - Area charts, Line charts, Pie charts
  - Bar charts, Radar charts
- **React Sigma**: Network graph visualization

**State & Data Management:**
- **React Query**: Server state management
- **Context API**: Global state management
- **React Router**: Client-side routing
- **Axios**: HTTP client

**Form Handling:**
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers**: Validation integration

### Backend Technologies

**Runtime & Framework:**
- **Node.js 20**: JavaScript runtime
- **Express**: Web application framework
- **TypeScript**: Type-safe backend code

**Database:**
- **MongoDB**: Primary database (User data, sessions, logs)
- **Mongoose**: MongoDB ODM
- **Elasticsearch**: Search and analytics engine

**Authentication & Security:**
- **Passport.js**: Authentication middleware
- **JWT**: JSON Web Tokens
- **bcryptjs**: Password hashing
- **express-validator**: Input validation
- **helmet**: Security headers
- **express-rate-limit**: Rate limiting
- **express-mongo-sanitize**: NoSQL injection protection
- **cors**: Cross-origin resource sharing

**Session Management:**
- **express-session**: Session middleware
- **memorystore**: Session store
- **cookie-parser**: Cookie handling

**Real-time Communication:**
- **Socket.io**: WebSocket library for real-time updates

**Python Integration:**
- **Child Process**: Execute Python OSINT scripts
- **Python 3.x**: OSINT scanning engine

### Python OSINT Engine

**Core Libraries:**
- **requests**: HTTP library
- **BeautifulSoup4**: HTML parsing
- **dnspython**: DNS resolution
- **python-whois**: WHOIS lookups
- **nmap**: Port scanning
- **ssl**: Certificate analysis
- **socket**: Network operations
- **json**: Data serialization

### Infrastructure

**Process Management:**
- **PM2**: Production process manager
- **Ecosystem Config**: Process configuration

**Reverse Proxy:**
- **Nginx**: Web server and reverse proxy
- **SSL/TLS**: Certificate management

**Deployment:**
- **Linux**: Production server OS
- **Bash Scripts**: Deployment automation
- **Environment Variables**: Configuration management

---

## 🔒 Access Control

### User Roles

**Admin Role:**
Full platform access including:
- All user features
- User management (CRUD)
- Session management
- Activity log viewing
- Index management
- Elasticsearch administration
- Data management
- Performance monitoring
- System configuration

**User Role:**
Standard platform access including:
- OSINT assessments
- Dark web searches
- Threat intelligence feeds
- Personal dashboard
- Search history
- Profile management
- Settings configuration

### Route Protection

**Public Routes:**
- `/` - Landing page
- `/login` - Login page

**Protected Routes (Authentication Required):**
- `/dashboard` - Main dashboard
- `/osint/*` - OSINT platform
- `/analytics` - Dark web analytics
- `/discovery` - Dark web search
- `/domain-monitoring` - Domain monitoring
- `/threat-intelligence` - Threat intelligence
- `/search-history` - Search history
- `/settings` - User settings

**Admin-Only Routes:**
- `/users/*` - User management
- `/index/*` - Index management
- `/users/management` - Manage users
- `/users/activity-logs` - Activity logs
- `/users/sessions` - Session management
- `/index/management` - Manage indices
- `/index/data-management` - Data management
- `/index/performance` - Performance optimization

### API Security

**Authentication Methods:**
- JWT Bearer tokens
- Session cookies
- API key authentication (optional)

**Rate Limiting:**
- Per-IP rate limits
- Per-user rate limits
- Per-endpoint rate limits

**Input Validation:**
- Schema validation (Zod)
- SQL injection prevention
- NoSQL injection prevention
- XSS protection
- CSRF protection

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB 4.4+
- Elasticsearch 8.x
- Python 3.8+
- Nginx (production)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ANATSCRAWLER

# Install dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Build application
npm run build

# Start production server
npm start
```

### Development

```bash
# Start development server
npm run dev

# Start backend server (separate terminal)
npm run dev:server
```

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://localhost:27017/anatscrawler

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# API Keys (Optional)
HIBP_API_KEY=your_haveibeenpwned_key
VT_API_KEY=your_virustotal_key
OTX_API_KEY=your_alienvault_key
URLSCAN_API_KEY=your_urlscan_key
```

### Default Admin Account

```
Username: admin
Password: admin123
```

**⚠️ Change default credentials immediately after first login!**

---

## 📖 Documentation Structure

The platform includes comprehensive documentation:

- **QUICK_START.md**: Quick start guide
- **DEPLOYMENT_GUIDE.md**: Production deployment instructions
- **OSINT_DASHBOARD_FEATURE.md**: OSINT dashboard documentation
- **DARK_WEB_MONITORING_DASHBOARD.md**: Dark web monitoring guide
- **THREAT_INTELLIGENCE_COMPLETE.md**: Threat intelligence setup
- **SESSION_MANAGEMENT_COMPLETE.md**: Session management guide
- **INDEX_MANAGEMENT_IMPLEMENTATION.md**: Index management docs
- **USER_MANAGEMENT_DASHBOARD_IMPLEMENTATION.md**: User management guide
- **DISCOVERY_PAGE_IMPLEMENTATION.md**: Discovery page documentation
- **SEARCH_TRACKING_COMPLETE.md**: Search tracking implementation
- **ELASTICSEARCH_QUERY_SEARCH_FEATURE.md**: Query interface guide
- **DATA_MANAGEMENT_GUIDE.md**: Data lifecycle management
- **PERFORMANCE_OPTIMIZATION_GUIDE.md**: Performance tuning guide

---

## 🎯 Use Cases

### Security Researchers
- Conduct OSINT reconnaissance on targets
- Identify attack surfaces and vulnerabilities
- Monitor dark web for credential leaks
- Track threat intelligence feeds
- Analyze breach databases

### Organizations
- Monitor corporate domain exposures
- Track employee email breaches
- Assess third-party vendor security
- Audit external attack surface
- Compliance and reporting

### Penetration Testers
- Pre-engagement reconnaissance
- Attack surface mapping
- Vulnerability identification
- Social engineering preparation
- Report generation

### Cybersecurity Teams
- Threat intelligence gathering
- Incident response preparation
- Dark web monitoring
- Security posture assessment
- Proactive threat hunting

---

## 🔄 Version History

**v2.0.0** (Current)
- Complete platform redesign
- Dark web monitoring suite
- Threat intelligence feeds
- Enhanced user management
- Session management system
- Index management tools
- Performance optimization dashboard
- Data lifecycle management
- Comprehensive documentation

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Support

For support, feature requests, or bug reports:
- Create an issue in the repository
- Contact the development team
- Refer to documentation

---

## 🎉 Conclusion

ANAT Security Platform is a comprehensive, enterprise-grade OSINT and cybersecurity intelligence platform that combines powerful reconnaissance capabilities with modern user experience design. With features ranging from deep OSINT assessments to real-time threat intelligence and dark web monitoring, it provides security professionals with the tools they need for effective cyber threat analysis and management.

The platform's modular architecture, comprehensive API, and extensible design make it suitable for organizations of all sizes, from individual researchers to large security teams.

---

**Built with ❤️ by the ANAT Security Team**

*Last Updated: December 31, 2025*
