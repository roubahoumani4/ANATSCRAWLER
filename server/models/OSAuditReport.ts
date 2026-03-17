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
  kernelVersion: {
    type: String,
    description: 'Kernel version from the audited machine'
  },
  hostname: {
    type: String,
    description: 'Hostname of the audited machine'
  },
  companyName: {
    type: String,
    description: 'Company name for the audit report'
  },
  osType: {
    type: String,
    enum: ['linux', 'windows'],
    default: 'linux',
    description: 'OS type that produced this report'
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
  lynisLogFile: {
    type: String,
    default: '/var/log/lynis.log',
    description: 'Path to Lynis log file on the audited machine'
  },
  lynisReportFile: {
    type: String,
    default: '/var/log/lynis-report.dat',
    description: 'Path to Lynis report data file on the audited machine'
  },
  logFileContent: {
    type: String,
    description: 'Content of /var/log/lynis.log (test and debug information)'
  },
  reportFileContent: {
    type: String,
    description: 'Content of /var/log/lynis-report.dat (report data)'
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
  pdfFilePath: {
    type: String,
    description: 'Path to pre-generated PDF report file'
  },
  pdfGenerationStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    description: 'Status of background PDF generation'
  },
  pdfGenerationError: {
    type: String,
    description: 'Error message if PDF generation failed'
  },
  aiEnrichmentData: {
    type: Schema.Types.Mixed,
    description: 'Cached AI enrichment results for findings'
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
  osType?: 'linux' | 'windows';
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
  lynisLogFile?: string;
  lynisReportFile?: string;
  logFileContent?: string;
  reportFileContent?: string;
  status: 'completed' | 'failed' | 'pending';
  errorMessage?: string;
  auditDuration?: number;
  lynisVersion?: string;
  pdfFilePath?: string;
  pdfGenerationStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  pdfGenerationError?: string;
  aiEnrichmentData?: any;
  createdAt: Date;
  updatedAt: Date;
}

export const OSAuditReport = mongoose.models.OSAuditReport || 
  mongoose.model<IOSAuditReport>('OSAuditReport', osAuditReportSchema, 'os_audit_reports');
