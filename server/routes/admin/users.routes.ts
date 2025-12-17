import type { Request, Response } from 'express';
import { Router } from 'express';
import { mongodb } from '../../lib/mongodb';
import bcrypt from 'bcryptjs';

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

/**
 * GET /users
 * Get all users - Admin only
 */
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await mongodb.findUsers({});

    if (result.success && result.users) {
      const userList = result.users.map((user) => formatUserResponse(user));
      res.json({
        success: true,
        users: userList,
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * POST /users
 * Create a new user - Admin only
 */
router.post('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "admin" or "user"' });
    }

    // Check if user already exists
    const existingUser = await mongodb.findUsers({ 
      filters: { 
        $or: [{ username }, { email }] 
      } 
    });

    if (existingUser.success && existingUser.users && existingUser.users.length > 0) {
      return res.status(400).json({ error: 'User with this username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      roles: [role],
      createdAt: new Date(),
      isActive: true,
      preferences: {
        theme: 'dark',
        language: 'English',
        autoLogoutTime: 30,
        mfaEnabled: false,
        showIndexedFiles: true,
        showRecentSearches: true
      }
    };

    const result = await mongodb.createUser(newUser);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        userId: result.userId
      });
    } else {
      res.status(500).json({ error: result.error || 'Failed to create user' });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * DELETE /users/:id
 * Delete a user - Admin only
 */
router.delete('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user && req.user._id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await mongodb.deleteUser(id);

    if (result.success) {
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } else {
      res.status(404).json({ error: result.error || 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * PATCH /users/:id/role
 * Update user role - Admin only
 */
router.patch('/users/:id/role', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validation
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "admin" or "user"' });
    }

    // Prevent admin from changing their own role
    if (req.user && req.user._id === id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const result = await mongodb.updateUser(id, { roles: [role] });

    if (result.success) {
      res.json({
        success: true,
        message: 'User role updated successfully'
      });
    } else {
      res.status(404).json({ error: result.error || 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
