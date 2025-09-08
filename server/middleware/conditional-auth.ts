import { NextFunction, Request, Response } from 'express';
import authenticate from './auth';

/**
 * Conditional authentication middleware for API routes
 * - In production: Requires full authentication
 * - In development: Bypasses auth for easier testing (configurable)
 * - Maintains security while allowing development flexibility
 */
export default function conditionalAuth(req: Request, res: Response, next: NextFunction) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const skipAuthInDev = process.env.SKIP_API_AUTH_IN_DEV === 'true';

  // In production or if explicitly configured, always require authentication
  if (!isDevelopment || !skipAuthInDev) {
    return authenticate(req, res, next);
  }

  // In development with auth bypass enabled, create mock user context
  console.log('[ConditionalAuth] Bypassing authentication in development mode');
  req.user = {
    _id: 'dev-user',
    username: 'dev-user',
    password: '',
    email: 'dev@anatscrawler.local',
    fullName: 'Development User',
    roles: ['admin'],
    isActive: true,
    createdAt: new Date(),
  };
  req.token = 'dev-token';

  next();
}
