import mongoose from 'mongoose';

const { Schema } = mongoose;

const installationPackageSchema = new Schema({
  packageId: {
    type: String,
    required: true,
    unique: true,
    description: 'Unique package identifier'
  },
  name: {
    type: String,
    required: true,
    trim: true,
    description: 'Package name'
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    description: 'Company this package belongs to'
  },
  osType: {
    type: String,
    enum: ['linux', 'windows'],
    required: true,
    description: 'Target operating system'
  },
  supportedVersions: {
    type: [String],
    default: [],
    description: 'Supported OS versions'
  },
  agentToken: {
    type: String,
    required: true,
    unique: true,
    description: 'Token embedded in agent for automatic company identification'
  },
  description: {
    type: String,
    trim: true,
    description: 'Package description'
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    description: 'User who created this package'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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

installationPackageSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export interface IInstallationPackage extends mongoose.Document {
  packageId: string;
  name: string;
  company: mongoose.Types.ObjectId;
  osType: 'linux' | 'windows';
  supportedVersions: string[];
  agentToken: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  downloadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const InstallationPackage = mongoose.model<IInstallationPackage>('InstallationPackage', installationPackageSchema);
