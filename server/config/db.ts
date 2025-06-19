import { mongodb } from '../lib/mongodb';

export const connectDB = async () => {
  try {
    const connection = await mongodb.testConnection();
    if (!connection.connected) {
      throw new Error(connection.error || 'Failed to connect to MongoDB');
    }
    console.log('MongoDB connected successfully');
    
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
