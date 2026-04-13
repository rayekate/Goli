import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

// Security headers applied to all responses
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
  );
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return response;
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Categorise routes
  const isAdminPath = pathname.startsWith('/admin');
  const isUserPath = ['/dashboard', '/trade', '/deposit', '/withdraw', '/history', '/support', '/settings'].some(
    (p) => pathname.startsWith(p)
  );
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // No token: redirect protected routes to login, pass everything else through
  if (!token) {
    if (isAdminPath || isUserPath) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const role = (payload as { role?: string }).role;

    // Admin trying to access user pages — send to admin panel
    if (role === 'admin' && isUserPath) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/admin', request.url)));
    }

    // Regular user trying to access admin pages — send to dashboard
    if (role !== 'admin' && isAdminPath) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
    }

    // Authenticated users should not see login/register pages
    if (isAuthPage) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/dashboard', request.url))
      );
    }

    return addSecurityHeaders(NextResponse.next());
  } catch {
    // Invalid/expired token — always clear the stale cookie
    if (isAdminPath || isUserPath) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return addSecurityHeaders(response);
    }

    // On auth pages or public pages with a bad token: clear cookie and let through
    const response = NextResponse.next();
    response.cookies.delete('auth_token');
    return addSecurityHeaders(response);
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/trade/:path*',
    '/deposit/:path*',
    '/withdraw/:path*',
    '/history/:path*',
    '/support/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
