import mongoose from 'mongoose';

const SCANS_URI = process.env.SCANS_MONGODB_URI || process.env.MONGODB_SCANS_URI || process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://192.168.1.110:27017/assessment_scans';

const options: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  // useNewUrlParser and useUnifiedTopology are defaults in newer mongoose
};

// Create a dedicated connection for scans DB (separate database)
// This will create the `assessment_scans` database if it does not exist on first write.
const scansConnection = mongoose.createConnection(SCANS_URI, options);

scansConnection.on('connected', () => {
  console.log(`MongoDB (scans) connected to ${SCANS_URI}`);
});

scansConnection.on('error', (err) => {
  console.error('MongoDB (scans) connection error:', err);
});

scansConnection.on('disconnected', () => {
  console.warn('MongoDB (scans) disconnected');
});

export default scansConnection;
