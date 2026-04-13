/**
 * Simple in-memory rate limiter for single-instance deployments.
 * For production multi-instance, swap to Upstash Redis or similar.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

// Auto-cleanup stale records every 60 seconds
const cleanupInterval = setInterval(() => {
  try {
    const now = Date.now();
    for (const store of stores.values()) {
      for (const [key, record] of store) {
        if (now > record.resetTime) store.delete(key);
      }
    }
  } catch { /* prevent cleanup crash from killing server */ }
}, 60_000);
// Allow process to exit without waiting for this timer
if (typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
  cleanupInterval.unref();
}

export function createRateLimiter(name: string, limit: number, windowMs: number) {
  const store = new Map<string, RateLimitRecord>();
  stores.set(name, store);

  // Prevent unbounded memory growth
  const MAX_KEYS = 100_000;

  return function check(identifier: string): {
    success: boolean;
    remaining: number;
    resetIn: number;
    limit: number;
  } {
    const now = Date.now();
    const record = store.get(identifier);

    if (!record || now > record.resetTime) {
      // Evict oldest if store is too large
      if (store.size >= MAX_KEYS) {
        const firstKey = store.keys().next().value;
        if (firstKey) store.delete(firstKey);
      }
      store.set(identifier, { count: 1, resetTime: now + windowMs });
      return { success: true, remaining: limit - 1, resetIn: windowMs, limit };
    }

    if (record.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetIn: record.resetTime - now,
        limit,
      };
    }

    record.count++;
    return {
      success: true,
      remaining: limit - record.count,
      resetIn: record.resetTime - now,
      limit,
    };
  };
}

// ─── Pre-configured limiters ─────────────────────────────────────────────────
// Auth: 50 attempts per 15 minutes per IP (Relaxed for development/testing)
export const authLimiter = createRateLimiter('auth', 50, 15 * 60 * 1000);

// Trade: 30 trades per minute per user
export const tradeLimiter = createRateLimiter('trade', 30, 60 * 1000);

// General API: 100 requests per minute per IP
export const apiLimiter = createRateLimiter('api', 100, 60 * 1000);

// Ticket: 5 tickets per hour per user (prevent spam)
export const ticketLimiter = createRateLimiter('ticket', 5, 60 * 60 * 1000);

// Password change: 3 per hour per user
export const passwordLimiter = createRateLimiter('password', 3, 60 * 60 * 1000);
