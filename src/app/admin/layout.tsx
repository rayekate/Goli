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
        router.replace('/login');
      } else if (user.role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="skeleton" style={{ width: '100%', height: '400px' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: 'clamp(16px, 4vw, 40px)', background: 'var(--background)', overflow: 'auto', width: '100%', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
