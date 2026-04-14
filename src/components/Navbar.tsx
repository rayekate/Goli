'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LivePriceTicker from './LivePriceTicker';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className={styles.navbarWrapper}>
      <nav className={styles.navbar}>
        <div className={styles.inner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href="/" className={`${styles.logo} text-gradient-gold`}>
              GOLD<span>XCHANGE</span>
            </Link>
            
            <div className={styles.statusContainer}>
              <div className={styles.statusDot} />
              <span className={styles.statusText}>Live Terminal</span>
              <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
              <LivePriceTicker compact />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Hamburger toggle */}
            <button
              className={styles.menuToggle}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}>
              <ThemeToggle />
              {user ? (
                <>
                  <Link href="/dashboard" className={pathname === '/dashboard' ? styles.active : ''}>Dashboard</Link>
                  <Link href="/trade" className={pathname === '/trade' ? styles.active : ''}>Trade</Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className={pathname === '/admin' ? styles.active : ''}>Admin</Link>
                  )}
                  <div className={styles.userSection}>
                    <span className={styles.balance}>
                      ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <button onClick={logout} className={styles.logoutBtn}>Logout</button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className={pathname === '/login' ? styles.active : ''}>Login</Link>
                  <Link href="/register" className={styles.getStartedBtn}>Register Now</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
