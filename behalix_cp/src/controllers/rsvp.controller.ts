import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import RSVP from '../models/RSVP';
import Event from '../models/Event';
import UserDetails from '../models/UserDetails';
import User from '../models/User';

export const rsvpToEvent = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    }

    const userDetails = await UserDetails.findOne({ userId });
    if (userDetails?.gender === 'male' && event.isWomenOnly) {
      return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    }

    const existingRSVP = await RSVP.findOne({ userId, eventId });
    if (existingRSVP) {
      return res.status(409).json({ error: 'Already RSVPed to this event', code: 'ALREADY_RSVPED' });
    }

    const rsvp = new RSVP({ userId, eventId });
    await rsvp.save();

    res.status(201).json({
      message: 'RSVP successful',
      rsvp: {
        id: rsvp._id,
        userId,
        eventId,
        createdAt: rsvp.createdAt,
      },
    });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const cancelRSVP = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const result = await RSVP.deleteOne({ userId, eventId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'RSVP not found', code: 'RSVP_NOT_FOUND' });
    }

    res.status(200).json({ message: 'RSVP cancelled successfully' });
  } catch (error) {
    console.error('Cancel RSVP error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const getEventRSVPs = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const all = req.query.all === 'true';

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    }

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the event creator can view attendees', code: 'FORBIDDEN' });
    }

    const query = { eventId: new Types.ObjectId(eventId as string) };
    const total = await RSVP.countDocuments(query);
    
    const pipeline: any[] = [
      { $match: query },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'userdetails',
          localField: 'userId',
          foreignField: 'userId',
          as: 'details'
        }
      },
      { $unwind: { path: '$details', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'eventDoc',
        },
      },
      { $unwind: { path: '$eventDoc', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          displayName: { $ifNull: ['$user.displayName', '$user.email'] },
          avatarId: { $ifNull: ['$details.avatarId', 1] },
          isHost: { $eq: ['$userId', '$eventDoc.createdBy'] },
        },
      },
      {
        $project: {
          userId: '$user._id',
          email: '$user.email',
          displayName: 1,
          avatarId: 1,
          gender: '$details.gender',
          interests: '$details.interests',
          phone: '$details.phone',
          rsvpedAt: '$createdAt',
          isHost: 1,
          _id: 0,
        },
      }
    ];

    if (!all) {
      pipeline.push({ $skip: (page - 1) * limit });
      pipeline.push({ $limit: limit });
    }

    const combinedRSVPs = await RSVP.aggregate(pipeline);

    if (all) {
       return res.status(200).json({ rsvps: combinedRSVPs });
    }

    res.status(200).json({
      rsvps: combinedRSVPs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get Event RSVPs error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

/** Public preview for event detail page: count + first 12 attendees with displayName, avatarId, isHost (no email). */
export const getEventAttendeesPreview = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0] ?? '';
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    }
    const userDetails = await UserDetails.findOne({ userId: req.user.id });
    if (userDetails?.gender === 'male' && event.isWomenOnly) {
      return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    }
    const creatorId = String(event.createdBy);
    const count = await RSVP.countDocuments({ eventId });
    const pipeline: any[] = [
      { $match: { eventId: new Types.ObjectId(eventId) } },
      { $sort: { createdAt: 1 } },
      { $limit: 12 },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'userdetails',
          localField: 'userId',
          foreignField: 'userId',
          as: 'details',
        },
      },
      { $unwind: { path: '$details', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: { $toString: '$user._id' },
          displayName: { $ifNull: ['$user.displayName', '$user.email'] },
          avatarId: { $ifNull: ['$details.avatarId', 1] },
          isHost: { $eq: [{ $toString: '$user._id' }, creatorId] },
          _id: 0,
        },
      },
    ];
    const attendees = await RSVP.aggregate(pipeline);
    res.status(200).json({ count, attendees });
  } catch (error) {
    console.error('Get attendees preview error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const getUserRSVPs = async (req: AuthRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  
      const query = { userId: req.user.id };
      
      const rsvps = await RSVP.find(query)
        .populate('eventId')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      
      const total = await RSVP.countDocuments(query);
  
      const formattedRSVPs = rsvps.map((rsvp: any) => ({
        rsvpId: rsvp._id,
        event: {
          id: rsvp.eventId._id,
          title: rsvp.eventId.title,
          timestamp: rsvp.eventId.timestamp,
          address: {
            city: rsvp.eventId.address.city,
            state: rsvp.eventId.address.state
          }
        },
        rsvpedAt: rsvp.createdAt
      }));
  
      res.status(200).json({
        rsvps: formattedRSVPs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get User RSVPs error:', error);
      res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
    }
  };
