# Query & Search Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Admin account on ANAT Security platform
- At least one Elasticsearch index with data
- Elasticsearch service running

---

## Step 1: Access the Feature

1. **Login** to the platform as an admin user
2. Click **"Index Management"** in the sidebar
3. Select **"Query & Search"** from the submenu

---

## Step 2: Choose Your Mode

### 🔍 Data Browser (Simple Searches)
Perfect for quick document lookups and browsing

### 💻 DSL Console (Advanced Queries)
For complex queries with filters, aggregations, and custom logic

---

## Quick Examples

### Example 1: Browse All Documents

1. **Select an index** from the dropdown
2. **Leave search box empty**
3. **Click "Search"**
4. **Browse results** with pagination

### Example 2: Search for Specific Text

1. **Select an index**
2. **Enter search term** (e.g., "security")
3. **Click "Search"**
4. **View matching documents**

### Example 3: Filter by Field

1. **Select an index**
2. **Choose a filter field** (e.g., "status")
3. **Enter filter value** (e.g., "active")
4. **Click "Search"**

### Example 4: Export Results

1. **Run a search** (any of the above)
2. **Click "JSON"** or **"CSV"** button
3. **File downloads automatically**

### Example 5: Execute Custom Query

1. **Switch to "DSL Console" tab**
2. **Select an index**
3. **Enter your query**:
   ```json
   {
     "query": {
       "match": {
         "field_name": "search_value"
       }
     },
     "size": 50
   }
   ```
4. **Click "Execute Query"**
5. **View results with metrics**

### Example 6: Save a Query

1. **Write a query** in DSL Console
2. **Click "Save Query"**
3. **Enter name**: "My Custom Search"
4. **Add description** (optional)
5. **Click "Save"**

### Example 7: Load Saved Query

1. **Click "Saved" button** (top right)
2. **Click on any saved query**
3. **Query loads automatically**
4. **Click "Execute Query"**

### Example 8: View Query History

1. **Click "History" button** (top right)
2. **Browse past queries**
3. **Click any query to reload it**
4. **Execute again if needed**

---

## 🎯 Common Use Cases

### Find Recent Documents
```json
{
  "query": { "match_all": {} },
  "sort": [{ "timestamp": { "order": "desc" } }],
  "size": 20
}
```

### Search with Date Range
```json
{
  "query": {
    "range": {
      "timestamp": {
        "gte": "2024-01-01",
        "lte": "2024-12-31"
      }
    }
  }
}
```

### Count by Category (Aggregation)
```json
{
  "size": 0,
  "aggs": {
    "categories": {
      "terms": {
        "field": "category.keyword",
        "size": 10
      }
    }
  }
}
```

### Complex Boolean Query
```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "status": "active" } }
      ],
      "should": [
        { "term": { "priority": "high" } }
      ],
      "must_not": [
        { "term": { "archived": true } }
      ]
    }
  }
}
```

---

## 💡 Pro Tips

### Data Browser
- **Empty search** = Get all documents
- **Adjust page size** for better performance
- **Use filters** to narrow results before export
- **Export limit**: 10,000 documents max

### DSL Console
- **Start simple** and build complexity gradually
- **Save queries** you use frequently
- **Check history** to avoid rewriting queries
- **Watch execution time** for optimization opportunities

### Performance
- **Use filters** instead of queries when possible
- **Limit result size** with `size` parameter
- **Add time ranges** to reduce dataset
- **Use aggregations** instead of retrieving all docs

---

## ⚠️ Important Notes

1. **Admin Only**: This feature requires admin role
2. **Query Validation**: Ensure JSON is valid before executing
3. **Auto-Save History**: All queries automatically saved for 30 days
4. **Export Limits**: CSV/JSON exports capped at 10,000 documents
5. **Performance**: Large result sets may take longer to process

---

## 🆘 Need Help?

### Query Not Working?
- ✅ Check JSON syntax
- ✅ Verify field names in index mapping
- ✅ Ensure index name is correct
- ✅ Review Elasticsearch error message

### No Results?
- ✅ Try simpler query (match_all)
- ✅ Check if index has data
- ✅ Verify filter values are correct
- ✅ Remove restrictive filters

### Export Failed?
- ✅ Ensure search returned results
- ✅ Check browser download permissions
- ✅ Try smaller result set first

---

## 📚 Learn More

- Full documentation: `ELASTICSEARCH_QUERY_SEARCH_FEATURE.md`
- Elasticsearch Query DSL: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
- Search API: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html

---

**Happy Querying! 🎉**
