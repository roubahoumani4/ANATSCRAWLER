# Data Management Dashboard 💾

The **Data Management** page provides comprehensive tools for managing your Elasticsearch data lifecycle, including Index Lifecycle Management (ILM), Snapshot & Restore operations, and automated Data Purging capabilities.

## Features Overview

### 1. Index Lifecycle Management (ILM) ⏰

Automate index lifecycle transitions through hot, warm, cold, frozen, and delete phases.

#### Key Capabilities:
- **Define Lifecycle Policies**: Create custom policies for different data tiers
- **Automated Rollover**: Automatically roll over indices based on age, size, or document count
- **Automated Deletion**: Remove old data based on age
- **Shrinking**: Reduce shard count for older data
- **Storage Tier Transitions**: Move data between hot, warm, cold, and frozen tiers
- **Force Merge**: Optimize segment count for better query performance

#### Common ILM Policy Example:

```json
{
  "hot": {
    "actions": {
      "rollover": {
        "max_age": "7d",
        "max_size": "50gb",
        "max_docs": 10000000
      },
      "set_priority": {
        "priority": 100
      }
    }
  },
  "warm": {
    "min_age": "7d",
    "actions": {
      "shrink": {
        "number_of_shards": 1
      },
      "forcemerge": {
        "max_num_segments": 1
      },
      "allocate": {
        "number_of_replicas": 1
      },
      "set_priority": {
        "priority": 50
      }
    }
  },
  "cold": {
    "min_age": "30d",
    "actions": {
      "allocate": {
        "number_of_replicas": 0
      },
      "set_priority": {
        "priority": 0
      }
    }
  },
  "delete": {
    "min_age": "90d",
    "actions": {
      "delete": {}
    }
  }
}
```

#### Creating an ILM Policy:

1. Navigate to **Index Management** → **Data Management**
2. Click on **Index Lifecycle** tab
3. Click **Create Policy**
4. Enter a policy name (e.g., `logs-policy`)
5. Define phases and actions in JSON format
6. Click **Create Policy**

#### Policy Phases Explained:

**Hot Phase** 🔥
- Active data being written and frequently queried
- Stored on fastest hardware
- Actions: rollover, set_priority

**Warm Phase** 🌡️
- Data queried less frequently
- Read-only operations
- Actions: shrink, forcemerge, allocate

**Cold Phase** ❄️
- Infrequently accessed data
- Minimal replicas for cost savings
- Actions: allocate, readonly, set_priority

**Frozen Phase** 🧊
- Rarely accessed data
- Mounted as searchable snapshots
- Actions: searchable_snapshot

**Delete Phase** 🗑️
- Permanently delete old data
- Actions: delete

---

### 2. Snapshot & Restore 💾

Create backups of your indices and restore them when needed.

#### Key Capabilities:
- **Create Index Snapshots**: Full or partial index backups
- **Restore from Snapshots**: Recover data from any snapshot
- **Scheduled Backup Policies**: Automate regular backups
- **Snapshot Repository Management**: Configure multiple backup locations
- **Incremental Snapshots**: Efficient storage with only changed data

#### Setting Up a Snapshot Repository:

Before creating snapshots, you need to configure a repository. This is typically done via Elasticsearch configuration:

```bash
# File System Repository
PUT /_snapshot/my_backup
{
  "type": "fs",
  "settings": {
    "location": "/mount/backups/my_backup"
  }
}

# S3 Repository
PUT /_snapshot/s3_backup
{
  "type": "s3",
  "settings": {
    "bucket": "my-elasticsearch-snapshots",
    "region": "us-east-1",
    "base_path": "elasticsearch/snapshots"
  }
}
```

#### Creating a Snapshot:

1. Navigate to **Data Management** → **Snapshot & Restore**
2. Select a repository
3. Click **Create Snapshot**
4. Enter snapshot name (e.g., `snapshot-2025-01-01`)
5. Specify indices to backup (or leave empty for all)
6. Click **Create**

#### Restoring a Snapshot:

1. Navigate to **Data Management** → **Snapshot & Restore**
2. Select the repository containing your snapshot
3. Find the snapshot you want to restore
4. Click **Restore**
5. Confirm the restoration

**Note**: Restoring will create indices with the same names. If indices already exist, you may need to:
- Close the existing indices first
- Use rename patterns during restore
- Delete the existing indices

#### Snapshot Best Practices:

✅ **Regular Backups**: Schedule daily or weekly snapshots
✅ **Retention Policy**: Keep snapshots for 30-90 days based on compliance needs
✅ **Test Restores**: Regularly test snapshot restoration
✅ **Multiple Repositories**: Use different storage locations for redundancy
✅ **Monitor Storage**: Ensure adequate space in backup location

---

### 3. Data Purging 🗑️

Automatically remove old data to manage storage costs and comply with retention policies.

#### Key Capabilities:
- **Delete Documents by Query**: Remove specific documents matching criteria
- **Date-based Data Retention**: Automatically delete data older than X days
- **Scheduled Purge Jobs**: Automate regular data cleanup
- **Preview Before Deletion**: See what will be deleted before executing

#### Preview Data Purge:

1. Navigate to **Data Management** → **Data Purging**
2. Click **New Purge Job**
3. Enter:
   - **Index Pattern**: `logs-*` (indices to purge)
   - **Date Field**: `@timestamp` (field to check age)
   - **Retention Days**: `30` (keep last 30 days)
4. Click **Preview**
5. Review the number of documents to be deleted
6. Click **Execute Purge** to proceed

#### Understanding Purge Preview:

The preview shows:
- **Documents to Delete**: Total count of documents older than retention period
- **Affected Indices**: List of indices that will be modified
- **Cutoff Date**: Documents older than this date will be deleted

#### Manual Purge vs Scheduled Jobs:

**Manual Purge**:
- One-time data deletion
- Useful for ad-hoc cleanup
- Immediate execution

**Scheduled Jobs** (Coming Soon):
- Automated regular cleanup
- Cron-style scheduling
- Continuous compliance with retention policies

#### Purge Safety Features:

⚠️ **Preview Required**: Always preview before executing
⚠️ **Irreversible**: Deleted data cannot be recovered (unless you have snapshots)
⚠️ **Conflict Handling**: Continues on version conflicts
⚠️ **Async Execution**: Large purges run in background

---

## API Endpoints

### ILM Endpoints

```bash
# Get all ILM policies
GET /api/v1/admin/elasticsearch/data/ilm/policies

# Create ILM policy
POST /api/v1/admin/elasticsearch/data/ilm/policies
{
  "name": "my-policy",
  "phases": { ... }
}

# Delete ILM policy
DELETE /api/v1/admin/elasticsearch/data/ilm/policies/:policyName

# Apply policy to index
POST /api/v1/admin/elasticsearch/data/ilm/apply
{
  "indexName": "logs-2025.01.01",
  "policyName": "logs-policy"
}
```

### Snapshot Endpoints

```bash
# List repositories
GET /api/v1/admin/elasticsearch/data/snapshot/repositories

# Create repository
POST /api/v1/admin/elasticsearch/data/snapshot/repository
{
  "name": "my_backup",
  "type": "fs",
  "settings": { ... }
}

# List snapshots in repository
GET /api/v1/admin/elasticsearch/data/snapshot/list/:repository

# Create snapshot
POST /api/v1/admin/elasticsearch/data/snapshot/create
{
  "repository": "my_backup",
  "snapshot": "snapshot-2025-01-01",
  "indices": ["index1", "index2"]
}

# Restore snapshot
POST /api/v1/admin/elasticsearch/data/snapshot/restore
{
  "repository": "my_backup",
  "snapshot": "snapshot-2025-01-01"
}

# Delete snapshot
DELETE /api/v1/admin/elasticsearch/data/snapshot/delete/:repository/:snapshot

# Get snapshot status
GET /api/v1/admin/elasticsearch/data/snapshot/status/:repository/:snapshot
```

### Purge Endpoints

```bash
# Preview purge
POST /api/v1/admin/elasticsearch/data/purge/preview
{
  "indexPattern": "logs-*",
  "dateField": "@timestamp",
  "retentionDays": 30
}

# Execute purge
POST /api/v1/admin/elasticsearch/data/purge/execute
{
  "indexPattern": "logs-*",
  "dateField": "@timestamp",
  "retentionDays": 30
}

# List scheduled purge jobs
GET /api/v1/admin/elasticsearch/data/purge/jobs

# Create purge job
POST /api/v1/admin/elasticsearch/data/purge/job
{
  "indexPattern": "logs-*",
  "dateField": "@timestamp",
  "retentionDays": 30,
  "schedule": "0 0 * * *"
}

# Delete purge job
DELETE /api/v1/admin/elasticsearch/data/purge/job/:jobId
```

---

## Use Cases

### Use Case 1: Log Management with ILM

**Scenario**: You have application logs that need to be:
- Actively searchable for 7 days
- Archived for 30 days
- Deleted after 90 days

**Solution**:
1. Create an ILM policy with hot (7d), warm (30d), and delete (90d) phases
2. Apply the policy to your log indices
3. Elasticsearch automatically manages the lifecycle

### Use Case 2: Compliance Snapshots

**Scenario**: Regulatory requirements mandate keeping data for 7 years

**Solution**:
1. Set up a snapshot repository (preferably S3 for durability)
2. Create daily snapshots
3. Set up snapshot retention policy to keep snapshots for 7 years
4. Regularly test restoration to ensure compliance

### Use Case 3: Cost Optimization

**Scenario**: Reduce storage costs while maintaining data accessibility

**Solution**:
1. Use ILM to move old data to cold tier (cheaper storage)
2. Use shrink action to reduce shard count
3. Use force merge to optimize segments
4. Delete very old data that's no longer needed
5. Use snapshot archives for rarely accessed historical data

### Use Case 4: GDPR/Privacy Compliance

**Scenario**: Delete user data on request

**Solution**:
1. Use Data Purging with custom queries to delete specific user data
2. Preview before deletion to ensure accuracy
3. Execute purge across all relevant indices
4. Verify deletion with search queries

---

## Best Practices

### ILM Best Practices

1. **Start with Hot Phase**: Always begin with a hot phase for active data
2. **Use Rollover**: Prevents indices from becoming too large
3. **Optimize Before Cold**: Use forcemerge in warm phase before moving to cold
4. **Set Priorities**: Higher priority for hot data ensures faster recovery
5. **Test Policies**: Apply to test indices before production

### Snapshot Best Practices

1. **Regular Schedule**: Daily snapshots for critical data
2. **Verify Repositories**: Ensure backup storage has sufficient space
3. **Test Restores**: Monthly restoration tests
4. **Multiple Locations**: Use different repositories for disaster recovery
5. **Monitor Status**: Check snapshot success/failure regularly
6. **Incremental Backups**: Elasticsearch automatically handles this

### Purge Best Practices

1. **Always Preview**: Never execute purge without previewing
2. **Backup First**: Create snapshot before large purges
3. **Off-Peak Hours**: Schedule purges during low-traffic periods
4. **Gradual Deletion**: For very large datasets, purge in smaller batches
5. **Monitor Tasks**: Large purges run asynchronously; monitor task API
6. **Document Retention**: Maintain clear data retention policies

---

## Troubleshooting

### ILM Issues

**Problem**: Policy not applying to indices
- **Solution**: Ensure index template includes `index.lifecycle.name` setting
- Check ILM is enabled: `GET _cluster/settings`

**Problem**: Indices stuck in a phase
- **Solution**: Check `GET /<index>/_ilm/explain` for errors
- Verify cluster has necessary resources for actions

### Snapshot Issues

**Problem**: Snapshot creation fails
- **Solution**: Check repository accessibility
- Verify path.repo setting in elasticsearch.yml
- Ensure sufficient disk space

**Problem**: Restoration overwrites existing indices
- **Solution**: Use rename_pattern and rename_replacement
- Close or delete existing indices first
- Restore to different cluster

### Purge Issues

**Problem**: Purge running slowly
- **Solution**: Use smaller batch sizes
- Run during off-peak hours
- Consider using ILM delete phase instead for ongoing retention

**Problem**: Accidental deletion
- **Solution**: Restore from snapshot (if available)
- Implement mandatory preview step
- Require secondary approval for large purges

---

## Quick Start Guide

### 1. Set Up ILM for Logs (5 minutes)

```bash
# Create ILM policy
curl -X POST "${API_URL}/api/v1/admin/elasticsearch/data/ilm/policies" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "logs-policy",
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "7d",
            "max_size": "50gb"
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }'
```

### 2. Create Your First Snapshot (3 minutes)

1. Navigate to **Data Management** → **Snapshot & Restore**
2. Select an existing repository (or configure one via Elasticsearch)
3. Click **Create Snapshot**
4. Name it `manual-backup-$(date +%Y%m%d)`
5. Click **Create**

### 3. Purge Old Data (2 minutes)

1. Navigate to **Data Management** → **Data Purging**
2. Click **New Purge Job**
3. Enter:
   - Index Pattern: `logs-*`
   - Date Field: `@timestamp`
   - Retention Days: `30`
4. Click **Preview**
5. Review and **Execute Purge**

---

## Security Considerations

⚠️ **Admin Only**: All data management features require admin role
⚠️ **Audit Logging**: All operations are logged for compliance
⚠️ **Irreversible Actions**: Deletions cannot be undone without snapshots
⚠️ **Access Control**: Ensure proper Elasticsearch security settings
⚠️ **Backup Encryption**: Use encrypted snapshot repositories for sensitive data

---

## Performance Tips

### ILM Performance
- Use rollover to prevent oversized indices
- Force merge in warm phase for better query performance
- Set appropriate priorities for resource allocation

### Snapshot Performance
- Incremental snapshots are faster than full snapshots
- Use SSD storage for snapshot repositories when possible
- Avoid snapshots during peak query times

### Purge Performance
- Use date-based index names for easier deletion
- Delete entire indices instead of documents when possible
- Run purges during low-traffic periods
- Monitor task API for progress on large purges

---

## Next Steps

- ✅ Configure ILM policies for your indices
- ✅ Set up snapshot repositories for disaster recovery
- ✅ Define data retention policies
- ✅ Schedule regular backups
- ✅ Test snapshot restoration process
- ✅ Implement automated data purging

For more information, consult the [Elasticsearch ILM documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html) and [Snapshot/Restore documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/snapshot-restore.html).
