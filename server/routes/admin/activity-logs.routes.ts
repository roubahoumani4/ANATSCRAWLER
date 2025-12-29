import { Router, Request, Response } from 'express';
import { ActivityLog } from '../../models/ActivityLog';
import { User } from '../../models/User';
import { Parser } from 'json2csv';

const router = Router();

/**
 * GET /api/v1/admin/activity-logs
 * Get activity logs with filtering and pagination
 * Admin only - can see all users' logs
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      userId,
      actionType,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query: any = {};

    if (userId) {
      query.userId = userId;
    }

    if (actionType) {
      query.actionType = actionType;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'username email')
        .lean(),
      ActivityLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity logs',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/admin/activity-logs/export
 * Export activity logs to CSV or JSON
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { 
      format = 'csv',
      userId,
      actionType,
      status,
      startDate,
      endDate
    } = req.query;

    // Build query (same as above)
    const query: any = {};
    if (userId) query.userId = userId;
    if (actionType) query.actionType = actionType;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'username email')
      .limit(10000) // Limit exports to 10k records
      .lean();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${Date.now()}.json"`);
      return res.json(logs);
    }

    // CSV export
    const fields = [
      { label: 'Date/Time', value: 'createdAt' },
      { label: 'Username', value: 'username' },
      { label: 'Email', value: 'email' },
      { label: 'Action Type', value: 'actionType' },
      { label: 'Action', value: 'action' },
      { label: 'Details', value: 'details' },
      { label: 'Module', value: 'module' },
      { label: 'Status', value: 'status' },
      { label: 'IP Address', value: 'ipAddress' },
      { label: 'User Agent', value: 'userAgent' }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(logs);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Error exporting activity logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export activity logs',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/admin/activity-logs/stats
 * Get activity statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    // Add userId filter if provided
    if (userId && userId !== 'all') {
      query.userId = userId;
    }

    const [
      totalActivities,
      successCount,
      failedCount,
      actionTypeCounts,
      recentActivities
    ] = await Promise.all([
      ActivityLog.countDocuments(query),
      ActivityLog.countDocuments({ ...query, status: 'success' }),
      ActivityLog.countDocuments({ ...query, status: 'failed' }),
      ActivityLog.aggregate([
        { $match: query },
        { $group: { _id: '$actionType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'username email')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        totalActivities,
        successCount,
        failedCount,
        warningCount: totalActivities - successCount - failedCount,
        actionTypeCounts,
        recentActivities
      }
    });
  } catch (error: any) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity statistics',
      message: error.message
    });
  }
});

/**
 * DELETE /api/v1/admin/activity-logs
 * Delete activity logs (bulk delete by filter)
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const { olderThan, actionType, status } = req.body;

    const query: any = {};

    if (olderThan) {
      query.createdAt = { $lt: new Date(olderThan) };
    }

    if (actionType) {
      query.actionType = actionType;
    }

    if (status) {
      query.status = status;
    }

    const result = await ActivityLog.deleteMany(query);

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error: any) {
    console.error('Error deleting activity logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete activity logs',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/admin/activity-logs/users
 * Get list of users for dropdown filter
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, {
      _id: 1,
      username: 1,
      email: 1,
      roles: 1
    }).sort({ username: 1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/admin/activity-logs/stats
 * Get overall activity statistics for dashboard
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [
      total,
      today,
      thisWeek,
      byActionType
    ] = await Promise.all([
      // Total activities
      ActivityLog.countDocuments(),

      // Today's activities
      ActivityLog.countDocuments({
        createdAt: { $gte: startOfToday }
      }),

      // This week's activities
      ActivityLog.countDocuments({
        createdAt: { $gte: startOfWeek }
      }),

      // By action type
      ActivityLog.aggregate([
        { $group: { _id: '$actionType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total,
        today,
        thisWeek,
        byActionType
      }
    });
  } catch (error: any) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity stats',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/admin/activity-logs/user-summary/:userId
 * Get activity summary for a specific user
 */
router.get('/user-summary/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get user info
    const user = await User.findById(userId, { username: 1, email: 1, roles: 1 });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Convert userId to ObjectId for aggregation
    const mongoose = require('mongoose');
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get activity statistics
    const [
      totalActivities,
      actionTypeCounts,
      statusCounts,
      recentActivities,
      dailyActivity
    ] = await Promise.all([
      // Total activities
      ActivityLog.countDocuments({ userId: userObjectId }),

      // By action type
      ActivityLog.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: '$actionType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // By status
      ActivityLog.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Recent 10 activities
      ActivityLog.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'username email'),

      // Daily activity (last 30 days)
      ActivityLog.aggregate([
        {
          $match: {
            userId: userObjectId,
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          roles: user.roles
        },
        statistics: {
          total: totalActivities,
          byActionType: actionTypeCounts.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byStatus: statusCounts.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        recentActivities,
        dailyActivity: dailyActivity.map((item: any) => ({
          date: item._id,
          count: item.count
        }))
      }
    });
  } catch (error: any) {
    console.error('Error fetching user summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user summary',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/admin/activity-logs/export/user/:userId
 * Export activities for a specific user
 */
router.get('/export/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { format = 'csv' } = req.query;

    // Get user info
    const user = await User.findById(userId, { username: 1, email: 1 });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Fetch all activities for this user
    const activities = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'username email')
      .lean();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${user.username}-${new Date().toISOString()}.json`);
      return res.json(activities);
    }

    // CSV export
    const fields = [
      { label: 'Date', value: 'createdAt' },
      { label: 'Username', value: 'userId.username' },
      { label: 'Email', value: 'userId.email' },
      { label: 'Action Type', value: 'actionType' },
      { label: 'Action', value: 'action' },
      { label: 'Details', value: 'details' },
      { label: 'Module', value: 'module' },
      { label: 'Status', value: 'status' },
      { label: 'IP Address', value: 'ipAddress' }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(activities);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${user.username}-${new Date().toISOString()}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error('Error exporting user activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export user activities',
      message: error.message
    });
  }
});

export default router;
