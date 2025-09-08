import { mongodb } from '../lib/mongodb';

export const connectDB = async () => {
  try {
    const connection = await mongodb.connect();
    if (!connection) {
      throw new Error('Failed to connect to MongoDB');
    }
    console.log('MongoDB connected successfully');
    
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
