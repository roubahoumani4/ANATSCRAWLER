import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { mongodb } from '../lib/mongodb';
import { ObjectId } from 'mongodb';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

export default async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ANAT_SECURITY_JWT_SECRET_KEY') as jwt.JwtPayload;
    if (!decoded || !decoded._id) {
      throw new Error('Invalid token structure');
    }

    // Verify user exists in database
    const result = await mongodb.findUsers({ 
      filters: { _id: new ObjectId(decoded._id) } 
    });

    if (!result.success || !result.users || result.users.length === 0) {
      throw new Error('User not found');
    }

    const user = result.users[0];
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
