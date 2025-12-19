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

/**
 * GET /api/v1/admin/elasticsearch/logs
 * Get admin activity logs with optional filters
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { category, status, search, startDate, endDate, adminEmail, limit = 100 } = req.query;

    // Build Elasticsearch query
    const must: any[] = [
      { term: { logType: 'admin_action' } }
    ];

    if (category && category !== 'all') {
      must.push({ term: { category } });
    }

    if (status && status !== 'all') {
      must.push({ term: { status } });
    }
    
    if (adminEmail && adminEmail !== 'all') {
      must.push({ term: { 'adminEmail.keyword': adminEmail } });
    }

    if (search) {
      must.push({
        multi_match: {
          query: search,
          fields: ['action', 'resource', 'adminEmail', 'adminName', 'details']
        }
      });
    }

    if (startDate || endDate) {
      const range: any = {};
      if (startDate) range.gte = startDate;
      if (endDate) range.lte = endDate;
      must.push({ range: { timestamp: range } });
    }

    // Query Elasticsearch for admin logs
    const response = await axios.post(
      `${ELASTICSEARCH_URI}/admin-logs-*/_search`,
      {
        query: {
          bool: { must }
        },
        sort: [{ timestamp: { order: 'desc' } }],
        size: parseInt(limit as string)
      }
    );

    const logs = response.data.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source
    }));

    res.json({ success: true, logs, total: response.data.hits.total.value });
  } catch (error: any) {
    console.error('Error fetching admin logs:', error.response?.data || error.message);
    
    // If index doesn't exist yet, return empty array
    if (error.response?.status === 404) {
      return res.json({ success: true, logs: [], total: 0 });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch admin logs',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/logs/admins
 * Get list of all admin users for filtering
 */
router.get('/admins', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get unique admin emails from logs
    const response = await axios.post(
      `${ELASTICSEARCH_URI}/admin-logs-*/_search`,
      {
        size: 0,
        aggs: {
          admins: {
            terms: {
              field: 'adminEmail.keyword',
              size: 100
            },
            aggs: {
              latest: {
                top_hits: {
                  size: 1,
                  sort: [{ timestamp: { order: 'desc' } }],
                  _source: ['adminName', 'adminEmail']
                }
              }
            }
          }
        }
      }
    );

    const admins = response.data.aggregations.admins.buckets.map((bucket: any) => ({
      email: bucket.key,
      name: bucket.latest.hits.hits[0]?._source.adminName || bucket.key,
      actionCount: bucket.doc_count
    }));

    res.json({ success: true, admins });
  } catch (error: any) {
    console.error('Error fetching admin list:', error.response?.data || error.message);
    
    // If index doesn't exist yet, return empty array
    if (error.response?.status === 404) {
      return res.json({ success: true, admins: [] });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch admin list',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/logs/stats
 * Get admin activity statistics
 */
router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get aggregated statistics
    const response = await axios.post(
      `${ELASTICSEARCH_URI}/admin-logs-*/_search`,
      {
        size: 0,
        query: {
          bool: {
            must: [
              { term: { logType: 'admin_action' } },
              {
                range: {
                  timestamp: {
                    gte: 'now-30d'
                  }
                }
              }
            ]
          }
        },
        aggs: {
          total_actions: {
            value_count: { field: '_id' }
          },
          success_count: {
            filter: { term: { status: 'success' } }
          },
          by_category: {
            terms: { field: 'category.keyword', size: 10 }
          },
          by_admin: {
            terms: { field: 'adminEmail.keyword', size: 1 }
          },
          by_date: {
            date_histogram: {
              field: 'timestamp',
              calendar_interval: 'day'
            }
          },
          recent_actions: {
            top_hits: {
              size: 10,
              sort: [{ timestamp: { order: 'desc' } }]
            }
          }
        }
      }
    );

    const aggs = response.data.aggregations;
    const totalActions = aggs.total_actions.value;
    const successCount = aggs.success_count.doc_count;
    
    const stats = {
      totalActions,
      successRate: totalActions > 0 ? (successCount / totalActions) * 100 : 0,
      mostActiveAdmin: aggs.by_admin.buckets[0]?.key || 'N/A',
      actionsByCategory: aggs.by_category.buckets.map((bucket: any) => ({
        category: bucket.key,
        count: bucket.doc_count
      })),
      actionsOverTime: aggs.by_date.buckets.map((bucket: any) => ({
        date: new Date(bucket.key).toLocaleDateString(),
        count: bucket.doc_count
      })),
      recentActions: aggs.recent_actions.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source
      }))
    };

    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching admin stats:', error.response?.data || error.message);
    
    // If index doesn't exist yet, return default stats
    if (error.response?.status === 404) {
      return res.json({
        totalActions: 0,
        successRate: 0,
        mostActiveAdmin: 'N/A',
        actionsByCategory: [],
        actionsOverTime: [],
        recentActions: []
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch admin statistics',
      details: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/logs
 * Create a new admin action log
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { action, category, resource, details, status = 'success' } = req.body;

    if (!action || !category || !resource) {
      return res.status(400).json({ 
        error: 'Action, category, and resource are required' 
      });
    }

    const user = req.user as any;
    const log = {
      logType: 'admin_action',
      adminId: user._id || user.id,
      adminEmail: user.email,
      adminName: user.name || user.username || user.email,
      action,
      category,
      resource,
      details: details || {},
      status,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    // Create index with current date
    const indexName = `admin-logs-${new Date().toISOString().split('T')[0]}`;

    await axios.post(
      `${ELASTICSEARCH_URI}/${indexName}/_doc`,
      log
    );

    res.json({ 
      success: true, 
      message: 'Admin action logged successfully',
      log 
    });
  } catch (error: any) {
    console.error('Error creating admin log:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create admin log',
      details: error.response?.data || error.message 
    });
  }
});

export default router;
