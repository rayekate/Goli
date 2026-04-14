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

  if (!email) {
    return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
  }

  await connectToDatabase();
  const pending = await User.findOne({ email, isVerified: false }).select('name registrationOtp registrationOtpExpiry');

  if (!pending || !pending.registrationOtp) {
    return NextResponse.json({ emails: [] });
  }

  // Return a mock email object matching the mailer's structure
  return NextResponse.json({
    emails: [
      {
        id: '1',
        from: 'GoldXchange Support <support@goli-trade.com>',
        subject: 'Verify Your GoldXchange Email',
        timestamp: new Date().toISOString(),
        body: `Your email verification code is: ${pending.registrationOtp}`,
        otp: pending.registrationOtp,
        name: pending.name,
      }
    ]
  });
}
