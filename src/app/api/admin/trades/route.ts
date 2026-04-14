import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Trade from '@/models/Trade';
import User from '@/models/User';
import { withAuth } from '@/lib/api-guard';

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

  const [trades, total, statsAgg] = await Promise.all([
    Trade.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Trade.countDocuments(filter),
    Trade.aggregate([
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$amount' },
          totalTrades: { $sum: 1 },
          totalWins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
          totalLosses: { $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] } },
          winPayouts: {
            $sum: {
              $cond: [{ $eq: ['$result', 'win'] }, { $abs: '$profitOrLoss' }, 0],
            },
          },
          lossCollected: {
            $sum: {
              $cond: [{ $eq: ['$result', 'loss'] }, { $abs: '$profitOrLoss' }, 0],
            },
          },
        },
      },
    ]),
  ]);

  const raw = statsAgg[0] || {};
  const stats = {
    totalVolume: raw.totalVolume || 0,
    totalTrades: raw.totalTrades || 0,
    totalWins: raw.totalWins || 0,
    totalLosses: raw.totalLosses || 0,
    winPayouts: raw.winPayouts || 0,
    lossCollected: raw.lossCollected || 0,
    houseNet: (raw.lossCollected || 0) - (raw.winPayouts || 0),
  };

  return NextResponse.json({
    trades,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats,
  });
}, { adminOnly: true });
