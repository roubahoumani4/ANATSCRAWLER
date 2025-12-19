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
 * GET /api/v1/admin/elasticsearch/performance/optimization
 * Get index optimization statistics
 */
router.get('/optimization', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get all indices stats
    const statsResponse = await axios.get(`${ELASTICSEARCH_URI}/_stats/segments,query_cache,fielddata,store`);

    const stats: any[] = [];
    
    for (const [indexName, indexStats] of Object.entries(statsResponse.data.indices || {})) {
      const total = (indexStats as any).total || {};
      
      stats.push({
        indexName,
        segmentCount: total.segments?.count || 0,
        segmentMemory: total.segments?.memory_in_bytes || 0,
        cacheSize: total.query_cache?.memory_size_in_bytes || 0,
        memoryUsage: (total.segments?.memory_in_bytes || 0) + 
                     (total.query_cache?.memory_size_in_bytes || 0) +
                     (total.fielddata?.memory_size_in_bytes || 0),
        shardCount: total.segments?.max_unsafe_auto_id_timestamp || 0,
        queryCacheHits: total.query_cache?.hit_count || 0,
        queryCacheMisses: total.query_cache?.miss_count || 0,
        fieldDataMemory: total.fielddata?.memory_size_in_bytes || 0,
      });
    }

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching optimization stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch optimization statistics',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/performance/segments/:indexName?
 * Get segment information for indices
 */
router.get('/segments/:indexName?', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { indexName } = req.params;

    const segmentsResponse = await axios.get(
      `${ELASTICSEARCH_URI}/${indexName || '_all'}/_segments`
    );

    const segments: any[] = [];

    for (const [index, indexData] of Object.entries(segmentsResponse.data.indices || {})) {
      const shards = (indexData as any).shards || {};
      
      for (const [shardId, shardArray] of Object.entries(shards)) {
        if (Array.isArray(shardArray)) {
          for (const shard of shardArray) {
            const segmentData = shard.segments || {};
            const segmentCount = Object.keys(segmentData).length;
            
            let totalSize = 0;
            let totalMemory = 0;
            
            for (const segment of Object.values(segmentData)) {
              const seg = segment as any;
              totalSize += seg.size_in_bytes || 0;
              totalMemory += seg.memory_in_bytes || 0;
            }

            segments.push({
              indexName: index,
              shard: parseInt(shardId),
              segments: segmentCount,
              committed: shard.committed || false,
              searchable: true,
              size: formatBytes(totalSize),
              memory: formatBytes(totalMemory),
            });
          }
        }
      }
    }

    res.json({
      success: true,
      segments,
    });
  } catch (error: any) {
    console.error('Error fetching segment information:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch segment information',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/performance/force-merge
 * Force merge index segments
 */
router.post('/force-merge', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { index, maxSegments = 1 } = req.body;

    if (!index) {
      return res.status(400).json({
        success: false,
        error: 'Index name is required',
      });
    }
    
    const response = await axios.post(
      `${ELASTICSEARCH_URI}/${index}/_forcemerge?max_num_segments=${maxSegments}&wait_for_completion=false`
    );

    res.json({
      success: true,
      message: 'Force merge operation initiated',
      response: response.data,
    });
  } catch (error: any) {
    console.error('Error initiating force merge:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate force merge',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/performance/clear-cache
 * Clear index cache
 */
router.post('/clear-cache', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { index, cacheType } = req.body;

    if (!index) {
      return res.status(400).json({
        success: false,
        error: 'Index name is required',
      });
    }
    
    // Build query parameters for cache clearing
    const cacheParams: string[] = [];
    if (cacheType === 'query' || !cacheType) cacheParams.push('query=true');
    if (cacheType === 'request' || !cacheType) cacheParams.push('request=true');
    if (cacheType === 'fielddata' || !cacheType) cacheParams.push('fielddata=true');

    const queryString = cacheParams.join('&');
    const response = await axios.post(
      `${ELASTICSEARCH_URI}/${index}/_cache/clear?${queryString}`
    );

    res.json({
      success: true,
      message: `${cacheType || 'all'} cache cleared successfully`,
      response: response.data,
    });
  } catch (error: any) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear cache',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/performance/query-metrics
 * Get query performance metrics
 */
router.get('/query-metrics', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { range = '1h' } = req.query;

    // Get node stats for query metrics
    const nodeStats = await axios.get(`${ELASTICSEARCH_URI}/_nodes/stats/indices`);

    const metrics: any[] = [];
    const nodes = nodeStats.data.nodes || {};

    for (const [nodeId, nodeData] of Object.entries(nodes)) {
      const indices = (nodeData as any).indices || {};
      const search = indices.search || {};

      if (search.query_total) {
        metrics.push({
          query: 'All Queries',
          count: search.query_total,
          avgTime: search.query_time_in_millis / Math.max(search.query_total, 1),
          minTime: 0,
          maxTime: search.query_time_in_millis,
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error('Error fetching query metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch query metrics',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/performance/slow-queries
 * Get slow query logs
 */
router.get('/slow-queries', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { range = '1h' } = req.query;

    // In a real implementation, you would fetch this from a slow query log index
    // For now, we'll return mock data
    const queries: any[] = [];

    res.json({
      success: true,
      queries,
    });
  } catch (error: any) {
    console.error('Error fetching slow queries:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch slow queries',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/performance/shards
 * Get shard information
 */
router.get('/shards', requireAdmin, async (req: Request, res: Response) => {
  try {
    const shardsResponse = await axios.get(
      `${ELASTICSEARCH_URI}/_cat/shards?format=json&bytes=b`
    );

    const shards = (shardsResponse.data as any[]).map((shard: any) => ({
      index: shard.index,
      shard: parseInt(shard.shard),
      prirep: shard.prirep,
      state: shard.state,
      docs: parseInt(shard.docs) || 0,
      store: formatBytes(parseInt(shard.store) || 0),
      node: shard.node,
    }));

    res.json({
      success: true,
      shards,
    });
  } catch (error: any) {
    console.error('Error fetching shard information:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch shard information',
    });
  }
});

/**
 * POST /api/v1/admin/elasticsearch/performance/reroute-shard
 * Manually reroute a shard
 */
router.post('/reroute-shard', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { index, shard, fromNode, toNode } = req.body;

    if (!index || shard === undefined || !fromNode || !toNode) {
      return res.status(400).json({
        success: false,
        error: 'Index, shard, fromNode, and toNode are required',
      });
    }

    const response = await axios.post(
      `${ELASTICSEARCH_URI}/_cluster/reroute`,
      {
        commands: [
          {
            move: {
              index,
              shard,
              from_node: fromNode,
              to_node: toNode,
            },
          },
        ],
      }
    );

    res.json({
      success: true,
      message: 'Shard rerouted successfully',
      response: response.data,
    });
  } catch (error: any) {
    console.error('Error rerouting shard:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reroute shard',
    });
  }
});

/**
 * GET /api/v1/admin/elasticsearch/performance/tiers
 * Get hot/warm/cold tier information
 */
router.get('/tiers', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get all indices with their settings
    const indicesResponse = await axios.get(`${ELASTICSEARCH_URI}/_all`);

    const tiers: { [key: string]: { indices: string[]; shardCount: number; totalSize: number } } = {
      hot: { indices: [], shardCount: 0, totalSize: 0 },
      warm: { indices: [], shardCount: 0, totalSize: 0 },
      cold: { indices: [], shardCount: 0, totalSize: 0 },
    };

    // Get stats for size calculation
    const statsResponse = await axios.get(`${ELASTICSEARCH_URI}/_stats/store`);

    for (const [indexName, indexData] of Object.entries(indicesResponse.data)) {
      const settings = (indexData as any).settings?.index || {};
      const routing = settings.routing?.allocation?.include?._tier_preference || 'data_hot';
      
      // Determine tier
      let tier = 'hot';
      if (routing.includes('data_warm')) {
        tier = 'warm';
      } else if (routing.includes('data_cold')) {
        tier = 'cold';
      }

      tiers[tier].indices.push(indexName);
      
      // Add shard count and size
      const indexStats = (statsResponse.data.indices as any)?.[indexName];
      if (indexStats) {
        const primaryShards = indexStats.primaries?.docs?.count ? 
          Math.ceil(indexStats.primaries.docs.count / 1000000) : 1;
        tiers[tier].shardCount += primaryShards;
        tiers[tier].totalSize += indexStats.total?.store?.size_in_bytes || 0;
      }
    }

    const result = Object.entries(tiers).map(([tier, data]) => ({
      tier,
      indices: data.indices,
      shardCount: data.shardCount,
      totalSize: formatBytes(data.totalSize),
    }));

    res.json({
      success: true,
      tiers: result,
    });
  } catch (error: any) {
    console.error('Error fetching tier information:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tier information',
    });
  }
});

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default router;
