import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Event from '../models/Event';
import EventReaction, { EventReactionType } from '../models/EventReaction';

const VALID_TYPES: EventReactionType[] = ['excited', 'interested', 'skeptical', 'not_for_me'];

export const getEventReactions = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    }
    const reactions = await EventReaction.find({ eventId }).lean();
    const counts = { excited: 0, interested: 0, skeptical: 0, not_for_me: 0 };
    let userReaction: EventReactionType | null = null;
    for (const r of reactions as any[]) {
      counts[r.type as EventReactionType]++;
      if (String(r.userId) === req.user.id) userReaction = r.type;
    }
    res.status(200).json({ counts, userReaction });
  } catch (error) {
    console.error('Get event reactions error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const setEventReaction = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const { type } = req.body;
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid reaction type', code: 'VALIDATION_ERROR' });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    }
    const existing = await EventReaction.findOne({ eventId, userId: req.user.id });
    if (existing) {
      existing.type = type;
      await existing.save();
      return res.status(200).json({ reaction: existing });
    }
    const reaction = new EventReaction({ eventId, userId: req.user.id, type });
    await reaction.save();
    res.status(200).json({ reaction });
  } catch (error) {
    console.error('Set event reaction error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};
