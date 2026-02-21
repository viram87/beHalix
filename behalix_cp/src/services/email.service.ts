import nodemailer from 'nodemailer';
import { transporter } from '../config/email';
import { getOTPEmailHtml, getOTPEmailText } from '../templates/otp-email';

export const sendOTPEmail = async (email: string, code: string) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to: email,
    subject: 'Your BeHalix verification code',
    text: getOTPEmailText(code),
    html: getOTPEmailHtml(code),
  };

  try {
    if (process.env.NODE_ENV === 'test') {
      console.log(`[TEST] Mock sending email to ${email} with code ${code}`);
      return;
    }
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send OTP email');
  }
};
