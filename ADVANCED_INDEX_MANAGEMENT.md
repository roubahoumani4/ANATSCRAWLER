# Advanced Index Management Features

## 🚀 New Features Added

We've enhanced the Index Management page with powerful advanced operations for managing Elasticsearch indices at scale.

---

## ✨ Features Overview

### 1. **Bulk Operations** ⚡

Perform operations on multiple indices simultaneously.

#### Features:
- **Bulk Mode Toggle**: Enable/disable bulk selection mode
- **Multi-Select Indices**: Check/uncheck individual indices
- **Select/Deselect All**: Quick selection controls
- **Bulk Delete**: Delete multiple indices at once
- **Bulk Refresh**: Refresh multiple indices simultaneously

#### Usage:
1. Click "Bulk Operations" button in header
2. Select indices using checkboxes
3. Click "Select All" or manually check indices
4. Choose "Refresh Selected" or "Delete Selected"
5. Confirm action

**Protection**: System indices (starting with `.`) cannot be selected for bulk operations.

---

### 2. **Index Aliases Management** 🔗

Create and manage index aliases for flexible indexing strategies.

#### Features:
- **Create Aliases**: Point alias to an index
- **Delete Aliases**: Remove alias associations
- **View All Aliases**: See all configured aliases
- **Alias Swapping**: Atomic alias swaps for zero-downtime reindexing

#### Usage:

**Create an Alias:**
1. Click "Manage Aliases" button
2. Select "Create" action
3. Choose index from dropdown
4. Enter alias name
5. Click "Create Alias"

**Delete an Alias:**
1. Click "Manage Aliases" button
2. Select "Delete" action
3. Choose index and alias name
4. Click "Delete Alias"

**View All Aliases:**
1. Click "View All Aliases" button
2. Browse list of all configured aliases
3. See index-to-alias mappings

#### Use Cases:
- **Zero-downtime deployments**: Swap aliases to new indices
- **Versioned indices**: `logs-v1`, `logs-v2` → `logs` alias
- **Read/Write splits**: Different aliases for reading vs writing
- **Multi-tenant**: Alias per customer pointing to shared index

---

### 3. **Index Reindexing** 🔄

Copy data from one index to another with progress tracking.

#### Features:
- **Background Reindexing**: Non-blocking operation
- **Progress Tracking**: Real-time percentage progress
- **Task Monitoring**: Track reindex task status
- **Auto-refresh**: Automatic progress updates

#### Usage:
1. Click "Reindex" button
2. Select source index
3. Select destination index (must exist)
4. Click "Start Reindex"
5. Monitor progress bar
6. Wait for completion notification

#### Use Cases:
- **Data migration**: Move data to new index structure
- **Index optimization**: Reindex to apply new mappings
- **Data consolidation**: Merge multiple indices
- **Version upgrades**: Migrate to new Elasticsearch version

**Important**: Destination index must exist before reindexing!

---

### 4. **Index Cloning** 📋

Duplicate index structure or data.

#### Features:
- **Structure-Only Clone**: Copy mappings and settings
- **Full Clone**: Copy structure AND documents
- **Custom Target Name**: Specify new index name
- **Validation**: Automatic name format checking

#### Usage:
1. Click "Clone Index" button
2. Select source index from dropdown
3. Enter target index name
4. Toggle "Include data" checkbox if needed
5. Click "Clone Index"

**Structure-Only Clone**: Perfect for creating test indices
**With Data**: Creates exact replica with all documents

#### Use Cases:
- **Testing**: Create test index with production structure
- **Backups**: Snapshot index at specific point
- **Development**: Clone production index for dev environment
- **Experimentation**: Try different configurations

---

## 🎯 API Endpoints

### Bulk Operations
```
POST /api/v1/admin/elasticsearch/indices/bulk-delete
POST /api/v1/admin/elasticsearch/indices/bulk-refresh
```

### Alias Management
```
GET    /api/v1/admin/elasticsearch/aliases
GET    /api/v1/admin/elasticsearch/indices/:indexName/aliases
POST   /api/v1/admin/elasticsearch/aliases
DELETE /api/v1/admin/elasticsearch/aliases
POST   /api/v1/admin/elasticsearch/aliases/swap
```

### Reindexing
```
POST /api/v1/admin/elasticsearch/indices/reindex
GET  /api/v1/admin/elasticsearch/tasks/:taskId
```

### Cloning
```
POST /api/v1/admin/elasticsearch/indices/clone
```

---

## 💡 Best Practices

### Bulk Operations
- ✅ Review selected indices before bulk delete
- ✅ Use bulk refresh after large data imports
- ⚠️ Avoid deleting production indices in bulk
- ⚠️ System indices are protected automatically

### Alias Management
- ✅ Use aliases for production indices
- ✅ Implement blue-green deployments with aliases
- ✅ Create versioned indices (v1, v2) with stable alias
- ⚠️ Don't point multiple write aliases to same index

### Reindexing
- ✅ Create destination index before reindexing
- ✅ Monitor progress for large indices
- ✅ Use during off-peak hours for production
- ⚠️ Ensure sufficient disk space
- ⚠️ Consider index.max_result_window settings

### Cloning
- ✅ Clone structure-only for testing
- ✅ Include data for backups
- ✅ Use meaningful target names
- ⚠️ Cloning large indices can be slow
- ⚠️ Ensure cluster has capacity for duplicated data

---

## 🎨 UI Components

### Bulk Mode Toolbar
- Purple-themed selection interface
- Selected count display
- Quick select/deselect controls
- Action buttons (Refresh/Delete)

### Advanced Operations Bar
- Blue "Clone Index" button
- Green "Reindex" button
- Yellow "Manage Aliases" button
- Purple "View All Aliases" button

### Modals
- **Clone Modal**: Source/target selection with data toggle
- **Reindex Modal**: Source/dest with progress bar
- **Alias Modal**: Create/delete with index selection
- **Alias List Modal**: View all configured aliases

---

## 🔧 Technical Details

### Backend Service Methods

```typescript
// Bulk operations
bulkDeleteIndices(indexNames: string[]): Promise<{success: string[], failed: string[]}>
bulkRefreshIndices(indexNames: string[]): Promise<{success: string[], failed: string[]}>

// Alias management
createAlias(indexName: string, aliasName: string): Promise<boolean>
deleteAlias(indexName: string, aliasName: string): Promise<boolean>
getAllAliases(): Promise<any>
getIndexAliases(indexName: string): Promise<string[]>
swapAlias(oldIndex: string, newIndex: string, aliasName: string): Promise<boolean>

// Reindexing
reindex(sourceIndex: string, destIndex: string, waitForCompletion: boolean): Promise<any>
getTaskStatus(taskId: string): Promise<any>

// Cloning
cloneIndex(sourceIndex: string, targetIndex: string, includeData: boolean): Promise<boolean>
createIndexFromTemplate(indexName: string, templateSettings: any): Promise<boolean>
```

---

## 📊 Example Workflows

### Zero-Downtime Reindexing
```
1. Create new index: logs-v2
2. Reindex: logs-v1 → logs-v2
3. Monitor progress
4. Swap alias: logs (logs-v1 → logs-v2)
5. Delete old index: logs-v1
```

### Bulk Index Cleanup
```
1. Enable Bulk Mode
2. Select old/unused indices
3. Review selection
4. Bulk Delete
5. Confirm action
```

### Development Environment Setup
```
1. Clone production index (structure only)
2. Create alias for dev environment
3. Populate with test data
4. Run tests against cloned index
```

---

## ⚠️ Important Notes

### Reindexing
- Destination index must exist before reindexing
- Progress tracking polls every 1 second
- Large indices may take significant time
- Task continues even if you close the modal

### Aliases
- Aliases cannot have same name as existing indices
- Multiple aliases can point to same index
- Atomic swaps prevent downtime
- Aliases don't consume extra storage

### Cloning
- Structure-only clones are instant
- Data cloning time depends on index size
- Cloned index is independent (not linked)
- Customize settings during clone if needed

### Bulk Operations
- Operations process sequentially
- Partial success possible (some may fail)
- Failed indices reported in result
- No undo for bulk delete!

---

## 🚀 Quick Start Examples

### Example 1: Create Versioned Indices with Alias
```
1. Create index: products-v1
2. Manage Aliases → Create
3. Index: products-v1, Alias: products
4. App uses "products" alias
5. Later: Create products-v2, swap alias
```

### Example 2: Clone for Testing
```
1. Clone Index → Select production-data
2. Target: test-data
3. Uncheck "Include data"
4. Clone → Use for testing
```

### Example 3: Bulk Refresh After Import
```
1. Import data to multiple indices
2. Enable Bulk Mode
3. Select imported indices
4. Bulk Refresh → Make data searchable
```

---

## 📈 Performance Considerations

### Reindexing
- **Small indices (<1GB)**: Seconds to minutes
- **Medium indices (1-10GB)**: Minutes to hours
- **Large indices (>10GB)**: Hours to days

### Cloning
- **Structure only**: < 1 second
- **With data**: Same as reindex time

### Bulk Operations
- **Refresh**: Seconds per index
- **Delete**: Seconds per index
- Sequential processing may take time for many indices

---

**Built with ❤️ for ANAT Security Platform**

Enhanced Index Management - Version 2.0
