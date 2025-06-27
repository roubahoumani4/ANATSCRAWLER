import { ObjectId } from 'mongodb';

export interface ProfileInfo {
  _id?: ObjectId;
  userId: ObjectId;
  fullName?: string;
  organization?: string;
  department?: string;
  jobPosition?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
