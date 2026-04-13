'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUI } from '@/context/UIContext';
import { 
  LayoutDashboard, 
  LineChart, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Clock, 
  Settings,
  Headset
} from 'lucide-react';
import styles from './UserSidebar.module.css';

export default function UserSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUI();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Trade Terminal', icon: LineChart, href: '/trade' },
    { name: 'Deposit', icon: ArrowDownCircle, href: '/deposit' },
    { name: 'Withdraw', icon: ArrowUpCircle, href: '/withdraw' },
    { name: 'History', icon: Clock, href: '/history' },
    { name: 'Settings', icon: Settings, href: '/settings' },
    { name: 'Support', icon: Headset, href: '/support' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.menu}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
      </div>
    </>
  );
}
