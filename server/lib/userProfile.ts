import { ObjectId } from 'mongodb';
import { mongodb } from './mongodb';
import { UserProfile } from '../models/UserProfile';

const COLLECTION = 'user_profiles';

async function getDb() {
  await mongodb.connect();
  // @ts-ignore
  return mongodb["db"];
}

export async function upsertUserProfile(userId: ObjectId, data: Partial<UserProfile>): Promise<UserProfile> {
  const db = await getDb();
  const now = new Date();
  const update = {
    $set: { ...data, updatedAt: now },
    $setOnInsert: { userId, createdAt: now }
  };
  await db.collection(COLLECTION).updateOne(
    { userId },
    update,
    { upsert: true }
  );
  return db.collection(COLLECTION).findOne({ userId });
}

export async function getUserProfile(userId: ObjectId): Promise<UserProfile | null> {
  const db = await getDb();
  return db.collection(COLLECTION).findOne({ userId });
}


// Returns all users from the main users collection, joined with their profile info (if any)
export async function getAllUserProfiles(): Promise<any[]> {
  const db = await getDb();
  // Get all users from the main users collection
  const users: any[] = await db.collection('users').find({}).toArray();
  // Get all user profiles from the correct collection
  const profiles: any[] = await db.collection('profile-info').find({}).toArray();
  // Map profiles by userId (as string) or username fallback
  const profileMap = new Map<string, any>();
  for (const profile of profiles) {
    // Try to use userId, fallback to username if needed
    let key = '';
    if (profile.userId) {
      key = typeof profile.userId === 'string' ? profile.userId : profile.userId.toString();
    } else if (profile.username) {
      key = profile.username;
    }
    if (key) profileMap.set(key, profile);
  }
  // Merge users with their profile info
  const merged = users.map((user: any) => {
    const userIdStr = user._id.toString();
    // Try to match by userId, then by username
    let profile = profileMap.get(userIdStr);
    if (!profile) profile = profileMap.get(user.username);
    return {
      username: user.username,
      userId: userIdStr,
      fullName: profile?.fullName || '',
      organization: profile?.organization || '',
      department: profile?.department || '',
      jobPosition: profile?.jobPosition || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Add more fields if needed
    };
  });
  return merged;
}
