import { Request } from 'express';
import { Session } from '../models/Session';
import crypto from 'crypto';

interface SessionData {
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Create a device fingerprint based on user agent and other factors
 */
export function createDeviceFingerprint(userAgent: string, ipAddress: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(userAgent + ipAddress);
  return hash.digest('hex');
}

/**
 * Parse user agent to extract device info (simple parser)
 */
export function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
  let browser = 'Unknown';
  let browserVersion = '';
  let os = 'Unknown';
  let osVersion = '';
  
  // Detect device type
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  } else if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
    deviceType = 'desktop';
  }
  
  // Detect browser
  if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/([\d.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('edg')) {
    browser = 'Edge';
    const match = ua.match(/edg\/([\d.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('chrome')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/([\d.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('safari')) {
    browser = 'Safari';
    const match = ua.match(/version\/([\d.]+)/);
    if (match) browserVersion = match[1];
  }
  
  // Detect OS
  if (ua.includes('windows')) {
    os = 'Windows';
    if (ua.includes('windows nt 10')) osVersion = '10';
    else if (ua.includes('windows nt 11')) osVersion = '11';
  } else if (ua.includes('mac')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
    const match = ua.match(/android\s([\d.]+)/);
    if (match) osVersion = match[1];
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    const match = ua.match(/os\s([\d_]+)/);
    if (match) osVersion = match[1].replace(/_/g, '.');
  }

  return {
    deviceType,
    browser,
    browserVersion,
    os,
    osVersion,
  };
}

/**
 * Get IP address from request
 */
export function getIpAddress(req: Request): string {
  // Check various headers for real IP (useful when behind proxy/load balancer)
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xRealIp = req.headers['x-real-ip'];
  
  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    return ips.split(',')[0].trim();
  }
  
  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }
  
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Create a new session
 */
export async function createSession(data: SessionData): Promise<any> {
  try {
    const { userId, token, ipAddress, userAgent } = data;
    
    // Parse user agent
    const deviceInfo = parseUserAgent(userAgent);
    
    // Create device fingerprint
    const deviceFingerprint = createDeviceFingerprint(userAgent, ipAddress);
    
    // Set session expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Create session
    const session = new Session({
      userId,
      token,
      ipAddress,
      deviceFingerprint,
      ...deviceInfo,
      expiresAt,
      isActive: true,
    });
    
    await session.save();
    
    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(token: string): Promise<void> {
  try {
    await Session.findOneAndUpdate(
      { token, isActive: true },
      { lastActivity: new Date() }
    );
  } catch (error) {
    console.error('Error updating session activity:', error);
  }
}

/**
 * Terminate session by token
 */
export async function terminateSession(token: string): Promise<void> {
  try {
    await Session.findOneAndUpdate(
      { token },
      { isActive: false }
    );
  } catch (error) {
    console.error('Error terminating session:', error);
    throw error;
  }
}

/**
 * Terminate all sessions for a user
 */
export async function terminateAllUserSessions(userId: string): Promise<number> {
  try {
    const result = await Session.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );
    
    return result.modifiedCount;
  } catch (error) {
    console.error('Error terminating user sessions:', error);
    throw error;
  }
}

/**
 * Check if session is valid
 */
export async function isSessionValid(token: string): Promise<boolean> {
  try {
    const session = await Session.findOne({
      token,
      isActive: true,
      isBlocked: false,
      expiresAt: { $gt: new Date() },
    });
    
    return !!session;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
}

/**
 * Get active sessions for a user
 */
export async function getUserActiveSessions(userId: string): Promise<any[]> {
  try {
    const sessions = await Session.find({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastActivity: -1 })
      .lean();
    
    return sessions;
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return [];
  }
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await Session.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return 0;
  }
}

/**
 * Enforce concurrent session limit for a user
 */
export async function enforceSessionLimit(userId: string, maxSessions: number = 5): Promise<void> {
  try {
    const sessions = await Session.find({
      userId,
      isActive: true,
    })
      .sort({ lastActivity: -1 })
      .lean();
    
    // If user has more than allowed sessions, terminate the oldest ones
    if (sessions.length > maxSessions) {
      const sessionsToTerminate = sessions.slice(maxSessions);
      const sessionIds = sessionsToTerminate.map(s => s._id);
      
      await Session.updateMany(
        { _id: { $in: sessionIds } },
        { isActive: false }
      );
    }
  } catch (error) {
    console.error('Error enforcing session limit:', error);
  }
}
