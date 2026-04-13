import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { getSettings } from '@/models/PlatformSettings';
import { withAuth, getClientIP, logAudit } from '@/lib/api-guard';
import { adminScheduleSchema } from '@/lib/validations';

/**
 * GET: Fetch only trading schedule settings (Admin only)
 */
export const GET = withAuth(async () => {
  await connectToDatabase();
  const settings = await getSettings();

  const now = new Date();
  
  return NextResponse.json({
    tradingStartTime: settings.tradingStartTime,
    tradingEndTime: settings.tradingEndTime,
    tradingDays: settings.tradingDays,
    serverTime: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}, { adminOnly: true });

/**
 * PATCH: Update only trading schedule settings (Admin only)
 */
export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  await connectToDatabase();
  const body = await req.json();

  const parsed = adminScheduleSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid input';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const settings = await getSettings();
  const data = parsed.data;

  if (data.tradingStartTime !== undefined) settings.tradingStartTime = data.tradingStartTime;
  if (data.tradingEndTime !== undefined) settings.tradingEndTime = data.tradingEndTime;
  if (data.tradingDays !== undefined) settings.tradingDays = data.tradingDays;

  await settings.save();

  // Audit log
  const ip = getClientIP(req);
  logAudit({
    actorId: ctx.user.userId,
    actorRole: 'admin',
    action: 'update_trading_schedule',
    targetType: 'settings',
    details: { changedFields: Object.keys(data) },
    ip,
  });

  return NextResponse.json({
    message: 'Trading schedule updated successfully',
    schedule: {
      tradingStartTime: settings.tradingStartTime,
      tradingEndTime: settings.tradingEndTime,
      tradingDays: settings.tradingDays,
    }
  });
}, { adminOnly: true });
