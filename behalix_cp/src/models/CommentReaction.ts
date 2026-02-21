import mongoose, { Document, Schema } from 'mongoose';

export interface ICommentReaction extends Document {
  commentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'like' | 'dislike';
  createdAt: Date;
}

const CommentReactionSchema: Schema = new Schema(
  {
    commentId: { type: Schema.Types.ObjectId, ref: 'EventComment', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like', 'dislike'], required: true },
  },
  { timestamps: true }
);

CommentReactionSchema.index({ commentId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ICommentReaction>('CommentReaction', CommentReactionSchema);
