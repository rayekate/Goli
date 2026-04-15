'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import AppHeader from '@/components/AppHeader';
import GoldCoinLoader from '@/components/GoldCoinLoader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/admin-343adfasdhl343lkdf9');
      } else if (user.role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GoldCoinLoader label="Verifying admin access…" />
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      overflow: 'hidden',
      background: 'var(--background)',
    }}>
      {/* Background system */}
      <div className="noise-texture" />
      <div className="mesh-gradient" />
      <div className="grid-overlay" />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 100 }}>
        <AppHeader />
      </div>

      {/* Body: sidebar + content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', zIndex: 10 }}>
        <AdminSidebar />

        <main style={{
          flex: 1,
          /* 96px fixed header + 16px gap */
          paddingTop: '128px',
          paddingBottom: '3rem',
          paddingLeft: 'clamp(16px, 3vw, 40px)',
          paddingRight: 'clamp(16px, 3vw, 40px)',
          /* 248px sidebar + 24px left gutter + 16px extra */
          marginLeft: '288px',
          background: 'transparent',
          overflow: 'auto',
          width: '100%',
          minWidth: 0,
          transition: 'margin-left 0.4s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {children}
        </main>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 1024px) {
          main { margin-left: 0 !important; padding-top: 108px !important; }
        }
        @media (max-width: 480px) {
          main { padding-left: 12px !important; padding-right: 12px !important; }
        }
      `}</style>
    </div>
  );
}
