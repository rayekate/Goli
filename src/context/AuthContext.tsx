'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  role: 'user' | 'admin';
  twoFactorEnabled?: boolean;
  withdrawalOtpEnabled?: boolean;
  notifications?: {
    platformBroadcasts: boolean;
    financialConfirmations: boolean;
    marketAlerts: boolean;
    securityAlerts: boolean;
  };
  payoutWallet?: {
    address: string;
    network: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** How often (ms) to re-fetch user data in the background */
const BACKGROUND_REFRESH_MS = 60_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount to restore session
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Background polling so long-lived tabs stay current
  useEffect(() => {
    if (!user) return;
    intervalRef.current = setInterval(fetchUser, BACKGROUND_REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, fetchUser]);

  const login = useCallback(async (userData: User) => {
    // Trust the server-returned user and navigate immediately.
    // No need to re-fetch — the cookie is already set server-side.
    setUser(userData);
    router.push(userData.role === 'admin' ? '/admin' : '/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
