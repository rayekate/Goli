'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="interactive-haptic"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 1rem',
        background: 'rgba(var(--text), 0.05)',
        border: '1px solid var(--border)',
        borderRadius: '100px',
        cursor: 'pointer',
        transition: 'var(--transition-editorial)',
        color: 'var(--text)',
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'Obscura' : 'Lumina'} mode`}
    >
      <div style={{ position: 'relative', width: '20px', height: '20px' }}>
        {theme === 'dark' ? (
          <Moon size={18} style={{ color: 'var(--primary)' }} />
        ) : (
          <Sun size={18} style={{ color: 'var(--accent)' }} />
        )}
      </div>
      <span className="meta-text" style={{ fontSize: '9px', letterSpacing: '0.4em', opacity: 0.8 }}>
        {theme === 'dark' ? 'LUMINA' : 'OBSCURA'}
      </span>
    </button>
  );
}
