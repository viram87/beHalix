import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunity extends Document {
  name: string;
  description?: string;
  slug: string;
  createdBy: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema: Schema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    memberIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
  },
  { timestamps: true }
);

// slug already has unique: true above, do not add duplicate index
CommunitySchema.index({ memberIds: 1 });
CommunitySchema.index({ createdBy: 1 });

export default mongoose.model<ICommunity>('Community', CommunitySchema);
