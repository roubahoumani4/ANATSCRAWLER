# OSINT Platform Dashboard - Visual Guide

## 🎨 Dashboard Layout

### Header Section
```
┌─────────────────────────────────────────────────────────────────┐
│  🛡️ OSINT Platform Dashboard                    [🔄 Refresh]   │
│  Comprehensive overview of your security assessments           │
└─────────────────────────────────────────────────────────────────┘
```

### Key Metrics Row (4 Cards)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🎯 Total    │ │ 🕐 Active    │ │ ⚠️ Vulnera-  │ │ ⚡ Avg       │
│    Scans    │ │    Scans     │ │    bilities  │ │    Duration  │
│             │ │              │ │              │ │              │
│    156      │ │     3        │ │    1,247     │ │    24m       │
│ 142 done    │ │ Running...   │ │ 87 critical  │ │ Per scan     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
   Sky Blue        Amber          Red              Emerald
```

### Charts Section (2x2 Grid)

#### Row 1: Distribution Charts
```
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ 📊 Scan Status Distribution │ │ 📈 Scans Over Time         │
│                             │ │                             │
│     PIE CHART               │ │     AREA CHART              │
│   ┌───────────┐             │ │    ╱╲                       │
│   │           │             │ │   ╱  ╲      ╱╲              │
│   │  Finished │ 91%         │ │  ╱    ╲    ╱  ╲╱╲           │
│   │  Running  │  5%         │ │ ╱      ╲  ╱      ╲          │
│   │  Failed   │  4%         │ │╱        ╲╱        ╲         │
│   └───────────┘             │ │└──────────────────────┘     │
└─────────────────────────────┘ └─────────────────────────────┘
```

#### Row 2: Analysis Charts
```
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ 🛡️ Risk Level Distribution  │ │ 📊 Vulnerability Trends     │
│                             │ │                             │
│     BAR CHART               │ │     LINE CHART              │
│     ▓▓▓▓▓▓▓▓▓               │ │                    ╱───     │
│     ▓▓▓▓▓▓                  │ │          ╱───╲   ╱          │
│     ▓▓▓▓                    │ │   ╱───╲╱      ╲╱            │
│     ▓▓                      │ │  ╱                          │
│  Critical High Med  Low     │ │ Critical High Medium Low    │
└─────────────────────────────┘ └─────────────────────────────┘
```

### Information Section (2 Columns)

#### Column 1: Top Targets
```
┌────────────────────────────────────────┐
│ 🌐 Most Scanned Targets               │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ example.com              34 scans  │ │
│ │ Last: Dec 3, 2025                  │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ test-site.io             28 scans  │ │
│ │ Last: Dec 2, 2025                  │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ api.service.net          22 scans  │ │
│ │ Last: Dec 1, 2025                  │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

#### Column 2: Recent Activity
```
┌────────────────────────────────────────┐
│ 🕐 Recent Activity                     │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ ● example.com            [finished]│ │
│ │   Dec 4, 2025 10:30 AM   12 vulns │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ ● test-api.io            [running] │ │
│ │   Dec 4, 2025 10:25 AM             │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ ● secure-site.com        [finished]│ │
│ │   Dec 4, 2025 9:15 AM    8 vulns  │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Quick Actions Row (3 Buttons)
```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  ⚡ New          │ │  📄 View         │ │  📊 View         │
│     Assessment   │ │     History      │ │     Output       │
│                  │ │                  │ │                  │
│  Start new scan  │ │  Browse past     │ │  See scan        │
│                  │ │  scans           │ │  results         │
└──────────────────┘ └──────────────────┘ └──────────────────┘
  Emerald Green       Purple              Sky Blue
```

## 🎨 Color Scheme

### Status Colors
- **Finished**: `#10b981` (Emerald) - Success state
- **Running**: `#f59e0b` (Amber) - In-progress with pulse
- **Failed**: `#ef4444` (Red) - Error state
- **Aborted**: `#8b5cf6` (Purple) - User-cancelled
- **Pending**: `#6b7280` (Gray) - Queued

### Severity Colors (Vulnerabilities)
- **Critical**: `#ef4444` (Red)
- **High**: `#f97316` (Orange)
- **Medium**: `#eab308` (Yellow)
- **Low**: `#22c55e` (Green)

### Card Backgrounds
- Dark base: `#111827` (Jet Black)
- Card background: `rgba(17, 24, 39, 0.6)` (Transparent dark)
- Border: `#374151` (Gray-800)
- Hover border: Accent color at 70% opacity

## 🔄 Interactive States

### Loading State
```
┌─────────────────────────────────────┐
│                                     │
│          ⭕ (spinning)              │
│                                     │
│    Loading dashboard analytics...  │
│                                     │
└─────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────┐
│          ⚠️ (alert icon)            │
│                                     │
│    Error Loading Dashboard          │
│    Failed to fetch dashboard data   │
│                                     │
│         [Retry Button]              │
└─────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────┐
│          🛡️ (shield icon)           │
│                                     │
│       No Data Available             │
│    Start your first assessment      │
│       to see analytics              │
│                                     │
│    [Start Assessment Button]        │
└─────────────────────────────────────┘
```

## 📱 Responsive Behavior

### Desktop (>1024px)
- 4-column metrics grid
- 2x2 charts grid
- 2-column info section
- Full-width quick actions

### Tablet (768px - 1024px)
- 2-column metrics grid
- 2-column charts grid
- 2-column info section
- Full-width quick actions

### Mobile (<768px)
- 1-column metrics grid (stacked)
- 1-column charts grid (stacked)
- 1-column info section (stacked)
- Stacked quick actions

## 🎯 User Interactions

### Clickable Elements

1. **Refresh Button** (Top right)
   - Reloads dashboard data
   - Shows loading spinner during refresh
   - Updates all metrics and charts

2. **Recent Activity Items**
   - Click any activity card
   - Navigates to: `/osint/assessment/output?jobId={jobId}`
   - Shows full scan details

3. **Quick Action Buttons**
   - New Assessment → `/osint/assessment`
   - View History → `/osint/assessment/history`
   - View Output → `/osint/assessment/output`

4. **Chart Elements**
   - Hover for tooltips
   - Shows exact values
   - Interactive legends

### Hover Effects

1. **Metric Cards**
   - Border color intensifies
   - Subtle shadow appears
   - Background gradient shows

2. **Info Cards**
   - Background slightly lightens
   - Smooth transition effect
   - Cursor changes to pointer

3. **Charts**
   - Tooltips appear on hover
   - Highlight specific data points
   - Show exact values

## 📊 Data Update Frequency

### Real-time Elements
- **Active Scans Count**: Updates every 30s automatically
- **Running Status**: Shows pulse animation
- **Recent Activity**: Shows latest 10 entries

### On-Demand Updates
- **All Metrics**: Update via Refresh button
- **Charts**: Recalculate on refresh
- **Trends**: Recompute from latest data

## 🔐 Security Features

### User Isolation
- Dashboard shows ONLY user's own scans
- No cross-user data leakage
- Authenticated API endpoint
- Owner validation on backend

### Data Privacy
- No sensitive data in URLs
- Secure API communication
- Token-based authentication
- Session management

## 🚀 Performance

### Optimization Techniques
1. **Memoization**: useMemo for computed data
2. **Efficient Queries**: Single DB call for all stats
3. **Lazy Loading**: Charts load as needed
4. **Responsive Images**: Optimized icon sizes

### Load Time Targets
- Initial load: < 2s
- Refresh: < 1s
- Chart render: < 500ms
- Interaction response: < 100ms

---

## Quick Start Guide

1. **Navigate to Dashboard**: Click "OSINT Platform" in sidebar
2. **View Overview**: See all your scan statistics at a glance
3. **Analyze Trends**: Check vulnerability and scan trends
4. **Review Activity**: Browse recent scans in activity feed
5. **Take Action**: Use quick action buttons to manage scans
6. **Drill Down**: Click recent activities for detailed views

---

**Dashboard is fully responsive, accessible, and optimized for security professionals monitoring multiple assessments.**
