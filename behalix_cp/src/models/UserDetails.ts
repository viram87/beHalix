import mongoose, { Document, Schema } from 'mongoose';

export interface IUserDetails extends Document {
  userId: mongoose.Types.ObjectId;
  gender?: 'male' | 'female' | 'other';
  interests: string[];
  phone?: string;
  avatarId: number; // 1-8, maps to default avatar image
  createdAt: Date;
  updatedAt: Date;
}

const UserDetailsSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: false },
  interests: { type: [String], default: [], validate: [(val: string[]) => val.length <= 10, '{PATH} exceeds the limit of 10'] },
  phone: { type: String, default: '' },
  avatarId: { type: Number, default: 1, min: 1, max: 8 },
}, { timestamps: true });

export default mongoose.model<IUserDetails>('UserDetails', UserDetailsSchema);
