import mongoose from 'mongoose';

const { Schema } = mongoose;

const searchHistorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  searchType: { 
    type: String, 
    enum: ['discovery', 'domain-monitoring'], 
    required: true,
    index: true 
  },
  query: { type: String, required: true },
  queryType: { type: String }, // email, username, domain, etc.
  resultsCount: { type: Number, default: 0 },
  hasResults: { type: Boolean, default: false },
  results: { type: Schema.Types.Mixed }, // Store the actual results
  metadata: {
    searchDuration: { type: Number }, // milliseconds
    filters: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  status: { 
    type: String, 
    enum: ['success', 'failed', 'no-results'], 
    default: 'success' 
  },
  error: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on save
searchHistorySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient querying
searchHistorySchema.index({ userId: 1, createdAt: -1 });
searchHistorySchema.index({ userId: 1, searchType: 1, createdAt: -1 });
searchHistorySchema.index({ hasResults: 1, createdAt: -1 });

export interface ISearchHistory extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  searchType: 'discovery' | 'domain-monitoring';
  query: string;
  queryType?: string;
  resultsCount: number;
  hasResults: boolean;
  results?: any;
  metadata?: {
    searchDuration?: number;
    filters?: any;
    ipAddress?: string;
    userAgent?: string;
  };
  status: 'success' | 'failed' | 'no-results';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const SearchHistory = mongoose.models.SearchHistory || mongoose.model<ISearchHistory>('SearchHistory', searchHistorySchema, 'search_history');

