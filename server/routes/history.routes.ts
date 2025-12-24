import { Router } from 'express';
import type { Request, Response } from 'express';
import { SearchHistory } from '../models/SearchHistory';
import authMiddleware from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/v1/history/searches
 * Create a new search history entry
 */
router.post('/searches', async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const {
      searchType,
      query,
      queryType,
      resultsCount,
      hasResults,
      results,
      metadata,
      status
    } = req.body;

    console.log('📝 Saving search history:', {
      userId: userId?.toString(),
      searchType,
      query,
      resultsCount,
      hasResults,
      status
    });

    // Validate required fields
    if (!searchType || !query) {
      console.error('❌ Missing required fields:', { searchType, query });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: searchType and query'
      });
    }

    // Validate searchType
    if (searchType !== 'discovery' && searchType !== 'domain-monitoring') {
      console.error('❌ Invalid searchType:', searchType);
      return res.status(400).json({
        success: false,
        error: 'Invalid searchType. Must be "discovery" or "domain-monitoring"'
      });
    }

    // Create search history entry
    const searchHistory = new SearchHistory({
      userId,
      searchType,
      query,
      queryType,
      resultsCount: resultsCount || 0,
      hasResults: hasResults || false,
      results: results || null,
      metadata: metadata || {},
      status: status || 'success'
    });

    await searchHistory.save();

    console.log('✅ Search history saved successfully:', searchHistory._id);

    // Log search activity
    await logActivity(
      userId,
      'search',
      `Performed ${searchType} search`,
      searchType === 'discovery' ? 'Discovery' : 'Domain Monitoring',
      `Query: "${query}" - ${resultsCount} results`,
      hasResults ? 'success' : 'warning',
      { searchType, query, resultsCount },
      req
    );

    res.status(201).json({
      success: true,
      data: searchHistory,
      message: 'Search history saved successfully'
    });
  } catch (error: any) {
    console.error('❌ Error saving search history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save search history',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/history/searches
 * Get search history for the authenticated user
 */
router.get('/searches', async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { 
      searchType, 
      page = 1, 
      limit = 50,
      hasResults,
      startDate,
      endDate 
    } = req.query;

    console.log('🔍 Fetching search history:', {
      userId: userId?.toString(),
      searchType,
      page,
      limit,
      hasResults
    });

    const query: any = { userId };

    // Filter by search type
    if (searchType && (searchType === 'discovery' || searchType === 'domain-monitoring')) {
      query.searchType = searchType;
    }

    // Filter by results
    if (hasResults !== undefined) {
      query.hasResults = hasResults === 'true';
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [searchesRaw, total] = await Promise.all([
      SearchHistory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-results') // Exclude full results for performance
        .lean(),
      SearchHistory.countDocuments(query)
    ]);

    // Normalize old records that might have 'timestamp' instead of 'createdAt'
    const searches = searchesRaw.map((search: any) => {
      // If createdAt is missing but timestamp exists, use timestamp
      if (!search.createdAt && search.timestamp) {
        search.createdAt = search.timestamp;
      }
      
      // Set defaults for missing fields in old records
      if (search.searchType === undefined) {
        search.searchType = 'discovery'; // Default to discovery for old records
      }
      if (search.hasResults === undefined) {
        search.hasResults = false;
      }
      if (search.resultsCount === undefined) {
        search.resultsCount = 0;
      }
      if (search.status === undefined) {
        search.status = 'no-results';
      }
      
      return search;
    });

    console.log('✅ Found searches:', {
      total,
      returned: searches.length,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      sampleSearch: searches.length > 0 ? {
        query: searches[0].query,
        createdAt: searches[0].createdAt,
        hasResults: searches[0].hasResults,
        resultsCount: searches[0].resultsCount
      } : null
    });

    res.json({
      success: true,
      data: {
        searches,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching search history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search history',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/history/searches/:id
 * Get detailed information for a specific search
 */
router.get('/searches/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const search = await SearchHistory.findOne({
      _id: id,
      userId
    }).lean();

    if (!search) {
      return res.status(404).json({
        success: false,
        error: 'Search not found'
      });
    }

    res.json({
      success: true,
      data: search
    });
  } catch (error: any) {
    console.error('Error fetching search details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search details',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/history/stats
 * Get statistics about user's search history
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    // Get all searches to manually count by type (for backward compatibility with old records)
    const allSearches = await SearchHistory.find({ userId })
      .select('searchType hasResults')
      .lean();
    
    const totalSearches = allSearches.length;
    const successfulSearches = allSearches.filter((s: any) => s.hasResults === true).length;
    
    // Count by searchType, treating missing searchType as 'discovery' (legacy records)
    const discoverySearches = allSearches.filter((s: any) => 
      !s.searchType || s.searchType === 'discovery'
    ).length;
    const domainSearches = allSearches.filter((s: any) => 
      s.searchType === 'domain-monitoring'
    ).length;
    
    const recentSearchesRaw = await SearchHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('query searchType resultsCount createdAt hasResults timestamp')
      .lean();

    // Normalize old records that might have 'timestamp' instead of 'createdAt'
    const recentSearches = recentSearchesRaw.map((search: any) => {
      if (!search.createdAt && search.timestamp) {
        search.createdAt = search.timestamp;
      }
      if (search.searchType === undefined) {
        search.searchType = 'discovery';
      }
      if (search.hasResults === undefined) {
        search.hasResults = false;
      }
      if (search.resultsCount === undefined) {
        search.resultsCount = 0;
      }
      return search;
    });

    // Get searches by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const searchesByDay = await SearchHistory.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          withResults: {
            $sum: { $cond: ['$hasResults', 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const responseData = {
      totalSearches,
      successfulSearches,
      failedSearches: totalSearches - successfulSearches,
      discoverySearches,
      domainSearches,
      successRate: totalSearches > 0 ? ((successfulSearches / totalSearches) * 100).toFixed(1) : '0',
      recentSearches,
      searchesByDay
    };

    console.log('📊 Sending search stats:', responseData);

    res.json({
      success: true,
      data: responseData
    });
  } catch (error: any) {
    console.error('Error fetching search stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * DELETE /api/v1/history/searches/:id
 * Delete a specific search from history
 */
router.delete('/searches/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const result = await SearchHistory.deleteOne({
      _id: id,
      userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Search not found'
      });
    }

    res.json({
      success: true,
      message: 'Search deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete search',
      message: error.message
    });
  }
});

/**
 * DELETE /api/v1/history/searches
 * Clear all search history for the user
 */
router.delete('/searches', async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { searchType } = req.query;

    const query: any = { userId };
    if (searchType) {
      query.searchType = searchType;
    }

    const result = await SearchHistory.deleteMany(query);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} search(es)`,
      deletedCount: result.deletedCount
    });
  } catch (error: any) {
    console.error('Error clearing search history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear search history',
      message: error.message
    });
  }
});

export default router;
