import type { Request, Response } from 'express';
import { Router } from 'express';
import { mongodb } from '../../lib/mongodb';

const router = Router();

// Helper function to standardize user responses
function formatUserResponse(user: any) {
  const { password: _, ...userWithoutPassword } = user;
  return {
    _id: userWithoutPassword._id,
    username: userWithoutPassword.username,
    firstName: userWithoutPassword.firstName || '',
    lastName: userWithoutPassword.lastName || '',
    fullName: userWithoutPassword.fullName || '',
    email: userWithoutPassword.email || '',
    organization: userWithoutPassword.organization || '',
    department: userWithoutPassword.department || '',
    jobPosition: userWithoutPassword.jobPosition || '',
    roles: userWithoutPassword.roles || ['user'],
    createdAt: userWithoutPassword.createdAt,
    lastLogin: userWithoutPassword.lastLogin,
    isActive: userWithoutPassword.isActive,
    preferences: userWithoutPassword.preferences,
  };
}

// Middleware to check admin role
function requireAdmin(req: Request, res: Response, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  // Check if user has admin role
  if (!req.user.roles || !req.user.roles.includes('admin')) {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  next();
}

/**
 * GET /profiles
 * Get all user profiles - Admin only
 */
router.get('/profiles', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await mongodb.findUsers({});

    if (result.success && result.users) {
      const userProfiles = result.users.map((user) => formatUserResponse(user));
      res.json({
        success: true,
        users: userProfiles,
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch user profiles' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profiles' });
  }
});

/**
 * Legacy endpoint - kept for backward compatibility
 * GET /user-profiles  
 * Get all user profiles - Admin only
 */
router.get('/user-profiles', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await mongodb.findUsers({});

    if (result.success && result.users) {
      const userProfiles = result.users.map((user) => formatUserResponse(user));
      res.json({
        success: true,
        users: userProfiles,
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch user profiles' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profiles' });
  }
});

/**
 * Legacy endpoint - profile info for EditUserPage
 * GET /profile-info
 * Get profile info for editing
 */
router.get('/profile-info', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userResponse = formatUserResponse(req.user);

    res.json({
      success: true,
      profile: userResponse,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile info' });
  }
});

export default router;
