import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Trade from '@/models/Trade';
import { getAuthUser } from '@/lib/auth';
import { getCurrentGoldPrice } from '@/lib/gold-price';
import { tradeSchema } from '@/lib/validations';
import { tradeLimiter } from '@/lib/rate-limit';
import { getSettings } from '@/models/PlatformSettings';
import { getTradeTier } from '@/lib/trade-utils';

/**
 * Settle expired pending trades. Called lazily on GET/POST.
 * Resolves all trades whose expiresAt has passed.
 */
async function settlePendingTrades() {
  const now = new Date();
  const pendingTrades = await Trade.find({
    result: 'pending',
    expiresAt: { $lte: now },
  }).limit(50); // batch limit

  if (pendingTrades.length === 0) return;

  const platformSettings = await getSettings();
  const defaultProfitRatio = (platformSettings.profitPercent || 80) / 100;
  const exitPrice = await getCurrentGoldPrice();

  for (const trade of pendingTrades) {
    // Determine win/loss based on price movement
    let isWin = false;
    if (trade.direction === 'up' && exitPrice > trade.entryPrice) isWin = true;
    if (trade.direction === 'down' && exitPrice < trade.entryPrice) isWin = true;

    // Determine profit ratio: 
    // 1. Specific profitPercent saved on the trade
    // 2. Dynamic tier based on amount (fallback for legacy trades)
    // 3. Platform default setting
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
    // Win: return stake + profit  (amount + amount*ratio)
    // Loss: return stake - loss   (amount - amount*ratio)
    const creditAmount = Number((trade.amount + profitOrLoss).toFixed(2));

    // ATOMIC: Only settle if trade is still pending (prevents double-settlement)
    const settled = await Trade.findOneAndUpdate(
      { _id: trade._id, result: 'pending' },
      { result, profitOrLoss, exitPrice, settledAt: now },
      { new: true }
    );
    if (!settled) continue; // already settled by another request

    // Credit balance back to user
    if (creditAmount > 0) {
      await User.findByIdAndUpdate(trade.userId, { $inc: { balance: creditAmount } });
    }
  }
}

/**
 * GET: Fetch trade history for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthUser();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    // Settle any expired pending trades lazily
    await settlePendingTrades();

    const { searchParams } = new URL(req.url);
    const page = Math.min(10000, Math.max(1, parseInt(searchParams.get('page') || '1') || 1));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50') || 50));
    const skip = (page - 1) * limit;

    const filter = payload.role === 'admin' ? {} : { userId: payload.userId };
    const [trades, total] = await Promise.all([
      payload.role === 'admin'
        ? Trade.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email')
        : Trade.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Trade.countDocuments(filter),
    ]);

    return NextResponse.json({ trades, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST: Execute a new gold trade
 * Uses atomic findOneAndUpdate to prevent race conditions / double-spending.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthUser();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (payload.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot participate in trading' }, { status: 403 });
    }

    // Rate limit per user
    const rl = tradeLimiter(payload.userId);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Trading too fast. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    await connectToDatabase();

    // Check maintenance mode
    const platformSettings = await getSettings();
    if (platformSettings.maintenanceMode) {
      return NextResponse.json({ error: 'Platform is under maintenance. Trading is temporarily disabled.' }, { status: 503 });
    }

    // Check Trading Schedule
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const tradingDays = platformSettings.tradingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const tradingStartTime = platformSettings.tradingStartTime || '00:00';
    const tradingEndTime = platformSettings.tradingEndTime || '23:59';

    const isDayAllowed = tradingDays.includes(currentDay);
    const isTimeAllowed = currentTime >= tradingStartTime && currentTime <= tradingEndTime;

    if (!isDayAllowed || !isTimeAllowed) {
      let message = 'Market is currently closed.';
      if (!isDayAllowed) message = `Trading is not allowed on ${currentDay}s.`;
      else message = `Trading hours are from ${tradingStartTime} to ${tradingEndTime} (Server Time).`;
      
      return NextResponse.json({ error: message }, { status: 403 });
    }

    const body = await req.json();

    // Validate input
    const parsed = tradeSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid trade details';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { amount, direction, duration } = parsed.data;

    // Dynamically calculate tier based on amount for PROFIT PERCENT only
    const tier = getTradeTier(amount);
    const profitPercent = tier.profitPercent;

    if (platformSettings.minTrade && amount < platformSettings.minTrade) {
      return NextResponse.json({ error: `Minimum investment is $${platformSettings.minTrade.toLocaleString()}` }, { status: 400 });
    }

    if (platformSettings.maxTrade && amount > platformSettings.maxTrade) {
      return NextResponse.json({ error: `Maximum investment is $${platformSettings.maxTrade.toLocaleString()}` }, { status: 400 });
    }
    // ATOMIC: Deduct balance only if sufficient — prevents race conditions
    const user = await User.findOneAndUpdate(
      { _id: payload.userId, isBlocked: false, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true }
    );

    if (!user) {
      // Check why it failed
      const checkUser = await User.findById(payload.userId);
      if (!checkUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      if (checkUser.isBlocked) {
        return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Insufficient balance to trade' }, { status: 400 });
    }

    // Capture entry price
    const entryPrice = await getCurrentGoldPrice();

    // Compute expiration
    const expiresAt = new Date(Date.now() + duration * 1000);

    const trade = await Trade.create({
      userId: payload.userId,
      amount,
      direction,
      result: 'pending',
      profitOrLoss: 0,
      entryPrice,
      duration: duration,
      profitPercent: profitPercent,
      expiresAt,
    });

    return NextResponse.json({
      message: 'Trade placed successfully',
      trade,
      currentBalance: user.balance,
    });
  } catch (error) {
    console.error('Trade execution error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
