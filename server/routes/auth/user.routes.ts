import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import sanitizeHtml from 'sanitize-html';
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

/**
 * GET /profile
 * Get current user profile
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userResponse = formatUserResponse(req.user);

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

/**
 * PUT /profile
 * Update user profile
 */
router.put('/profile', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { username, email, firstName, lastName, organization, department, jobPosition } =
      req.body;

    // Validate input
    if (username && typeof username === 'string') {
      if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
      }
    }

    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Update user
    const updateData: any = {};
    if (username) updateData.username = username.toLowerCase();
    if (email) updateData.email = email.toLowerCase();
    if (firstName) updateData.firstName = sanitizeHtml(firstName);
    if (lastName) updateData.lastName = sanitizeHtml(lastName);
    if (organization) updateData.organization = sanitizeHtml(organization);
    if (department) updateData.department = sanitizeHtml(department);
    if (jobPosition) updateData.jobPosition = sanitizeHtml(jobPosition);

    const result = await mongodb.updateUser(req.user._id, updateData);

    if (result.success) {
      res.json({ success: true, message: 'Profile updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * PUT /password
 * Change user password
 */
router.put('/password', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, req.user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const result = await mongodb.updateUser(req.user._id, { password: hashedPassword });

    if (result.success) {
      res.json({ success: true, message: 'Password changed successfully' });
    } else {
      res.status(500).json({ error: 'Failed to change password' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * PUT /change-password
 * Legacy endpoint for password change
 */
router.put('/change-password', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, req.user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const result = await mongodb.updateUser(req.user._id, { password: hashedPassword });

    if (result.success) {
      res.json({ success: true, message: 'Password updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update password' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

/**
 * PUT /update-username
 * Update username - Legacy endpoint for EditProfilePage
 */
router.put('/update-username', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    // Check if username is already taken
    const existingUser = await mongodb.findUsers({
      filters: {
        username: username.toLowerCase(),
        _id: { $ne: new ObjectId(req.user._id) },
      },
    });

    if (existingUser.success && existingUser.users && existingUser.users.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Update username
    const result = await mongodb.updateUser(req.user._id, { username: username.toLowerCase() });

    if (result.success) {
      res.json({ success: true, message: 'Username updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update username' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update username' });
  }
});

/**
 * PUT /update-profile
 * Update profile - Legacy endpoint for EditProfilePage
 */
router.put('/update-profile', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { email, firstName, lastName, organization, department, jobPosition } = req.body;

    // Validate email if provided
    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Update user
    const updateData: any = {};
    if (email) updateData.email = email.toLowerCase();
    if (firstName) updateData.firstName = sanitizeHtml(firstName);
    if (lastName) updateData.lastName = sanitizeHtml(lastName);
    if (organization) updateData.organization = sanitizeHtml(organization);
    if (department) updateData.department = sanitizeHtml(department);
    if (jobPosition) updateData.jobPosition = sanitizeHtml(jobPosition);

    const result = await mongodb.updateUser(req.user._id, updateData);

    if (result.success) {
      res.json({ success: true, message: 'Profile updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
