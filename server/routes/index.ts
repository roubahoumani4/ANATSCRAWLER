import type { Express } from 'express';
import authenticate from '../middleware/auth';
import conditionalAuth from '../middleware/conditional-auth';

// Import route modules
import adminRoutes from './admin/users.routes';
import authRoutes from './auth/auth.routes';
import userRoutes from './auth/user.routes';
import healthRoutes from './health/health.routes';
import searchRoutes from './search';

/**
 * Register all application routes with proper organization and authentication
 */
export async function registerRoutes(app: Express): Promise<void> {
  // API versioning base path
  const apiV1 = '/api/v1';

  // Simple test endpoint - public
  app.get('/test', (req, res) => {
    res.json({ status: 'test working', timestamp: new Date().toISOString() });
  });

  // Health check routes - public, no auth needed
  app.use('/health', healthRoutes);

  // Authentication routes - public, no auth needed
  app.use(`${apiV1}/auth`, authRoutes);

  // User management routes - authenticated users only
  app.use(`${apiV1}/user`, authenticate, userRoutes);

  // Admin routes - authenticated users with admin role check in routes
  app.use(`${apiV1}/admin`, authenticate, adminRoutes);

  // Search routes - authenticated users only
  app.use(`${apiV1}/search`, authenticate, searchRoutes);

  // Public search endpoint for landing page - no authentication required
  app.use('/api/public-search', searchRoutes);

  // Additional API routes can be added here

  // Legacy API endpoints (without versioning) - redirect to v1 with deprecation warning
  app.use('/api/auth/*', (req, res, next) => {
    console.warn(`DEPRECATED: Legacy API endpoint ${req.originalUrl} used. Please use ${apiV1}/auth instead.`);
    next();
  });

  // Legacy routes for backward compatibility
  app.use('/api/auth', authRoutes);
  app.use('/api/user', authenticate, userRoutes);
  app.use('/api/admin', authenticate, adminRoutes);
  
  app.use('/api/search', authenticate, searchRoutes);

  // Legacy health endpoints - redirect to new health routes
  app.get('/api/health', (req, res) => res.redirect('/health/api'));
  
  // Create API v1 health endpoints (for compatibility with deploy scripts)
  app.use(`${apiV1}/health`, healthRoutes);

  // Legacy profile and user endpoints
  app.get('/api/profile-info', authenticate, (req, res) => res.redirect(`${apiV1}/admin/profile-info`));
  app.get('/api/user-profiles', authenticate, (req, res) => res.redirect(`${apiV1}/admin/user-profiles`));
  app.get('/api/validate-token', (req, res) => res.redirect(`${apiV1}/auth/validate`));

  console.log('✅ Routes registered successfully');
  console.log('📍 API v1 available at:', apiV1);
  console.log('🏥 Health checks available at: /health');
  console.log('🔐 Authentication endpoints at:', `${apiV1}/auth`);
}

export default registerRoutes;
