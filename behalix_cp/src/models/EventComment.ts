import mongoose, { Document, Schema } from 'mongoose';

export interface IEventComment extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  parentId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const EventCommentSchema: Schema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 2000 },
    parentId: { type: Schema.Types.ObjectId, ref: 'EventComment', default: null },
  },
  { timestamps: true }
);

EventCommentSchema.index({ eventId: 1, createdAt: 1 });
EventCommentSchema.index({ parentId: 1 });

export default mongoose.model<IEventComment>('EventComment', EventCommentSchema);
