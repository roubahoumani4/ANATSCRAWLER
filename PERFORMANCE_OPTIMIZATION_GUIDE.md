# Performance & Optimization Dashboard

## Overview
The Performance & Optimization page is a comprehensive dashboard for monitoring and optimizing your Elasticsearch cluster's performance. It provides three main sections with powerful tools for index optimization, performance analysis, and shard management.

## Features

### 🎯 Index Optimization Dashboard

#### Segment Merging Status
- **Real-time segment monitoring**: View the number of segments per index and shard
- **Segment memory tracking**: Monitor memory usage by segments
- **Committed/Searchable status**: Check which segments are committed and searchable
- **Force merge operations**: Manually trigger segment merging to optimize storage
  - Configurable max segments count
  - Background execution to avoid blocking
  - Reduces fragmentation and improves search performance

#### Cache Statistics & Management
- **Cache hit rate monitoring**: Track query cache, request cache, and fielddata cache effectiveness
- **Memory usage visualization**: See how much memory each cache type is consuming
- **Cache clearing**: Clear specific cache types (query, request, fielddata) or all caches
- **Performance charts**: Visual representation of cache hits vs misses

#### Memory Usage Per Index
- **Per-index memory breakdown**: Detailed memory usage statistics for each index
- **Pie chart visualization**: Easy-to-understand visual representation of memory distribution
- **Memory types tracked**:
  - Segment memory
  - Query cache memory
  - Field data memory
  - Total memory usage

### 📈 Performance Analyzer

#### Query Performance Metrics
- **Average execution time**: Track query performance over time
- **Min/Max execution time**: Identify performance outliers
- **Query count tracking**: Monitor query volume
- **Time-series charts**: Visualize performance trends with interactive line charts
- **Configurable time ranges**:
  - Last 15 minutes
  - Last hour
  - Last 24 hours
  - Last 7 days
  - Last 30 days

#### Slow Query Logs
- **Query identification**: Automatically detect slow-running queries
- **Execution time highlighting**: Color-coded based on severity
  - Green: < 2 seconds
  - Yellow: 2-5 seconds
  - Red: > 5 seconds
- **Full query details**: View complete DSL query for analysis
- **Timestamp tracking**: Know exactly when slow queries occurred

#### Bottleneck Identification
- **High Latency Detection**: Identify queries taking longer than expected
- **Memory Pressure Alerts**: Detect high memory usage issues
- **Cache Efficiency Analysis**: Monitor low cache hit rates
- **Shard Balance Issues**: Identify uneven shard distribution

### 🧩 Shard Management

#### Shard Allocation Viewer
- **Comprehensive shard listing**: View all shards across your cluster
- **Shard details**:
  - Index name
  - Shard number
  - Type (Primary/Replica)
  - State (STARTED, RELOCATING, etc.)
  - Document count
  - Size
  - Node assignment
- **Real-time refresh**: Update shard information on demand

#### Reroute Shards Manually
- **Manual shard relocation**: Move shards between nodes
- **Node selection**: Specify source and target nodes
- **State-aware operations**: Only reroute when appropriate
- **Cluster rebalancing**: Help distribute load evenly

#### Shard Size Distribution
- **Visual bar chart**: Compare shard sizes across indices
- **Document count tracking**: See how data is distributed
- **Top 15 shards**: Focus on the largest shards
- **Balance analysis**: Identify oversized shards

#### Hot/Warm/Cold Tier Management
- **Three-tier architecture**:
  - **Hot Tier**: Active, frequently accessed data
  - **Warm Tier**: Less frequently accessed data
  - **Cold Tier**: Infrequently accessed, archived data
- **Per-tier statistics**:
  - Number of indices
  - Total shard count
  - Total storage size
  - Index listing
- **Visual tier indicators**: Color-coded displays
  - Red: Hot tier
  - Yellow: Warm tier
  - Blue: Cold tier

## API Endpoints

### Index Optimization
- `GET /api/v1/admin/elasticsearch/performance/optimization` - Get optimization statistics
- `GET /api/v1/admin/elasticsearch/performance/segments/:indexName?` - Get segment information
- `POST /api/v1/admin/elasticsearch/performance/force-merge` - Initiate force merge
- `POST /api/v1/admin/elasticsearch/performance/clear-cache` - Clear index caches

### Performance Analysis
- `GET /api/v1/admin/elasticsearch/performance/query-metrics` - Get query performance metrics
- `GET /api/v1/admin/elasticsearch/performance/slow-queries` - Get slow query logs

### Shard Management
- `GET /api/v1/admin/elasticsearch/performance/shards` - Get shard information
- `POST /api/v1/admin/elasticsearch/performance/reroute-shard` - Manually reroute a shard
- `GET /api/v1/admin/elasticsearch/performance/tiers` - Get tier information

## Usage Guide

### Accessing the Dashboard
1. Navigate to **Index Management** in the sidebar
2. Click on **Performance & Optimization**
3. You'll see three tabs at the top: Index Optimization, Performance Analyzer, and Shard Management

### Optimizing Indices

#### Force Merging Segments
1. Go to the **Index Optimization** tab
2. Select an index from the dropdown
3. Review the segment information in the table
4. Click **Force Merge** button
5. Enter the desired max segments (default: 1)
6. The operation will run in the background

**When to use:**
- After bulk indexing operations
- When you see many small segments (> 10 per shard)
- To improve search performance
- Before making an index read-only

**Caution:** Force merge is resource-intensive. Run during low-traffic periods.

#### Managing Caches
1. Select an index
2. Choose the cache type to clear (query, request, or fielddata)
3. Click **Clear Cache**
4. Monitor the cache hit rate improvements

**When to clear caches:**
- After major index updates
- When experiencing memory pressure
- To force fresh data loading
- During troubleshooting

### Analyzing Performance

#### Monitoring Query Performance
1. Go to the **Performance Analyzer** tab
2. Select a time range from the dropdown
3. Review the performance metrics chart
4. Look for:
   - Increasing average execution times
   - Large gaps between min and max times
   - Sudden spikes in execution time

#### Identifying Slow Queries
1. Check the Slow Query Logs section
2. Review queries with red or yellow highlighting
3. Click on a query to see full details
4. Consider:
   - Adding appropriate indices
   - Optimizing query structure
   - Adjusting shard allocation

### Managing Shards

#### Viewing Shard Distribution
1. Go to the **Shard Management** tab
2. Review the shard allocation table
3. Look for:
   - Uneven distribution across nodes
   - RELOCATING or failed shards
   - Oversized shards

#### Manually Rerouting Shards
1. Find the shard you want to move
2. Click the **Reroute** button
3. Enter the target node name
4. Confirm the operation
5. Monitor the shard state until it's STARTED

**Use cases:**
- Balancing load across nodes
- Moving shards off an overloaded node
- Preparing for node maintenance
- Optimizing data locality

#### Managing Data Tiers
1. Review the Hot/Warm/Cold tier cards
2. Check which indices are in each tier
3. Verify appropriate tier placement
4. Consider moving indices between tiers based on:
   - Access patterns
   - Data age
   - Storage costs
   - Performance requirements

## Best Practices

### Regular Monitoring
- Check cache hit rates weekly
- Review slow query logs daily
- Monitor shard distribution monthly
- Track segment counts after bulk operations

### Optimization Schedule
- Force merge read-only indices
- Clear caches during maintenance windows
- Rebalance shards during low-traffic periods
- Move indices to appropriate tiers quarterly

### Performance Tuning
1. **Identify bottlenecks** using the Performance Analyzer
2. **Optimize queries** based on slow query logs
3. **Balance shards** to distribute load evenly
4. **Manage memory** by clearing unused caches
5. **Merge segments** to reduce fragmentation

### Capacity Planning
- Monitor memory usage trends
- Track shard size growth
- Plan tier migrations based on data lifecycle
- Scale nodes before reaching capacity limits

## Troubleshooting

### High Memory Usage
1. Check Memory Usage Per Index chart
2. Clear unnecessary caches
3. Force merge indices with many segments
4. Consider increasing node memory or adding nodes

### Slow Queries
1. Review Slow Query Logs
2. Check for missing indices
3. Analyze query structure
4. Consider adding replicas for read-heavy workloads

### Unbalanced Shards
1. Review Shard Allocation Viewer
2. Identify overloaded nodes
3. Manually reroute shards to balance load
4. Check cluster allocation settings

### Cache Inefficiency
1. Monitor cache hit rates
2. Increase cache size if hit rate is low
3. Review query patterns
4. Consider query optimization

## Security

All endpoints require:
- **Authentication**: Valid user session
- **Authorization**: Admin role
- **Rate limiting**: Applied to prevent abuse

## Future Enhancements

Planned features:
- Automated shard rebalancing
- Performance alerting and notifications
- Historical trend analysis
- Custom metric dashboards
- Query optimization suggestions
- Automated tier migration policies

## Support

For issues or questions:
1. Check the slow query logs first
2. Review Elasticsearch cluster logs
3. Consult the bottleneck identification section
4. Contact your system administrator

---

**Note:** This feature requires Elasticsearch cluster access and admin privileges. Use optimization operations carefully as they can impact cluster performance.
