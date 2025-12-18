# Session Management - Visual Guide

## Navigation

### Accessing the Session Management Page

1. **Login as Administrator**
   - Navigate to the login page
   - Enter admin credentials
   - Click "Sign In"

2. **Navigate to Session Management**
   ```
   Sidebar → User Management → Session Management
   ```

## Page Layout

### Header Section
```
┌─────────────────────────────────────────────────────────────┐
│  🛡️  Session Management                    [Refresh]        │
│     Monitor and control active user sessions                │
└─────────────────────────────────────────────────────────────┘
```

### Statistics Cards
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Active       │ Suspicious   │ Blocked      │
│ Sessions     │ Sessions     │ Sessions     │ Sessions     │
│   123        │    45        │     8        │     2        │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Filters Section
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Filters                                                   │
├─────────────────────────────────────────────────────────────┤
│ [User ▼]  [Device ▼]  [Status ▼]  [Search...........]      │
│                                                              │
│ [Clear Filters]  [⚠️ Show Suspicious Only]                  │
└─────────────────────────────────────────────────────────────┘
```

### Session List
```
┌─────────────────────────────────────────────────────────────┐
│ 👤 john.doe  •  john@example.com        [✓ Active]          │
│                                    [⚠️ Multiple IPs]         │
├─────────────────────────────────────────────────────────────┤
│ 🖥️  Desktop        🌐 Chrome 120       📍 192.168.1.1      │
│ 💻  Windows 11     🌍 New York, US     🕐 5m ago            │
│ 📅 Dec 18, 2025    ⚡ abc123...                             │
│                                                              │
│                          [Terminate]  [Block]               │
└─────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Status Badges
- **✓ Active** - Green (`text-green-400`, `bg-green-400/10`)
- **⚠️ Suspicious** - Yellow (`text-yellow-400`, `bg-yellow-400/10`)
- **🚫 Blocked** - Red (`text-red-400`, `bg-red-400/10`)
- **⭕ Inactive** - Gray (`text-gray-400`, `bg-gray-400/10`)

### Device Type Icons
- **🖥️ Desktop** - Monitor icon
- **📱 Mobile** - Smartphone icon
- **📲 Tablet** - Tablet icon
- **🌐 Unknown** - Globe icon

### Information Icons
- **👤 User** - User icon (blue)
- **🌐 Browser** - Globe/Chrome icon
- **📍 IP Address** - Globe icon (purple)
- **🌍 Location** - Map pin icon (green)
- **💻 OS** - Monitor icon (cyan)
- **🕐 Last Activity** - Clock icon (yellow)
- **📅 Created** - Calendar icon (indigo)
- **⚡ Fingerprint** - Zap icon (orange)

## Action Dialogs

### Terminate Session Dialog
```
┌─────────────────────────────────────────────────────┐
│ Terminate Session                                   │
├─────────────────────────────────────────────────────┤
│ Are you sure you want to terminate this session?    │
│ The user will be logged out immediately.            │
│                                                      │
│ User:        john.doe                               │
│ Device:      Desktop                                │
│ IP Address:  192.168.1.1                            │
│                                                      │
│                    [Cancel]  [🔴 Terminate Session] │
└─────────────────────────────────────────────────────┘
```

### Block Session Dialog
```
┌─────────────────────────────────────────────────────┐
│ Block Session                                        │
├─────────────────────────────────────────────────────┤
│ Are you sure you want to block this session?        │
│ This will prevent future access from this device/IP.│
│                                                      │
│ User:             john.doe                          │
│ Device Fingerprint: abc123def456...                 │
│ IP Address:       192.168.1.1                       │
│                                                      │
│                    [Cancel]  [🟠 Block Session]     │
└─────────────────────────────────────────────────────┘
```

## Responsive Design

### Desktop View (≥1024px)
- 4 columns for statistics cards
- 5 columns for filters
- Full session details visible
- Actions on the right side

### Tablet View (768px - 1023px)
- 2 columns for statistics cards
- 3 columns for filters
- Condensed session details
- Actions below session info

### Mobile View (<768px)
- 1 column for statistics cards
- 1 column for filters
- Stacked session details
- Full-width action buttons

## Typography

### Headings
- **Page Title**: `text-2xl font-semibold`
- **Section Title**: `text-lg font-semibold`
- **Card Title**: `text-sm font-medium`

### Body Text
- **Primary**: `text-coolWhite` (default white)
- **Secondary**: `text-gray-400`
- **Monospace** (for IPs, fingerprints): `font-mono`

### Font Sizes
- **Large numbers** (stats): `text-2xl`
- **Headers**: `text-lg` to `text-2xl`
- **Body**: `text-sm` (default)
- **Small labels**: `text-xs`

## Animations

### Page Load
- Fade in with slide up: `duration: 0.6s`
- Stagger children: `delay: 0.1s`

### Session Cards
- Fade in on load
- Slide up on appearance
- Hover: Border color change

### Buttons
- Hover: Background opacity change
- Active: Scale down slightly
- Loading: Spinner animation

## Spacing & Layout

### Padding
- Page container: `p-8 pt-4`
- Cards: `p-6` (header), `p-4` (content)
- Filters: `p-3` (compact)

### Margins
- Section spacing: `mb-6` to `mb-8`
- Element spacing: `gap-3` to `gap-6`

### Grid Gaps
- Stats cards: `gap-6`
- Filters: `gap-3`
- Session info: `gap-4`

## Background Effects

### Matrix Background
- Animated falling characters
- Low opacity for readability
- Fixed position, full screen
- z-index: 0 (behind content)

### Card Backgrounds
- `bg-jetBlack/50` - Semi-transparent black
- `backdrop-blur-sm` - Blur effect
- `border-gray-700` - Subtle border

## Loading States

### Initial Load
```
┌─────────────────────────────────────────┐
│                                         │
│            ⭕ Loading...                │
│         (spinning animation)            │
│                                         │
└─────────────────────────────────────────┘
```

### Action Loading
```
[Terminating...]  [Blocking...]
(disabled state with text change)
```

## Empty States

### No Sessions Found
```
┌─────────────────────────────────────────┐
│                                         │
│           🛡️ (faded)                    │
│                                         │
│        No sessions found                │
│                                         │
└─────────────────────────────────────────┘
```

## Pagination

### Page Controls
```
[← Previous]  [1] [2] [3] [4] [5]  [Next →]
              (active page highlighted in red)
```

### Pagination Logic
- Shows 5 pages at a time
- Smart range calculation based on current page
- Disabled states for first/last page
- Current page in crimson red

## Best Practices

### UX
- Clear visual hierarchy
- Consistent spacing
- Meaningful icons
- Confirmation dialogs for destructive actions
- Loading states for all async operations
- Error handling with user-friendly messages

### Performance
- Pagination to limit data
- Efficient queries with filters
- Lazy loading where possible
- Debounced search input (can be added)

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- High contrast colors
- Clear focus states

## Comparison with Activity Logs Page

### Similarities
✓ Same header structure
✓ Identical stats card layout
✓ Matching filter section design
✓ Consistent color scheme
✓ Same typography
✓ Identical button styles
✓ Same pagination pattern
✓ Matrix background effect
✓ Card-based layout

### Differences
- Different data model (sessions vs. activity logs)
- Session-specific actions (terminate, block)
- Device and browser information
- Suspicious session detection
- Different icon set (session-related)

## Integration Points

### With Activity Logs
- Cross-reference sessions with user actions
- Link from activity log to session details
- Session termination logged as activity

### With User Management
- View sessions from user detail page
- Terminate sessions when suspending user
- Session count in user overview

### With Authentication
- Create session on login
- Update session on activity
- Validate session on token verification
- Terminate session on logout
