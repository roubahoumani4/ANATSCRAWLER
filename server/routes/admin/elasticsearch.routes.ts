import type { Request, Response } from 'express';
import { Router } from 'express';
import { elasticsearchService } from '../../services/elasticsearch.service';
import { logAdminAction } from '../../utils/adminLogger';

const router = Router();

// Middleware to check admin role
function requireAdmin(req: Request, res: Response, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  // Check if user has admin role
  if (!req.user.roles || !req.user.roles.includes('admin')) {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  next();
}

/**
 * GET /api/v1/admin/elasticsearch/indices
 * Get all Elasticsearch indices
 */
router.get('/indices', requireAdmin, async (req: Request, res: Response) => {
  try {
    const indices = await elasticsearchService.getAllIndices();
    res.json({
      success: true,
      indices,
    });
  } catch (error: any) {
    console.error('Error fetching indices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch indices',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/indices/:indexName/stats
 * Get detailed stats for a specific index
 */
router.get('/indices/:indexName/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName } = req.params;
    const stats = await elasticsearchService.getIndexStats(indexName);
    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error(`Error fetching stats for index ${req.params.indexName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch index stats',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/cluster/health
 * Get Elasticsearch cluster health
 */
router.get('/cluster/health', requireAdmin, async (req: Request, res: Response) => {
  try {
    const health = await elasticsearchService.getClusterHealth();
    res.json({
      success: true,
      health,
    });
  } catch (error: any) {
    console.error('Error fetching cluster health:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch cluster health',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/indices
 * Create a new index
 */
router.post('/indices', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName, settings } = req.body;

    if (!indexName) {
      return res.status(400).json({
        success: false,
        error: 'Index name is required',
      });
    }

    // Validate index name (lowercase, no special characters except - and _)
    const indexNameRegex = /^[a-z0-9_-]+$/;
    if (!indexNameRegex.test(indexName)) {
      await logAdminAction({
        req,
        action: 'create_index_failed',
        category: 'index',
        resource: indexName,
        status: 'error',
        details: { reason: 'Invalid index name format' }
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid index name. Use only lowercase letters, numbers, hyphens, and underscores.',
      });
    }

    await elasticsearchService.createIndex(indexName, settings);
    
    // Log successful creation
    await logAdminAction({
      req,
      action: 'create_index',
      category: 'index',
      resource: indexName,
      status: 'success',
      details: { indexName, settings }
    });
    
    res.json({
      success: true,
      message: `Index '${indexName}' created successfully`,
    });
  } catch (error: any) {
    console.error('Error creating index:', error);
    
    // Log failed creation
    await logAdminAction({
      req,
      action: 'create_index_failed',
      category: 'index',
      resource: req.body.indexName || 'unknown',
      status: 'error',
      details: { error: error.message }
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create index',
    });
  }
});

/**
 * DELETE /api/v1/admin/elasticsearch/indices/:indexName
 * Delete an index
 */
router.delete('/indices/:indexName', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName } = req.params;

    // Prevent deletion of system indices
    if (indexName.startsWith('.')) {
      await logAdminAction({
        req,
        action: 'delete_index_failed',
        category: 'index',
        resource: indexName,
        status: 'error',
        details: { reason: 'Cannot delete system indices' }
      });
      
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system indices',
      });
    }

    await elasticsearchService.deleteIndex(indexName);
    
    // Log successful deletion
    await logAdminAction({
      req,
      action: 'delete_index',
      category: 'index',
      resource: indexName,
      status: 'success',
      details: { indexName }
    });
    
    res.json({
      success: true,
      message: `Index '${indexName}' deleted successfully`,
    });
  } catch (error: any) {
    console.error(`Error deleting index ${req.params.indexName}:`, error);
    
    // Log failed deletion
    await logAdminAction({
      req,
      action: 'delete_index_failed',
      category: 'index',
      resource: req.params.indexName,
      status: 'error',
      details: { error: error.message }
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete index',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/indices/:indexName/mapping
 * Get index mapping
 */
router.get('/indices/:indexName/mapping', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName } = req.params;
    const mapping = await elasticsearchService.getIndexMapping(indexName);
    res.json({
      success: true,
      mapping,
    });
  } catch (error: any) {
    console.error(`Error fetching mapping for index ${req.params.indexName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch index mapping',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/indices/:indexName/settings
 * Get index settings
 */
router.get('/indices/:indexName/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName } = req.params;
    const settings = await elasticsearchService.getIndexSettings(indexName);
    res.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error(`Error fetching settings for index ${req.params.indexName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch index settings',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/indices/:indexName/refresh
 * Refresh an index
 */
router.post('/indices/:indexName/refresh', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName } = req.params;
    await elasticsearchService.refreshIndex(indexName);
    res.json({
      success: true,
      message: `Index '${indexName}' refreshed successfully`,
    });
  } catch (error: any) {
    console.error(`Error refreshing index ${req.params.indexName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to refresh index',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/connection
 * Check Elasticsearch connection status
 */
router.get('/connection', requireAdmin, async (req: Request, res: Response) => {
  try {
    const isConnected = await elasticsearchService.checkConnection();
    res.json({
      success: true,
      connected: isConnected,
    });
  } catch (error: any) {
    console.error('Error checking Elasticsearch connection:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check connection',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/indices/bulk-delete
 * Bulk delete multiple indices
 */
router.post('/indices/bulk-delete', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexNames } = req.body;

    if (!indexNames || !Array.isArray(indexNames) || indexNames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Index names array is required',
      });
    }

    const result = await elasticsearchService.bulkDeleteIndices(indexNames);

    res.json({
      success: true,
      result,
      message: `Deleted ${result.success.length} indices, ${result.failed.length} failed`,
    });
  } catch (error: any) {
    console.error('Error bulk deleting indices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk delete indices',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/indices/bulk-refresh
 * Bulk refresh multiple indices
 */
router.post('/indices/bulk-refresh', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexNames } = req.body;

    if (!indexNames || !Array.isArray(indexNames) || indexNames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Index names array is required',
      });
    }

    const result = await elasticsearchService.bulkRefreshIndices(indexNames);

    res.json({
      success: true,
      result,
      message: `Refreshed ${result.success.length} indices, ${result.failed.length} failed`,
    });
  } catch (error: any) {
    console.error('Error bulk refreshing indices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk refresh indices',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/aliases
 * Get all aliases
 */
router.get('/aliases', requireAdmin, async (req: Request, res: Response) => {
  try {
    const aliases = await elasticsearchService.getAllAliases();
    res.json({
      success: true,
      aliases,
    });
  } catch (error: any) {
    console.error('Error fetching aliases:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch aliases',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/indices/:indexName/aliases
 * Get aliases for a specific index
 */
router.get('/indices/:indexName/aliases', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName } = req.params;
    const aliases = await elasticsearchService.getIndexAliases(indexName);
    res.json({
      success: true,
      aliases,
    });
  } catch (error: any) {
    console.error('Error fetching index aliases:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch index aliases',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/aliases
 * Create an alias
 */
router.post('/aliases', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName, aliasName } = req.body;

    if (!indexName || !aliasName) {
      return res.status(400).json({
        success: false,
        error: 'Index name and alias name are required',
      });
    }

    await elasticsearchService.createAlias(indexName, aliasName);

    res.json({
      success: true,
      message: `Alias '${aliasName}' created for index '${indexName}'`,
    });
  } catch (error: any) {
    console.error('Error creating alias:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create alias',
    });
  }
});

/**
 * DELETE /api/v1/admin/elasticsearch/aliases
 * Delete an alias
 */
router.delete('/aliases', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName, aliasName } = req.body;

    if (!indexName || !aliasName) {
      return res.status(400).json({
        success: false,
        error: 'Index name and alias name are required',
      });
    }

    await elasticsearchService.deleteAlias(indexName, aliasName);

    res.json({
      success: true,
      message: `Alias '${aliasName}' deleted from index '${indexName}'`,
    });
  } catch (error: any) {
    console.error('Error deleting alias:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete alias',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/aliases/swap
 * Atomic alias swap
 */
router.post('/aliases/swap', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { oldIndex, newIndex, aliasName } = req.body;

    if (!oldIndex || !newIndex || !aliasName) {
      return res.status(400).json({
        success: false,
        error: 'Old index, new index, and alias name are required',
      });
    }

    await elasticsearchService.swapAlias(oldIndex, newIndex, aliasName);

    res.json({
      success: true,
      message: `Alias '${aliasName}' swapped from '${oldIndex}' to '${newIndex}'`,
    });
  } catch (error: any) {
    console.error('Error swapping alias:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to swap alias',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/indices/reindex
 * Reindex from one index to another
 */
router.post('/indices/reindex', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { sourceIndex, destIndex, waitForCompletion = false } = req.body;

    if (!sourceIndex || !destIndex) {
      return res.status(400).json({
        success: false,
        error: 'Source index and destination index are required',
      });
    }

    const result = await elasticsearchService.reindex(sourceIndex, destIndex, waitForCompletion);

    res.json({
      success: true,
      result,
      message: waitForCompletion 
        ? `Reindexing completed: ${result.created} documents created`
        : `Reindexing started. Task ID: ${result.task}`,
    });
  } catch (error: any) {
    console.error('Error reindexing:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reindex',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/tasks/:taskId
 * Get task status
 */
router.get('/tasks/:taskId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const status = await elasticsearchService.getTaskStatus(taskId);

    res.json({
      success: true,
      status,
    });
  } catch (error: any) {
    console.error('Error fetching task status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch task status',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/indices/clone
 * Clone an index
 */
router.post('/indices/clone', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { sourceIndex, targetIndex, includeData = false } = req.body;

    if (!sourceIndex || !targetIndex) {
      return res.status(400).json({
        success: false,
        error: 'Source index and target index are required',
      });
    }

    await elasticsearchService.cloneIndex(sourceIndex, targetIndex, includeData);

    res.json({
      success: true,
      message: `Index '${sourceIndex}' cloned to '${targetIndex}' ${includeData ? 'with data' : '(structure only)'}`,
    });
  } catch (error: any) {
    console.error('Error cloning index:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clone index',
    });
  }
});

export default router;
