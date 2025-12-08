# Discovery Page - Testing Guide

## Pre-Testing Checklist

### Prerequisites
- [ ] Server is running
- [ ] Client is running
- [ ] Elasticsearch is accessible
- [ ] User is authenticated
- [ ] MongoDB connection is active

### Verification Steps
```bash
# 1. Check if server is running
curl http://localhost:5000/health

# 2. Check if Elasticsearch is configured
# Look for ELASTICSEARCH_URL in server logs

# 3. Verify authentication
# Login through the app first
```

---

## Manual Testing Scenarios

### Test Case 1: Page Access
**Objective**: Verify page loads correctly

**Steps**:
1. Login to the application
2. Navigate to Dark Web Monitoring in sidebar
3. Click on "Discovery"
4. Verify page loads without errors

**Expected Result**:
- ✅ Page displays with header "Discovery - Dark Web Intelligence"
- ✅ Search box is visible and empty
- ✅ Search button is disabled (no query entered)
- ✅ Guidelines section is visible
- ✅ No console errors

---

### Test Case 2: Basic Search
**Objective**: Perform a simple search and verify results

**Steps**:
1. Navigate to Discovery page
2. Enter a test query: `test@example.com`
3. Click SEARCH button
4. Wait for results

**Expected Result**:
- ✅ Button shows "SEARCHING..." with spinner
- ✅ Search input is disabled during search
- ✅ Results table appears after search completes
- ✅ Results count is displayed: "RECONNAISSANCE RESULTS (X)"
- ✅ Export button is visible

**Sample Queries to Test**:
- Email: `user@example.com`
- Username: `john_doe`
- Phone: `+1-555-1234`
- Name: `John Smith`

---

### Test Case 3: Keyboard Interaction
**Objective**: Test Enter key functionality

**Steps**:
1. Navigate to Discovery page
2. Enter a query in search box
3. Press Enter key
4. Verify search is triggered

**Expected Result**:
- ✅ Search initiates on Enter key
- ✅ Same behavior as clicking SEARCH button

---

### Test Case 4: Empty Query Handling
**Objective**: Verify empty query validation

**Steps**:
1. Navigate to Discovery page
2. Leave search box empty
3. Try to click SEARCH button
4. Enter spaces only and try again

**Expected Result**:
- ✅ SEARCH button remains disabled
- ✅ No API call is made
- ✅ No errors in console

---

### Test Case 5: No Results Scenario
**Objective**: Test empty results handling

**Steps**:
1. Navigate to Discovery page
2. Enter a query unlikely to have results: `xyzabc123nonexistent999`
3. Click SEARCH
4. Wait for response

**Expected Result**:
- ✅ Results section appears
- ✅ Empty state message displayed
- ✅ Shield icon visible
- ✅ Helpful message: "No results found for your search query"
- ✅ Suggestion: "Try different search terms..."

---

### Test Case 6: Results Display
**Objective**: Verify results table functionality

**Steps**:
1. Perform a search that returns results
2. Inspect the results table
3. Check all columns
4. Hover over rows

**Expected Result**:
- ✅ Table displays with all columns: #, Score, Name, Phone, Location, Link, Matched Terms, Context
- ✅ Scores are formatted with 2 decimals
- ✅ Scores have green badge styling
- ✅ Links are clickable and open in new tab
- ✅ Matched terms have red badge styling
- ✅ Row hover effect works (red background)
- ✅ Context/highlights are displayed

---

### Test Case 7: Loading States
**Objective**: Test loading indicators

**Steps**:
1. Start a search
2. Observe loading indicators
3. Wait for completion

**Expected Result**:
- ✅ Spinner appears in input field
- ✅ Button text changes to "SEARCHING..."
- ✅ Button is disabled during search
- ✅ Spinner icon rotates continuously
- ✅ Status indicators pulse

---

### Test Case 8: Multiple Searches
**Objective**: Test consecutive searches

**Steps**:
1. Perform first search: `test1`
2. Wait for results
3. Change query to: `test2`
4. Perform second search
5. Verify new results replace old ones

**Expected Result**:
- ✅ Previous results are cleared
- ✅ New results load correctly
- ✅ Result count updates
- ✅ No duplicate data

---

### Test Case 9: Export Functionality
**Objective**: Test export button

**Steps**:
1. Perform a search with results
2. Click "Export to Excel" button
3. Check console for implementation status

**Expected Result**:
- ✅ Button is clickable
- ✅ Console log: "Export functionality to be implemented"
- ✅ (When implemented) Excel file downloads

---

### Test Case 10: Responsive Design
**Objective**: Test on different screen sizes

**Steps**:
1. Open Discovery page
2. Resize browser window to mobile size (< 768px)
3. Resize to tablet (768px - 1023px)
4. Resize to desktop (≥ 1024px)
5. Test search on each size

**Expected Result**:
- ✅ Mobile: Sidebar collapses, search bar full width
- ✅ Tablet: Medium sizing, scrollable table
- ✅ Desktop: Full layout, all columns visible
- ✅ No layout breaks on any size
- ✅ Search functionality works on all sizes

---

### Test Case 11: Animation Testing
**Objective**: Verify smooth animations

**Steps**:
1. Navigate to Discovery page
2. Observe entry animations
3. Perform a search
4. Observe result animations

**Expected Result**:
- ✅ Page fades in smoothly
- ✅ Title has pulsing glow effect
- ✅ Status indicators pulse
- ✅ Search button scales on hover
- ✅ Results stagger in sequentially
- ✅ Table rows have hover animation

---

### Test Case 12: Error Handling
**Objective**: Test network error scenarios

**Steps**:
1. Open browser DevTools
2. Go to Network tab
3. Throttle to "Offline"
4. Try to perform a search
5. Check console and UI

**Expected Result**:
- ✅ Error logged to console
- ✅ Results show empty state or error message
- ✅ App doesn't crash
- ✅ User can try again after reconnecting

---

### Test Case 13: API Integration
**Objective**: Verify correct API endpoint usage

**Steps**:
1. Open browser DevTools
2. Go to Network tab
3. Perform a search
4. Inspect the API request

**Expected Result**:
- ✅ Request to: `POST /api/v1/search/darkweb-search`
- ✅ Request includes: `Content-Type: application/json`
- ✅ Request includes: `credentials: include`
- ✅ Body contains: `{"query": "search_term", "limit": 100}`
- ✅ Response includes: `results` array
- ✅ Response status: 200 OK

---

### Test Case 14: Status Indicators
**Objective**: Test status indicator animations

**Steps**:
1. Navigate to Discovery page
2. Observe status indicators below search box
3. Wait 5-10 seconds

**Expected Result**:
- ✅ "TERMINAL: ACTIVE" with green icon
- ✅ "SURVEILLANCE: MONITORING" with red icon
- ✅ Both indicators pulse/fade continuously
- ✅ Different pulse timing for visual effect

---

### Test Case 15: Browser Compatibility
**Objective**: Test on different browsers

**Browsers to Test**:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, if on Mac)
- [ ] Edge (latest)

**Expected Result**:
- ✅ Page loads on all browsers
- ✅ Animations work consistently
- ✅ Search functionality works
- ✅ Styling is consistent
- ✅ No browser-specific errors

---

## Automated Testing (Future)

### Unit Tests to Write
```typescript
describe('DiscoveryPage', () => {
  test('renders without crashing', () => {});
  test('search button disabled with empty query', () => {});
  test('search triggers on Enter key', () => {});
  test('displays loading state during search', () => {});
  test('displays results after successful search', () => {});
  test('displays empty state when no results', () => {});
  test('handles API errors gracefully', () => {});
});
```

### Integration Tests
```typescript
describe('Discovery Search Integration', () => {
  test('search returns results from API', () => {});
  test('authentication is included in request', () => {});
  test('results are properly formatted', () => {});
  test('export button is clickable', () => {});
});
```

---

## Performance Testing

### Metrics to Monitor
- [ ] Page load time: < 2 seconds
- [ ] Search response time: < 3 seconds
- [ ] Animation frame rate: 60 FPS
- [ ] Memory usage: Stable (no leaks)
- [ ] Bundle size impact: Minimal

### Load Testing
```bash
# Use Apache Bench or similar
ab -n 100 -c 10 http://localhost:5000/api/v1/search/darkweb-search
```

---

## Bug Report Template

If you find any issues, use this template:

```markdown
**Title**: [Brief description]

**Environment**:
- Browser: [Chrome/Firefox/Safari/Edge]
- OS: [Windows/Mac/Linux]
- Screen Size: [Desktop/Tablet/Mobile]

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots**:
[If applicable]

**Console Errors**:
[Paste any errors from console]

**Additional Context**:
[Any other relevant information]
```

---

## Testing Checklist Summary

### Functionality
- [ ] Page loads correctly
- [ ] Search functionality works
- [ ] Results display properly
- [ ] Empty state works
- [ ] Loading states visible
- [ ] Keyboard shortcuts work
- [ ] Export button visible

### UI/UX
- [ ] Animations smooth
- [ ] Colors correct (red/orange theme)
- [ ] Typography readable
- [ ] Responsive on all sizes
- [ ] Hover effects work
- [ ] Status indicators animate

### Technical
- [ ] API calls correct endpoint
- [ ] Authentication included
- [ ] Error handling works
- [ ] No console errors
- [ ] No memory leaks
- [ ] Performance acceptable

### Cross-Platform
- [ ] Works on Chrome
- [ ] Works on Firefox
- [ ] Works on Safari
- [ ] Works on Edge
- [ ] Mobile responsive
- [ ] Tablet responsive

---

## Sign-Off

**Tester Name**: ___________________
**Date**: ___________________
**Test Environment**: ___________________
**Overall Status**: [ ] Pass / [ ] Fail
**Notes**: 
___________________
___________________

---

**Testing Guide Version**: 1.0
**Last Updated**: December 8, 2025
