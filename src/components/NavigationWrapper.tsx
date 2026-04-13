'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

const dashboardRoutes = [
  '/dashboard',
  '/trade',
  '/deposit',
  '/withdraw',
  '/history',
  '/settings',
  '/support',
  '/admin'
];

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if current path is a dashboard route
  const isDashboard = dashboardRoutes.some(route => pathname.startsWith(route));

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </>
  );
}
