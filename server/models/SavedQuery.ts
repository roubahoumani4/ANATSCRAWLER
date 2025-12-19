import { Schema, model } from 'mongoose';

export interface ISavedQuery {
  userId: Schema.Types.ObjectId;
  name: string;
  description?: string;
  indexName: string;
  query: any; // DSL query object
  createdAt: Date;
  updatedAt: Date;
}

const savedQuerySchema = new Schema<ISavedQuery>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    indexName: {
      type: String,
      required: true,
    },
    query: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
savedQuerySchema.index({ userId: 1, createdAt: -1 });

export default model<ISavedQuery>('SavedQuery', savedQuerySchema);
