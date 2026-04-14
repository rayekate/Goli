import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/auth';
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

    await connectToDatabase();
    const body = await req.json();

    const { email, otp, rememberMe } = body;
    if (!email || !otp || typeof otp !== 'string' || otp.length !== 6) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }

    if (!user.loginOtp || user.loginOtp.length !== 6 || !user.loginOtpExpiry) {
      return NextResponse.json({ error: 'No OTP requested. Please login again.' }, { status: 400 });
    }

    const expiryTime = user.loginOtpExpiry instanceof Date
      ? user.loginOtpExpiry.getTime()
      : new Date(user.loginOtpExpiry).getTime();

    if (expiryTime < Date.now()) {
      return NextResponse.json({ error: 'OTP has expired. Please login again.' }, { status: 400 });
    }

    if (user.loginOtp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 401 });
    }

    // Clear OTP
    await User.updateOne(
      { _id: user._id },
      { $unset: { loginOtp: '', loginOtpExpiry: '' } }
    );

    // Calculate session duration
    const expiresIn = rememberMe ? '30d' : '7d';
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    }, expiresIn);

    await setAuthCookie(token, maxAge);

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
