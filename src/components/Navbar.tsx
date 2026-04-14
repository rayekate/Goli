'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LivePriceTicker from './LivePriceTicker';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
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
          <Link href="/" className={`${styles.logo} text-gradient-gold`}>
            GOLD<span>TRADEX</span>
          </Link>

          {/* Live price chip — visible to everyone */}
          <div className={styles.livePriceChip}>
            <LivePriceTicker compact />
          </div>

          {/* Hamburger toggle */}
          <button
            className={styles.menuToggle}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}>
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <Link href="/admin" className={styles.adminLink}>Admin Panel</Link>
                ) : (
                  <Link href="/dashboard" className={styles.adminLink} style={{ color: 'var(--gold)', borderColor: 'var(--gold)' }}>Dashboard</Link>
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
                <Link href="/contact" className={pathname === '/contact' ? styles.active : ''}>Contact</Link>
                <Link href="/login" className={pathname === '/login' ? styles.active : ''}>Login</Link>
                <Link href="/register" className={styles.getStartedBtn}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
