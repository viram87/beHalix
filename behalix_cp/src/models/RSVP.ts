import mongoose, { Document, Schema } from 'mongoose';

export interface IRSVP extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const RSVPSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  createdAt: { type: Date, default: Date.now },
});

RSVPSchema.index({ userId: 1, eventId: 1 }, { unique: true });
RSVPSchema.index({ eventId: 1 });
RSVPSchema.index({ userId: 1 });

export default mongoose.model<IRSVP>('RSVP', RSVPSchema);
