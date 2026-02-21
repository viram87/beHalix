import mongoose, { Document, Schema } from 'mongoose';

export type EventReactionType = 'excited' | 'interested' | 'skeptical' | 'not_for_me';

export interface IEventReaction extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: EventReactionType;
  createdAt: Date;
}

const EventReactionSchema: Schema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['excited', 'interested', 'skeptical', 'not_for_me'], required: true },
  },
  { timestamps: true }
);

EventReactionSchema.index({ eventId: 1, userId: 1 }, { unique: true });
EventReactionSchema.index({ eventId: 1, type: 1 });

export default mongoose.model<IEventReaction>('EventReaction', EventReactionSchema);
