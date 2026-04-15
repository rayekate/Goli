'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accent?: 'default' | 'success' | 'danger' | 'warning';
}

const ACCENT_MAP = {
  default: { glow: 'var(--accent)', iconBg: 'rgba(245,158,11,0.08)', iconBorder: 'rgba(245,158,11,0.15)', iconColor: 'var(--accent)' },
  success: { glow: 'var(--success)', iconBg: 'rgba(52,211,153,0.08)', iconBorder: 'rgba(52,211,153,0.15)', iconColor: 'var(--success)' },
  danger:  { glow: 'var(--danger)',  iconBg: 'rgba(239,68,68,0.08)',   iconBorder: 'rgba(239,68,68,0.15)',  iconColor: 'var(--danger)'  },
  warning: { glow: '#f59e0b',        iconBg: 'rgba(245,158,11,0.08)', iconBorder: 'rgba(245,158,11,0.15)', iconColor: '#f59e0b'        },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  accent = 'default',
}: StatCardProps) {
  const a = ACCENT_MAP[accent];

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: 'var(--glass-border)',
        borderRadius: '16px',
        padding: '1.35rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minHeight: '120px',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: 'var(--glass-shadow)',
      }}
      className="animate-in stagger-2"
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${a.glow}, transparent)`,
        opacity: 0.5, pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.68rem',
            marginBottom: '0.5rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}>
            {title}
          </p>

          <h2 style={{
            fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)',
            margin: 0,
            color: 'var(--text)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}>
            {value}
          </h2>

          {trend && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              marginTop: '0.65rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
              background: trend.isPositive ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)',
              padding: '0.2rem 0.65rem',
              borderRadius: '100px',
              border: `1px solid ${trend.isPositive ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)'}`,
            }}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>

        {/* Icon box */}
        <div style={{
          width: 48, height: 48, borderRadius: '12px', flexShrink: 0,
          background: a.iconBg,
          border: `1px solid ${a.iconBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: a.iconColor,
          transition: 'all 0.3s ease',
        }}>
          <Icon size={21} />
        </div>
      </div>

      {/* Subtle corner glow */}
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: 100, height: 100,
        background: a.glow,
        filter: 'blur(50px)',
        opacity: 0.05,
        pointerEvents: 'none', zIndex: 0,
      }} />
    </div>
  );
}
