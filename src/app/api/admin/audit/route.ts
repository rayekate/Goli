import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import AuditLog from '@/models/AuditLog';
import { withAuth } from '@/lib/api-guard';

/**
 * GET: Fetch paginated audit logs (Admin only)
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name email'),
      AuditLog.countDocuments({}),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('AuditLog fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}, { adminOnly: true });
