'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Activity,
  LogOut,
  Headset,
  Settings,
  Wallet,
  Clock,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import styles from './AdminSidebar.module.css';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { name: 'Command Center', icon: LayoutDashboard, href: '/admin' },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Manage Users', icon: Users, href: '/admin/users' },
      { name: 'Transactions', icon: ArrowLeftRight, href: '/admin/transactions' },
      { name: 'Global Trades', icon: Activity, href: '/admin/trades' },
      { name: 'Wallets', icon: Wallet, href: '/admin/wallets' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Help Desk', icon: Headset, href: '/admin/support' },
      { name: 'Trade Schedule', icon: Clock, href: '/admin/schedule' },
      { name: 'Audit Logs', icon: ShieldCheck, href: '/admin/audit' },
      { name: 'Settings', icon: Settings, href: '/admin/settings' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useUI();

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>

        {/* ── Nav sections ── */}
        <nav className={styles.menu}>
          {NAV_SECTIONS.map((section) => (
            <React.Fragment key={section.label}>
              <p className={styles.sectionLabel}>{section.label}</p>

              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.menuItem} ${active ? styles.activeItem : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={17} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* ── Logout ── */}
        <div className={styles.logoutSection}>
          <button
            onClick={logout}
            className={`${styles.menuItem} ${styles.logoutBtn}`}
          >
            <LogOut size={17} />
            <span>Exit Admin</span>
          </button>
        </div>
      </div>
    </>
  );
}
