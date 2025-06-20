import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true
  },
  fullName: String,
  organization: String,
  department: String,
  jobPosition: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    theme: {
      type: String,
      default: 'dark'
    },
    language: {
      type: String,
      default: 'English'
    },
    timezone: String,
    autoLogoutTime: {
      type: Number,
      default: 30
    },
    mfaEnabled: {
      type: Boolean,
      default: false
    },
    showIndexedFiles: {
      type: Boolean,
      default: true
    },
    showRecentSearches: {
      type: Boolean,
      default: true
    }
  }
});

// Search History Schema
const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Search Results Schema
const searchResultSchema = new mongoose.Schema({
  collection: {
    type: String,
    required: true
  },
  folder: String,
  fileName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  }
});

// User Search Results Schema
const userSearchResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  searchHistoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SearchHistory',
    required: true
  },
  resultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SearchResult',
    required: true
  }
});

// Session Schema
const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  deviceInfo: String,
  ipAddress: String,
  lastActive: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Model interfaces
export interface IUser extends mongoose.Document {
  username: string;
  password: string;
  email?: string;
  fullName?: string;
  organization?: string;
  department?: string;
  jobPosition?: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  preferences: {
    theme: string;
    language: string;
    timezone?: string;
    autoLogoutTime: number;
    mfaEnabled: boolean;
    showIndexedFiles: boolean;
    showRecentSearches: boolean;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Export models
export const User = mongoose.model<IUser>('User', userSchema, 'users');
export const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema, 'search_history');
export const SearchResult = mongoose.model('SearchResult', searchResultSchema, 'search_results');
export const UserSearchResult = mongoose.model('UserSearchResult', userSearchResultSchema, 'user_search_results');
export const Session = mongoose.model('Session', sessionSchema, 'sessions');
