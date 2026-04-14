import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { forgotPasswordSchema } from '@/lib/validations';
import { generateOtp, sendOtpEmail } from '@/lib/mailer';
import { authLimiter } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/api-guard';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rl = authLimiter(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const body = await req.json();

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { email } = parsed.data;

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // We don't want to leak user existence, but for a forgot password flow,
    // usually we'd just say "If an account exists, you'll receive an email."
    // However, for this specific project, simple feedback is often preferred.
    if (!user) {
      return NextResponse.json({ 
        message: 'If an account exists with this email, a reset code has been sent.' 
      }, { status: 200 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: 'Account suspended. Please contact support.' }, { status: 403 });
    }

    const otp = generateOtp();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    try {
      await sendOtpEmail(user.email, otp, 'password_reset', user.name);
    } catch (err) {
      console.error('Mail error:', err);
      // Don't fail the request if mail fails, just log it. 
      // In production, you'd want better handling.
    }

    return NextResponse.json({ 
      message: 'If an account exists with this email, a reset code has been sent.',
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
