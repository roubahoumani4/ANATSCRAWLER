import type { Request, Response } from 'express';
import { Router } from 'express';
import axios from 'axios';
import { ELASTICSEARCH_URI } from '../../config';

const router = Router();

// Middleware to check admin role
function requireAdmin(req: Request, res: Response, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (!req.user.roles || !req.user.roles.includes('admin')) {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  next();
}

// ============================================================================
// INDEX LIFECYCLE MANAGEMENT (ILM)
// ============================================================================

/**
 * GET /api/v1/admin/elasticsearch/data/ilm/policies
 * Get all ILM policies
 */
router.get('/ilm/policies', requireAdmin, async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${ELASTICSEARCH_URI}/_ilm/policy`);
    
    const policies = Object.entries(response.data).map(([name, policy]: [string, any]) => ({
      name,
      phases: policy.policy?.phases || {},
      modified_date: policy.modified_date,
      version: policy.version,
    }));

    res.json({ success: true, policies });
  } catch (error: any) {
    console.error('Error fetching ILM policies:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch ILM policies',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/data/ilm/policies
 * Create a new ILM policy
 */
router.post('/ilm/policies', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, phases } = req.body;

    if (!name || !phases) {
      return res.status(400).json({ error: 'Policy name and phases are required' });
    }

    const policy = {
      policy: {
        phases,
      },
    };

    await axios.put(`${ELASTICSEARCH_URI}/_ilm/policy/${name}`, policy);

    res.json({ 
      success: true, 
      message: `ILM policy '${name}' created successfully`,
      policy: { name, phases },
    });
  } catch (error: any) {
    console.error('Error creating ILM policy:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create ILM policy',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * DELETE /api/v1/admin/elasticsearch/data/ilm/policies/:policyName
 * Delete an ILM policy
 */
router.delete('/ilm/policies/:policyName', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { policyName } = req.params;

    await axios.delete(`${ELASTICSEARCH_URI}/_ilm/policy/${policyName}`);

    res.json({ 
      success: true, 
      message: `ILM policy '${policyName}' deleted successfully` 
    });
  } catch (error: any) {
    console.error('Error deleting ILM policy:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to delete ILM policy',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/data/ilm/apply
 * Apply ILM policy to an index
 */
router.post('/ilm/apply', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName, policyName } = req.body;

    if (!indexName || !policyName) {
      return res.status(400).json({ error: 'Index name and policy name are required' });
    }

    await axios.put(`${ELASTICSEARCH_URI}/${indexName}/_settings`, {
      index: {
        lifecycle: {
          name: policyName,
        },
      },
    });

    res.json({ 
      success: true, 
      message: `ILM policy '${policyName}' applied to index '${indexName}'` 
    });
  } catch (error: any) {
    console.error('Error applying ILM policy:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to apply ILM policy',
      details: error.response?.data || error.message 
    });
  }
});

// ============================================================================
// SNAPSHOT & RESTORE
// ============================================================================

/**
 * GET /api/v1/admin/elasticsearch/data/snapshot/repositories
 * Get all snapshot repositories
 */
router.get('/snapshot/repositories', requireAdmin, async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${ELASTICSEARCH_URI}/_snapshot/_all`);
    
    const repositories = Object.entries(response.data).map(([name, repo]: [string, any]) => ({
      name,
      type: repo.type,
      settings: repo.settings,
    }));

    res.json({ success: true, repositories });
  } catch (error: any) {
    console.error('Error fetching snapshot repositories:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch snapshot repositories',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/data/snapshot/repository
 * Create a snapshot repository
 */
router.post('/snapshot/repository', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, type, settings } = req.body;

    if (!name || !type || !settings) {
      return res.status(400).json({ error: 'Repository name, type, and settings are required' });
    }

    await axios.put(`${ELASTICSEARCH_URI}/_snapshot/${name}`, {
      type,
      settings,
    });

    res.json({ 
      success: true, 
      message: `Snapshot repository '${name}' created successfully` 
    });
  } catch (error: any) {
    console.error('Error creating snapshot repository:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create snapshot repository',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/data/snapshot/list/:repository
 * List all snapshots in a repository
 */
router.get('/snapshot/list/:repository', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { repository } = req.params;

    const response = await axios.get(`${ELASTICSEARCH_URI}/_snapshot/${repository}/_all`);

    res.json({ 
      success: true, 
      snapshots: response.data.snapshots || [] 
    });
  } catch (error: any) {
    console.error('Error listing snapshots:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to list snapshots',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/data/snapshot/create
 * Create a new snapshot
 */
router.post('/snapshot/create', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { repository, snapshot, indices } = req.body;

    if (!repository || !snapshot) {
      return res.status(400).json({ error: 'Repository and snapshot name are required' });
    }

    const body: any = {
      indices: indices && indices.length > 0 ? indices.join(',') : '*',
      ignore_unavailable: true,
      include_global_state: false,
    };

    await axios.put(
      `${ELASTICSEARCH_URI}/_snapshot/${repository}/${snapshot}?wait_for_completion=false`,
      body
    );

    res.json({ 
      success: true, 
      message: `Snapshot '${snapshot}' creation initiated in repository '${repository}'` 
    });
  } catch (error: any) {
    console.error('Error creating snapshot:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create snapshot',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/data/snapshot/restore
 * Restore a snapshot
 */
router.post('/snapshot/restore', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { repository, snapshot, indices, renamePattern, renameReplacement } = req.body;

    if (!repository || !snapshot) {
      return res.status(400).json({ error: 'Repository and snapshot name are required' });
    }

    const body: any = {
      indices: indices && indices.length > 0 ? indices.join(',') : '*',
      ignore_unavailable: true,
      include_global_state: false,
    };

    if (renamePattern && renameReplacement) {
      body.rename_pattern = renamePattern;
      body.rename_replacement = renameReplacement;
    }

    await axios.post(
      `${ELASTICSEARCH_URI}/_snapshot/${repository}/${snapshot}/_restore`,
      body
    );

    res.json({ 
      success: true, 
      message: `Snapshot '${snapshot}' restoration initiated from repository '${repository}'` 
    });
  } catch (error: any) {
    console.error('Error restoring snapshot:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to restore snapshot',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * DELETE /api/v1/admin/elasticsearch/data/snapshot/delete/:repository/:snapshot
 * Delete a snapshot
 */
router.delete('/snapshot/delete/:repository/:snapshot', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { repository, snapshot } = req.params;

    await axios.delete(`${ELASTICSEARCH_URI}/_snapshot/${repository}/${snapshot}`);

    res.json({ 
      success: true, 
      message: `Snapshot '${snapshot}' deleted from repository '${repository}'` 
    });
  } catch (error: any) {
    console.error('Error deleting snapshot:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to delete snapshot',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/data/snapshot/status/:repository/:snapshot
 * Get snapshot status
 */
router.get('/snapshot/status/:repository/:snapshot', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { repository, snapshot } = req.params;

    const response = await axios.get(`${ELASTICSEARCH_URI}/_snapshot/${repository}/${snapshot}/_status`);

    res.json({ 
      success: true, 
      status: response.data.snapshots?.[0] || {} 
    });
  } catch (error: any) {
    console.error('Error getting snapshot status:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get snapshot status',
      details: error.response?.data || error.message 
    });
  }
});

// ============================================================================
// DATA PURGING
// ============================================================================

/**
 * POST /api/v1/admin/elasticsearch/data/purge/preview
 * Preview documents to be deleted
 */
router.post('/purge/preview', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexPattern, dateField, retentionDays } = req.body;

    if (!indexPattern || !dateField || retentionDays === undefined) {
      return res.status(400).json({ 
        error: 'Index pattern, date field, and retention days are required' 
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Count documents to be deleted
    const countResponse = await axios.post(
      `${ELASTICSEARCH_URI}/${indexPattern}/_count`,
      {
        query: {
          range: {
            [dateField]: {
              lt: cutoffDate.toISOString(),
            },
          },
        },
      }
    );

    // Get list of affected indices
    const indicesResponse = await axios.get(`${ELASTICSEARCH_URI}/${indexPattern}`);
    const affectedIndices = Object.keys(indicesResponse.data);

    res.json({
      success: true,
      documentsToDelete: countResponse.data.count,
      affectedIndices,
      cutoffDate: cutoffDate.toISOString(),
      indexPattern,
      dateField,
      retentionDays,
    });
  } catch (error: any) {
    console.error('Error previewing purge:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to preview purge',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/data/purge/execute
 * Execute data purge
 */
router.post('/purge/execute', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexPattern, dateField, retentionDays } = req.body;

    if (!indexPattern || !dateField || retentionDays === undefined) {
      return res.status(400).json({ 
        error: 'Index pattern, date field, and retention days are required' 
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Delete documents by query
    const deleteResponse = await axios.post(
      `${ELASTICSEARCH_URI}/${indexPattern}/_delete_by_query?wait_for_completion=false&conflicts=proceed`,
      {
        query: {
          range: {
            [dateField]: {
              lt: cutoffDate.toISOString(),
            },
          },
        },
      }
    );

    res.json({
      success: true,
      message: 'Data purge initiated',
      taskId: deleteResponse.data.task,
      details: deleteResponse.data,
    });
  } catch (error: any) {
    console.error('Error executing purge:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to execute purge',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/data/purge/jobs
 * Get all scheduled purge jobs (mock implementation)
 * Note: This is a placeholder. In production, you would store these in a database
 * and use a job scheduler like node-cron
 */
router.get('/purge/jobs', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Mock data - in production, fetch from database
    const jobs = [
      {
        id: 'purge-1',
        indexPattern: 'logs-*',
        dateField: '@timestamp',
        retentionDays: 30,
        schedule: '0 0 * * *', // Daily at midnight
        enabled: true,
        lastRun: new Date(Date.now() - 86400000).toISOString(),
        nextRun: new Date(Date.now() + 86400000).toISOString(),
      },
    ];

    res.json({ success: true, jobs });
  } catch (error: any) {
    console.error('Error fetching purge jobs:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch purge jobs',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/data/purge/job
 * Create a scheduled purge job
 */
router.post('/purge/job', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexPattern, dateField, retentionDays, schedule } = req.body;

    if (!indexPattern || !dateField || !retentionDays || !schedule) {
      return res.status(400).json({ 
        error: 'Index pattern, date field, retention days, and schedule are required' 
      });
    }

    // In production, save to database and register with job scheduler
    const job = {
      id: `purge-${Date.now()}`,
      indexPattern,
      dateField,
      retentionDays,
      schedule,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: 'Purge job created successfully',
      job,
    });
  } catch (error: any) {
    console.error('Error creating purge job:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create purge job',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * DELETE /api/v1/admin/elasticsearch/data/purge/job/:jobId
 * Delete a scheduled purge job
 */
router.delete('/purge/job/:jobId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    // In production, delete from database and unregister from job scheduler

    res.json({
      success: true,
      message: `Purge job '${jobId}' deleted successfully`,
    });
  } catch (error: any) {
    console.error('Error deleting purge job:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to delete purge job',
      details: error.response?.data || error.message 
    });
  }
});

export default router;
