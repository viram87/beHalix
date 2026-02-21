import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import Event from '../models/Event';
import User from '../models/User';
import UserDetails from '../models/UserDetails';
import Community from '../models/Community';
import { uploadImage } from '../services/cloudinary.service';
import RSVP from '../models/RSVP';
import SavedEvent from '../models/SavedEvent';

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, timestamp, isWomenOnly, address, communityId, tags, assemblyTime } = req.body;
    const files = req.files as Express.Multer.File[];

    const userDetails = await UserDetails.findOne({ userId: req.user.id });
    const isMale = userDetails?.gender === 'male';
    const requestedIsWomenOnly = isWomenOnly === 'true' || isWomenOnly === true;

    let parsedAddress = address;
    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid address format', code: 'INVALID_ADDRESS' });
      }
    }

    if (
      !parsedAddress ||
      !parsedAddress.line1 ||
      !parsedAddress.city ||
      !parsedAddress.state ||
      !parsedAddress.zipCode
    ) {
      return res.status(400).json({
        error: 'Address must include line1, city, state, and zipCode',
        code: 'INVALID_ADDRESS',
      });
    }

    if (new Date(timestamp) <= new Date()) {
      return res.status(400).json({ error: 'Timestamp must be in future', code: 'EVENT_PAST' });
    }

    let communityIdObj = null;
    if (communityId) {
      const community = await Community.findById(communityId);
      if (!community) {
        return res.status(400).json({ error: 'Community not found', code: 'COMMUNITY_NOT_FOUND' });
      }
      if (String(community.createdBy) !== req.user.id) {
        return res.status(403).json({ error: 'Only the community creator can create events for this community', code: 'FORBIDDEN' });
      }
      communityIdObj = community._id;
    }

    const images: { url: string; publicId: string; uploadedAt: Date }[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
          return res.status(400).json({
            error: 'Invalid file upload. Please upload image files.',
            code: 'INVALID_FILE',
          });
        }
        const result = await uploadImage(file.buffer);
        images.push({
          url: result.url,
          publicId: result.publicId,
          uploadedAt: result.uploadedAt instanceof Date ? result.uploadedAt : new Date(result.uploadedAt),
        });
      }
    }

    const tagList = Array.isArray(tags) ? tags.slice(0, 10) : typeof tags === 'string' ? (() => { try { const p = JSON.parse(tags); return Array.isArray(p) ? p.slice(0, 10) : []; } catch { return []; } })() : [];

    const event = new Event({
      createdBy: req.user.id,
      communityId: communityIdObj,
      title,
      description,
      timestamp,
      isWomenOnly: isMale ? false : requestedIsWomenOnly,
      address: parsedAddress,
      images,
      tags: tagList,
      assemblyTime: assemblyTime ? String(assemblyTime).trim().slice(0, 50) : undefined,
    });

    await event.save();

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    const message = (error as Error).message;
    if (message.includes('Cloudinary') || message.includes('Image upload')) {
      return res.status(502).json({ error: message, code: 'IMAGE_UPLOAD_FAILED' });
    }
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const userId = req.user?.id;

    const query: any = {};
    const communityIdParam = req.query.communityId as string;
    if (communityIdParam) {
      query.communityId = new Types.ObjectId(communityIdParam);
    }
    if (userId) {
      const userDetails = await UserDetails.findOne({ userId });
      if (userDetails?.gender === 'male') {
        query.isWomenOnly = false;
      }
    }

    const pipeline: any[] = [
      { $match: query },
      {
        $lookup: {
          from: 'rsvps',
          localField: '_id',
          foreignField: 'eventId',
          as: 'rsvps',
        },
      },
      {
        $addFields: {
          rsvpCount: { $size: '$rsvps' },
          userHasRsvped: userId
            ? {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: '$rsvps',
                        as: 'r',
                        cond: { $eq: ['$$r.userId', new Types.ObjectId(userId)] },
                      },
                    },
                  },
                  0,
                ],
              }
            : false,
        },
      },
      {
        $project: {
          rsvps: 0,
          __v: 0,
        },
      },
      {
        $lookup: {
          from: 'rsvps',
          let: { eid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$eventId', '$$eid'] } } },
            { $sort: { createdAt: 1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'u',
              },
            },
            { $unwind: '$u' },
            {
              $lookup: {
                from: 'userdetails',
                localField: 'userId',
                foreignField: 'userId',
                as: 'ud',
              },
            },
            { $unwind: { path: '$ud', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                displayName: { $ifNull: ['$u.displayName', '$u.email'] },
                avatarId: { $ifNull: ['$ud.avatarId', 1] },
                _id: 0,
              },
            },
          ],
          as: 'attendeePreview',
        },
      },
      {
        $addFields: {
          id: '$_id',
          isNewlyAdded: {
            $lte: [
              { $subtract: [new Date(), '$createdAt'] },
              14 * 24 * 60 * 60 * 1000,
            ],
          },
        },
      },
    ];

    if (userId) {
      pipeline.push(
        {
          $lookup: {
            from: 'savedevents',
            let: { eid: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$eventId', '$$eid'] },
                      { $eq: ['$userId', new Types.ObjectId(userId)] },
                    ],
                  },
                },
              },
            ],
            as: '_saved',
          },
        },
        {
          $addFields: {
            userHasSaved: { $gt: [{ $size: '$_saved' }, 0] },
          },
        },
        { $project: { _saved: 0 } }
      );
    } else {
      pipeline.push({ $addFields: { userHasSaved: false } });
    }

    pipeline.push(
      { $sort: { timestamp: 1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const events = await Event.aggregate(pipeline);
    const total = await Event.countDocuments(query);

    res.status(200).json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const getEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    }

    const userId = req.user?.id;
    if (userId) {
      const userDetails = await UserDetails.findOne({ userId });
      if (userDetails?.gender === 'male' && event.isWomenOnly) {
        return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
      }
    }

    const rsvpCount = await RSVP.countDocuments({ eventId: event._id });
    let userHasRsvped = false;
    if (userId) {
      const userRsvp = await RSVP.findOne({
        eventId: event._id,
        userId,
      });
      userHasRsvped = !!userRsvp;
    }

    let creator: { id: string; displayName: string; avatarId: number } | null = null;
    const creatorUser = await User.findById(event.createdBy).lean();
    const creatorDetails = await UserDetails.findOne({ userId: event.createdBy }).lean();
    if (creatorUser) {
      creator = {
        id: String(creatorUser._id),
        displayName: (creatorUser as any).displayName?.trim() || creatorUser.email || 'Host',
        avatarId: (creatorDetails as any)?.avatarId ?? 1,
      };
    }

    res.status(200).json({
      ...event.toObject(),
      rsvpCount,
      id: event._id,
      userHasRsvped,
      creator,
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const saveEvent = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    }
    const existing = await SavedEvent.findOne({ userId: req.user.id, eventId });
    if (existing) {
      return res.status(200).json({ message: 'Already saved', saved: true });
    }
    await SavedEvent.create({ userId: req.user.id, eventId });
    res.status(201).json({ message: 'Event saved', saved: true });
  } catch (error) {
    console.error('Save event error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const unsaveEvent = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const result = await SavedEvent.deleteOne({ userId: req.user.id, eventId });
    res.status(200).json({ message: result.deletedCount ? 'Event unsaved' : 'Was not saved', saved: false });
  } catch (error) {
    console.error('Unsave event error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
    }

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }

    await Event.deleteOne({ _id: event._id });
    await RSVP.deleteMany({ eventId: event._id });

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};
