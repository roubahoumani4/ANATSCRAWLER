import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  browserVersion?: string;
  os: string;
  osVersion?: string;
  ipAddress: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  };
  deviceFingerprint: string;
  token: string;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  isSuspicious: boolean;
  suspiciousReason?: string;
  isBlocked: boolean;
  blockedAt?: Date;
  blockedReason?: string;
}

const SessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown',
  },
  browser: {
    type: String,
    required: true,
  },
  browserVersion: String,
  os: {
    type: String,
    required: true,
  },
  osVersion: String,
  ipAddress: {
    type: String,
    required: true,
    index: true,
  },
  location: {
    country: String,
    city: String,
    region: String,
    latitude: Number,
    longitude: Number,
  },
  deviceFingerprint: {
    type: String,
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    index: true,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // index: true - removed, defined in schema.index() below
  },
  expiresAt: {
    type: Date,
    required: true,
    // index: true - removed, defined in schema.index() below with expireAfterSeconds
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isSuspicious: {
    type: Boolean,
    default: false,
    index: true,
  },
  suspiciousReason: String,
  isBlocked: {
    type: Boolean,
    default: false,
    index: true,
  },
  blockedAt: Date,
  blockedReason: String,
});

// Index for efficient queries
SessionSchema.index({ userId: 1, isActive: 1 });
SessionSchema.index({ userId: 1, createdAt: -1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save hook to check for suspicious activity
SessionSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Check for multiple sessions from same IP
    const sessionsFromIP = await mongoose.model('Session').countDocuments({
      userId: this.userId,
      ipAddress: this.ipAddress,
      isActive: true,
    });

    if (sessionsFromIP >= 3) {
      this.isSuspicious = true;
      this.suspiciousReason = 'Multiple sessions from same IP';
    }

    // Check for multiple devices
    const sessionsCount = await mongoose.model('Session').countDocuments({
      userId: this.userId,
      isActive: true,
    });

    if (sessionsCount >= 5) {
      this.isSuspicious = true;
      this.suspiciousReason = 'Too many concurrent sessions';
    }

    // Check for different country in short time
    const recentSession = await mongoose.model('Session').findOne({
      userId: this.userId,
      isActive: true,
      'location.country': { $exists: true, $ne: this.location?.country },
      createdAt: { $gte: new Date(Date.now() - 3600000) }, // Last hour
    });

    if (recentSession && this.location?.country) {
      this.isSuspicious = true;
      this.suspiciousReason = 'Different country login';
    }
  }

  next();
});

// Export model with check to prevent overwrite error
export const Session = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
