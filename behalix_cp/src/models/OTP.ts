import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

const OTPSchema: Schema = new Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

OTPSchema.index({ email: 1 });
OTPSchema.index({ createdAt: 1 });

export default mongoose.model<IOTP>('OTP', OTPSchema);
