import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { registerSchema } from '@/lib/validations';
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
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    await connectToDatabase();
    const body = await req.json();

    // Validate input with Zod
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, username, email, password } = parsed.data;
    const emailLower = email.toLowerCase();
    const usernameLower = username.toLowerCase();

    // Check if a VERIFIED account already exists with this email or username
    const [existingVerifiedEmail, existingVerifiedUsername] = await Promise.all([
      User.findOne({ email: emailLower, isVerified: true }),
      User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') }, isVerified: true }),
    ]);

    if (existingVerifiedEmail) {
      return NextResponse.json({ error: 'Unable to create account with this email' }, { status: 400 });
    }
    if (existingVerifiedUsername) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 13);
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Check if there's an existing UNVERIFIED record for this email (re-registration)
    const existingUnverified = await User.findOne({ email: emailLower, isVerified: false });

    if (existingUnverified) {
      // Update the existing unverified record with fresh OTP + new data
      existingUnverified.name = name;
      existingUnverified.username = usernameLower;
      existingUnverified.password = hashedPassword;
      existingUnverified.registrationOtp = otp;
      existingUnverified.registrationOtpExpiry = otpExpiry;
      await existingUnverified.save();
    } else {
      // Create a new unverified user record
      await User.create({
        name,
        username: usernameLower,
        email: emailLower,
        password: hashedPassword,
        isVerified: false,
        registrationOtp: otp,
        registrationOtpExpiry: otpExpiry,
        balance: 0,
        role: 'user',
      });
    }

    // Send verification email
    try {
      await sendOtpEmail(emailLower, otp, 'registration', name);
    } catch (mailErr) {
      // Clean up the unverified record if email send fails
      await User.deleteOne({ email: emailLower, isVerified: false });
      console.error('Mail error:', mailErr);
      return NextResponse.json({ error: 'Failed to send verification email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      requiresOtp: true,
      message: 'Verification link sent to your email',
      email: emailLower.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Something went wrong during registration' },
      { status: 500 }
    );
  }
}
