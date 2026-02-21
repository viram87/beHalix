import { Request, Response } from 'express';
import User from '../models/User';
import PendingSignup from '../models/PendingSignup';
import UserDetails from '../models/UserDetails';
import { createAndSendOTP, verifyOTP } from '../services/otp.service';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';

function normalizeEmail(email: unknown): string {
  return String(email ?? '').trim().toLowerCase();
}

export const signup = async (req: Request, res: Response) => {
  try {
    const { password, gender, interests } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ error: 'Email is required', code: 'VALIDATION_ERROR' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists', code: 'EMAIL_ALREADY_EXISTS' });
    }

    const passwordHash = await hashPassword(password);

    await PendingSignup.findOneAndUpdate(
      { email },
      { email, passwordHash, gender, interests },
      { upsert: true, new: true }
    );

    await createAndSendOTP(email);

    res.status(201).json({ message: 'Verification OTP sent to email', email });
  } catch (error) {
    console.error('Signup error:', error);
    if ((error as Error).message.includes('Too many OTP requests')) {
        return res.status(429).json({ error: (error as Error).message, code: 'OTP_RATE_LIMIT' });
    }
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = req.body.code;

    if (!email) {
      return res.status(400).json({ error: 'Email is required', code: 'VALIDATION_ERROR' });
    }

    const isValid = await verifyOTP(email, code);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP code', code: 'OTP_INVALID' });
    }

    const pendingSignup = await PendingSignup.findOne({ email });
    if (!pendingSignup) {
      return res.status(404).json({ error: 'Pending signup not found', code: 'PENDING_SIGNUP_NOT_FOUND' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists', code: 'USER_ALREADY_EXISTS' });
    }

    const user = new User({
      email: pendingSignup.email,
      passwordHash: pendingSignup.passwordHash,
    });
    await user.save();

    const userDetails = new UserDetails({
      userId: user._id,
      gender: pendingSignup.gender ?? undefined,
      interests: pendingSignup.interests ?? [],
      avatarId: Math.floor(Math.random() * 8) + 1, // 1-8 default avatar
    });
    await userDetails.save();

    await PendingSignup.deleteOne({ email });

    res.status(200).json({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email) {
      return res.status(400).json({ error: 'Email is required', code: 'VALIDATION_ERROR' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const userDetails = await UserDetails.findOne({ userId: user._id });
    const displayName = ((user as any).displayName ?? '').trim();
    const phone = (userDetails?.phone ?? '').trim();
    const hasGender = !!userDetails?.gender;
    const profileComplete = !!displayName && !!phone && hasGender;

    const token = generateToken(user._id as any);

    res.status(200).json({
      token,
      profileComplete,
      user: {
        id: user._id,
        email: user.email,
        displayName,
        gender: userDetails?.gender,
        interests: userDetails?.interests ?? [],
        avatarId: userDetails?.avatarId ?? 1,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
};
