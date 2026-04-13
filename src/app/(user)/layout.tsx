'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import UserSidebar from '@/components/UserSidebar';
import AppHeader from '@/components/AppHeader';

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

  // Auth guard effect
  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="skeleton-loader" style={{ margin: '0 auto', width: '40px', height: '40px' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Connecting to platform...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Sticky top header with logo, live price, user info */}
      <AppHeader />

      {/* Sidebar + page content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <UserSidebar />
        <main style={{
          flex: 1,
          padding: 'clamp(16px, 4vw, 40px)',
          background: 'var(--background)',
          overflow: 'auto',
          width: '100%',
          minWidth: 0,
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
