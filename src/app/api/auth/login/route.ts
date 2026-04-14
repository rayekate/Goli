import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { authLimiter } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/api-guard';
import { generateOtp, sendOtpEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = getClientIP(req);
    const rl = authLimiter(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    await connectToDatabase();
    const body = await req.json();

    // Validate input with Zod
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'This account has been suspended by the administrator.' },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // If 2FA is enabled, send OTP email instead of logging in
    if (user.twoFactorEnabled) {
      const otp = generateOtp();
      user.loginOtp = otp;
      user.loginOtpExpiry = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      try {
        await sendOtpEmail(user.email, otp, 'login');
      } catch {
        return NextResponse.json({ error: 'Failed to send verification email. Please try again.' }, { status: 500 });
      }

      return NextResponse.json({
        requires2FA: true,
        message: 'Verification code sent to your email',
        email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      });
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        role: user.role,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong during login' },
      { status: 500 }
    );
  }
}
