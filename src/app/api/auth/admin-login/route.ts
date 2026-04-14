import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { authLimiter } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/api-guard';

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

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied: Admin privileges required.' },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      message: 'Admin Login successful',
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
