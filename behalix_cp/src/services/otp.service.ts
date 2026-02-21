import crypto from 'crypto';
import OTP from '../models/OTP';
import { sendOTPEmail } from './email.service';

const OTP_EXPIRY_MINUTES = 10;
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.OTP_RATE_LIMIT_WINDOW || '3600000');
const MAX_OTP_REQUESTS = parseInt(process.env.OTP_RATE_LIMIT_MAX || '5');

export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const createAndSendOTP = async (email: string) => {
  // Rate limiting check
  const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const otpCount = await OTP.countDocuments({
    email,
    createdAt: { $gte: oneHourAgo },
  });

  if (otpCount >= MAX_OTP_REQUESTS) {
    throw new Error('Too many OTP requests. Please try again later.');
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const otp = new OTP({
    email,
    code,
    expiresAt,
  });

  await otp.save();
  await sendOTPEmail(email, code);
};

export const verifyOTP = async (email: string, code: string): Promise<boolean> => {
  const otp = await OTP.findOne({
    email,
    code,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otp) {
    return false;
  }

  otp.isUsed = true;
  await otp.save();
  return true;
};
