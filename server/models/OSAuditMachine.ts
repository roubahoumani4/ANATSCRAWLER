import mongoose from 'mongoose';

const { Schema } = mongoose;

const osAuditMachineSchema = new Schema({
  machineId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  owner: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  ownerName: {
    type: String,
    required: true,
    description: 'Name of the person who owns/uses this machine'
  },
  machineName: {
    type: String,
    required: true,
    description: 'Display name for the machine'
  },
  machineHostname: {
    type: String,
    description: 'System hostname'
  },
  ipAddress: {
    type: String,
    required: true,
    description: 'IP address of the machine'
  },
  companyName: {
    type: String,
    description: 'Company name associated with this machine'
  },
  operatingSystem: {
    type: String,
    description: 'Operating system type and version'
  },
  osType: {
    type: String,
    enum: ['linux', 'windows'],
    default: 'linux',
    description: 'OS type for agent generation (linux or windows)'
  },
  lynisVersion: {
    type: String,
    description: 'Version of Lynis agent installed'
  },
  agentStatus: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending',
    description: 'Status of the Lynis agent'
  },
  lastAuditDate: {
    type: Date,
    description: 'Date of the last audit'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  agentInstallationToken: {
    type: String,
    unique: true,
    sparse: true,
    description: 'Unique token for agent installation'
  },
  agentInstalledDate: {
    type: Date,
    description: 'Date when the agent was installed'
  },
  metadata: {
    type: Schema.Types.Mixed,
    description: 'Additional machine information'
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
osAuditMachineSchema.pre('save', function (next) {
  // @ts-ignore
  this.updatedAt = new Date();
  next();
});

export interface IOSAuditMachine extends mongoose.Document {
  machineId: string;
  owner: mongoose.Types.ObjectId;
  ownerName: string;
  machineName: string;
  machineHostname?: string;
  ipAddress: string;
  operatingSystem?: string;
  osType?: 'linux' | 'windows';
  lynisVersion?: string;
  agentStatus: 'active' | 'inactive' | 'pending';
  lastAuditDate?: Date;
  registrationDate: Date;
  isActive: boolean;
  agentInstallationToken?: string;
  agentInstalledDate?: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export const OSAuditMachine = mongoose.models.OSAuditMachine || 
  mongoose.model<IOSAuditMachine>('OSAuditMachine', osAuditMachineSchema, 'os_audit_machines');
