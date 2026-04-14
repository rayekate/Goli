import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

/**
 * Internal API to fetch simulated emails (OTP) for the Mock Inbox.
 * Reads from MongoDB instead of the old in-memory Map.
 * In a real app, this would be highly restricted or non-existent in production.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.toLowerCase();

  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCK_EMAILS !== 'true') {
    return NextResponse.json({ error: 'Endpoint restricted' }, { status: 403 });
  }

  if (!email) {
    return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email }).select('name registrationOtp loginOtp withdrawalOtp resetPasswordOtp');

  if (!user) {
    return NextResponse.json({ emails: [] });
  }

  const emails = [];
  if (user.registrationOtp && !user.isVerified) {
    emails.push({
      id: 'reg',
      from: 'GoldXchange Support',
      subject: 'Verify Your GoldXchange Email',
      timestamp: new Date().toISOString(),
      body: `Verification code: ${user.registrationOtp}`,
      otp: user.registrationOtp,
    });
  }
  if (user.loginOtp) {
    emails.push({
      id: 'login',
      from: 'GoldXchange Support',
      subject: 'Your GoldXchange Login OTP',
      timestamp: new Date().toISOString(),
      body: `Login code: ${user.loginOtp}`,
      otp: user.loginOtp,
    });
  }

  return NextResponse.json({ emails });
}
