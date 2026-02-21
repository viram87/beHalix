import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import Event from '../models/Event';
import EventComment from '../models/EventComment';
import CommentReaction from '../models/CommentReaction';
import User from '../models/User';
import UserDetails from '../models/UserDetails';

export const getEventComments = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    }
    const comments = await EventComment.find({ eventId, parentId: null })
      .sort({ createdAt: 1 })
      .lean();
    const userId = req.user.id;
    const withDetails = await Promise.all(
      comments.map(async (c: any) => {
        const user = await User.findById(c.userId).lean();
        const details = await UserDetails.findOne({ userId: c.userId }).lean();
        const replies = await EventComment.find({ parentId: c._id }).sort({ createdAt: 1 }).lean();
        const likeCount = await CommentReaction.countDocuments({ commentId: c._id, type: 'like' });
        const dislikeCount = await CommentReaction.countDocuments({ commentId: c._id, type: 'dislike' });
        const myReaction = await CommentReaction.findOne({ commentId: c._id, userId }).lean();
        const repliesWithDetails = await Promise.all(
          replies.map(async (r: any) => {
            const ru = await User.findById(r.userId).lean();
            const rd = await UserDetails.findOne({ userId: r.userId }).lean();
            const rLike = await CommentReaction.countDocuments({ commentId: r._id, type: 'like' });
            const rDislike = await CommentReaction.countDocuments({ commentId: r._id, type: 'dislike' });
            const rMy = await CommentReaction.findOne({ commentId: r._id, userId }).lean();
            return {
              id: r._id,
              text: r.text,
              userId: r.userId,
              displayName: (ru as any)?.displayName || (ru as any)?.email || 'User',
              avatarId: (rd as any)?.avatarId ?? 1,
              createdAt: r.createdAt,
              likeCount: rLike,
              dislikeCount: rDislike,
              userReaction: rMy ? (rMy as any).type : null,
              canEdit: String(r.userId) === userId,
              canDelete: String(r.userId) === userId || String(event.createdBy) === userId,
            };
          })
        );
        return {
          id: c._id,
          text: c.text,
          userId: c.userId,
          displayName: (user as any)?.displayName || (user as any)?.email || 'User',
          avatarId: (details as any)?.avatarId ?? 1,
          createdAt: c.createdAt,
          likeCount,
          dislikeCount,
          userReaction: myReaction ? (myReaction as any).type : null,
          replies: repliesWithDetails,
          canEdit: String(c.userId) === userId,
          canDelete: String(c.userId) === userId || String(event.createdBy) === userId,
        };
      })
    );
    res.status(200).json({ comments: withDetails });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const { text, parentId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    }
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required', code: 'VALIDATION_ERROR' });
    }
    const comment = new EventComment({
      eventId,
      userId: req.user.id,
      text: text.trim().slice(0, 2000),
      parentId: parentId || null,
    });
    await comment.save();
    const user = await User.findById(req.user.id).lean();
    const details = await UserDetails.findOne({ userId: req.user.id }).lean();
    res.status(201).json({
      comment: {
        id: comment._id,
        text: comment.text,
        userId: comment.userId,
        displayName: (user as any)?.displayName || (user as any)?.email || 'User',
        avatarId: (details as any)?.avatarId ?? 1,
        createdAt: comment.createdAt,
        likeCount: 0,
        dislikeCount: 0,
        userReaction: null,
        replies: [],
        canEdit: true,
        canDelete: true,
      },
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id: eventId, commentId } = req.params;
    const { text } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    const comment = await EventComment.findOne({ _id: commentId, eventId });
    if (!comment) return res.status(404).json({ error: 'Comment not found', code: 'NOT_FOUND' });
    const isOwner = String(comment.userId) === req.user.id;
    if (!isOwner) {
      return res.status(403).json({ error: 'Only the comment author can edit it', code: 'FORBIDDEN' });
    }
    if (text !== undefined && typeof text === 'string') {
      comment.text = text.trim().slice(0, 2000);
      await comment.save();
    }
    res.status(200).json(comment);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id: eventId, commentId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    const comment = await EventComment.findOne({ _id: commentId, eventId });
    if (!comment) return res.status(404).json({ error: 'Comment not found', code: 'NOT_FOUND' });
    const isCreator = String(event.createdBy) === req.user.id;
    const isOwner = String(comment.userId) === req.user.id;
    if (!isCreator && !isOwner) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }
    await EventComment.deleteMany({ $or: [{ _id: commentId }, { parentId: commentId }] });
    await CommentReaction.deleteMany({ commentId });
    res.status(200).json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const reactToComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id: eventId, commentId } = req.params;
    const { type } = req.body;
    if (!['like', 'dislike'].includes(type)) {
      return res.status(400).json({ error: 'Invalid reaction type', code: 'VALIDATION_ERROR' });
    }
    const comment = await EventComment.findOne({ _id: commentId, eventId });
    if (!comment) return res.status(404).json({ error: 'Comment not found', code: 'NOT_FOUND' });
    const existing = await CommentReaction.findOne({ commentId, userId: req.user.id });
    if (existing) {
      if (existing.type === type) {
        await CommentReaction.deleteOne({ _id: existing._id });
        return res.status(200).json({ message: 'Reaction removed', reaction: null });
      }
      existing.type = type as 'like' | 'dislike';
      await existing.save();
      return res.status(200).json({ reaction: existing });
    }
    const reaction = new CommentReaction({ commentId, userId: req.user.id, type });
    await reaction.save();
    res.status(200).json({ reaction });
  } catch (error) {
    console.error('React to comment error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};
