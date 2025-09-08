import express from "express";
import type { Request, Response } from "express";
import { performOsintSearch } from "../lib/search/index";
import { performElasticsearchSearch } from "../lib/search";
import { ELASTICSEARCH_URI } from "../config";

const router = express.Router();

/**
 * OSINT Search endpoint - searches through OSINT data
 */
router.post("/osint", async (req: Request, res: Response) => {
  try {
    const { query, scanId, dataType, module, riskLevel, limit = 100 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: "Search query is required",
        message: "Please provide a valid search query"
      });
    }

    console.log(`[OSINT Search] Searching for: "${query}"`);
    
    // Perform OSINT search
    const results = await performOsintSearch(query);
    
    // Apply additional filters if provided
    let filteredResults = results;
    
    if (scanId) {
      filteredResults = filteredResults.filter((result: any) => result.scanId === scanId);
    }
    
    if (dataType) {
      filteredResults = filteredResults.filter((result: any) => 
        result.dataType.toLowerCase().includes(dataType.toLowerCase())
      );
    }
    
    if (module) {
      filteredResults = filteredResults.filter((result: any) => 
        result.module.toLowerCase().includes(module.toLowerCase())
      );
    }
    
    if (riskLevel) {
      filteredResults = filteredResults.filter((result: any) => 
        result.threatLevel === riskLevel.toUpperCase()
      );
    }
    
    // Apply limit
    if (limit && limit > 0) {
      filteredResults = filteredResults.slice(0, limit);
    }
    
    // Add search metadata
    const searchMetadata = {
      query,
      totalResults: results.length,
      filteredResults: filteredResults.length,
      filters: {
        scanId: scanId || null,
        dataType: dataType || null,
        module: module || null,
        riskLevel: riskLevel || null,
        limit: limit || null
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(`[OSINT Search] Found ${filteredResults.length} results for "${query}"`);
    
    res.json({
      success: true,
      metadata: searchMetadata,
      results: filteredResults
    });
    
  } catch (error) {
    console.error('[OSINT Search] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown search error';
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Quick OSINT search endpoint - simplified search for common use cases
 */
router.get("/osint/quick", async (req: Request, res: Response) => {
  try {
    const { q, limit = 50 } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ 
        error: "Query parameter 'q' is required",
        message: "Please provide a search query"
      });
    }
    
    console.log(`[OSINT Quick Search] Searching for: "${q}"`);
    
    const results = await performOsintSearch(q as string);
    const limitedResults = results.slice(0, Number(limit));
    
    res.json({
      success: true,
      query: q,
      totalResults: results.length,
      results: limitedResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[OSINT Quick Search] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown search error';
    res.status(500).json({
      success: false,
      error: 'Quick search failed',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * OSINT search suggestions - provides autocomplete suggestions based on OSINT data
 */
router.get("/osint/suggestions", async (req: Request, res: Response) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ 
        error: "Query parameter 'q' is required",
        message: "Please provide a search query"
      });
    }
    
    console.log(`[OSINT Suggestions] Getting suggestions for: "${q}"`);
    
    // Get search results for suggestions
    const results = await performOsintSearch(q as string);
    
    // Generate suggestions based on result types
    const suggestions = new Set<string>();
    
    results.forEach((result: any) => {
      // Add data type suggestions
      if (type === 'all' || type === 'dataType') {
        suggestions.add(result.dataType);
      }
      
      // Add module suggestions
      if (type === 'all' || type === 'module') {
        suggestions.add(result.module);
      }
      
      // Add value suggestions (truncated)
      if (type === 'all' || type === 'value') {
        const truncated = result.value.length > 50 ? 
          result.value.substring(0, 50) + '...' : 
          result.value;
        suggestions.add(truncated);
      }
      
      if (suggestions.size >= Number(limit)) return;
    });
    
    const limitedSuggestions = Array.from(suggestions).slice(0, Number(limit));
    
    res.json({
      success: true,
      query: q,
      type,
      suggestions: limitedSuggestions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[OSINT Suggestions] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * OSINT search statistics - provides search analytics and metadata
 */
router.get("/osint/stats", async (req: Request, res: Response) => {
  try {
    console.log('[OSINT Stats] Getting search statistics');
    
    // Get a sample search to analyze data structure
    const sampleResults = await performOsintSearch('test');
    
    // Analyze data types and modules
    const dataTypeStats = new Map<string, number>();
    const moduleStats = new Map<string, number>();
    const riskLevelStats = new Map<string, number>();
    
    sampleResults.forEach((result: any) => {
      // Count data types
      dataTypeStats.set(result.dataType, (dataTypeStats.get(result.dataType) || 0) + 1);
      
      // Count modules
      moduleStats.set(result.module, (moduleStats.get(result.module) || 0) + 1);
      
      // Count risk levels
      riskLevelStats.set(result.threatLevel, (riskLevelStats.get(result.threatLevel) || 0) + 1);
    });
    
    const stats = {
      totalSamples: sampleResults.length,
      dataTypes: Object.fromEntries(dataTypeStats),
      modules: Object.fromEntries(moduleStats),
      riskLevels: Object.fromEntries(riskLevelStats),
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      stats,
      message: 'Search statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('[OSINT Stats] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: 'Failed to get search statistics',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Legacy search endpoint - redirects to OSINT search for backward compatibility
 */
router.post("/", async (req: Request, res: Response) => {
  console.log('[Search] Legacy search endpoint called, redirecting to OSINT search');
  
  // For backward compatibility, just call the OSINT search directly
  req.body = req.body || {};
  req.body.query = req.body.query || 'legacy';
  
  // Call the OSINT search handler by copying the request body
  const { query, scanId, dataType, module, riskLevel, limit } = req.body;
  
  try {
    console.log(`[OSINT Search] Legacy redirect searching for: "${query}"`);
    
    // Perform OSINT search
    const results = await performOsintSearch(query);
    
    // Apply additional filters if provided
    let filteredResults = results;
    
    if (scanId) {
      filteredResults = filteredResults.filter((result: any) => result.scanId === scanId);
    }
    
    if (dataType) {
      filteredResults = filteredResults.filter((result: any) => 
        result.dataType.toLowerCase().includes(dataType.toLowerCase())
      );
    }
    
    if (module) {
      filteredResults = filteredResults.filter((result: any) => 
        result.module.toLowerCase().includes(module.toLowerCase())
      );
    }
    
    if (riskLevel) {
      filteredResults = filteredResults.filter((result: any) => 
        result.threatLevel === riskLevel.toUpperCase()
      );
    }
    
    // Apply limit
    if (limit && limit > 0) {
      filteredResults = filteredResults.slice(0, limit);
    }
    
    // Add search metadata
    const searchMetadata = {
      query,
      totalResults: results.length,
      filteredResults: filteredResults.length,
      filters: {
        scanId: scanId || null,
        dataType: dataType || null,
        module: module || null,
        riskLevel: riskLevel || null,
        limit: limit || null
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(`[OSINT Search] Legacy redirect found ${filteredResults.length} results for "${query}"`);
    
    res.json({
      success: true,
      metadata: searchMetadata,
      results: filteredResults
    });
    
  } catch (error) {
    console.error('[OSINT Search] Legacy redirect error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown search error';
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health check endpoint
 */
router.get("/health", async (_req: Request, res: Response) => {
  try {
    // Test OSINT search functionality
    let testResults: any[] = [];
    let searchError: string | null = null;
    
    try {
      testResults = await performOsintSearch('test');
    } catch (error) {
      searchError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    res.json({
      status: "OSINT Search service is running",
      timestamp: new Date().toISOString(),
      testSearch: {
        success: searchError === null,
        resultsCount: testResults.length,
        error: searchError
      },
      endpoints: {
        osint: "POST /osint - Full OSINT search",
        quick: "GET /osint/quick - Quick search",
        suggestions: "GET /osint/suggestions - Search suggestions",
        stats: "GET /osint/stats - Search statistics",
        darkweb: "POST /darkweb-search - Darkweb search"
      }
    });
  } catch (error) {
    console.error('[Search Health] Error:', error);
    
    res.status(500).json({
      status: "OSINT Search service has issues",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Darkweb search endpoint - searches Elasticsearch darkweb_structured index
 */
router.post("/darkweb-search", async (req: Request, res: Response) => {
  try {
    const { query, limit = 100 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: "Search query is required",
        message: "Please provide a valid search query"
      });
    }

    console.log(`[Darkweb Search] Searching Elasticsearch for: "${query}" at ${ELASTICSEARCH_URI}`);
    
    // Use Elasticsearch to search darkweb_structured index
    const results = await performElasticsearchSearch(query, ELASTICSEARCH_URI);
    
    // Apply limit
    const limitedResults = limit > 0 ? results.slice(0, limit) : results;
    
    // Add search metadata
    const searchMetadata = {
      query,
      searchType: 'darkweb',
      elasticsearchUri: ELASTICSEARCH_URI,
      index: 'darkweb_structured',
      totalResults: results.length,
      limitedResults: limitedResults.length,
      limit: limit || null,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Darkweb Search] Found ${limitedResults.length} results in Elasticsearch for "${query}"`);
    
    res.json({
      success: true,
      metadata: searchMetadata,
      results: limitedResults
    });
    
  } catch (error) {
    console.error('[Darkweb Search] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown darkweb search error';
    res.status(500).json({
      success: false,
      error: 'Darkweb search failed',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
