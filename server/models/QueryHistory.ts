import { Schema, model } from 'mongoose';

export interface IQueryHistory {
  userId: Schema.Types.ObjectId;
  indexName: string;
  query: any;
  executionTime: number; // in milliseconds
  resultCount: number;
  timestamp: Date;
}

const queryHistorySchema = new Schema<IQueryHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    indexName: {
      type: String,
      required: true,
    },
    query: {
      type: Schema.Types.Mixed,
      required: true,
    },
    executionTime: {
      type: Number,
      required: true,
    },
    resultCount: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      // index: true - removed, defined in schema.index() below
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient queries
queryHistorySchema.index({ userId: 1, timestamp: -1 });

// Auto-delete old history entries after 30 days
queryHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default model<IQueryHistory>('QueryHistory', queryHistorySchema);
