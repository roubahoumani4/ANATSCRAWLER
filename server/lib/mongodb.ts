import 'dotenv/config';
import { MongoClient, MongoClientOptions, Document, WithId, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import dns from 'dns';

// Define User interface to match existing database structure
interface User {
  _id?: string | ObjectId;
  username: string;
  password: string;
  createdAt?: Date;
  lastLogin?: Date;
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

// Use environment variable with fallback
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://46.165.254.175:50105/anat_security?directConnection=true";
const DB_NAME = 'anat_security';
const COLLECTION_NAME = 'people';

console.log('MongoDB URI being used:', MONGODB_URI);
console.log('Database:', DB_NAME);
console.log('Collection:', COLLECTION_NAME);

class MongoDBClient {
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

  private async checkHostResolution(): Promise<boolean> {
    try {
      const uri = new URL(MONGODB_URI);
      console.log('Checking DNS resolution for MongoDB host...');
      return new Promise((resolve) => {
        dns.lookup(uri.hostname, (err) => {
          if (err) {
            console.error('DNS resolution failed:', err);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('Error parsing MongoDB URI:', error);
      return false;
    }
  }

  private async getConnection(): Promise<MongoClient> {
    if (this.client && this.isConnected) {
      try {
        // Verify the connection is still alive
        await this.client.db(DB_NAME).command({ ping: 1 });
        return this.client;
      } catch (error) {
        console.log('Existing connection is stale, creating new connection...');
        this.isConnected = false;
      }
    }

    const canResolve = await this.checkHostResolution();
    if (!canResolve) {
      throw new Error('Cannot resolve MongoDB host');
    }

    const options: MongoClientOptions = {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      directConnection: true,
      retryWrites: true,
      w: 'majority'
    };

    console.log('Attempting to connect to MongoDB at:', MONGODB_URI);
    console.log('Connecting with options:', JSON.stringify(options, null, 2));

    try {
      this.client = await MongoClient.connect(MONGODB_URI, options);
      
      // Verify connection with a ping
      await this.client.db(DB_NAME).command({ ping: 1 });
      console.log('MongoDB connection verified via ping on database:', DB_NAME);
      
      this.isConnected = true;
      this.db = this.client.db(DB_NAME);
      this.collection = this.db.collection(COLLECTION_NAME);
      
      return this.client;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      await this.getConnection();
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public async createUser(userData: Omit<User, '_id'>): Promise<UserCreateResult> {
    try {
      await this.getConnection();
      
      // Check if username already exists
      const existingUser = await this.collection.findOne({
        username: userData.username
      });

      if (existingUser) {
        return {
          success: false,
          error: 'Username already exists'
        };
      }

      const result = await this.collection.insertOne({
        ...userData,
        createdAt: new Date(),
        lastLogin: new Date()
      });

      return {
        success: true,
        userId: result.insertedId.toString()
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user'
      };
    }
  }

  public async findUsers(query: { filters?: any; search?: string } = {}): Promise<UserQueryResult> {
    try {
      await this.getConnection();

      let filter: any = {};
      
      if (query.filters) {
        filter = { ...query.filters };
      }
      
      if (query.search) {
        filter.$or = [
          { username: new RegExp(query.search, 'i') }
        ];
      }

      const users = await this.collection.find(filter).toArray();
      
      return {
        success: true,
        users: users.map((user: WithId<Document>) => ({
          _id: user._id.toString(),
          username: user.username,
          password: user.password,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }))
      };
    } catch (error) {
      console.error('Error finding users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find users'
      };
    }
  }
}

export const mongodb = MongoDBClient.getInstance();
