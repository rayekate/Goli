'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import UserSidebar from '@/components/UserSidebar';
import AppHeader from '@/components/AppHeader';
import GoldCoinLoader from '@/components/GoldCoinLoader';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check for maintenance mode
  React.useEffect(() => {
    if (user?.role === 'admin') return;
    
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.maintenanceMode) {
            router.replace('/maintenance');
          }
        }
      } catch (err) {
        // ignore network errors for maintenance check
      }
    };
    checkMaintenance();
  }, [user, router]);

  // Auth guard effect — only redirect after auth state is resolved
  const hasRedirected = React.useRef(false);
  React.useEffect(() => {
    if (!loading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GoldCoinLoader label="Connecting to platform…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GoldCoinLoader label="Redirecting to login…" />
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
        <UserSidebar />
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
