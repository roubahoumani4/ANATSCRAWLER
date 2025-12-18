import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { mongodb } from '../../lib/mongodb';
import authenticate from '../../middleware/auth';
import { logActivity } from '../../utils/activityLogger';

const router = createRouter();

/**
 * POST /setup
 * Generate 2FA secret and QR code for user
 */
router.post('/setup', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `ANAT OSINT (${req.user.username})`,
      issuer: 'ANAT OSINT Platform',
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Store secret temporarily (not enabled yet)
    await mongodb.updateUser(req.user._id.toString(), {
      'preferences.mfaSecret': secret.base32,
    } as any);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Scan the QR code with your authenticator app',
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

/**
 * POST /verify
 * Verify 2FA token and enable 2FA
 */
router.post('/verify', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const secret = (req.user.preferences as any)?.mfaSecret;
    if (!secret) {
      return res.status(400).json({ error: '2FA not set up. Please run setup first.' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps before/after for clock skew
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Enable 2FA
    await mongodb.updateUser(req.user._id.toString(), {
      'preferences.mfaEnabled': true,
    } as any);

    // Log 2FA enabled activity
    await logActivity(
      req.user._id,
      'settings_change',
      '2FA enabled',
      'Security',
      'Two-factor authentication has been enabled',
      'success',
      { action: '2fa_enabled' },
      req
    );

    res.json({
      success: true,
      message: '2FA enabled successfully',
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

/**
 * POST /disable
 * Disable 2FA for user
 */
router.post('/disable', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { password, token } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, req.user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // If 2FA is currently enabled, require token
    if (req.user.preferences?.mfaEnabled) {
      if (!token) {
        return res.status(400).json({ error: '2FA token is required' });
      }

      const secret = (req.user.preferences as any)?.mfaSecret;
      if (!secret) {
        return res.status(400).json({ error: '2FA secret not found' });
      }

      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2,
      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid 2FA token' });
      }
    }

    // Disable 2FA and remove secret
    await mongodb.updateUser(req.user._id.toString(), {
      'preferences.mfaEnabled': false,
      'preferences.mfaSecret': null,
    } as any);

    // Log 2FA disabled activity
    await logActivity(
      req.user._id,
      'settings_change',
      '2FA disabled',
      'Security',
      'Two-factor authentication has been disabled',
      'warning',
      { action: '2fa_disabled' },
      req
    );

    res.json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

/**
 * POST /validate
 * Validate 2FA token during login
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { username, token } = req.body;

    if (!username || !token) {
      return res.status(400).json({ error: 'Username and token are required' });
    }

    // Find user
    const result = await mongodb.findUsers({
      filters: { username: username.toLowerCase() },
    });

    if (!result.success || !result.users || result.users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.users[0];

    if (!(user.preferences as any)?.mfaEnabled || !(user.preferences as any)?.mfaSecret) {
      return res.status(400).json({ error: '2FA not enabled for this user' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: (user.preferences as any).mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid 2FA token' });
    }

    res.json({
      success: true,
      message: '2FA token validated',
    });
  } catch (error) {
    console.error('2FA validation error:', error);
    res.status(500).json({ error: 'Failed to validate 2FA' });
  }
});

export default router;
