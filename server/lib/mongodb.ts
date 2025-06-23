import 'dotenv/config';
import { MongoClient, MongoClientOptions, Document, WithId, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import dns from 'dns';

// Define User interface to match existing database structure
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

console.log('MongoDB URI being used:', MONGODB_URI);
console.log('Database:', DB_NAME);
console.log('Collection:', COLLECTION_NAME);

class MongoDBClient {
  private static instance: MongoDBClient;
  private client: MongoClient | null = null;
  private isConnected: boolean = false;
  private db: any = null;
  private collection: any = null;
  private connectionPromise: Promise<boolean> | null = null;

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

    // Return existing connection attempt if one is in progress
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }

  private async _connect(): Promise<boolean> {
    try {
      // Check DNS resolution first
      console.log('Checking DNS resolution for MongoDB host...');
      const mongoUrl = new URL(MONGODB_URI);
      try {
        await new Promise((resolve, reject) => {
          dns.lookup(mongoUrl.hostname, (err, address) => {
            if (err) reject(err);
            else {
              console.log(`MongoDB host resolves to: ${address}`);
              resolve(address);
            }
          });
        });
      } catch (error) {
        console.error('DNS resolution failed:', error);
      }

      const options: MongoClientOptions = {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1,
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        directConnection: true,
      };

      console.log('Attempting to connect to MongoDB at:', MONGODB_URI);
      console.log('Connecting with options:', JSON.stringify(options, null, 2));

      this.client = await MongoClient.connect(MONGODB_URI, options);
      this.db = this.client.db(DB_NAME);
      this.collection = this.db.collection(COLLECTION_NAME);
      this.isConnected = true;

      // Verify connection with a ping
      await this.db.command({ ping: 1 });
      console.log(`MongoDB connection verified via ping on database: ${DB_NAME}`);

      // Set up connection monitoring
      this.client.on('serverHeartbeatSucceeded', () => {
        this.isConnected = true;
      });

      this.client.on('serverHeartbeatFailed', () => {
        console.warn('MongoDB heartbeat failed');
      });

      this.client.on('close', () => {
        console.warn('MongoDB connection closed');
        this.isConnected = false;
      });

      return true;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      this.isConnected = false;
      this.client = null;
      this.connectionPromise = null;
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

  public async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.connect();
      if (!this.isConnected) {
        throw new Error('Not connected to database');
      }
      const result = await this.collection.deleteOne({ _id: new ObjectId(userId) });
      if (result.deletedCount === 0) {
        return { success: false, error: 'User not found' };
      }
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user:', error);
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
