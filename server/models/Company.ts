import mongoose from 'mongoose';

const { Schema } = mongoose;

const companySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    description: 'Company name'
  },
  sector: {
    type: String,
    required: true,
    trim: true,
    description: 'Company sector/category'
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    description: 'Company phone number'
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    description: 'Company email address'
  },
  address: {
    type: String,
    trim: true,
    description: 'Company address'
  },
  website: {
    type: String,
    trim: true,
    description: 'Company website'
  },
  contactPerson: {
    type: String,
    trim: true,
    description: 'Primary contact person name'
  },
  notes: {
    type: String,
    trim: true,
    description: 'Additional notes about the company'
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    description: 'User who created this company'
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

companySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export interface ICompany extends mongoose.Document {
  name: string;
  sector: string;
  phone: string;
  email: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  notes?: string;
  owner: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Company = mongoose.model<ICompany>('Company', companySchema);
