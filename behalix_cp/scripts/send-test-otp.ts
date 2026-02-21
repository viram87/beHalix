/**
 * Sends a test OTP email to verify the branded template.
 * Run: npx ts-node -r dotenv/config scripts/send-test-otp.ts
 * (from behalix_cp directory; ensure .env has SMTP_* and FROM_EMAIL set)
 */
import dotenv from 'dotenv';
dotenv.config();

const testEmail = 'meetkumar.chavda785@gmail.com';
const testCode = '847291';

async function main() {
  const { sendOTPEmail } = await import('../src/services/email.service');
  console.log(`Sending test OTP email to ${testEmail} with code ${testCode}...`);
  await sendOTPEmail(testEmail, testCode);
  console.log('Done. Check your inbox (and spam).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
