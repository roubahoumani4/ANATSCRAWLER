import express, { Request, Response } from 'express';
import { Session } from '../../models/Session';
import { User } from '../../models/User';
import { socketService } from '../../services/socket.service';

const router = express.Router();

/**
 * @route   GET /api/v1/admin/sessions
 * @desc    Get all sessions with filters
 * @access  Admin
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      deviceType,
      isActive,
      isSuspicious,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query: any = {};

    if (userId) query.userId = userId;
    if (deviceType) query.deviceType = deviceType;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isSuspicious !== undefined) query.isSuspicious = isSuspicious === 'true';
    
    if (search) {
      query.$or = [
        { ipAddress: { $regex: search, $options: 'i' } },
        { browser: { $regex: search, $options: 'i' } },
        { os: { $regex: search, $options: 'i' } },
        { 'location.country': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const sessions = await Session.find(query)
      .populate('userId', 'username email roles')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions: sessions.map(session => ({
          ...session,
          username: (session.userId as any)?.username,
          email: (session.userId as any)?.email,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions',
    });
  }
});

/**
 * @route   GET /api/v1/admin/sessions/stats
 * @desc    Get session statistics
 * @access  Admin
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const query: any = userId ? { userId } : {};

    const totalSessions = await Session.countDocuments(query);
    const activeSessions = await Session.countDocuments({ ...query, isActive: true });
    const suspiciousSessions = await Session.countDocuments({ ...query, isSuspicious: true });
    const blockedSessions = await Session.countDocuments({ ...query, isBlocked: true });

    const deviceBreakdown = await Session.aggregate([
      { $match: { ...query, isActive: true } },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const topBrowsers = await Session.aggregate([
      { $match: { ...query, isActive: true } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: {
        totalSessions,
        activeSessions,
        suspiciousSessions,
        blockedSessions,
        deviceBreakdown,
        topBrowsers,
      },
    });
  } catch (error) {
    console.error('Error fetching session stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session statistics',
    });
  }
});

/**
 * @route   GET /api/v1/admin/sessions/:sessionId
 * @desc    Get session details
 * @access  Admin
 */
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId)
      .populate('userId', 'username email roles')
      .lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session',
    });
  }
});

/**
 * @route   POST /api/v1/admin/sessions/:sessionId/terminate
 * @desc    Terminate a specific session
 * @access  Admin
 */
router.post('/:sessionId/terminate', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Store the token before updating
    const sessionToken = session.token;

    // Update session to inactive
    session.isActive = false;
    await session.save();

    // Emit real-time termination event via Socket.IO
    try {
      socketService.terminateSessionByToken(sessionToken);
      console.log(`🔴 Real-time termination event sent for session ${sessionId}`);
    } catch (socketError) {
      console.error('Failed to emit socket event:', socketError);
      // Continue even if socket event fails
    }

    res.json({
      success: true,
      message: 'Session terminated successfully',
      data: session,
    });
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to terminate session',
    });
  }
});

/**
 * @route   POST /api/v1/admin/sessions/:sessionId/block
 * @desc    Block a specific session
 * @access  Admin
 */
router.post('/:sessionId/block', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const session = await Session.findByIdAndUpdate(
      sessionId,
      {
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: reason || 'Blocked by admin',
        isActive: false,
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      message: 'Session blocked successfully',
      data: session,
    });
  } catch (error) {
    console.error('Error blocking session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to block session',
    });
  }
});

/**
 * @route   POST /api/v1/admin/sessions/user/:userId/terminate-all
 * @desc    Terminate all sessions for a user
 * @access  Admin
 */
router.post('/user/:userId/terminate-all', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await Session.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Emit real-time termination event via Socket.IO for all user sessions
    try {
      socketService.terminateAllUserSessions(userId);
      console.log(`🔴 Real-time termination event sent for all sessions of user ${userId}`);
    } catch (socketError) {
      console.error('Failed to emit socket event:', socketError);
      // Continue even if socket event fails
    }

    res.json({
      success: true,
      message: `Terminated ${result.modifiedCount} session(s)`,
      data: {
        terminatedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error terminating user sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to terminate user sessions',
    });
  }
});

/**
 * @route   GET /api/v1/admin/sessions/user/:userId
 * @desc    Get all sessions for a specific user
 * @access  Admin
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const sessions = await Session.find({ userId })
      .sort({ lastActivity: -1 })
      .lean();

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user sessions',
    });
  }
});

/**
 * @route   DELETE /api/v1/admin/sessions/cleanup
 * @desc    Cleanup expired and old inactive sessions
 * @access  Admin
 */
router.delete('/cleanup', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const result = await Session.deleteMany({
      $or: [
        { expiresAt: { $lt: now } },
        { isActive: false, lastActivity: { $lt: thirtyDaysAgo } },
      ],
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} session(s)`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup sessions',
    });
  }
});

export default router;
