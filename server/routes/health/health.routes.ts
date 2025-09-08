import type { Request, Response } from 'express';
import { Router } from 'express';
import { mongodb } from '../../lib/mongodb';

const router = Router();
// Avoid creating an instance at module load; use getInstance() in handlers when needed

/**
 * GET /
 * Main system health check
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: false,
        system: true,
      },
    };

    // Test MongoDB connection (skip in development)
    try {
      if (process.env.SKIP_DATABASE_CONNECTION !== 'true') {
        await mongodb.findUsers({});
        healthStatus.services.mongodb = true;
      } else {
        // In development mode, mark as true to indicate skipped
        healthStatus.services.mongodb = true;
      }
    } catch (error) {
      console.error('Health check - MongoDB failed:', error);
    }

    // Overall health status
    const overallHealthy =
      healthStatus.services.mongodb &&
      healthStatus.services.system;

    res.status(overallHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * GET /api
 * API health status
 */
router.get('/api', async (req: Request, res: Response) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        search: 'available',
        mongodb: 'available',
      }
    });
  } catch (error) {
    console.error('API health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'API health check failed',
    });
  }
});

/**
 * GET /mongodb
 * MongoDB specific health check
 */
router.get('/mongodb', async (req: Request, res: Response) => {
  try {
    if (process.env.SKIP_DATABASE_CONNECTION === 'true') {
      return res.json({
        status: 'healthy',
        service: 'mongodb',
        message: 'Database connection skipped in development',
        timestamp: new Date().toISOString(),
      });
    }

    // Test MongoDB connection
    await mongodb.findUsers({});
    res.json({
      status: 'healthy',
      service: 'mongodb',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      service: 'mongodb',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
