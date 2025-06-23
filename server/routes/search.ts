import { Request, Response } from 'express';
import { Express } from 'express-serve-static-core';
import { body, validationResult } from 'express-validator';
import { mongodb } from '../lib/mongodb';
import authenticate from '../middleware/auth';
import { ELASTICSEARCH_URI } from '../config';
import { performFuzzySearch } from '../lib/search/index';

interface SearchResult {
  id: string;
  score: number;
  snippet: string;
  type: 'document' | 'user';
}

async function searchElasticsearch(query: string): Promise<SearchResult[]> {
  console.log(`[Search] Starting search for query "${query}"`);
  
  try {
    const searchBody = {
      query: {
        multi_match: {
          query: query,
          fields: ["field1", "field2"],
          operator: "and"
        }
      },
      size: 100
    };

    const response = await fetch(`${ELASTICSEARCH_URI}/filesearchdb.fs.chunks/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();
    
    // Process and sanitize results
    const results = data.hits.hits.map((hit: any) => {
      const field1 = hit._source?.field1 || '';
      const field2 = hit._source?.field2 || '';
      const content = field1 || field2;
      
      return {
        id: hit._id,
        score: hit._score,
        snippet: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
        type: 'document'
      };
    });

    // Filter out empty results
    return results.filter((result: SearchResult) => result.snippet && result.snippet.trim() !== '');

  } catch (error) {
    console.error('[Search] Error:', error);
    throw error;
  }
}

export function registerRoutes(app: Express): void {
  // Dark Web Search API
  app.post("/api/darkweb-search", [
    body("query").trim().notEmpty().withMessage("Search query is required"),
  ], async (req: Request, res: Response) => {
    console.log('[API] Received search request:', {
      query: req.body.query,
      timestamp: new Date().toISOString(),
      headers: req.headers
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('[API] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Use the advanced fuzzy search logic
      const results = await performFuzzySearch(req.body.query, ELASTICSEARCH_URI);
      console.log('[API] Search completed successfully:', {
        query: req.body.query,
        resultCount: results.length,
        timestamp: new Date().toISOString()
      });

      // Sanitize response for the client
      const sanitizedResults = results.slice(0, 20).map(result => ({
        id: result.id,
        score: result.score,
        context: result.context,
        highlights: result.highlights,
        matchedTerms: result.matchedTerms,
        index: result.index
      }));

      return res.json({ 
        success: true, 
        results: sanitizedResults,
        query: req.body.query,
        total: results.length
      });
    } catch (error) {
      console.error('[Search] Error processing search:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Search failed'
      });
    }
  });
}
