'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import AppHeader from '@/components/AppHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Auth & Role guard effects
  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/admin-343adfasdhl343lkdf9');
      } else if (user.role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);

  // Loading or Unauthorized state
  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="skeleton" style={{ width: '100%', height: '400px' }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Immersive Background System */}
      <div className="noise-texture" />
      <div className="mesh-gradient" />
      <div className="grid-overlay" />

      {/* Sticky top header with logo, live price, user info */}
      <div style={{ position: 'relative', zIndex: 100 }}>
        <AppHeader />
      </div>

      {/* Sidebar + page content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', zIndex: 10 }}>
        <AdminSidebar />
        <main style={{
          flex: 1,
          padding: '180px clamp(16px, 4vw, 40px) 40px', // Top padding for fixed header + spacing
          marginLeft: '270px', // Offset for fixed sidebar (240px + 30px margin)
          background: 'transparent',
          overflow: 'auto',
          width: '100%',
          minWidth: 0,
          transition: 'margin-left 0.4s ease',
        }}>
          <style jsx global>{`
            @media (max-width: 1024px) {
              main { margin-left: 0 !important; padding-top: 140px !important; }
            }
          `}</style>
          {children}
        </main>
      </div>
    </div>
  );
}
