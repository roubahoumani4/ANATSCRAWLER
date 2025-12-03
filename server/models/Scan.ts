import mongoose from 'mongoose';
import scansConnection from '../services/mongodbScans.service';

const { Schema } = mongoose;

const scanSchema = new Schema({
  jobId: { type: String, required: true, unique: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  target: { type: String, required: true },
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  elapsedSeconds: { type: Number },
  exitCode: { type: Number },
  stdout: { type: String },
  stderr: { type: String },
  parsed: { type: Schema.Types.Mixed },
  reportLocation: { type: String },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt on save
scanSchema.pre('save', function (next) {
  // @ts-ignore
  this.updatedAt = new Date();
  next();
});

export interface IScan extends mongoose.Document {
  jobId: string;
  owner: mongoose.Types.ObjectId;
  target: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  elapsedSeconds?: number;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  parsed?: any;
  reportLocation?: string;
  error?: string;
}

// Use the dedicated scans connection so documents are stored in the `assessment_scans` DB
export const Scan = scansConnection.model<IScan>('Scan', scanSchema, 'scans');
