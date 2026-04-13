import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Transaction from '@/models/Transaction';
import { withAuth } from '@/lib/api-guard';

/**
 * GET: Fetch proof image for a specific transaction (Admin only)
 */
export const GET = withAuth(async (req: NextRequest, ctx) => {
  const url = new URL(req.url);
  const transactionId = url.searchParams.get('id');

  if (!transactionId) {
    return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
  }

  await connectToDatabase();
  const transaction = await Transaction.findById(transactionId).select('proofImage');

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  return NextResponse.json({ proofImage: transaction.proofImage || null });
}, { adminOnly: true });
