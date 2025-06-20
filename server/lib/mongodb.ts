import 'dotenv/config';
import { MongoClient, MongoClientOptions, Document, WithId, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import dns from 'dns';

// Update User interface to match the one in types/User.ts
interface User {
  _id?: string | ObjectId;
  username: string;
  password: string;
  fullName?: string;
  email?: string;
  organization?: string;
  department?: string;
  jobPosition?: string;
  roles?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  isActive?: boolean;
  preferences?: {
    theme?: string;
    language?: string;
    timezone?: string;
    autoLogoutTime?: number;
    mfaEnabled?: boolean;
    showIndexedFiles?: boolean;
    showRecentSearches?: boolean;
  };
}

interface UserQueryResult {
  success: boolean;
  users?: User[];
  error?: string;
}

interface UserCreateResult {
  success: boolean;
  userId?: string;
  error?: string;
}

interface UserUpdateResult {
  success: boolean;
  error?: string;
}

// Use environment variable with fallback
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://192.168.1.110:27017/anat_security?directConnection=true";
const DB_NAME = 'anat_security';
const COLLECTION_NAME = 'users';

export class MongoDBClient {
  private static instance: MongoDBClient;
  private client: MongoClient | null = null;
  private isConnected: boolean = false;
  private db: any = null;
  private collection: any = null;

  private constructor() {}

  public static getInstance(): MongoDBClient {
    if (!MongoDBClient.instance) {
      MongoDBClient.instance = new MongoDBClient();
    }
    return MongoDBClient.instance;
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    try {
      const options: MongoClientOptions = {
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: 'majority'
      };

      this.client = await MongoClient.connect(MONGODB_URI, options);
      this.db = this.client.db(DB_NAME);
      this.collection = this.db.collection(COLLECTION_NAME);
      this.isConnected = true;

      console.log('Successfully connected to MongoDB');
      return true;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return false;
    }
  }

  public async findUsers(query: { 
    filters?: Record<string, any>
  }): Promise<UserQueryResult> {
    try {
      await this.connect();
      if (!this.isConnected) {
        throw new Error('Not connected to database');
      }

      const users = await this.collection.find(query.filters || {}).toArray();
      return { success: true, users };
    } catch (error: any) {
      console.error('Error finding users:', error);
      return { success: false, error: error.message };
    }
  }

  public async createUser(user: Omit<User, '_id'>): Promise<UserCreateResult> {
    try {
      await this.connect();
      if (!this.isConnected) {
        throw new Error('Not connected to database');
      }

      const result = await this.collection.insertOne({
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });

      return { 
        success: true, 
        userId: result.insertedId.toString() 
      };
    } catch (error: any) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  public async updateUser(userId: string, update: Partial<User>): Promise<UserUpdateResult> {
    try {
      await this.connect();
      if (!this.isConnected) {
        throw new Error('Not connected to database');
      }

      const result = await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: {
            ...update,
            updatedAt: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        return { success: false, error: 'User not found' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
    }
  }
}

export const mongodb = MongoDBClient.getInstance();
