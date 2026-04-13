import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Trade from '@/models/Trade';
import User from '@/models/User';
import { withAuth, logAudit, getClientIP } from '@/lib/api-guard';
import { getCurrentGoldPrice } from '@/lib/gold-price';
import { getSettings } from '@/models/PlatformSettings';
import { getTradeTier } from '@/lib/trade-utils';

/**
 * GET: List all trades with filtering, pagination, and search
 */
export const GET = withAuth(async (req, { user }) => {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const result = searchParams.get('result'); // win|loss|pending
  const userId = searchParams.get('userId');
  const search = searchParams.get('search');

  const filter: Record<string, unknown> = {};
  if (result && ['win', 'loss', 'pending'].includes(result)) filter.result = result;
  if (userId) filter.userId = userId;

  // Search by user name/email
  if (search) {
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    filter.userId = { $in: matchingUsers.map(u => u._id) };
  }

  const [trades, total] = await Promise.all([
    Trade.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Trade.countDocuments(filter),
  ]);

  return NextResponse.json({
    trades,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}, { adminOnly: true });

/**
 * PATCH: Admin manually resolve a pending trade (force win/loss)
 */
export const PATCH = withAuth(async (req, { user }) => {
  await connectToDatabase();

  const body = await req.json();
  const { tradeId, action } = body;

  if (!tradeId || !['force_win', 'force_loss'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request. Provide tradeId and action (force_win/force_loss).' }, { status: 400 });
  }

  const trade = await Trade.findById(tradeId);
  if (!trade) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
  }
  if (trade.result !== 'pending') {
    return NextResponse.json({ error: 'Trade is already settled' }, { status: 400 });
  }

  const exitPrice = await getCurrentGoldPrice();
  const isWin = action === 'force_win';
  
  // Determine profit ratio:
  // 1. Specific profitPercent saved on the trade
  // 2. Dynamic tier based on amount (fallback for legacy trades)
  // 3. Platform default setting
  const platformSettings = await getSettings();
  const defaultProfitRatio = (platformSettings.profitPercent || 80) / 100;
  
  let profitRatio = defaultProfitRatio;
  if (trade.profitPercent != null) {
    profitRatio = trade.profitPercent / 100;
  } else {
    profitRatio = getTradeTier(trade.amount).profitPercent / 100;
  }

  const result = isWin ? 'win' : 'loss';
  // Symmetric P/L: win earns +X%, loss costs -X% of stake
  const profitOrLoss = isWin
    ? Number((trade.amount * profitRatio).toFixed(2))
    : Number((-trade.amount * profitRatio).toFixed(2));

  // Balance credit: stake was deducted at trade creation
  // Win: return stake + profit | Loss: return stake - loss
  const creditAmount = Number((trade.amount + profitOrLoss).toFixed(2));

  // ATOMIC: Only settle if still pending
  const settled = await Trade.findOneAndUpdate(
    { _id: tradeId, result: 'pending' },
    { result, profitOrLoss, exitPrice, settledAt: new Date() },
    { new: true }
  );
  if (!settled) {
    return NextResponse.json({ error: 'Trade already settled' }, { status: 400 });
  }

  // Credit balance (win or loss both return something)
  if (creditAmount > 0) {
    await User.findByIdAndUpdate(trade.userId, { $inc: { balance: creditAmount } });
  }

  await logAudit({
    actorId: user.userId,
    actorRole: 'admin',
    action: `trade_${action}`,
    targetType: 'trade',
    targetId: tradeId,
    details: { originalAmount: trade.amount, result, profitOrLoss },
    ip: getClientIP(req),
  });

  return NextResponse.json({ message: `Trade ${result === 'win' ? 'forced win' : 'forced loss'} successfully` });
}, { adminOnly: true });
