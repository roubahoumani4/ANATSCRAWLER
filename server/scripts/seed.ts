import mongoose from 'mongoose';
import { User } from '../models/User';

const MONGODB_URI = process.env.MONGODB_URL || 'mongodb://192.168.1.110:27017/anat_security';

async function seed() {
  await mongoose.connect(MONGODB_URI);

  // Example: Seed an admin user if not exists
  const admin = await User.findOne({ username: 'admin' });
  if (!admin) {
    await User.create({
      username: 'admin',
      email: 'r.houmani',
      password: 'admin1234', // In production, hash this!
      isActive: true,
      preferences: {
        theme: 'dark',
        language: 'English',
        autoLogoutTime: 30,
        mfaEnabled: false,
        showIndexedFiles: true,
        showRecentSearches: true
      }
    });
    console.log('Admin user seeded.');
  } else {
    console.log('Admin user already exists.');
  }

  // Add more seed logic as needed

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
