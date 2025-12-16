# Dark Web Monitoring Dashboard - Visual Guide

## 🎨 Dashboard Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📊 Dark Web Monitoring                            Last Updated: 10:30  │
│  Comprehensive intelligence and threat monitoring dashboard              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 🟠 Active       │ │ 🔴 Discovery    │ │ 🔵 Monitored    │ │ 🟣 Total        │
│    Threats      │ │    Searches     │ │    Domains      │ │    Searches     │
│                 │ │                 │ │                 │ │                 │
│    0            │ │    0            │ │    0            │ │    0            │
│    ↗ +12%      │ │    ↗ +8%       │ │    ↗ +5%       │ │    0% success   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘

┌───────────────────────────────────────────────┐ ┌──────────────────────┐
│  📊 Weekly Activity Overview                  │ │  ⚡ Recent Activity  │
│                                               │ │                      │
│  [Area Chart]                                 │ │  🟠 New threat       │
│   - Threats (Orange)                          │ │     detected         │
│   - Discoveries (Red)                         │ │     2 min ago        │
│   - Domains (Cyan)                            │ │                      │
│                                               │ │  🔴 Email exposure   │
│   70│      ╱╲                                 │ │     found            │
│   60│    ╱    ╲    ╱╲                        │ │     15 min ago       │
│   50│  ╱        ╲╱    ╲                      │ │                      │
│   40│╱                  ╲                    │ │  🔵 Domain breach    │
│   30│                      ╲                 │ │     detected         │
│   20│                        ╲               │ │     1 hour ago       │
│   10│                          ╲             │ │                      │
│    0└─────────────────────────────           │ │  ℹ️ New search       │
│      Mon Tue Wed Thu Fri Sat Sun             │ │     completed        │
│                                               │ │     2 hours ago      │
└───────────────────────────────────────────────┘ └──────────────────────┘

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  🥧 Threat       │ │  🥧 Search       │ │  📡 Security     │
│     Distribution │ │     Distribution │ │      Score       │
│                  │ │                  │ │                  │
│   [Pie Chart]    │ │   [Pie Chart]    │ │  [Radar Chart]   │
│                  │ │                  │ │                  │
│   🔴 Critical    │ │   🟣 Email 45%   │ │      95          │
│   🟠 High        │ │   🔵 Domain 35%  │ │   90 ╱│╲ 90     │
│   🟡 Medium      │ │   🟡 Threat 20%  │ │    85╱ │ ╲85    │
│   🔵 Low         │ │                  │ │   ───────────    │
│                  │ │                  │ │   Detection      │
└──────────────────┘ └──────────────────┘ └──────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  👁️ Monitoring Modules                                             │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Orange Gradient Header             │ │ Red Gradient Header              │
│                                    │ │                                  │
│  🟠                          0     │ │  🔴                          0   │
│  [Icon]                 ↗ +12%    │ │  [Icon]                 ↗ +8%   │
│                                    │ │                                  │
│  Threat Intelligence               │ │  Discovery                       │
│                                    │ │                                  │
│  Monitor and analyze emerging      │ │  Search for exposed credentials, │
│  threats from dark web sources...  │ │  emails, and sensitive data...   │
│                                    │ │                                  │
│  • 0 Critical alerts               │ │  • 0 Exposures found            │
│  • 0 High priority items           │ │  • Multi-database search        │
│  • Real-time monitoring            │ │  • Instant breach alerts        │
│                                    │ │                                  │
│  ┌──────────────────────────────┐ │ │  ┌──────────────────────────────┐│
│  │  Access Module            →  │ │ │  │  Access Module            →  ││
│  └──────────────────────────────┘ │ │  └──────────────────────────────┘│
└──────────────────────────────────┘ └──────────────────────────────────┘

┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Blue Gradient Header               │ │ Purple Gradient Header           │
│                                    │ │                                  │
│  🔵                          0     │ │  🟣                          0   │
│  [Icon]                 ↗ +5%     │ │  [Icon]              0% success  │
│                                    │ │                                  │
│  Domain Monitoring                 │ │  Search History                  │
│                                    │ │                                  │
│  Track domain-level exposures and  │ │  Access comprehensive logs of    │
│  monitor organization-wide...      │ │  all searches with detailed...   │
│                                    │ │                                  │
│  • 0 Total exposures               │ │  • Complete audit trail         │
│  • Continuous monitoring           │ │  • Advanced filtering           │
│  • Risk scoring                    │ │  • Export capabilities          │
│                                    │ │                                  │
│  ┌──────────────────────────────┐ │ │  ┌──────────────────────────────┐│
│  │  Access Module            →  │ │ │  │  Access Module            →  ││
│  └──────────────────────────────┘ │ │  └──────────────────────────────┘│
└──────────────────────────────────┘ └──────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  🔒 System Status                                                   │
└────────────────────────────────────────────────────────────────────┘

┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌─────────────┐
│ API Services   │ │ Database       │ │ Monitoring     │ │ Updates     │
│ ● Operational  │ │ ● Connected    │ │ ● Active       │ │ ● Up to date│
└────────────────┘ └────────────────┘ └────────────────┘ └─────────────┘
```

---

## 🎯 Component Breakdown

### 1. Header Section
```
┌─────────────────────────────────────────────────────┐
│ 📊 Dark Web Monitoring    Last Updated: 10:30 AM   │
│ Comprehensive intelligence and threat monitoring    │
└─────────────────────────────────────────────────────┘
```
- **Left**: Icon + Title + Description
- **Right**: Real-time clock
- **Gradient**: Cyan to Blue on title

### 2. Statistics Cards (4 Cards)
```
┌─────────────────┐
│ 🟠 Icon         │
│ ↗ Trend         │
│                 │
│ 42              │ ← Large number
│ Active Threats  │ ← Label
└─────────────────┘
```
- **Colors**: Orange, Red, Blue, Purple
- **Icons**: AlertTriangle, Shield, Globe, History
- **Trend Indicators**: Arrow + percentage

### 3. Activity Chart (Large)
```
┌────────────────────────────────────────┐
│ 📊 Weekly Activity Overview            │
│                                        │
│ [Multi-series Area Chart]              │
│  - Gradient fills                      │
│  - 3 data series                       │
│  - Interactive tooltips                │
│  - X-axis: Days (Mon-Sun)              │
│  - Y-axis: Count                       │
└────────────────────────────────────────┘
```
**Chart Features:**
- **Threats**: Orange gradient fill
- **Discoveries**: Red gradient fill
- **Domains**: Cyan gradient fill
- **Grid**: Subtle gray lines
- **Tooltip**: Dark background with white text

### 4. Recent Activity Feed
```
┌──────────────────────┐
│ ⚡ Recent Activity   │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ 🟠 New threat    │ │
│ │    detected      │ │
│ │    2 min ago     │ │
│ └──────────────────┘ │
│                      │
│ ┌──────────────────┐ │
│ │ 🔴 Email         │ │
│ │    exposure      │ │
│ │    15 min ago    │ │
│ └──────────────────┘ │
└──────────────────────┘
```
**Activity Items:**
- Icon badge with color
- Activity title
- Timestamp
- Hover effect: Border highlight

### 5. Distribution Charts (3 Charts)

#### Threat Distribution (Pie)
```
       Critical
    ●─────────●
   ╱           ╲
  ●     PIE     ●
   ╲           ╱
    ●─────────●
    High  Medium Low
```

#### Search Distribution (Pie)
```
   Email 45%
   Domain 35%
   Threat 20%
```

#### Security Score (Radar)
```
      Threat Detection
         ╱│╲
    Data│ │ │Response
        │ ○ │
   Cover│   │Quality
         ╲│╱
```

### 6. Module Cards (4 Cards)
```
┌─────────────────────────────────┐
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ← Gradient bar
│                                 │
│ 🔵                        156   │ ← Icon + Stat
│ [Icon]                 ↗ +5%   │ ← Trend
│                                 │
│ Module Name                     │ ← Title
│                                 │
│ Description text goes here and  │ ← Description
│ explains what this module does  │
│                                 │
│ • Feature 1                     │ ← Highlights
│ • Feature 2                     │
│ • Feature 3                     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Access Module            →  │ │ ← Action button
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Gradient Colors:**
- **Threat Intelligence**: Orange to Red
- **Discovery**: Red to Pink
- **Domain Monitoring**: Blue to Cyan
- **Search History**: Purple to Indigo

### 7. System Status Panel
```
┌────────────────────────────────────────────┐
│ 🔒 System Status                           │
├─────────────┬─────────────┬────────────────┤
│ API         │ Database    │ Monitoring     │
│ ● Green     │ ● Green     │ ● Green        │
│ Operational │ Connected   │ Active         │
└─────────────┴─────────────┴────────────────┘
```

---

## 🎨 Color Palette

### Primary Colors
```css
Jet Black:     #0a0a0a  ███  Background
Dark Gray:     #1a1a1a  ███  Cards
Cool White:    #f5f5f5  ███  Text
```

### Accent Colors
```css
Cyan:          #06b6d4  ███  Primary accent
Orange:        #f97316  ███  Threats
Red:           #ef4444  ███  Critical/Discovery
Blue:          #3b82f6  ███  Domains
Purple:        #8b5cf6  ███  History
Yellow:        #eab308  ███  Medium severity
Green:         #22c55e  ███  Success/Active
```

### Severity Colors
```css
Critical:      #ef4444  ███  Red
High:          #f97316  ███  Orange
Medium:        #eab308  ███  Yellow
Low:           #3b82f6  ███  Blue
Info:          #06b6d4  ███  Cyan
```

---

## 📱 Responsive Breakpoints

### Desktop (lg: 1024px+)
- 4-column stats grid
- 2-column module cards
- Side-by-side charts

### Tablet (md: 768px)
- 2-column stats grid
- Single column modules
- Stacked charts

### Mobile (sm: 640px)
- Single column layout
- Compact cards
- Simplified charts

---

## ✨ Animation States

### Load Animations
1. **Fade In**: Opacity 0 → 1
2. **Slide Up**: Y: 20px → 0px
3. **Stagger**: 0.1s delay between children

### Hover States
```
Card Normal:
┌─────────────┐
│   Content   │
└─────────────┘
border: gray/10

Card Hover:
┌─────────────┐
│   Content   │  ← Slight lift
└─────────────┘
border: cyan/30
```

### Button Hover
```
Normal:
[ Access Module    → ]

Hover:
[ Access Module     → ]  ← Arrow shifts right
  Background: cyan/10
```

---

## 🎯 Interactive Elements

### Clickable Areas
1. **Module Cards** → Navigate to module page
2. **Chart Tooltips** → Show detailed data
3. **Activity Items** → Expand details (future)

### Status Indicators
```
● Active   ← Pulsing animation
○ Inactive ← Static
```

---

## 📊 Chart Specifications

### Area Chart
- **Width**: 100% responsive
- **Height**: 300px
- **Grid**: Dashed lines, gray
- **Axes**: Gray labels
- **Tooltip**: Dark background

### Pie Charts
- **Radius**: 80px
- **Labels**: Name + Percentage
- **Legend**: Below chart
- **Colors**: Matched to severity

### Radar Chart
- **Dimensions**: 5 axes
- **Fill**: Semi-transparent green
- **Grid**: Polar grid, gray
- **Labels**: Category names

---

## 🎭 User Interactions

### Navigation Flow
```
Dashboard → Click Module Card → Module Page
     ↓
  Sidebar → Select Submenu → Module Page
     ↓
  Direct URL → /analytics → Dashboard
```

### Data Flow
```
Component Mount
     ↓
Fetch API Data
     ↓
Update State
     ↓
Render Charts
     ↓
Display Stats
```

---

## 📐 Spacing & Layout

### Card Spacing
```
Padding:     24px (6 units)
Gap:         24px between cards
Border:      1px solid white/10
Radius:      12px (rounded-xl)
```

### Typography
```
Title:       4xl (36px) bold
Subtitle:    base (16px) gray
Stats:       3xl (30px) bold
Labels:      sm (14px) gray
```

---

## 🎨 Visual Hierarchy

### Level 1: Page Title
- Largest font (4xl)
- Gradient text effect
- Icon accent

### Level 2: Section Headers
- xl font size
- Icon prefix
- Bottom margin

### Level 3: Card Content
- Base font size
- Regular weight
- Gray color

### Level 4: Metadata
- sm font size
- Light gray
- Secondary info

---

## 🔄 Real-time Updates

### Update Indicators
```
Last Updated: 10:30:45 AM  ← Live clock

Status: ● Active  ← Pulsing dot
```

### Loading States
```
┌─────────────┐
│      ⟳      │  ← Spinner
│  Loading... │
└─────────────┘
```

---

## 📱 Mobile Optimization

### Simplified Layout
- Single column
- Collapsed charts
- Touch-friendly buttons
- Swipe gestures (future)

### Compact Cards
```
┌──────────────┐
│ 🟠 42        │  ← Icon + Number
│ Threats      │  ← Label
└──────────────┘
Smaller padding
No trend indicator
```

---

This visual guide provides a comprehensive overview of the Dark Web Monitoring Dashboard's layout, components, and design elements. Use it as a reference for understanding the interface structure and user experience flow.
