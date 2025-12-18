import { Request, Response, NextFunction } from 'express';
import { ActivityLog } from '../models/ActivityLog';

/**
 * Utility function to log user activity
 */
export const logActivity = async (
  userId: any,
  actionType: string,
  action: string,
  module: string,
  details?: string,
  status: 'success' | 'failed' | 'warning' = 'success',
  metadata?: any,
  req?: Request
) => {
  try {
    const activityLog = new ActivityLog({
      userId,
      actionType,
      action,
      details,
      module,
      status,
      metadata,
      ipAddress: req?.ip || req?.socket?.remoteAddress,
      userAgent: req?.headers['user-agent']
    });

    await activityLog.save();
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error - activity logging should not break the main flow
  }
};

/**
 * Middleware to automatically log API requests
 */
export const activityLoggerMiddleware = (
  actionType: string,
  module: string,
  getAction?: (req: Request) => string,
  getDetails?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (user) {
      const action = getAction ? getAction(req) : `${req.method} ${req.path}`;
      const details = getDetails ? getDetails(req) : undefined;

      // Log after response is sent
      res.on('finish', () => {
        const status = res.statusCode >= 400 ? 'failed' : 'success';
        logActivity(
          user._id,
          actionType,
          action,
          module,
          details,
          status,
          {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode
          },
          req
        ).catch(err => console.error('Activity logging failed:', err));
      });
    }

    next();
  };
};

export default logActivity;
