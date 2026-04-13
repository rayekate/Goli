import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getTokenIssuedAt } from './auth';
import type { TokenPayload } from '@/types';

type HandlerContext = {
  user: TokenPayload;
};

type RouteHandler = (
  req: NextRequest,
  ctx: HandlerContext
) => Promise<NextResponse>;

interface GuardOptions {
  adminOnly?: boolean;
}

/**
 * Wraps an API route handler with authentication and optional role checks.
 * Eliminates the repetitive auth boilerplate from every route.
 * Also enforces passwordChangedAt check and isBlocked.
 */
export function withAuth(handler: RouteHandler, options?: GuardOptions) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const user = await getAuthUser();
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (options?.adminOnly && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden — admin access required' },
          { status: 403 }
        );
      }

      // Lazy import to avoid circular deps
      const connectToDatabase = (await import('./db')).default;
      const User = (await import('@/models/User')).default;
      const { getSettings } = await import('@/models/PlatformSettings');
      await connectToDatabase();

      const settings = await getSettings();
      if (settings.maintenanceMode && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Platform is under maintenance. Please try again later.' },
          { status: 503 }
        );
      }

      const dbUser = await User.findById(user.userId).select('isBlocked passwordChangedAt').lean();
      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
      }
      if ((dbUser as any).isBlocked) {
        return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
      }

      // Invalidate token if password was changed after token issued
      const passwordChangedAt = (dbUser as any).passwordChangedAt;
      if (passwordChangedAt) {
        const tokenIat = await getTokenIssuedAt();
        if (tokenIat && new Date(passwordChangedAt).getTime() > tokenIat * 1000) {
          return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
        }
      }

      return await handler(req, { user });
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper to extract client IP from request for rate limiting.
 * On Vercel / known reverse proxies, x-forwarded-for is trustworthy.
 * Falls back to x-real-ip then 'unknown'.
 */
export function getClientIP(req: NextRequest): string {
  // Vercel sets this reliably
  const vercelIp = req.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0].trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Fire-and-forget audit log entry. Does not throw.
 */
export async function logAudit(params: {
  actorId: string;
  actorRole: 'user' | 'admin';
  action: string;
  targetType: 'user' | 'transaction' | 'trade' | 'ticket' | 'settings';
  targetId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    // Dynamic import to avoid circular deps
    const { default: AuditLog } = await import('@/models/AuditLog');
    await AuditLog.create({
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: params.details || {},
      ip: params.ip || '',
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
