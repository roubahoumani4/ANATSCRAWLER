import { Request, Response } from 'express';
import { Express } from 'express-serve-static-core';
import { body, validationResult } from 'express-validator';
import { mongodb } from '../lib/mongodb';
import authenticate from '../middleware/auth';
import { ELASTICSEARCH_URI } from '../config';
import { performFuzzySearch } from '../lib/search/index';

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
      // Use the advanced fuzzy search logic (correct indices)
      const results = await performFuzzySearch(req.body.query, ELASTICSEARCH_URI);
      console.log('[API] Search completed successfully:', {
        query: req.body.query,
        resultCount: results.length,
        timestamp: new Date().toISOString()
      });

      // Sanitize response for the client
      const sanitizedResults = results.slice(0, 20).map(result => ({
        id: result.id,
        phone: result.phone || '',
        name: result.name ? Buffer.from(result.name, 'utf8').toString() : '',
        link: result.link || '',
        score: result.score,
        timestamp: result.timestamp || '', // fallback to empty string if not present
      }));

      return res.json({ 
        success: true, 
        results: sanitizedResults,
        query: req.body.query,
        total: results.length
      });
    } catch (error) {
      console.error('[Search] Error processing search:', error, JSON.stringify(error));
      // Return the full error object for debugging
      return res.status(500).json({ 
        success: false, 
        error: error && typeof error === 'object' ? JSON.stringify(error) : String(error)
      });
    }
  });
}
