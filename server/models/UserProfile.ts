import { ObjectId } from 'mongodb';

export interface UserProfile {
  _id?: ObjectId;
  userId: ObjectId | string;
  username: string;
  fullName?: string;
  organization?: string;
  department?: string;
  jobPosition?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
