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
    <div className="glass-card animate-in stagger-2" style={{
      padding: '1.25rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      borderRadius: '24px',
      overflow: 'visible', // allow glow to bleed
      minHeight: '120px',
      justifyContent: 'center'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.7rem', 
            marginBottom: '0.4rem', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em' 
          }}>{title}</p>
          <h2 style={{ 
            fontSize: '1.75rem', 
            margin: 0, 
            color: '#fff', 
            fontWeight: 950,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>{value}</h2>
          
          {trend && (
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginTop: '0.75rem',
              fontSize: '0.72rem', 
              fontWeight: 800,
              color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
              background: trend.isPositive ? 'rgba(0,230,138,0.06)' : 'rgba(255,71,87,0.06)',
              padding: '0.2rem 0.75rem',
              borderRadius: '100px',
              border: `1px solid ${trend.isPositive ? 'rgba(0,230,138,0.1)' : 'rgba(255,71,87,0.1)'}`,
            }}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>
        <div className="icon-box" style={{ 
          width: '52px', 
          height: '52px', 
          borderRadius: '14px',
          flexShrink: 0
        }}>
          <Icon size={24} />
        </div>
      </div>
      
      {/* Dynamic Aura Glow */}
      <div style={{ 
        position: 'absolute', 
        bottom: '-10%', 
        right: '-10%', 
        width: '100px', 
        height: '100px', 
        background: 'var(--gold)', 
        filter: 'blur(50px)', 
        opacity: 0.04, 
        pointerEvents: 'none',
        zIndex: 0
      }} />
    </div>
  );
}
