import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { withAuth, getClientIP, logAudit } from '@/lib/api-guard';
import { adminManualTxSchema, adminTransactionActionSchema } from '@/lib/validations';

/**
 * GET: Fetch ALL transactions (Admin only)
 */
export const GET = withAuth(async (req, { user: admin }) => {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const page = Math.min(10000, Math.max(1, parseInt(searchParams.get('page') || '1') || 1));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50') || 50));
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find({})
      .select('-proofImage')
      .populate('userId', 'name email balance')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments({}),
  ]);

  return NextResponse.json({ transactions, total, page, totalPages: Math.ceil(total / limit) });
}, { adminOnly: true });

/**
 * POST: Admin creates a manual deposit or withdrawal for any user
 * Immediately approved — balance adjusted atomically on creation.
 */
export const POST = withAuth(async (req, { user: admin }) => {
  await connectToDatabase();
  const body = await req.json();

  const parsed = adminManualTxSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid input';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { userId, type, amount, note } = parsed.data;

  // Atomic balance adjustment
  const balanceChange = type === 'deposit' ? amount : -amount;
  const conditions: Record<string, unknown> = { _id: userId };
  if (type === 'withdrawal') {
    conditions.balance = { $gte: amount };
  }

  const user = await User.findOneAndUpdate(
    conditions,
    { $inc: { balance: balanceChange } },
    { new: true }
  );

  if (!user) {
    const checkUser = await User.findById(userId);
    if (!checkUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(
      { error: 'Insufficient user balance for this withdrawal' },
      { status: 400 }
    );
  }

  const transaction = await Transaction.create({
    userId,
    type,
    amount: Number(amount.toFixed(2)),
    status: 'approved',
    transactionHash: note ? `ADMIN: ${note}` : 'Manual admin adjustment',
    cryptoType: 'ADMIN',
  });

  // Audit log
  const ip = getClientIP(req);
  logAudit({
    actorId: admin.userId,
    actorRole: 'admin',
    action: `manual_${type}`,
    targetType: 'transaction',
    targetId: transaction._id.toString(),
    details: { userId, amount, note, newBalance: user.balance },
    ip,
  });

  return NextResponse.json({
    message: `Manual ${type} of $${amount.toFixed(2)} applied successfully`,
    transaction,
    newBalance: user.balance,
  });
}, { adminOnly: true });

/**
 * PATCH: Approve or reject a pending transaction
 * Uses atomic findOneAndUpdate to prevent double-processing.
 */
export const PATCH = withAuth(async (req, { user: admin }) => {
  await connectToDatabase();
  const body = await req.json();

  const parsed = adminTransactionActionSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid parameters';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { transactionId, status } = parsed.data;
  const adminNote = body.adminNote || '';
  const transactionHash = body.transactionHash || '';

  // ATOMIC: Only update if still pending — prevents double-processing race condition
  const transaction = await Transaction.findOneAndUpdate(
    { _id: transactionId, status: 'pending' },
    { status, ...(adminNote && { adminNote }), ...(transactionHash && { transactionHash }) },
    { new: true }
  );

  if (!transaction) {
    const check = await Transaction.findById(transactionId);
    if (!check) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
  }

  let newBalance: number | undefined;

  if (status === 'approved') {
    if (transaction.type === 'deposit') {
      const user = await User.findByIdAndUpdate(
        transaction.userId,
        { $inc: { balance: transaction.amount } },
        { new: true }
      );
      newBalance = user?.balance;
    } else if (transaction.type === 'withdrawal') {
      // Atomic: only deduct if balance is sufficient
      const user = await User.findOneAndUpdate(
        { _id: transaction.userId, balance: { $gte: transaction.amount } },
        { $inc: { balance: -transaction.amount } },
        { new: true }
      );
      if (!user) {
        // Revert transaction status since we can't fulfill it
        await Transaction.findByIdAndUpdate(transactionId, { status: 'pending' });
        return NextResponse.json(
          { error: 'Insufficient user balance for this withdrawal' },
          { status: 400 }
        );
      }
      newBalance = user.balance;
    }
  } else {
    const user = await User.findById(transaction.userId).select('balance');
    newBalance = user?.balance;
  }

  // Audit log
  const ip = getClientIP(req);
  logAudit({
    actorId: admin.userId,
    actorRole: 'admin',
    action: `transaction_${status}`,
    targetType: 'transaction',
    targetId: transactionId,
    details: { type: transaction.type, amount: transaction.amount, userId: transaction.userId.toString(), newBalance },
    ip,
  });

  return NextResponse.json({
    message: `Transaction ${status}`,
    transaction,
    newBalance,
  });
}, { adminOnly: true });
