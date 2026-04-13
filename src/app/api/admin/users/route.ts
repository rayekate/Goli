import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Trade from '@/models/Trade';
import Transaction from '@/models/Transaction';
import { withAuth, getClientIP, logAudit } from '@/lib/api-guard';
import { adminUpdateUserSchema } from '@/lib/validations';

/**
 * GET: Fetch ALL users with aggregated stats (Admin only)
 */
export const GET = withAuth(async (req, { user: admin }) => {
  await connectToDatabase();
  const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();

  const [tradeSummaries, transactionSummaries] = await Promise.all([
    Trade.aggregate([
      {
        $group: {
          _id: '$userId',
          totalTrades: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] } },
          totalProfitLoss: { $sum: '$profitOrLoss' },
          totalVolume: { $sum: '$amount' },
        },
      },
    ]),
    Transaction.aggregate([
      {
        $group: {
          _id: { userId: '$userId', type: '$type', status: '$status' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const tradeMap: Record<string, any> = {};
  for (const s of tradeSummaries) {
    tradeMap[s._id.toString()] = s;
  }

  const txMap: Record<string, any> = {};
  for (const s of transactionSummaries) {
    const uid = s._id.userId.toString();
    if (!txMap[uid]) txMap[uid] = {};
    const key = `${s._id.type}_${s._id.status}`;
    txMap[uid][key] = { total: s.total, count: s.count };
  }

  const enrichedUsers = users.map((u: any) => {
    const uid = u._id.toString();
    const ts = tradeMap[uid] || {};
    const tx = txMap[uid] || {};
    return {
      ...u,
      stats: {
        totalTrades: ts.totalTrades || 0,
        wins: ts.wins || 0,
        losses: ts.losses || 0,
        totalProfitLoss: ts.totalProfitLoss || 0,
        totalVolume: ts.totalVolume || 0,
        totalDeposited: tx['deposit_approved']?.total || 0,
        totalWithdrawn: tx['withdrawal_approved']?.total || 0,
        pendingDeposits: tx['deposit_pending']?.count || 0,
        pendingWithdrawals: tx['withdrawal_pending']?.count || 0,
      },
    };
  });

  return NextResponse.json({ users: enrichedUsers });
}, { adminOnly: true });

/**
 * PATCH: Update any user field — balance, role, isBlocked
 */
export const PATCH = withAuth(async (req, { user: admin }) => {
  await connectToDatabase();
  const body = await req.json();

  const parsed = adminUpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid input';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { userId, balance, role, isBlocked } = parsed.data;

  // Prevent admin from modifying their own role
  if (userId === admin.userId && role !== undefined && role !== 'admin') {
    return NextResponse.json({ error: 'Cannot change your own admin role' }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Track changes for audit log
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  if (balance !== undefined && user.balance !== Math.max(0, Number(balance))) {
    changes.balance = { from: user.balance, to: Math.max(0, Number(balance)) };
    user.balance = Math.max(0, Number(balance));
  }
  if (role !== undefined && user.role !== role) {
    changes.role = { from: user.role, to: role };
    user.role = role;
  }
  if (isBlocked !== undefined && user.isBlocked !== isBlocked) {
    changes.isBlocked = { from: user.isBlocked, to: isBlocked };
    user.isBlocked = isBlocked;
  }

  await user.save();

  // Audit log if changes were made
  if (Object.keys(changes).length > 0) {
    const ip = getClientIP(req);
    logAudit({
      actorId: admin.userId,
      actorRole: 'admin',
      action: 'update_user',
      targetType: 'user',
      targetId: userId,
      details: changes,
      ip,
    });
  }

  return NextResponse.json({ message: 'User updated successfully', user });
}, { adminOnly: true });
