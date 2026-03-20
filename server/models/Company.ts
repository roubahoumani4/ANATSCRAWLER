import mongoose from 'mongoose';

const { Schema } = mongoose;

const companySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    description: 'Company name'
  },
  companyType: {
    type: String,
    trim: true,
    default: 'Customer',
    description: 'Company type (Customer, Partner, etc.)'
  },
  country: {
    type: String,
    trim: true,
    description: 'Company country'
  },
  industry: {
    type: String,
    trim: true,
    description: 'Company industry'
  },
  sector: {
    type: String,
    trim: true,
    description: 'Company sector/category'
  },
  phone: {
    type: String,
    trim: true,
    description: 'Company phone number'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    description: 'Company email address'
  },
  address: {
    type: String,
    trim: true,
    description: 'Registered address'
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
  managedEndpointSecurity: {
    type: Boolean,
    default: true,
    description: 'The company manages endpoint security'
  },
  totalSeats: {
    type: Number,
    default: 0,
    description: 'Total number of seats'
  },
  usedSeats: {
    type: Number,
    default: 0,
    description: 'Number of used reserved seats'
  },
  availableSeats: {
    type: Number,
    default: 0,
    description: 'Number of available reserved seats'
  },
  companyStatus: {
    type: String,
    default: 'Active',
    description: 'Company status (Active, Inactive, Suspended)'
  },
  paymentPlan: {
    type: String,
    default: 'Monthly',
    description: 'Payment plan'
  },
  productName: {
    type: String,
    default: 'Monthly Subscription',
    description: 'Product name'
  },
  licenseKey: {
    type: String,
    trim: true,
    description: 'License key'
  },
  expiryDate: {
    type: String,
    default: 'Never',
    description: 'License expiry date'
  },
  logoUrl: {
    type: String,
    trim: true,
    description: 'URL to the company logo'
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
  // Auto-generate license key if not set
  if (!this.licenseKey) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 12; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.licenseKey = key;
  }
  // Calculate total seats
  this.totalSeats = (this.usedSeats || 0) + (this.availableSeats || 0);
  next();
});

export interface ICompany extends mongoose.Document {
  name: string;
  companyType: string;
  country?: string;
  industry?: string;
  sector?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  notes?: string;
  managedEndpointSecurity: boolean;
  totalSeats: number;
  usedSeats: number;
  availableSeats: number;
  companyStatus: string;
  paymentPlan: string;
  productName: string;
  licenseKey?: string;
  expiryDate: string;
  logoUrl?: string;
  owner: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Company = mongoose.model<ICompany>('Company', companySchema);
