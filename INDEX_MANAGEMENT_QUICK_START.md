# Index Management - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Admin role assigned to your user account
- Elasticsearch cluster running and accessible
- ANAT Security platform running

### Access the Feature

1. **Login** with admin credentials
2. Look for **"Index Management"** in the sidebar (admin users only)
3. Click on **"Manage Indices"** submenu item

## 📊 Dashboard Overview

### Cluster Health Cards
At the top of the page, you'll see 4 cards:

1. **Cluster Status** - Overall health (Green/Yellow/Red)
2. **Nodes** - Total nodes and data nodes
3. **Active Shards** - Total active shards and primary shards
4. **Shard Health** - Percentage of active shards and unassigned count

### Index List Table
Columns displayed:
- **Index Name** - Name of the index
- **Health** - Health status (Green/Yellow/Red)
- **Status** - Open/Closed
- **Documents** - Total document count (and deleted count)
- **Size** - Storage size
- **Shards (P/R)** - Primary/Replica shard counts
- **Actions** - Refresh, View, Delete buttons

## 🔧 Common Operations

### Create a New Index

```
1. Click "Create Index" button (top right)
2. Enter index name (e.g., "my-new-index")
   - Use lowercase only
   - Use hyphens (-) or underscores (_) only
   - No spaces or special characters
3. Click "Create"
4. Index appears in the list immediately
```

**Example Valid Names:**
- `user-data`
- `application_logs`
- `system-metrics-2025`

**Invalid Names:**
- `User-Data` (uppercase)
- `user data` (space)
- `user@data` (special character)

### View Index Details

```
1. Find your index in the list
2. Click the eye icon (👁️) in the Actions column
3. Explore the tabs:
   - Statistics: Document counts, size, shard info
   - Mapping: Field mappings and data types
   - Settings: Index configuration
```

### Refresh an Index

```
1. Find your index in the list
2. Click the refresh icon (🔄) in the Actions column
3. Index is refreshed for immediate data visibility
```

**When to use:** After bulk data imports or when documents aren't showing up in searches.

### Delete an Index

```
1. Find your index in the list
2. Click the trash icon (🗑️) in the Actions column
3. Confirm deletion in the modal
4. Index is permanently removed
```

⚠️ **Warning:** This action cannot be undone! System indices (starting with `.`) are protected.

## 🔍 Search and Filter

Use the search bar to filter indices:
```
Type: "user" → Shows only indices containing "user" in the name
```

## 🔄 Auto-Refresh

Toggle auto-refresh (top right):
- **ON** (Green): Updates every 5 seconds
- **OFF** (Gray): Manual refresh only

**Recommended:** Keep ON for monitoring active indexing operations.

## 📈 Monitoring Tips

### Check Cluster Health
- **Green**: All good ✅
- **Yellow**: Some replica shards unassigned ⚠️
- **Red**: Some primary shards unassigned 🚨

### Monitor Index Health
Each index shows its own health status:
- **Green**: Fully operational
- **Yellow**: Degraded but functional
- **Red**: Critical, may have data loss

### Track Document Growth
- Watch the "Documents" column
- Enable auto-refresh to see real-time indexing
- Check "deleted" count for cleanup needs

### Storage Management
- Monitor "Size" column
- Large indices may need optimization
- Consider index lifecycle policies

## 🎯 Best Practices

### Naming Conventions
```
✅ Good:
- application-logs-2025-12
- user-profiles
- transaction_data

❌ Avoid:
- MyIndex (uppercase)
- temp index (spaces)
- test@123 (special chars)
```

### Index Creation
- Plan shard count based on data size
- Use descriptive names
- Follow consistent naming patterns
- Document index purposes

### Regular Monitoring
- Check cluster health daily
- Monitor index growth trends
- Review unassigned shards
- Clean up unused indices

### Safety
- Always confirm before deleting
- Never delete system indices (`.` prefix)
- Test in development first
- Keep backups of critical indices

## 🆘 Troubleshooting

### Index Health is Yellow
**Cause:** Replica shards not assigned  
**Solution:** Check node count, may need more nodes for replicas

### Index Health is Red
**Cause:** Primary shards not assigned  
**Solution:** Critical! Check Elasticsearch logs, may have lost data

### Documents Not Appearing
**Cause:** Index needs refresh  
**Solution:** Click refresh icon or wait for auto-refresh

### Cannot Delete Index
**Cause:** System index protection  
**Solution:** System indices (`.` prefix) cannot be deleted via UI

### Connection Error
**Cause:** Elasticsearch unreachable  
**Solution:** Check Elasticsearch service status and network connectivity

## 📱 Keyboard Shortcuts

While the feature is focused:
- `Ctrl+F` / `Cmd+F` - Focus search bar
- `Esc` - Close modals

## 🎨 Visual Indicators

### Colors
- **Cyan/Purple Gradient** - Headers and primary actions
- **Green** - Healthy status
- **Yellow** - Warning status
- **Red** - Critical status
- **Blue** - Information/refresh actions
- **Gray** - Inactive/disabled

### Icons
- 🗄️ Database - Index/cluster
- 🔄 Refresh - Update data
- 👁️ Eye - View details
- 🗑️ Trash - Delete
- 📊 Chart - Statistics
- ⚙️ Gear - Settings
- 💾 Code - Mappings

## 📚 Related Documentation

- `INDEX_MANAGEMENT_IMPLEMENTATION.md` - Full technical documentation
- Elasticsearch documentation - [elastic.co](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- ANAT Security User Guide - User management and admin features

## 🔐 Security

- **Admin Only**: Feature visible only to admin users
- **Role Validation**: Every API call validates admin role
- **Protected Routes**: Frontend routes require admin authentication
- **Audit Trail**: All operations logged (via activity logs)

## 💡 Tips & Tricks

1. **Use Auto-Refresh** when actively indexing data
2. **Turn Off Auto-Refresh** when analyzing large index lists (performance)
3. **Search by Pattern** to group related indices
4. **Check Mapping** before schema changes
5. **Monitor Shard Count** for performance optimization
6. **Regular Cleanup** of test/temporary indices

---

**Need Help?** Contact your system administrator or refer to the full documentation.

**Feature Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** December 18, 2025
