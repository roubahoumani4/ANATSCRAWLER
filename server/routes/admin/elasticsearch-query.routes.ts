import type { Request, Response } from 'express';
import { Router } from 'express';
import { elasticsearchService } from '../../services/elasticsearch.service';
import SavedQuery from '../../models/SavedQuery';
import QueryHistory from '../../models/QueryHistory';

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

/**
 * POST /api/v1/admin/elasticsearch/query/search
 * Search documents in an index with pagination and filters
 */
router.post('/search', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName, query, from = 0, size = 10, sort } = req.body;

    if (!indexName) {
      return res.status(400).json({
        success: false,
        error: 'Index name is required',
      });
    }

    const results = await elasticsearchService.searchDocuments(
      indexName,
      query || { match_all: {} },
      from,
      size,
      sort
    );

    res.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Error searching documents:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search documents',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/query/execute
 * Execute custom DSL query and save to history
 */
router.post('/execute', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName, query } = req.body;

    if (!indexName || !query) {
      return res.status(400).json({
        success: false,
        error: 'Index name and query are required',
      });
    }

    const results = await elasticsearchService.executeQuery(indexName, query);

    // Save to query history
    try {
      await QueryHistory.create({
        userId: req.user!._id,
        indexName,
        query,
        executionTime: results.executionTime,
        resultCount: results.total,
      });
    } catch (historyError) {
      console.error('Error saving query history:', historyError);
      // Don't fail the request if history save fails
    }

    res.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Error executing query:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute query',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/query/fields/:indexName
 * Get all fields from an index
 */
router.get('/fields/:indexName', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName } = req.params;
    const fields = await elasticsearchService.getIndexFields(indexName);

    res.json({
      success: true,
      fields,
    });
  } catch (error: any) {
    console.error('Error fetching index fields:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch index fields',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/query/count
 * Count documents matching a query
 */
router.post('/count', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName, query } = req.body;

    if (!indexName) {
      return res.status(400).json({
        success: false,
        error: 'Index name is required',
      });
    }

    const count = await elasticsearchService.countDocuments(
      indexName,
      query || { match_all: {} }
    );

    res.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error('Error counting documents:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to count documents',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/query/history
 * Get query history for current user
 */
router.get('/history', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const history = await QueryHistory.find({ userId: req.user!._id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      history,
    });
  } catch (error: any) {
    console.error('Error fetching query history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch query history',
    });
  }
});

/**
 * DELETE /api/v1/admin/elasticsearch/query/history/:id
 * Delete a specific query from history
 */
router.delete('/history/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await QueryHistory.findOneAndDelete({
      _id: id,
      userId: req.user!._id,
    });

    res.json({
      success: true,
      message: 'Query history deleted',
    });
  } catch (error: any) {
    console.error('Error deleting query history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete query history',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/query/save
 * Save a query for future use
 */
router.post('/save', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, indexName, query } = req.body;

    if (!name || !indexName || !query) {
      return res.status(400).json({
        success: false,
        error: 'Name, index name, and query are required',
      });
    }

    const savedQuery = await SavedQuery.create({
      userId: req.user!._id,
      name,
      description,
      indexName,
      query,
    });

    res.json({
      success: true,
      savedQuery,
    });
  } catch (error: any) {
    console.error('Error saving query:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save query',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/query/saved
 * Get all saved queries for current user
 */
router.get('/saved', requireAdmin, async (req: Request, res: Response) => {
  try {
    const savedQueries = await SavedQuery.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      savedQueries,
    });
  } catch (error: any) {
    console.error('Error fetching saved queries:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch saved queries',
    });
  }
});

/**
 * DELETE /api/v1/admin/elasticsearch/query/saved/:id
 * Delete a saved query
 */
router.delete('/saved/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await SavedQuery.findOneAndDelete({
      _id: id,
      userId: req.user!._id,
    });

    res.json({
      success: true,
      message: 'Saved query deleted',
    });
  } catch (error: any) {
    console.error('Error deleting saved query:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete saved query',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/query/export
 * Export search results to JSON or CSV
 */
router.post('/export', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName, query, format = 'json' } = req.body;

    if (!indexName) {
      return res.status(400).json({
        success: false,
        error: 'Index name is required',
      });
    }

    // Get all matching documents (up to 10,000)
    const results = await elasticsearchService.searchDocuments(
      indexName,
      query || { match_all: {} },
      0,
      10000
    );

    if (format === 'csv') {
      // Convert to CSV
      const documents = results.hits.map((hit: any) => hit._source);
      
      if (documents.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No documents to export',
        });
      }

      // Get all unique keys
      const keys: string[] = Array.from(
        new Set(documents.flatMap((doc: any) => Object.keys(doc)))
      );

      // Create CSV header
      const csv = [
        keys.join(','),
        ...documents.map((doc: any) =>
          keys.map((key) => {
            const value = doc[key];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${indexName}_export.csv"`);
      res.send(csv);
    } else {
      // Export as JSON
      const exportData = {
        indexName,
        exportedAt: new Date().toISOString(),
        totalDocuments: results.total,
        documents: results.hits.map((hit: any) => ({
          id: hit._id,
          ...hit._source,
        })),
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${indexName}_export.json"`);
      res.json(exportData);
    }
  } catch (error: any) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export data',
    });
  }
});

export default router;
