# Elasticsearch Query & Search Feature

## 🎯 Overview
A powerful Query & Search interface has been added to the ANAT Security platform's Index Management section. This feature provides advanced Elasticsearch querying capabilities with two distinct modes: **Data Browser** for simple searches and **DSL Console** for advanced queries.

---

## ✨ Features

### 📝 **Data Browser**
Simple, user-friendly interface for browsing and searching documents:

- **Full-Text Search**: Search across all fields in an index
- **Field Filtering**: Filter results by specific field values
- **Pagination**: Configurable page sizes (10, 25, 50, 100 per page)
- **Export Options**: Download results as JSON or CSV
- **Real-time Stats**: View result count and query execution time
- **Score Display**: See relevance scores for search results

### 🔍 **DSL Console**
Advanced interface for Elasticsearch DSL queries:

- **Syntax Highlighted Editor**: Write custom Elasticsearch queries in JSON
- **Query Execution**: Run complex DSL queries with aggregations
- **Performance Metrics**: View execution time and Elasticsearch processing time
- **Save Queries**: Store frequently used queries for future use
- **Query History**: Access previously executed queries
- **Result Visualization**: Pretty-printed JSON results with full response details

### 💾 **Query Management**

#### Saved Queries
- Create named queries with descriptions
- Organize queries by index
- Quick load from saved queries panel
- Delete unwanted saved queries

#### Query History
- Automatic tracking of all executed queries
- Timestamp and performance data
- Result count for each query
- Auto-deletion after 30 days (configurable)
- Click to reload any historical query

---

## 🚀 Usage Guide

### Data Browser Mode

1. **Select an Index**
   - Choose from dropdown showing all available indices
   - Document count displayed for each index

2. **Search Documents**
   - Enter search terms in the search box
   - Select optional field filter
   - Choose page size
   - Click "Search" button

3. **Export Results**
   - Click "JSON" to download results as JSON file
   - Click "CSV" to download as CSV spreadsheet
   - Exports up to 10,000 documents

4. **Navigate Results**
   - Use pagination controls to browse pages
   - View document ID and relevance score
   - See full document source in formatted JSON

### DSL Console Mode

1. **Write Query**
   ```json
   {
     "query": {
       "bool": {
         "must": [
           { "match": { "field_name": "search_term" } }
         ],
         "filter": [
           { "range": { "timestamp": { "gte": "2024-01-01" } } }
         ]
       }
     },
     "size": 100,
     "sort": [
       { "timestamp": { "order": "desc" } }
     ]
   }
   ```

2. **Execute Query**
   - Click "Execute Query" button
   - View results with performance metrics
   - Analyze aggregations if included

3. **Save Query**
   - Click "Save Query" button
   - Enter name and optional description
   - Query saved for future use

4. **Access History**
   - Click "History" button to view past queries
   - Click any query to reload it
   - See execution time and result counts

---

## 🔧 Technical Implementation

### Backend Routes

All routes require admin authentication:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/elasticsearch/query/search` | Search documents with pagination |
| POST | `/api/v1/admin/elasticsearch/query/execute` | Execute custom DSL query |
| GET | `/api/v1/admin/elasticsearch/query/fields/:indexName` | Get all fields from index |
| POST | `/api/v1/admin/elasticsearch/query/count` | Count matching documents |
| GET | `/api/v1/admin/elasticsearch/query/history` | Get query history |
| DELETE | `/api/v1/admin/elasticsearch/query/history/:id` | Delete history item |
| POST | `/api/v1/admin/elasticsearch/query/save` | Save a query |
| GET | `/api/v1/admin/elasticsearch/query/saved` | Get saved queries |
| DELETE | `/api/v1/admin/elasticsearch/query/saved/:id` | Delete saved query |
| POST | `/api/v1/admin/elasticsearch/query/export` | Export results to JSON/CSV |

### Database Models

#### SavedQuery
```typescript
{
  userId: ObjectId,           // User who saved the query
  name: string,               // Query name
  description?: string,       // Optional description
  indexName: string,          // Target index
  query: object,              // DSL query object
  createdAt: Date,
  updatedAt: Date
}
```

#### QueryHistory
```typescript
{
  userId: ObjectId,           // User who executed query
  indexName: string,          // Target index
  query: object,              // DSL query executed
  executionTime: number,      // Time in milliseconds
  resultCount: number,        // Number of results
  timestamp: Date             // When executed
}
```

### Service Methods

New methods in `elasticsearch.service.ts`:

- `searchDocuments()`: Search with pagination and filters
- `executeQuery()`: Execute custom DSL queries
- `getIndexFields()`: Extract all field names from mapping
- `countDocuments()`: Count documents matching a query

---

## 📊 Example Queries

### Basic Match All
```json
{
  "query": {
    "match_all": {}
  }
}
```

### Full-Text Search
```json
{
  "query": {
    "multi_match": {
      "query": "security threat",
      "fields": ["title", "description", "content"],
      "type": "best_fields"
    }
  }
}
```

### Boolean Query with Filters
```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "status": "active" } }
      ],
      "filter": [
        { "range": { "severity": { "gte": 5 } } }
      ],
      "must_not": [
        { "term": { "archived": true } }
      ]
    }
  }
}
```

### Aggregation Query
```json
{
  "query": { "match_all": {} },
  "size": 0,
  "aggs": {
    "severity_distribution": {
      "terms": {
        "field": "severity",
        "size": 10
      }
    }
  }
}
```

### Range Query
```json
{
  "query": {
    "range": {
      "timestamp": {
        "gte": "2024-01-01",
        "lte": "2024-12-31"
      }
    }
  },
  "sort": [
    { "timestamp": { "order": "desc" } }
  ]
}
```

---

## 🎨 UI Components

### Main Page
- **Location**: `/index/query`
- **Component**: `IndexQueryPage.tsx`
- **Access**: Admin users only

### Features
- Matrix background animation
- Gradient headers
- Responsive design
- Modal panels for history and saved queries
- Syntax-highlighted JSON editor
- Real-time query metrics

---

## 🔐 Security

- **Admin Only**: All endpoints require admin role
- **User Isolation**: Saved queries and history are per-user
- **Query Validation**: JSON validation before execution
- **Rate Limiting**: Consider adding for production
- **Input Sanitization**: Queries executed safely via Elasticsearch client

---

## 🚦 Access

### Navigation
1. Login as admin user
2. Sidebar → "Index Management"
3. Click "Query & Search"

### Direct URL
```
https://your-domain.com/index/query
```

---

## 📈 Performance Metrics

Displayed for each query:
- **Result Count**: Total matching documents
- **Elasticsearch Time**: Time taken by Elasticsearch
- **Execution Time**: Total request processing time
- **Max Score**: Highest relevance score

---

## 💡 Tips & Best Practices

### For Data Browser
- Use filters to narrow results before exporting
- Adjust page size based on document complexity
- Export limits to 10,000 documents for performance

### For DSL Console
- Start with simple queries and build complexity
- Save frequently used queries
- Use aggregations for analytics
- Monitor execution times

### Query Optimization
- Use filters instead of queries when possible
- Limit field selection with `_source` filtering
- Use pagination for large result sets
- Consider using `search_after` for deep pagination

---

## 🔄 Future Enhancements

Potential additions:
- Query templates library
- Visual query builder
- Real-time query suggestions
- Query sharing between users
- Scheduled query execution
- Email query results
- Advanced result visualization
- Query comparison tool

---

## 🐛 Troubleshooting

### Common Issues

**No indices showing**
- Ensure Elasticsearch is running
- Check index permissions
- Verify admin role assigned

**Query execution errors**
- Validate JSON syntax
- Check field names exist in mapping
- Verify query type compatibility

**Export not working**
- Check browser download settings
- Ensure result set not empty
- Verify sufficient disk space

---

## 📝 Changelog

### Version 1.0.0 (Initial Release)
- Data Browser with full-text search
- DSL Console with syntax highlighting
- Query history tracking
- Saved queries feature
- JSON/CSV export functionality
- Real-time performance metrics
- Field-based filtering
- Pagination support

---

## 🎓 Learning Resources

- [Elasticsearch Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)
- [Search API Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html)
- [Aggregations Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html)

---

**Built with ❤️ for ANAT Security Platform**
