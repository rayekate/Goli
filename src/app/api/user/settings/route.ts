import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getSettings } from '@/models/PlatformSettings';
import { getAuthUser, signToken, setAuthCookie } from '@/lib/auth';
import { updateSettingsSchema, changePasswordSchema } from '@/lib/validations';
import { passwordLimiter } from '@/lib/rate-limit';

/**
 * PATCH: Update user profile settings (name, 2FA, withdrawal OTP, telegram, notifications, payout wallet)
 */
export async function PATCH(req: NextRequest) {
  try {
    const payload = await getAuthUser();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();

    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const { name, twoFactorEnabled, withdrawalOtpEnabled, notifications, payoutWallet } = parsed.data;

    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Fetch platform settings to check feature flags
    const platformSettings = await getSettings();

    if (name !== undefined) user.name = name;

    if (twoFactorEnabled !== undefined) {
      // Only allow user to toggle 2FA if admin permits it
      if (!platformSettings.allowUser2FA && twoFactorEnabled) {
        return NextResponse.json({ error: 'User-controlled 2FA is disabled by admin' }, { status: 403 });
      }
      user.twoFactorEnabled = twoFactorEnabled;
    }

    if (withdrawalOtpEnabled !== undefined) user.withdrawalOtpEnabled = withdrawalOtpEnabled;

    if (notifications !== undefined) {
      if (notifications.platformBroadcasts !== undefined) user.notifications.platformBroadcasts = notifications.platformBroadcasts;
      if (notifications.financialConfirmations !== undefined) user.notifications.financialConfirmations = notifications.financialConfirmations;
      if (notifications.marketAlerts !== undefined) user.notifications.marketAlerts = notifications.marketAlerts;
      if (notifications.securityAlerts !== undefined) user.notifications.securityAlerts = notifications.securityAlerts;
    }

    if (payoutWallet !== undefined) {
      if (payoutWallet.address && payoutWallet.address.length < 10) {
        return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
      }
      user.payoutWallet.address = payoutWallet.address;
      user.payoutWallet.network = payoutWallet.network;
    }

    await user.save();

    return NextResponse.json({
      message: 'Settings updated successfully',
      user: {
        name: user.name,
        twoFactorEnabled: user.twoFactorEnabled,
        withdrawalOtpEnabled: user.withdrawalOtpEnabled,
        notifications: user.notifications,
        payoutWallet: user.payoutWallet,
      },
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST: Change password (requires current password verification)
 * Re-issues auth token to invalidate old sessions.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthUser();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit password changes
    const rl = passwordLimiter(payload.userId);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many password change attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    await connectToDatabase();
    const body = await req.json();

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    // Prevent reusing the same password
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
    }

    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isMatch = await bcrypt.compare(currentPassword, user.password!);
    if (!isMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    user.password = await bcrypt.hash(newPassword, 13);
    user.passwordChangedAt = new Date();
    await user.save();

    // Re-issue token to invalidate all old sessions
    const newToken = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    await setAuthCookie(newToken);

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
