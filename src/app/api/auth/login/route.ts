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


    const { identifier, password } = parsed.data;
    // Check if identifier is email
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier);
    const user = isEmail
      ? await User.findOne({ email: identifier.toLowerCase() })
      : await User.findOne({ username: identifier });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'This account has been suspended by the administrator.' },
        { status: 403 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Your email has not been verified. Please check your inbox and verify your account.' },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    // Role-based bypass: Admins skip OTP
    if (user.role === 'admin') {
      const { rememberMe } = body;
      const expiresIn = rememberMe ? '30d' : '7d';
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      
      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      }, expiresIn);

      await setAuthCookie(token, maxAge);

      return NextResponse.json({
        requires2FA: false,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          balance: user.balance,
        },
        message: 'Admin login successful',
      });
    }

    // Standard User: Always send OTP for email verification on every login
    const otp = generateOtp();
    user.loginOtp = otp;
    user.loginOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await user.save();

    try {
      await sendOtpEmail(user.email, otp, 'login', user.name);
    } catch {
      return NextResponse.json({ error: 'Failed to send verification email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      requires2FA: true,
      message: 'Verification code sent to your email',
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    });


  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong during login' },
      { status: 500 }
    );
  }
}
