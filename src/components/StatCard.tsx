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
}

export default function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="animate-in stagger-2" style={{
      position: 'relative',
      background: 'rgba(8, 14, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(212, 175, 55, 0.08)',
      borderRadius: '14px',
      padding: '1rem 1.15rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      overflow: 'hidden',
      transition: 'all 0.35s ease',
    }}>
      {/* Top light line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)', pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.3rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
          <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#fff', fontWeight: 800 }}>{value}</h2>
          
          {trend && (
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.5rem',
              fontSize: '0.7rem', 
              fontWeight: 600,
              color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
              background: trend.isPositive ? 'rgba(0,230,138,0.08)' : 'rgba(255,71,87,0.08)',
              padding: '0.15rem 0.5rem',
              borderRadius: '20px',
              border: `1px solid ${trend.isPositive ? 'rgba(0,230,138,0.15)' : 'rgba(255,71,87,0.15)'}`,
            }}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>
        <div style={{ 
          background: 'rgba(212, 175, 55, 0.06)', 
          padding: '0.6rem', 
          borderRadius: '12px',
          color: 'var(--gold)',
          border: '1px solid rgba(212, 175, 55, 0.1)',
        }}>
          <Icon size={22} />
        </div>
      </div>
      
      {/* Corner glow */}
      <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '60px', height: '60px', background: 'var(--gold)', filter: 'blur(40px)', opacity: 0.06, pointerEvents: 'none' }} />
    </div>
  );
}
