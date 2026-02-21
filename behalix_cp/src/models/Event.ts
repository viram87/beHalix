import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  createdBy: mongoose.Types.ObjectId;
  communityId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  timestamp: Date;
  isWomenOnly: boolean;
  tags?: string[];
  assemblyTime?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  images: {
    url: string;
    publicId: string;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema({
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 2000 },
  timestamp: { type: Date, required: true },
  isWomenOnly: { type: Boolean, default: false },
  tags: { type: [String], default: [], validate: [(val: string[]) => val.length <= 10, '{PATH} exceeds 10'] },
  assemblyTime: { type: String, maxlength: 50 },
  address: {
    line1: { type: String, required: true, maxlength: 100 },
    line2: { type: String, maxlength: 100 },
    city: { type: String, required: true, maxlength: 50 },
    state: { type: String, required: true, maxlength: 50 },
    zipCode: { type: String, required: true, maxlength: 10 },
  },
  images: {
    type: [
      {
        url: String,
        publicId: String,
        uploadedAt: Date,
      },
    ],
    default: [],
    validate: [(val: any[]) => val.length <= 5, '{PATH} exceeds the limit of 5'],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

EventSchema.index({ timestamp: 1 });
EventSchema.index({ createdBy: 1 });
EventSchema.index({ isWomenOnly: 1 });
EventSchema.index({ communityId: 1 });

export default mongoose.model<IEvent>('Event', EventSchema);
