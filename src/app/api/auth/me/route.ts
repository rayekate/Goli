import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getAuthUser, getTokenIssuedAt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId).select('-password -twoFactorSecret');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Block suspended users
    if (user.isBlocked) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }

    // Invalidate token if password changed after token was issued
    if (user.passwordChangedAt) {
      const tokenIat = await getTokenIssuedAt();
      if (tokenIat && user.passwordChangedAt.getTime() > tokenIat * 1000) {
        return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
