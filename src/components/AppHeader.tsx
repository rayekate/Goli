'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import LivePriceTicker from './LivePriceTicker';
import ThemeToggle from './ThemeToggle';
import { LogOut, User, Menu, X } from 'lucide-react';
import styles from './AppHeader.module.css';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUI();

  return (
    <header className={styles.header}>
      {/* Mobile Toggle */}
      <button 
        className={styles.mobileToggle} 
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Logo */}
      <Link href="/dashboard" className={styles.logo}>
        GOLD<span>XCHANGE</span>
      </Link>

      {/* Live price — centre */}
      <div className={styles.priceArea}>
        <LivePriceTicker compact />
      </div>

      {/* User info + logout — right */}
      <div className={styles.userArea}>
        {user && (
          <>
            <ThemeToggle />
            <div className={styles.userChip}>
              <div className={styles.avatar}>
                <User size={14} />
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userBalance}>
                  ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button onClick={logout} className={styles.logoutBtn} aria-label="Logout">
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
