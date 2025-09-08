import { ObjectId } from 'mongodb';
import { mongodb } from './mongodb';
import { ProfileInfo } from '../models/ProfileInfo';

const COLLECTION = 'profile-info';

async function getDb() {
  await mongodb.connect();
  // @ts-ignore
  return mongodb["db"];
}

export async function getProfileInfo(userId: ObjectId): Promise<ProfileInfo | null> {
  const db = await getDb();
  return db.collection(COLLECTION).findOne({ userId });
}

export async function upsertProfileInfo(userId: ObjectId, data: Partial<ProfileInfo>): Promise<ProfileInfo> {
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
