import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IActivityLog extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  username?: string;
  email?: string;
  actionType: string;
  action: string;
  details?: string;
  module: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed' | 'warning';
  metadata?: any;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  username: { type: String },
  email: { type: String },
  actionType: { 
    type: String, 
    required: true,
    enum: [
      'login',
      'logout',
      'failed_login',
      'search',
      'scan',
      'export',
      'settings_change',
      'user_management',
      'api_access',
      'security_event',
      'other'
    ],
    index: true
  },
  action: { 
    type: String, 
    required: true 
  },
  details: { type: String },
  module: { 
    type: String, 
    required: true,
    enum: [
      'Authentication',
      'OSINT Framework',
      'Discovery',
      'Domain Monitoring',
      'Threat Intelligence',
      'Assessment',
      'User Management',
      'Settings',
      'Export System',
      'API',
      'Security',
      'System'
    ]
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: { 
    type: String, 
    enum: ['success', 'failed', 'warning'],
    default: 'success'
  },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // We only need createdAt
});

// Indexes for efficient querying
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ actionType: 1, createdAt: -1 });
activityLogSchema.index({ status: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, actionType: 1, createdAt: -1 });

// TTL index to auto-delete logs older than 90 days (optional)
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', activityLogSchema, 'activity_logs');

