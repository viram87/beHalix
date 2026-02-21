import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';
import UserDetails from '../models/UserDetails';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    const userDetails = await UserDetails.findOne({ userId: req.user.id });

    if (!user || !userDetails) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    res.status(200).json({
      id: user._id,
      email: user.email,
      displayName: (user as any).displayName ?? '',
      phone: userDetails.phone ?? '',
      gender: userDetails.gender,
      interests: userDetails.interests ?? [],
      avatarId: userDetails.avatarId ?? 1,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, phone, gender, interests, avatarId } = req.body;
    const userId = req.user.id;

    if (displayName !== undefined) {
      await User.findByIdAndUpdate(userId, {
        $set: { displayName: String(displayName).trim() || '' },
      });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (gender && ['male', 'female', 'other'].includes(gender)) updates.gender = gender;
    if (Array.isArray(interests)) updates.interests = interests.slice(0, 10);
    if (typeof avatarId === 'number' && avatarId >= 1 && avatarId <= 8) updates.avatarId = avatarId;

    const userDetails = await UserDetails.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!userDetails) {
      return res.status(404).json({ error: 'User details not found', code: 'USER_NOT_FOUND' });
    }

    const user = await User.findById(userId);

    res.status(200).json({
      message: 'Profile updated successfully',
      profile: {
        displayName: (user as any)?.displayName ?? '',
        phone: userDetails.phone ?? '',
        gender: userDetails.gender,
        interests: userDetails.interests ?? [],
        avatarId: userDetails.avatarId ?? 1,
        updatedAt: userDetails.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};
