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

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  const db = await getDb();
  return db.collection(COLLECTION).find({}).toArray();
}
