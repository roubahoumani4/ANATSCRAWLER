# Threat Intelligence Feed - Visual Guide

## 🎯 Page Overview

The Threat Intelligence Feed provides a comprehensive, real-time view of global security breaches and threat landscape.

```
┌─────────────────────────────────────────────────────────────────┐
│  🛡️  Threat Intelligence Feed                    🔄 Live ⟳ │
│  Real-time monitoring of global security breaches and threats   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │ 617  │  │12.8B │  │  23  │  │  89  │  │ 523  │  │84.7% │  │
│  │Breach│  │Accts │  │Recent│  │Crit. │  │Verify│  │Rate  │  │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  [Live Feed] [Timeline] [Trending] [Geographic]                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌─────────────────┐                │
│  │  Recent Breaches     │  │ Breach Details  │                │
│  │  ════════════════    │  │ ═══════════════ │                │
│  │                      │  │                 │                │
│  │  [Breach Card 1]     │  │  Selected info  │                │
│  │  [Breach Card 2]     │  │  appears here   │                │
│  │  [Breach Card 3]     │  │                 │                │
│  │  [Breach Card 4]     │  │                 │                │
│  │  [Breach Card 5]     │  │                 │                │
│  │  [Breach Card 6]     │  │                 │                │
│  │         ...          │  │                 │                │
│  └──────────────────────┘  └─────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Statistics Cards

Six real-time metric cards at the top of the page:

### 1. Total Breaches (Cyan)
```
┌─────────────────┐
│ 💾        Total │
│                 │
│     617         │
│ Total Breaches  │
└─────────────────┘
```
- Shows total number of breaches in database
- Updates in real-time
- Cyan gradient background

### 2. Accounts Compromised (Purple)
```
┌─────────────────┐
│ 👁️      Exposed │
│                 │
│    12.8B        │
│ Accounts Pwned  │
└─────────────────┘
```
- Total number of compromised accounts
- Formatted with B/M/K abbreviations
- Purple gradient background

### 3. Recent Breaches (Orange)
```
┌─────────────────┐
│ ⚡         30d   │
│                 │
│     23          │
│ Recent Breaches │
└─────────────────┘
```
- Breaches discovered in last 30 days
- Orange gradient (urgent attention)
- Auto-updates

### 4. Critical Severity (Red)
```
┌─────────────────┐
│ ⚠️     Critical  │
│                 │
│     89          │
│ Critical Sever. │
└─────────────────┘
```
- Count of critical severity breaches
- Red gradient (danger indicator)
- Based on severity algorithm

### 5. Verified Breaches (Green)
```
┌─────────────────┐
│ ✓      Verified │
│                 │
│    523          │
│ Verified Breach │
└─────────────────┘
```
- Breaches confirmed by HIBP
- Green gradient (trust indicator)
- Shows data quality

### 6. Verification Rate (Blue)
```
┌─────────────────┐
│ 📈         Rate  │
│                 │
│    84.7%        │
│ Verif. Rate     │
└─────────────────┘
```
- Percentage of verified breaches
- Blue gradient
- Quality metric

## 🔴 Live Feed Tab

### Breach Card Layout

Each breach is displayed in an interactive card:

```
┌────────────────────────────────────────────────────────┐
│  LinkedIn                          [CRITICAL]          │
│  linkedin.com                            ✓             │
│                                                         │
│  Breach Date: Nov 15, 2023    Discovered: 2 weeks ago │
│  Accounts: 165M               Data Types: 8 types      │
│                                                         │
│  [Email] [Names] [Phone] [Professional] +4 more        │
│                                                         │
│  A significant data breach exposing user profile...    │
└────────────────────────────────────────────────────────┘
```

**Elements:**
- **Title**: Breach name (bold, white)
- **Domain**: Associated domain (gray)
- **Severity Badge**: Color-coded (Critical/High/Medium/Low)
- **Verification**: ✓ icon if verified
- **Metrics Grid**:
  - Breach Date (when it occurred)
  - Discovered (relative time)
  - Accounts (formatted number)
  - Data Types (count)
- **Data Class Badges**: First 4 + counter
- **Description**: HTML formatted text

### Breach Details Sidebar

When you click a breach card:

```
┌─────────────────────────┐
│ ℹ️  Breach Details      │
├─────────────────────────┤
│                         │
│ LinkedIn                │
│ [CRITICAL SEVERITY]     │
│                         │
│ ─────────────────       │
│                         │
│ Description:            │
│ A significant data...   │
│                         │
│ Compromised Data:       │
│ [Email addresses]       │
│ [Names]                 │
│ [Phone numbers]         │
│ [Professional info]     │
│ [Geographic data]       │
│ [Job titles]            │
│ [Usernames]             │
│ [Passwords]             │
│                         │
│ ✓ Verified Breach       │
│ ⚠️ Sensitive Data       │
│ ✓ Not Fabricated        │
│                         │
│ ─────────────────       │
│                         │
│ Breach Date: Nov 2023   │
│ Added: Dec 2023         │
│ Pwned: 165M             │
│                         │
└─────────────────────────┘
```

## 📅 Timeline Tab

Historical view of breaches over time:

```
┌──────────────────────────────────────────────┐
│ 🕐 Breach Timeline (Last 12 Months)         │
├──────────────────────────────────────────────┤
│                                              │
│ 2024-12                               47.2M  │
│ 15 breaches discovered      accounts affected│
│ [████████████████░░░░░░░░░░░░░] 50%         │
│ [LinkedIn] [Twitter] [Adobe] +12 more        │
│                                              │
│ 2024-11                               32.1M  │
│ 12 breaches discovered      accounts affected│
│ [████████████░░░░░░░░░░░░░░░░] 40%          │
│ [Facebook] [Yahoo] +10 more                  │
│                                              │
│ 2024-10                               18.5M  │
│ 8 breaches discovered       accounts affected│
│ [████████░░░░░░░░░░░░░░░░░░░] 27%           │
│ [GitHub] [Discord] +6 more                   │
│                                              │
│ ... (continues for 12 months)                │
│                                              │
└──────────────────────────────────────────────┘
```

**Features:**
- Monthly aggregation
- Breach count per month
- Total affected accounts
- Progress bar (volume indicator)
- Sample breach names (first 5)

## 📈 Trending Tab

Most impactful and recent breach databases:

```
┌──────────────────────────────────────────────────────┐
│ 📊 Trending Breach Databases                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│ │LinkedIn │  │Twitter  │  │Adobe    │              │
│ │[CRITICAL│  │[CRITICAL│  │[HIGH]   │              │
│ │         │  │         │  │         │              │
│ │Accounts:│  │Accounts:│  │Accounts:│              │
│ │  165M   │  │  235M   │  │  153M   │              │
│ │         │  │         │  │         │              │
│ │Types: 8 │  │Types: 6 │  │Types: 7 │              │
│ │2 wks ago│  │3 wks ago│  │1 mo ago │              │
│ └─────────┘  └─────────┘  └─────────┘              │
│                                                      │
│ ... (up to 20 trending databases)                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Sorting Algorithm:**
- Recency score (60% weight)
- Impact score based on pwn count (40% weight)
- Excludes retired and spam lists

## 🌍 Geographic Tab

Country-based threat origin distribution:

```
┌──────────────────────────────────────────────────┐
│ 🌐 Geographic Distribution of Threats           │
├──────────────────────────────────────────────────┤
│                                                  │
│ 📍 United States              245      42.3%    │
│ [████████████████████████████████████░░░] 42%   │
│                                                  │
│ 📍 China                       87      15.0%    │
│ [██████████████░░░░░░░░░░░░░░░░░░░░░░░░] 15%   │
│                                                  │
│ 📍 Russia                      64      11.0%    │
│ [███████████░░░░░░░░░░░░░░░░░░░░░░░░░░░] 11%   │
│                                                  │
│ 📍 India                       52       9.0%    │
│ [█████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 9%    │
│                                                  │
│ 📍 Brazil                      38       6.5%    │
│ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 6.5%  │
│                                                  │
│ 📍 United Kingdom              31       5.3%    │
│ [█████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 5.3%  │
│                                                  │
│ ... (continues for all regions)                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Analysis Method:**
- Based on domain TLD analysis
- Country count and percentage
- Visual progress bars
- Sorted by count (descending)

## 🎨 Color Coding

### Severity Levels

**Critical (Red)**
```
[CRITICAL] - Red background, red border, red text
● High impact (100M+ accounts)
● Sensitive data exposed
● Recent discovery
● Verified breach
```

**High (Orange)**
```
[HIGH] - Orange background, orange border, orange text
● Significant impact (10M+ accounts)
● Important data classes
● Moderately recent
```

**Medium (Yellow)**
```
[MEDIUM] - Yellow background, yellow border, yellow text
● Moderate impact (1M+ accounts)
● Standard data classes
● Older breach
```

**Low (Blue)**
```
[LOW] - Blue background, blue border, blue text
● Lower impact (<1M accounts)
● Basic data classes
● Historical breach
```

## 🔄 Interactive Elements

### Auto-Refresh Control

```
┌────────────────────────────────┐
│ Last Updated: 10:23:45 AM  🔄  │
│                         [Live] │
└────────────────────────────────┘
```

**States:**
- **Live** (Green) - Auto-refresh every 5 minutes
- **Paused** (Gray) - Manual refresh only

**Actions:**
- Click 🔄 - Manual refresh immediately
- Click [Live]/[Paused] - Toggle auto-refresh

### Hover Effects

**Breach Cards:**
- Border changes to cyan on hover
- Smooth color transition
- Slight scale effect
- Cursor pointer

**Statistics Cards:**
- Scale up 2% on hover
- Enhanced glow effect
- Smooth animation

## 📱 Responsive Behavior

### Desktop (1920px+)
- 6 stat cards in single row
- 3-column layout (2 cols breach list, 1 col details)
- Full sidebar visible

### Tablet (768px - 1919px)
- 3 stat cards per row (2 rows)
- 2-column layout
- Collapsible sidebar

### Mobile (<768px)
- 2 stat cards per row (3 rows)
- Single column stack
- Full-width cards
- Bottom sheet for details

## 🔔 Loading States

**Initial Load:**
```
┌─────────────────────────────┐
│                             │
│         🔄 (spinning)       │
│                             │
│ Loading Threat Intelligence │
│         Feed...             │
│                             │
└─────────────────────────────┘
```

**Refresh:**
- Spinning refresh icon
- Data remains visible
- Smooth transition to new data

**Empty State:**
```
┌─────────────────────────────┐
│         🛡️                  │
│                             │
│ Select a breach to view     │
│       details               │
│                             │
└─────────────────────────────┘
```

## 🎯 Key Features Visualization

### Data Class Badges

```
[Email addresses] [Passwords] [Names] [Phone] +4 more
    └─ Red BG      └─ Red BG   └─Gray  └─Gray  └─Gray
```

- First badges for sensitive data (red)
- Standard data classes (gray)
- "+N more" counter for additional

### Verification Indicators

```
LinkedIn        ✓
    └─ Green checkmark if verified

Unverified DB   
    └─ No icon if not verified
```

### Relative Time Display

```
Today           → Less than 24 hours
Yesterday       → 1 day ago
3 days ago      → Less than a week
2 weeks ago     → Less than a month
3 months ago    → Less than a year
2 years ago     → Over a year
```

## 📊 Data Formatting

### Number Abbreviations

```
1,234          → 1.2K
1,234,567      → 1.2M
1,234,567,890  → 1.2B
```

### Date Formatting

```
2023-11-15 → Nov 15, 2023 (display)
ISO 8601   → Human readable
```

## 🎨 Theme Integration

Matches the platform's dark theme:
- Background: Slate-950 gradient
- Cards: Slate-900/800 with transparency
- Text: White/Gray hierarchy
- Accents: Cyan/Purple/Orange/Green
- Borders: Subtle slate-700

## 🚀 Performance

**Optimizations:**
- Lazy loading of breach details
- Virtualized scrolling for long lists
- Parallel API requests
- Response caching
- Debounced auto-refresh
- Efficient re-renders

**Load Times:**
- Initial page load: <2s
- Data fetch: ~1s (HIBP API)
- Refresh: ~1s (cached on backend)

---

**Visual Quality:** Modern, professional, clean
**User Experience:** Intuitive, responsive, informative
**Data Presentation:** Clear, organized, actionable
