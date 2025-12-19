import axios from 'axios';
import { ELASTICSEARCH_URI } from '../config';
import type { Request } from 'express';

interface LogAdminActionParams {
  req: Request;
  action: string;
  category: string;
  resource: string;
  details?: any;
  status?: 'success' | 'error' | 'warning';
}

/**
 * Log admin actions to Elasticsearch
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  try {
    const { req, action, category, resource, details, status = 'success' } = params;
    
    const user = req.user as any;
    
    const log = {
      logType: 'admin_action',
      adminId: user?._id || user?.id || 'unknown',
      adminEmail: user?.email || 'unknown',
      adminName: user?.name || user?.username || user?.email || 'unknown',
      action,
      category,
      resource,
      details: details || {},
      status,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    // Create index with current date
    const indexName = `admin-logs-${new Date().toISOString().split('T')[0]}`;

    // Fire and forget - don't wait for response
    axios.post(`${ELASTICSEARCH_URI}/${indexName}/_doc`, log).catch(err => {
      console.error('Failed to log admin action:', err.message);
    });
  } catch (error: any) {
    // Silently fail - logging shouldn't break the main operation
    console.error('Error in logAdminAction:', error.message);
  }
}
