import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://192.168.1.110:27017/anat_security";

class MongoDBService {
  private static instance: MongoDBService;
  private isConnected: boolean = false;
  private connectionPromise: Promise<typeof mongoose> | null = null;

  private constructor() {}

  public static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  public async connect(): Promise<typeof mongoose> {
    if (this.isConnected) {
      return mongoose;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    try {
      this.connectionPromise = mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      const connection = await this.connectionPromise;
      this.isConnected = true;
      
      // Setup connection monitoring
      mongoose.connection.on('connected', () => {
        console.log('MongoDB connection established');
      });

      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB connection disconnected');
        this.isConnected = false;
      });

      return connection;
    } catch (error) {
      this.connectionPromise = null;
      this.isConnected = false;
      throw error;
    }
  }

  public async getStatus(): Promise<{
    isConnected: boolean;
    databaseName: string | undefined;
    collectionsCount: number;
    usersCount: number;
  }> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const collections = await db.listCollections().toArray();
      const usersCollection = db.collection('users');
      const usersCount = await usersCollection.countDocuments();

      return {
        isConnected: this.isConnected,
        databaseName: db.databaseName,
        collectionsCount: collections.length,
        usersCount
      };
    } catch (error) {
      console.error('Error getting MongoDB status:', error);
      return {
        isConnected: false,
        databaseName: undefined,
        collectionsCount: 0,
        usersCount: 0
      };
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      console.error('MongoDB connection test failed:', error);
      return false;
    }
  }
}

export const mongoDBService = MongoDBService.getInstance();
