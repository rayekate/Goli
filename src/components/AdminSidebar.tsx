'use client';

import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useUI();

  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, href: '/admin' },
    { name: 'Manage Users', icon: Users, href: '/admin/users' },
    { name: 'Transactions', icon: ArrowLeftRight, href: '/admin/transactions' },
    { name: 'Global Trades', icon: Activity, href: '/admin/trades' },
    { name: 'Help Desk', icon: Headset, href: '/admin/support' },
    { name: 'Wallets', icon: Wallet, href: '/admin/wallets' },
    { name: 'Trading Schedule', icon: Clock, href: '/admin/schedule' },
    { name: 'Audit Logs', icon: ShieldCheck, href: '/admin/audit' },
    { name: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.menu}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.menuItem} ${isActive ? styles.activeItem : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className={styles.logoutSection}>
          <button onClick={logout} className={`${styles.menuItem} ${styles.logoutBtn}`}>
            <LogOut size={20} />
            <span>Exit Admin</span>
          </button>
        </div>
      </div>
    </>
  );
}
