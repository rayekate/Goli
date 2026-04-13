import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { getSettings } from '@/models/PlatformSettings';
import { withAuth, getClientIP, logAudit } from '@/lib/api-guard';
import { adminPlatformSettingsSchema } from '@/lib/validations';

/**
 * GET: Fetch current platform settings (Admin only)
 */
export const GET = withAuth(async () => {
  await connectToDatabase();
  const settings = await getSettings();

  return NextResponse.json({ settings: settings.toObject() });
}, { adminOnly: true });

/**
 * PATCH: Update platform settings (Admin only)
 */
export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  await connectToDatabase();
  const body = await req.json();

  const parsed = adminPlatformSettingsSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid input';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const settings = await getSettings();

  // Apply only provided fields
  const data = parsed.data;
  if (data.platformName !== undefined) settings.platformName = data.platformName;
  if (data.maintenanceMode !== undefined) settings.maintenanceMode = data.maintenanceMode;
  if (data.mandatory2FA !== undefined) settings.mandatory2FA = data.mandatory2FA;
  if (data.allowUser2FA !== undefined) settings.allowUser2FA = data.allowUser2FA;
  if (data.ticketSystem !== undefined) settings.ticketSystem = data.ticketSystem;
  if (data.withdrawalVerification !== undefined) settings.withdrawalVerification = data.withdrawalVerification;
  if (data.requireTransactionHash !== undefined) settings.requireTransactionHash = data.requireTransactionHash;
  if (data.minWithdrawal !== undefined) settings.minWithdrawal = data.minWithdrawal;
  if (data.maxWithdrawal !== undefined) settings.maxWithdrawal = data.maxWithdrawal;
  if (data.maxDeposit !== undefined) settings.maxDeposit = data.maxDeposit;
  if (data.minTrade !== undefined) settings.minTrade = data.minTrade;
  if (data.maxTrade !== undefined) settings.maxTrade = data.maxTrade;
  if (data.profitPercent !== undefined) settings.profitPercent = data.profitPercent;
  if (data.tradeDuration !== undefined) settings.tradeDuration = data.tradeDuration;
  if (data.wallets !== undefined) settings.wallets = data.wallets.map((w: any) => ({ ...w, logo: w.logo || '💰' }));
  if (data.walletBTC !== undefined) settings.walletBTC = data.walletBTC;
  if (data.walletETH !== undefined) settings.walletETH = data.walletETH;
  if (data.walletUSDT !== undefined) settings.walletUSDT = data.walletUSDT;


  await settings.save();

  // Audit log
  const ip = getClientIP(req);
  logAudit({
    actorId: ctx.user.userId,
    actorRole: 'admin',
    action: 'update_platform_settings',
    targetType: 'settings',
    details: { changedFields: Object.keys(data) },
    ip,
  });

  return NextResponse.json({
    message: 'Platform settings updated successfully',
    settings,
  });
}, { adminOnly: true });
