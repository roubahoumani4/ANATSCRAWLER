import { Router, Request, Response } from 'express';
import { SearchHistory } from '../models/SearchHistory';
import { ELASTICSEARCH_URI } from '../config';

const router = Router();

/**
 * GET /api/v1/analytics/threat-distribution
 * Calculate threat distribution based on search results
 */
router.get('/threat-distribution', async (req: Request, res: Response) => {
  try {
    // Get all searches with results
    const searches = await SearchHistory.find({ 
      hasResults: true,
      results: { $exists: true, $ne: [] }
    }).select('results resultsCount searchType');

    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    // Analyze each search to categorize threat level
    for (const search of searches) {
      const resultCount = search.resultsCount || 0;
      
      // Categorize based on exposure count
      if (resultCount > 100) {
        critical += resultCount;
      } else if (resultCount > 50) {
        high += resultCount;
      } else if (resultCount > 10) {
        medium += resultCount;
      } else {
        low += resultCount;
      }

      // Additional severity analysis based on password strength
      if (search.results && Array.isArray(search.results)) {
        for (const result of search.results.slice(0, 10)) {
          const password = result.password || '';
          
          // Weak passwords increase threat level
          if (password.length < 6 || ['password', '123456', 'admin'].includes(password.toLowerCase())) {
            // Move some from low to higher categories
            if (low > 0) {
              low--;
              high++;
            }
          }
        }
      }
    }

    const distribution = [
      { name: 'Critical', value: critical, color: '#ef4444' },
      { name: 'High', value: high, color: '#f97316' },
      { name: 'Medium', value: medium, color: '#eab308' },
      { name: 'Low', value: low, color: '#3b82f6' }
    ];

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Error calculating threat distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate threat distribution',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/analytics/security-score
 * Calculate security score based on multiple metrics
 */
router.get('/security-score', async (req: Request, res: Response) => {
  try {
    const totalSearches = await SearchHistory.countDocuments();
    const successfulSearches = await SearchHistory.countDocuments({ hasResults: true });
    const recentSearches = await SearchHistory.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Get all searches with results for analysis
    const searchesWithResults = await SearchHistory.find({ 
      hasResults: true,
      results: { $exists: true, $ne: [] }
    }).select('results resultsCount searchType createdAt');

    // Calculate Threat Detection Score (based on proactive searching)
    const threatDetectionScore = totalSearches > 0 
      ? Math.min(100, Math.floor((successfulSearches / totalSearches) * 100))
      : 50;

    // Calculate Data Protection Score (based on password strength in exposures)
    let strongPasswords = 0;
    let weakPasswords = 0;
    let totalPasswords = 0;

    for (const search of searchesWithResults) {
      if (search.results && Array.isArray(search.results)) {
        for (const result of search.results.slice(0, 10)) {
          const password = result.password || '';
          totalPasswords++;
          
          if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
            strongPasswords++;
          } else {
            weakPasswords++;
          }
        }
      }
    }

    const dataProtectionScore = totalPasswords > 0
      ? Math.floor((strongPasswords / totalPasswords) * 100)
      : 75;

    // Calculate Monitoring Coverage Score (based on search frequency)
    const monitoringCoverageScore = recentSearches > 0
      ? Math.min(100, Math.floor((recentSearches / 7) * 10))
      : 60;

    // Calculate Response Time Score (based on recent activity)
    const avgResponseTime = recentSearches > 0 ? 90 : 70;

    // Calculate Intelligence Quality Score (based on result diversity)
    const uniqueSources = new Set();
    for (const search of searchesWithResults) {
      if (search.results && Array.isArray(search.results)) {
        for (const result of search.results.slice(0, 10)) {
          if (result.database_source) {
            uniqueSources.add(result.database_source);
          }
        }
      }
    }
    const intelligenceQualityScore = Math.min(100, uniqueSources.size * 20);

    const securityScore = [
      { category: 'Threat Detection', score: threatDetectionScore },
      { category: 'Data Protection', score: dataProtectionScore },
      { category: 'Monitoring Coverage', score: monitoringCoverageScore },
      { category: 'Response Time', score: avgResponseTime },
      { category: 'Intelligence Quality', score: intelligenceQualityScore }
    ];

    res.json({
      success: true,
      data: securityScore
    });
  } catch (error) {
    console.error('Error calculating security score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate security score',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/analytics/elasticsearch-stats
 * Get total indexed files count from Elasticsearch
 */
router.get('/elasticsearch-stats', async (req: Request, res: Response) => {
  try {
    const indices = ['darkweb_structured', 'files_index'];
    let totalDocuments = 0;
    const indexStats: any = {};

    for (const indexName of indices) {
      try {
        // Use Elasticsearch _count API to get document count
        const countResponse = await fetch(`${ELASTICSEARCH_URI}/${indexName}/_count`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (countResponse.ok) {
          const countData = await countResponse.json() as any;
          const count = countData.count || 0;
          totalDocuments += count;
          indexStats[indexName] = count;
        } else {
          console.error(`Failed to get count for ${indexName}:`, countResponse.statusText);
          indexStats[indexName] = 0;
        }
      } catch (indexError) {
        console.error(`Error fetching count for ${indexName}:`, indexError);
        indexStats[indexName] = 0;
      }
    }

    res.json({
      success: true,
      data: {
        totalDocuments,
        indices: indexStats,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching Elasticsearch stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Elasticsearch statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
