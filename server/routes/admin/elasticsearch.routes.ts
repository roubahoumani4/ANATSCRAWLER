import type { Request, Response } from 'express';
import { Router } from 'express';
import { elasticsearchService } from '../../services/elasticsearch.service';

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
      return res.status(400).json({
        success: false,
        error: 'Invalid index name. Use only lowercase letters, numbers, hyphens, and underscores.',
      });
    }

    await elasticsearchService.createIndex(indexName, settings);
    
    res.json({
      success: true,
      message: `Index '${indexName}' created successfully`,
    });
  } catch (error: any) {
    console.error('Error creating index:', error);
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
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system indices',
      });
    }

    await elasticsearchService.deleteIndex(indexName);
    
    res.json({
      success: true,
      message: `Index '${indexName}' deleted successfully`,
    });
  } catch (error: any) {
    console.error(`Error deleting index ${req.params.indexName}:`, error);
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

export default router;
