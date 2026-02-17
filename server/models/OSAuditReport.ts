import mongoose from 'mongoose';

const { Schema } = mongoose;

const osAuditReportSchema = new Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  machine: {
    type: Schema.Types.ObjectId,
    ref: 'OSAuditMachine',
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  auditDate: {
    type: Date,
    default: Date.now
  },
  machineName: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  operatingSystem: {
    type: String,
    description: 'OS information from the audit'
  },
  auditScore: {
    type: Number,
    min: 0,
    max: 100,
    description: 'Overall security score from Lynis'
  },
  warnings: {
    type: Number,
    default: 0,
    description: 'Count of warnings found'
  },
  suggestions: {
    type: Number,
    default: 0,
    description: 'Count of suggestions provided'
  },
  systemHardening: {
    type: Number,
    description: 'System hardening score'
  },
  findings: [
    {
      id: String,
      test: String,
      description: String,
      result: {
        type: String,
        enum: ['PASS', 'WARNING', 'SUGGESTION', 'INFO']
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      recommendation: String
    }
  ],
  sections: {
    type: Schema.Types.Mixed,
    description: 'Detailed audit sections (initialization, file systems, storage, etc.)'
  },
  rawReport: {
    type: String,
    description: 'Raw Lynis report output'
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'pending'],
    default: 'completed'
  },
  errorMessage: {
    type: String,
    description: 'Error message if audit failed'
  },
  auditDuration: {
    type: Number,
    description: 'Duration of audit in seconds'
  },
  lynisVersion: {
    type: String,
    description: 'Version of Lynis used'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
osAuditReportSchema.pre('save', function (next) {
  // @ts-ignore
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
osAuditReportSchema.index({ owner: 1, machine: 1, auditDate: -1 });
osAuditReportSchema.index({ owner: 1, auditDate: -1 });

export interface IOSAuditReport extends mongoose.Document {
  reportId: string;
  machine: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  auditDate: Date;
  machineName: string;
  ipAddress: string;
  ownerName: string;
  operatingSystem?: string;
  auditScore?: number;
  warnings: number;
  suggestions: number;
  systemHardening?: number;
  findings: Array<{
    id: string;
    test: string;
    description: string;
    result: 'PASS' | 'WARNING' | 'SUGGESTION' | 'INFO';
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
  }>;
  sections?: any;
  rawReport?: string;
  status: 'completed' | 'failed' | 'pending';
  errorMessage?: string;
  auditDuration?: number;
  lynisVersion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const OSAuditReport = mongoose.models.OSAuditReport || 
  mongoose.model<IOSAuditReport>('OSAuditReport', osAuditReportSchema, 'os_audit_reports');
