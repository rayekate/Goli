import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { withAuth, getClientIP, logAudit } from '@/lib/api-guard';
import { adminPlatformSettingsSchema } from '@/lib/validations';
import mongoose from 'mongoose';
import { getSettings } from '@/models/PlatformSettings';

const COLLECTION = 'platformsettings';

/**
 * GET: Fetch current platform settings (Admin only)
 */
export const GET = withAuth(async () => {
  await connectToDatabase();
  const doc = await mongoose.connection.db!
    .collection(COLLECTION)
    .findOne({});
  if (!doc) {
    // seed defaults via getSettings, then return
    const s = await getSettings();
    return NextResponse.json({ settings: s.toObject() });
  }
  return NextResponse.json({ settings: doc });
}, { adminOnly: true });

/**
 * PATCH: Update platform settings (Admin only)
 * Uses direct MongoDB driver — bypasses Mongoose schema/model caching.
 */
export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  await connectToDatabase();
  const body = await req.json();

  const parsed = adminPlatformSettingsSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid input';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const data = parsed.data;

  // Build $set payload — only include fields that were actually sent
  const $set: Record<string, unknown> = {};
  if (data.platformName !== undefined) $set.platformName = data.platformName;
  if (data.siteTitle !== undefined) $set.siteTitle = data.siteTitle;
  if (data.siteDescription !== undefined) $set.siteDescription = data.siteDescription;
  if (data.telegramUsername !== undefined) $set.telegramUsername = data.telegramUsername;
  if (data.maintenanceMode !== undefined) $set.maintenanceMode = data.maintenanceMode;
  if (data.mandatory2FA !== undefined) $set.mandatory2FA = data.mandatory2FA;
  if (data.allowUser2FA !== undefined) $set.allowUser2FA = data.allowUser2FA;
  if (data.ticketSystem !== undefined) $set.ticketSystem = data.ticketSystem;
  if (data.withdrawalVerification !== undefined) $set.withdrawalVerification = data.withdrawalVerification;
  if (data.requireTransactionHash !== undefined) $set.requireTransactionHash = data.requireTransactionHash;
  if (data.minWithdrawal !== undefined) $set.minWithdrawal = data.minWithdrawal;
  if (data.maxWithdrawal !== undefined) $set.maxWithdrawal = data.maxWithdrawal;
  if (data.maxDeposit !== undefined) $set.maxDeposit = data.maxDeposit;
  if (data.minTrade !== undefined) $set.minTrade = data.minTrade;
  if (data.maxTrade !== undefined) $set.maxTrade = data.maxTrade;
  if (data.profitPercent !== undefined) $set.profitPercent = data.profitPercent;
  if (data.tradeDuration !== undefined) $set.tradeDuration = data.tradeDuration;
  if (data.wallets !== undefined) $set.wallets = data.wallets.map((w: any) => ({ ...w, logo: w.logo || '💰' }));
  if (data.walletBTC !== undefined) $set.walletBTC = data.walletBTC;
  if (data.walletETH !== undefined) $set.walletETH = data.walletETH;
  if (data.walletUSDT !== undefined) $set.walletUSDT = data.walletUSDT;

  // Direct MongoDB write — no Mongoose schema involved
  const updatedDoc = await mongoose.connection.db!
    .collection(COLLECTION)
    .findOneAndUpdate(
      {},
      { $set },
      { returnDocument: 'after', upsert: true }
    );

  // Audit log (fire and forget)
  const ip = getClientIP(req);
  logAudit({
    actorId: ctx.user.userId,
    actorRole: 'admin',
    action: 'update_platform_settings',
    targetType: 'settings',
    details: { changedFields: Object.keys($set) },
    ip,
  });

  return NextResponse.json({
    message: 'Platform settings updated successfully',
    settings: updatedDoc,
  });
}, { adminOnly: true });
