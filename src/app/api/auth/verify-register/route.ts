import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { authLimiter } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/api-guard';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rl = authLimiter(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    const { email, otp } = await req.json();
    if (!email || !otp || typeof otp !== 'string' || otp.length !== 6) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the unverified user in MongoDB
    const user = await User.findOne({ email: email.toLowerCase(), isVerified: false });

    if (!user) {
      return NextResponse.json(
        { error: 'No pending registration found. Please register again.' },
        { status: 400 }
      );
    }

    if (!user.registrationOtpExpiry || Date.now() > user.registrationOtpExpiry.getTime()) {
      return NextResponse.json(
        { error: 'Verification link has expired. Please register again.' },
        { status: 400 }
      );
    }

    if (user.registrationOtp !== otp) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Final duplicate check (race-condition guard)
    const existingVerified = await User.findOne({ email: email.toLowerCase(), isVerified: true });
    if (existingVerified) {
      await User.deleteOne({ _id: user._id });
      return NextResponse.json({ error: 'Account already exists. Please login.' }, { status: 400 });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.registrationOtp = '';
    user.registrationOtpExpiry = undefined as unknown as Date;
    await user.save();

    // Do NOT auto-login — user must navigate to the login page manually.
    return NextResponse.json({
      message: 'Email verified successfully. Please login to continue.',
    }, { status: 200 });
  } catch (error) {
    console.error('Verify registration error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
