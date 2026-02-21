import mongoose, { Document, Schema } from 'mongoose';

export interface IPendingSignup extends Document {
  email: string;
  passwordHash: string;
  gender?: 'male' | 'female' | 'other';
  interests: string[];
  createdAt: Date;
}

const PendingSignupSchema: Schema = new Schema({
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: false },
  interests: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // TTL 10 mins
});

PendingSignupSchema.index({ email: 1 });

export default mongoose.model<IPendingSignup>('PendingSignup', PendingSignupSchema);
