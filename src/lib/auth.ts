import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { TokenPayload } from '@/types';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'CHANGE_ME_TO_A_RANDOM_64_CHAR_STRING') {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is not set. ' +
      'Generate one with: openssl rand -base64 48'
    );
  }
  return secret;
}

export const signToken = (payload: TokenPayload, expiresIn: string = '7d'): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

export const verifyToken = (token: string): (TokenPayload & { iat?: number }) | null => {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload & { iat?: number };
  } catch (error) {
    return null;
  }
};

export const setAuthCookie = async (token: string, maxAge: number = 7 * 24 * 60 * 60) => {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAge,
    path: '/',
  });
};

export const removeAuthCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
};

export const getAuthUser = async (): Promise<TokenPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
};

/**
 * Get the raw token's issued-at timestamp (iat) for session invalidation checks.
 */
export const getTokenIssuedAt = async (): Promise<number | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.iat ?? null;
};
