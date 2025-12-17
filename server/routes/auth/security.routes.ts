import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { mongodb } from '../../lib/mongodb';
import authenticate from '../../middleware/auth';

const router = createRouter();

/**
 * PUT /session-timeout
 * Update user's session timeout preference
 */
router.put('/session-timeout', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { sessionTimeout } = req.body;

    if (typeof sessionTimeout !== 'number' || sessionTimeout < 5 || sessionTimeout > 1440) {
      return res.status(400).json({ 
        error: 'Invalid session timeout. Must be between 5 and 1440 minutes (24 hours)' 
      });
    }

    // Update session timeout preference
    await mongodb.updateUser(req.user._id.toString(), {
      'preferences.sessionTimeout': sessionTimeout,
    } as any);

    res.json({
      success: true,
      sessionTimeout,
      message: 'Session timeout updated successfully',
    });
  } catch (error) {
    console.error('Session timeout update error:', error);
    res.status(500).json({ error: 'Failed to update session timeout' });
  }
});

/**
 * GET /settings
 * Get user's security settings
 */
router.get('/settings', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    res.json({
      success: true,
      settings: {
        mfaEnabled: req.user.preferences?.mfaEnabled || false,
        sessionTimeout: req.user.preferences?.sessionTimeout || 30,
      },
    });
  } catch (error) {
    console.error('Get security settings error:', error);
    res.status(500).json({ error: 'Failed to get security settings' });
  }
});

export default router;
