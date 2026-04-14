import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { apiLimiter } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/api-guard';
import { generateOtp, sendOtpEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const payload = await getAuthUser();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ip = getClientIP(req as any);
    const { success } = apiLimiter(ip);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    await connectToDatabase();
    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!user.withdrawalOtpEnabled) {
      return NextResponse.json({ error: 'Withdrawal OTP is not enabled' }, { status: 400 });
    }

    // Prevent rapid-fire OTP requests (minimum 60s between sends)
    if (user.withdrawalOtpExpiry && new Date(user.withdrawalOtpExpiry).getTime() > Date.now() + 4 * 60 * 1000) {
      return NextResponse.json({ error: 'OTP already sent. Please wait before requesting a new one.' }, { status: 429 });
    }

    const otp = generateOtp();
    user.withdrawalOtp = otp;
    user.withdrawalOtpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    await sendOtpEmail(user.email, otp);

    return NextResponse.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
