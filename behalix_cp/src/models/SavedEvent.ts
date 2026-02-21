import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedEvent extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SavedEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  },
  { timestamps: true }
);

SavedEventSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.model<ISavedEvent>('SavedEvent', SavedEventSchema);
