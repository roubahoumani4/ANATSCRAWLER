import bcrypt from 'bcryptjs';
import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { mongodb } from '../../lib/mongodb';

const router = createRouter();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'ANAT_SECURITY_JWT_SECRET_KEY';
const TOKEN_EXPIRATION = '24h';

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
 * POST /login
 * Authenticate user with username and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password, twoFactorToken } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username
    const result = await mongodb.findUsers({
      filters: { username: username.toLowerCase() },
    });

    if (!result.success || !result.users || result.users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.users[0];

    // Check if user is active
    if (user.isActive === false) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if 2FA is enabled
    if ((user.preferences as any)?.mfaEnabled && (user.preferences as any)?.mfaSecret) {
      // If 2FA token not provided, ask for it
      if (!twoFactorToken) {
        return res.status(200).json({
          success: false,
          requiresTwoFactor: true,
          message: '2FA token required',
        });
      }

      // Verify 2FA token
      const speakeasy = require('speakeasy');
      const verified = speakeasy.totp.verify({
        secret: (user.preferences as any).mfaSecret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 2,
      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid 2FA token' });
      }
    }

    // Calculate token expiration based on user's session timeout preference
    const sessionTimeout = (user.preferences as any)?.sessionTimeout || 30; // minutes
    const tokenExpiration = `${sessionTimeout}m`;

    // Generate JWT token with proper options
    const token = jwt.sign(
      { _id: user._id, username: user.username, roles: user.roles || ['user'] },
      JWT_SECRET,
      { expiresIn: tokenExpiration } as jwt.SignOptions,
    );

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: sessionTimeout * 60 * 1000, // Convert minutes to milliseconds
    });

    // Update last login
    if (user._id) {
      await mongodb.updateUser(user._id.toString(), { lastLogin: new Date() });
    }

    // Return user info (without password) and token
    const userResponse = formatUserResponse(user);

    res.json({
      success: true,
      user: userResponse,
      token,
      sessionTimeout,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /validate
 * Validate JWT token and return user info
 */
router.get('/validate', async (req: Request, res: Response) => {
  try {
    // Try Authorization header first, then cookie
    let token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        valid: false,
        error: 'No token provided',
        message: 'Please log in to continue',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { _id: string };
    if (!decoded || !decoded._id) {
      return res.status(401).json({
        valid: false,
        error: 'Invalid token structure',
        message: 'Please log in again',
      });
    }

    // Verify user exists and is active
    const result = await mongodb.findUsers({
      filters: {
        _id: new ObjectId(decoded._id),
        isActive: { $ne: false },
      },
    });

    if (!result.success || !result.users || result.users.length === 0) {
      return res.status(401).json({
        valid: false,
        error: 'User not found or inactive',
        message: 'Please log in again',
      });
    }

    const user = result.users[0];

    // Return user info (without password)
    const userResponse = formatUserResponse(user);

    res.json({
      valid: true,
      user: userResponse,
      message: 'Token is valid',
    });
  } catch (error) {
    console.error('Token validation error:', error);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        valid: false,
        error: 'Token expired',
        message: 'Please log in again',
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        valid: false,
        error: 'Invalid token',
        message: 'Please log in again',
      });
    }

    res.status(500).json({
      valid: false,
      error: 'Token validation failed',
      message: 'Please try again',
    });
  }
});

/**
 * POST /logout
 * Clear authentication cookie
 */
router.post('/logout', (req: Request, res: Response) => {
  // Clear the token cookie
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
