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
        gap: '0.6rem',
        padding: '0.45rem 0.9rem',
        background: 'rgba(128,128,128, 0.08)',
        border: '1px solid var(--border)',
        borderRadius: '100px',
        cursor: 'pointer',
        transition: 'var(--transition-editorial)',
        color: 'var(--text)',
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {theme === 'dark' ? (
          <Moon size={14} style={{ color: 'var(--primary)' }} />
        ) : (
          <Sun size={14} style={{ color: 'var(--accent)' }} />
        )}
      </div>
      <span style={{
        fontSize: '9px',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.3em',
        opacity: 0.75,
        color: 'var(--text)',
      }}>
        {theme === 'dark' ? 'DARK' : 'LIGHT'}
      </span>
    </button>
  );
}
