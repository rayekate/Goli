import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { resetPasswordSchema } from '@/lib/validations';
import { authLimiter } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/api-guard';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rl = authLimiter(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const body = await req.json();

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message || 'Invalid data' }, { status: 400 });
    }

    const { email, otp, password } = parsed.data;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      return NextResponse.json({ error: 'Invalid or expired reset code' }, { status: 401 });
    }

    if (!user.resetPasswordOtpExpiry || new Date(user.resetPasswordOtpExpiry) < new Date()) {
      return NextResponse.json({ error: 'Reset code has expired. Please request a new one.' }, { status: 410 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update user: set new password, clear reset fields, update timestamp
    user.password = hashedPassword;
    user.resetPasswordOtp = '';
    user.resetPasswordOtpExpiry = undefined!;
    user.passwordChangedAt = new Date();
    await user.save();

    return NextResponse.json({ 
      message: 'Password reset successful. You can now log in with your new password.' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
