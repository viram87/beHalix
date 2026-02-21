import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import Community from '../models/Community';
import Event from '../models/Event';

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'community';
}

export const createCommunity = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const slug = (req.body.slug && String(req.body.slug).trim()) || slugify(name || '');
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
    }
    const finalSlug = slugify(slug) || slugify(name);
    const existing = await Community.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(409).json({ error: 'Slug already taken', code: 'SLUG_TAKEN' });
    }
    const community = new Community({
      name: name.trim(),
      description: description?.trim() || '',
      slug: finalSlug,
      createdBy: req.user.id,
      memberIds: [req.user.id],
    });
    await community.save();
    res.status(201).json(community);
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const getCommunities = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const communities = await Community.find({ memberIds: userId })
      .sort({ createdAt: -1 })
      .lean();
    const ids = (communities as any[]).map((c) => c._id);
    const eventCounts = await Event.aggregate([
      { $match: { communityId: { $in: ids } } },
      { $group: { _id: '$communityId', count: { $sum: 1 } } },
    ]);
    const countByCommunity: Record<string, number> = {};
    eventCounts.forEach((row: any) => {
      countByCommunity[String(row._id)] = row.count;
    });
    const withCounts = (communities as any[]).map((c) => ({
      ...c,
      memberCount: Array.isArray(c.memberIds) ? c.memberIds.length : 0,
      eventCount: countByCommunity[String(c._id)] ?? 0,
    }));
    res.status(200).json({ communities: withCounts });
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const getCommunity = async (req: AuthRequest, res: Response) => {
  try {
    const raw = req.params.id;
    const idOrSlug = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? '' : '';
    const isId = idOrSlug && Types.ObjectId.isValid(idOrSlug) && String(new Types.ObjectId(idOrSlug)) === idOrSlug;
    const community = await Community.findOne(
      isId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() }
    ).lean();
    if (!community) {
      return res.status(404).json({ error: 'Community not found', code: 'NOT_FOUND' });
    }
    const userId = req.user.id;
    const memberIds = (community.memberIds as any[]) || [];
    const isMember = memberIds.some((id: any) => String(id) === userId);

    const events = isMember
      ? await Event.find({ communityId: community._id, timestamp: { $gte: new Date() } })
          .sort({ timestamp: 1 })
          .limit(20)
          .lean()
      : [];

    res.status(200).json({
      ...community,
      isMember,
      memberCount: memberIds.length,
      events,
    });
  } catch (error) {
    console.error('Get community error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const joinCommunity = async (req: AuthRequest, res: Response) => {
  try {
    const raw = req.params.id;
    const communityId = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found', code: 'NOT_FOUND' });
    }
    const userId = req.user.id;
    const memberIds = community.memberIds as Types.ObjectId[];
    if (memberIds.some((id) => String(id) === userId)) {
      return res.status(200).json({ message: 'Already a member', community });
    }
    memberIds.push(userId as any);
    community.memberIds = memberIds;
    await community.save();
    res.status(200).json({ message: 'Joined community', community });
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const leaveCommunity = async (req: AuthRequest, res: Response) => {
  try {
    const raw = req.params.id;
    const communityId = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found', code: 'NOT_FOUND' });
    }
    const userId = req.user.id;
    if (String(community.createdBy) === userId) {
      return res.status(400).json({ error: 'Creator cannot leave', code: 'CREATOR_CANNOT_LEAVE' });
    }
    community.memberIds = (community.memberIds as Types.ObjectId[]).filter((id) => String(id) !== userId);
    await community.save();
    res.status(200).json({ message: 'Left community', community });
  } catch (error) {
    console.error('Leave community error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const getDiscoverCommunities = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const communities = await Community.find({}).sort({ createdAt: -1 }).lean();
    const withMembership = communities.map((c: any) => {
      const memberIds = c.memberIds || [];
      const isMember = memberIds.some((id: any) => String(id) === userId);
      return { ...c, isMember, memberCount: memberIds.length };
    });
    res.status(200).json({ communities: withMembership });
  } catch (error) {
    console.error('Discover communities error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const updateCommunity = async (req: AuthRequest, res: Response) => {
  try {
    const raw = req.params.id;
    const communityId = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found', code: 'NOT_FOUND' });
    }
    if (String(community.createdBy) !== req.user.id) {
      return res.status(403).json({ error: 'Only the creator can update this community', code: 'FORBIDDEN' });
    }
    const { name, description } = req.body;
    if (name !== undefined) community.name = String(name).trim() || community.name;
    if (description !== undefined) community.description = String(description).trim();
    await community.save();
    res.status(200).json(community);
  } catch (error) {
    console.error('Update community error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const deleteCommunity = async (req: AuthRequest, res: Response) => {
  try {
    const raw = req.params.id;
    const communityId = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found', code: 'NOT_FOUND' });
    }
    if (String(community.createdBy) !== req.user.id) {
      return res.status(403).json({ error: 'Only the creator can delete this community', code: 'FORBIDDEN' });
    }
    await Event.updateMany({ communityId: community._id }, { $unset: { communityId: 1 } });
    await Community.deleteOne({ _id: community._id });
    res.status(200).json({ message: 'Community deleted' });
  } catch (error) {
    console.error('Delete community error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};
