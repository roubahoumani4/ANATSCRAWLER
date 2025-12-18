# Elasticsearch Index Management Feature

## Overview
A comprehensive Elasticsearch Index Management system has been added to the ANAT Security platform. This feature is **admin-only** and provides powerful tools to monitor, manage, and maintain Elasticsearch indices in real-time.

## Features

### 🎯 Main Features

#### 1. **Index Management Dashboard**
- View all Elasticsearch indices in a clean, organized table
- Real-time auto-refresh (5-second intervals, toggleable)
- Search and filter indices by name
- Health status indicators (Green/Yellow/Red)
- Live document counts and size metrics
- Shard information (Primary/Replica)

#### 2. **Cluster Health Monitoring**
- Real-time cluster status overview
- Node count and data node tracking
- Active shards monitoring
- Shard health percentage
- Unassigned shards alerts

#### 3. **Index Operations**
- **Create Index**: Create new indices with validation
  - Lowercase name validation
  - Special character restrictions (only `-` and `_` allowed)
  - Default shard and replica configuration
  
- **Delete Index**: Remove indices with confirmation
  - System index protection (`.` prefix)
  - Confirmation modal to prevent accidents
  
- **Refresh Index**: Force index refresh for immediate visibility
  - Real-time data synchronization
  
- **View Details**: Comprehensive index information
  - Statistics tab with document counts and size
  - Mapping tab showing field mappings (JSON)
  - Settings tab displaying index configuration (JSON)

#### 4. **Live Monitoring**
- Auto-refresh toggle for real-time updates
- Visual health status indicators
- Dynamic document count tracking
- Storage size monitoring
- Shard distribution overview

## Implementation Details

### Backend Components

#### 1. **Elasticsearch Service** (`server/services/elasticsearch.service.ts`)
- Comprehensive Elasticsearch API wrapper
- Methods:
  - `getAllIndices()` - Fetch all indices
  - `getIndexStats(indexName)` - Detailed index statistics
  - `createIndex(indexName, settings)` - Create new index
  - `deleteIndex(indexName)` - Delete index
  - `getClusterHealth()` - Cluster health metrics
  - `getIndexMapping(indexName)` - Get index field mappings
  - `getIndexSettings(indexName)` - Get index configuration
  - `refreshIndex(indexName)` - Force index refresh
  - `checkConnection()` - Verify Elasticsearch connectivity

#### 2. **Admin Routes** (`server/routes/admin/elasticsearch.routes.ts`)
- Admin-only API endpoints:
  - `GET /api/v1/admin/elasticsearch/indices` - List all indices
  - `GET /api/v1/admin/elasticsearch/indices/:indexName/stats` - Index stats
  - `GET /api/v1/admin/elasticsearch/cluster/health` - Cluster health
  - `POST /api/v1/admin/elasticsearch/indices` - Create index
  - `DELETE /api/v1/admin/elasticsearch/indices/:indexName` - Delete index
  - `GET /api/v1/admin/elasticsearch/indices/:indexName/mapping` - Get mapping
  - `GET /api/v1/admin/elasticsearch/indices/:indexName/settings` - Get settings
  - `POST /api/v1/admin/elasticsearch/indices/:indexName/refresh` - Refresh index
  - `GET /api/v1/admin/elasticsearch/connection` - Check connection

#### 3. **Route Registration** (`server/routes/index.ts`)
- Registered elasticsearch routes with authentication
- Admin role validation middleware

### Frontend Components

#### 1. **Index Management Page** (`client/src/pages/IndexManagementPage.tsx`)
- Main dashboard for index management
- Features:
  - Cluster health cards
  - Index list table with sorting
  - Search functionality
  - Create/Delete modals
  - Auto-refresh toggle
  - Real-time updates via React Query

#### 2. **Index Details Page** (`client/src/pages/IndexDetailsPage.tsx`)
- Detailed view for individual indices
- Tabbed interface:
  - Statistics: Document counts, size, shards
  - Mapping: Field mappings in JSON format
  - Settings: Index configuration in JSON format
- Auto-refresh for live stats

#### 3. **Sidebar Integration** (`client/src/components/layout/Sidebar.tsx`)
- Added "Index Management" section (admin-only)
- Database icon for visual identification
- Submenu with "Manage Indices" option
- Positioned after "User Management"

#### 4. **Routing** (`client/src/AppContent.tsx`)
- Protected admin routes:
  - `/index/management` - Main index management page
  - `/index/details/:indexName` - Index details page
- AdminRoute wrapper for access control

## Access Control

### Admin-Only Access
✅ Only users with `admin` role can access this feature  
✅ Middleware validates admin role on every request  
✅ Frontend routes protected with `AdminRoute` component  
✅ Sidebar menu item hidden for non-admin users  

### Security Features
- System index protection (prevents deletion of `.` prefixed indices)
- Input validation for index names
- Confirmation dialogs for destructive operations
- Role-based access control at route and API level

## Visual Design

### Color Scheme
- **Health Status Colors**:
  - 🟢 Green: Healthy index
  - 🟡 Yellow: Warning state
  - 🔴 Red: Critical state
  - ⚪ Gray: Unknown/Unavailable

### UI Elements
- Gradient headers (Cyan to Purple)
- Matrix background (consistent with platform theme)
- Dark mode compatible
- Responsive grid layouts
- Real-time status indicators
- Animated loading states

## Usage Guide

### For Administrators

#### Creating an Index
1. Navigate to **Index Management** from sidebar
2. Click **Create Index** button
3. Enter index name (lowercase, use `-` or `_` only)
4. Click **Create**
5. Index appears in the list immediately

#### Viewing Index Details
1. Click the **eye icon** (👁️) next to any index
2. View statistics, mapping, and settings tabs
3. Monitor real-time document counts

#### Deleting an Index
1. Click the **trash icon** (🗑️) next to the index
2. Confirm deletion in the modal
3. Index is permanently removed

#### Refreshing an Index
1. Click the **refresh icon** (🔄) next to the index
2. Index is refreshed for immediate data visibility

#### Monitoring Cluster Health
- Check the cluster health cards at the top
- Monitor active shards and node count
- View unassigned shards for issues

## API Endpoints

### Public Endpoints (Admin Authentication Required)

```
GET    /api/v1/admin/elasticsearch/indices
GET    /api/v1/admin/elasticsearch/indices/:indexName/stats
GET    /api/v1/admin/elasticsearch/indices/:indexName/mapping
GET    /api/v1/admin/elasticsearch/indices/:indexName/settings
GET    /api/v1/admin/elasticsearch/cluster/health
GET    /api/v1/admin/elasticsearch/connection
POST   /api/v1/admin/elasticsearch/indices
POST   /api/v1/admin/elasticsearch/indices/:indexName/refresh
DELETE /api/v1/admin/elasticsearch/indices/:indexName
```

## Data Flow

```
User (Admin) 
  ↓
Sidebar → Index Management
  ↓
React Query (5s auto-refresh)
  ↓
API Routes (/api/v1/admin/elasticsearch/*)
  ↓
Admin Middleware (requireAdmin)
  ↓
Elasticsearch Service
  ↓
Elasticsearch Cluster
```

## Configuration

### Environment Variables
- `ELASTICSEARCH_URL`: Elasticsearch connection URL (default: `http://192.168.1.110:9200`)

### Default Settings
- Auto-refresh interval: 5 seconds
- Number of shards: 1 (for new indices)
- Number of replicas: 1 (for new indices)

## Benefits

1. **Real-Time Monitoring**: See index changes as they happen
2. **Centralized Management**: All index operations in one place
3. **Safety Features**: Confirmations and validations prevent errors
4. **Performance Insights**: Track document counts and storage
5. **Debugging Tools**: View mappings and settings for troubleshooting
6. **Admin Control**: Powerful tools for system administrators

## Screenshots Features

### Index Management Dashboard
- Cluster health overview (4 cards)
- Index list with health indicators
- Search bar for filtering
- Action buttons (Refresh, View, Delete)
- Create index button

### Index Details Page
- Header with index name and health status
- Statistics overview (4 cards)
- Tabbed interface (Stats/Mapping/Settings)
- JSON viewers for technical details
- Back navigation

## Future Enhancements (Potential)

- Index alias management
- Bulk operations
- Index templates
- Performance metrics graphs
- Search query testing
- Document browser
- Index optimization tools
- Backup/Restore functionality
- Index lifecycle policies

## Notes

- This feature follows the same design patterns as User Management
- Admin-only access ensures security
- Real-time updates provide immediate feedback
- Matrix background maintains platform consistency
- Responsive design works on all screen sizes

---

**Created**: December 18, 2025  
**Version**: 1.0.0  
**Status**: ✅ Implemented and Ready to Use
