# Quick Deployment Checklist

## What Was Changed
1. ✅ **server/lib/search.ts** - Optimized search logic
   - Changed from sequential to parallel index searches
   - Simplified query from complex bool to match_phrase
   - Removed content parsing overhead
   - Reduced source fields

2. ✅ **client/src/pages/DiscoveryPage.tsx** - Minor fix
   - Added explicit `limit: 100` parameter

## Before You Deploy

### Step 1: Verify Changes
```bash
cd /home/rouba/Downloads/ANATSCRAWLER

# Check if changes are present
grep -n "Promise.all(searchPromises)" server/lib/search.ts
# Should show: const allIndexResults = await Promise.all(searchPromises);

grep -n "match_phrase" server/lib/search.ts
# Should show the simplified query
```

### Step 2: Build the Code
```bash
npm run build
```

### Step 3: Restart Server
**Option A - If using PM2:**
```bash
pm2 restart all
# or
pm2 restart anatscrawler
```

**Option B - If running manually:**
```bash
# Stop current server (Ctrl+C)
npm run start
```

**Option C - If using Docker:**
```bash
docker-compose down
docker-compose up
```

## After Deployment: Test It

### Test 1: Direct Elasticsearch (Baseline)
```bash
curl -X GET "http://localhost:9200/collection1/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "_source": ["file_name", "file_path"],
    "query": {
      "match_phrase": {
        "content": "gmabis@yahoo.com"
      }
    }
  }'

# Expected: 4 results in ~570ms
```

### Test 2: Via WebApp (Discovery Page)
1. Open: http://your-server:3000/discovery
2. Search: `gmabis@yahoo.com`
3. **Expected**: Results in <1 second

### Test 3: Check Server Logs
```bash
# Watch for optimization logs
tail -f your-log-file.log | grep "ES Search"

# You should see:
# [ES Search] Starting optimized search for: "gmabis@yahoo.com"
# [ES Search] Searching index: darkweb_structured
# [ES Search] Searching index: files_index
# [ES Search] Searching index: collection1
# [ES Search] All indices completed in XXXms - Total results: 4
```

## Success Criteria

✅ **All of these should be true:**
- [ ] Elasticsearch search returns results in ~570ms
- [ ] WebApp search returns results in <1 second
- [ ] Server logs show parallel search (all 3 indices at once)
- [ ] No timeout errors in browser console
- [ ] Results display correctly (file names, paths)

## If Something Goes Wrong

### Issue: "Cannot find module" or build error
**Solution:**
```bash
npm install
npm run build
```

### Issue: Server crashes after restart
**Check:**
```bash
npm run build  # Rebuild
npm run start  # Check for errors
```

### Issue: Search still slow
**Check:**
```bash
# 1. Verify new code is running
grep "All indices completed in" your-log-file.log
# Should show parallel search times

# 2. Check Elasticsearch
curl http://localhost:9200/_cluster/health?pretty
```

### Issue: Results not appearing
**Check:**
```bash
# Verify Elasticsearch is responsive
curl http://localhost:9200/collection1/_count

# Check API logs
tail -100 your-log-file.log | grep -i error
```

## Rollback (if needed)

If you need to revert to the original code:
```bash
# Restore from git
git checkout server/lib/search.ts
git checkout client/src/pages/DiscoveryPage.tsx

# Rebuild and restart
npm run build
npm run start
```

## Performance Expectations

| Metric | Old | New |
|--------|-----|-----|
| Search time | 3+ minutes | ~800ms |
| Indices searched | 1 at a time | 3 in parallel |
| Timeout errors | Frequent | Eliminated |

**Expected improvement: 3-5x faster**
