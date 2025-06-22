import mongoose from 'mongoose';
import { User } from '../models/User';

const MONGODB_URI = process.env.MONGODB_URL || 'mongodb://192.168.1.110:27017/anat_security';

async function migrate() {
  await mongoose.connect(MONGODB_URI);

  // Example: Ensure indexes are up to date
  await User.syncIndexes();
  console.log('Indexes synchronized for User collection.');

  // Add more migration logic as needed

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
