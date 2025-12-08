# Discovery Page - Visual Guide

## Page Layout

```
╔════════════════════════════════════════════════════════════════════╗
║  SIDEBAR  ║                   DISCOVERY PAGE                        ║
╠═══════════╬════════════════════════════════════════════════════════╣
║           ║                                                          ║
║ Dashboard ║  🛡️ Discovery - Dark Web Intelligence                   ║
║           ║  Search and discover compromised credentials and data   ║
║ OSINT     ║  from dark web sources                                  ║
║ Framework ║                                                          ║
║           ║  ┌─────────────────────────────────────────────────┐    ║
║ 📊 Dark   ║  │  🔍 DARK WEB INTELLIGENCE SEARCH               │    ║
║   Web     ║  │                                                 │    ║
║ Monitoring║  │  ┌───────────────────────────────────────────┐ │    ║
║           ║  │  │ 🔍 [Enter search terms...]        [SEARCH] │ │    ║
║  🛡️       ║  │  └───────────────────────────────────────────┘ │    ║
║  Discovery║  │                                                 │    ║
║  (YOU ARE ║  │  ⚡ TERMINAL: ACTIVE   👁️ SURVEILLANCE: MONITORING    ║
║   HERE)   ║  └─────────────────────────────────────────────────┘    ║
║           ║                                                          ║
║  💼 LinkedIn ║  ┌─────────────────────────────────────────────┐   ║
║  Scraper  ║  │  👁️ RECONNAISSANCE RESULTS (25)             │    ║
║           ║  │                                                 │    ║
║  🌐 Infra-║  │  Score | Name | Phone | Location | Link ...   │    ║
║  structure║  │  ─────────────────────────────────────────────  │    ║
║  Mapping  ║  │  9.8   | John | +1... | USA     | link...     │    ║
║           ║  │  8.5   | Jane | +44.. | UK      | link...     │    ║
║  🐛 Security│  │  ...                                           │    ║
║  Exposures║  │                                                 │    ║
║           ║  │  [Export to Excel]                              │    ║
║ Settings  ║  └─────────────────────────────────────────────────┘    ║
║           ║                                                          ║
╚═══════════╩══════════════════════════════════════════════════════════╝
```

## Visual Elements

### 1. **Header Section**
```
┌─────────────────────────────────────────────────────┐
│ 🛡️ Discovery - Dark Web Intelligence                │
│                                                      │
│ Search and discover compromised credentials         │
│ and data from dark web sources                      │
└─────────────────────────────────────────────────────┘
```

### 2. **Search Box (Before Search)**
```
┌────────────────────────────────────────────────────────────┐
│  🔍 DARK WEB INTELLIGENCE SEARCH                          │
│  (pulsing red glow effect)                                │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🔍 Enter search terms for dark web reconnaissance... │ │
│  │                                           [SEARCH]   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ⚡ TERMINAL: ACTIVE    👁️ SURVEILLANCE: MONITORING        │
└────────────────────────────────────────────────────────────┘
```

### 3. **Search Box (While Searching)**
```
┌────────────────────────────────────────────────────────────┐
│  🔍 DARK WEB INTELLIGENCE SEARCH                          │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🔍 john@example.com              ⟳ [SEARCHING...]   │ │
│  │                                (button disabled)     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ⚡ TERMINAL: ACTIVE    👁️ SURVEILLANCE: MONITORING        │
└────────────────────────────────────────────────────────────┘
```

### 4. **Results Table**
```
┌──────────────────────────────────────────────────────────────┐
│  👁️ RECONNAISSANCE RESULTS (42)                              │
│                                                               │
│  ┌────┬──────┬────────────┬─────────┬──────────┬─────────┐  │
│  │ #  │Score │ Name       │ Phone   │ Location │ Link    │  │
│  ├────┼──────┼────────────┼─────────┼──────────┼─────────┤  │
│  │ 1  │ 9.8  │ John Doe   │ +1-555..│ USA      │ link... │  │
│  │ 2  │ 8.5  │ Jane Smith │ +44-20..│ UK       │ link... │  │
│  │ 3  │ 7.2  │ Bob Johnson│ +61-2...│ Australia│ link... │  │
│  │ ...│ ...  │ ...        │ ...     │ ...      │ ...     │  │
│  └────┴──────┴────────────┴─────────┴──────────┴─────────┘  │
│                                                               │
│  [Export to Excel]                                           │
└──────────────────────────────────────────────────────────────┘
```

### 5. **No Results Found**
```
┌──────────────────────────────────────────────────────────────┐
│  👁️ RECONNAISSANCE RESULTS (0)                                │
│                                                               │
│                         🛡️                                    │
│                                                               │
│           No results found for your search query.            │
│        Try different search terms or refine your query.      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 6. **Search Guidelines (Initial State)**
```
┌──────────────────────────────────────────────────────────────┐
│  Search Guidelines                                           │
│                                                               │
│  • Enter usernames, email addresses, phone numbers, or       │
│    other identifiers                                         │
│                                                               │
│  • Search results include matched terms, context, and        │
│    relevance scores                                          │
│                                                               │
│  • All searches are performed against indexed dark web       │
│    data sources                                              │
│                                                               │
│  • Use specific terms for more accurate results              │
└──────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Primary Colors
- **Background**: `#0a0e14` (Jet Black)
- **Cards**: `rgba(31, 41, 55, 0.4)` (Gray with opacity)
- **Borders**: Red/Orange gradient `#EF4444` to `#F97316`

### Accent Colors
- **Primary**: Red (`#EF4444`)
- **Secondary**: Orange (`#F97316`)
- **Success**: Green (`#10B981`)
- **Info**: Cyan (`#06B6D4`)
- **Text**: White/Gray gradient

### Status Indicators
- **Terminal Active**: Green (`#10B981`)
- **Surveillance**: Red (`#EF4444`)
- **Loading**: Red with rotation

## Animations

### Page Entry
```
1. Header: Fade in + slide down (0.6s)
2. Search Box: Fade in + slide up (0.6s, delay 0.2s)
3. Guidelines: Fade in + slide up (0.6s, delay 0.4s)
```

### Search Action
```
1. Button press: Scale down (0.95x)
2. Loading spinner: Continuous rotation
3. Results: Stagger children (0.05s each)
4. Table rows: Fade in + slide up (0.4s each)
```

### Hover Effects
```
1. Search button: Scale up (1.05x) + shadow
2. Table rows: Background red, text white
3. Links: Color change blue to light blue
```

### Text Effects
```
1. Title glow: Pulsing red shadow (2s cycle)
2. Status text: Opacity pulse (0.7 → 1.0 → 0.7)
3. Matched terms: Red background highlight
```

## Responsive Breakpoints

### Desktop (≥1024px)
- Full sidebar visible
- Wide search bar
- Multi-column table
- Large fonts

### Tablet (768px - 1023px)
- Collapsed sidebar
- Medium search bar
- Scrollable table
- Medium fonts

### Mobile (<768px)
- Hidden sidebar (hamburger menu)
- Full-width search bar
- Vertical scrolling table
- Small fonts

## User Interactions

### Search Flow
1. **User enters query** → Input field updates
2. **User clicks SEARCH or presses Enter** → Search initiated
3. **Loading state** → Button disabled, spinner shows
4. **Results received** → Table populates with animation
5. **User can export** → Excel download available

### Error Handling
- **Empty query**: Button stays disabled
- **Network error**: Console error, empty results
- **No results**: Friendly message displayed
- **Server error**: Error message in console

---

## Integration Points

### API Endpoint
```
POST /api/v1/search/darkweb-search
Authorization: Cookie-based session
Content-Type: application/json

Body:
{
  "query": "search_term",
  "limit": 100
}

Response:
{
  "success": true,
  "metadata": {...},
  "results": [...]
}
```

### Component Dependencies
- `ResultsTable` - Displays search results
- `framer-motion` - Animations
- `lucide-react` - Icons
- React hooks - State management

---

**Last Updated**: December 8, 2025
