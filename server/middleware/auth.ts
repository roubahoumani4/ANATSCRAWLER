import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { mongodb } from '../lib/mongodb';
import { ObjectId } from 'mongodb';
import type { User } from '../types/User';

const JWT_SECRET = process.env.JWT_SECRET || 'ANAT_SECURITY_JWT_SECRET_KEY';

export default async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { _id: string };
    if (!decoded || !decoded._id) {
      throw new Error('Invalid token structure');
    }

    // Verify user exists in database and is active
    const result = await mongodb.findUsers({ 
      filters: { 
        _id: new ObjectId(decoded._id),
        isActive: { $ne: false }  // User is active or field doesn't exist
      } 
    });

    if (!result.success || !result.users || result.users.length === 0) {
      throw new Error('User not found or inactive');
    }

    const user = result.users[0] as User;
    
    // Update last login
    await mongodb.updateUser(decoded._id, { lastLogin: new Date() });

    // Attach user and token to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
}
