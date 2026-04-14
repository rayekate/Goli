'use client';

import React from 'react';
import { Settings, ShieldAlert, Clock } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="maintenance-backdrop">
      <div className="maintenance-card animate-in">
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '200px',
          background: 'var(--gold-glow)',
          opacity: 0.1,
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }} />

        <div style={{
          width: '80px',
          height: '80px',
          background: 'rgba(212,175,55,0.1)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          border: '1px solid rgba(212,175,55,0.2)',
          animation: 'pulseGold 3s infinite'
        }}>
          <Settings size={40} color="var(--accent)" style={{ animation: 'spin 10s linear infinite' }} />
        </div>

        <h1 className="text-gradient-gold" style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 800 }}>
          System Maintenance
        </h1>
        
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
          We are currently performing scheduled upgrades to enhance your trading experience. 
          The platform will be back online shortly. Thank you for your patience.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'var(--surface-hover)',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', fontSize: '0.9rem' }}>
            <Clock size={16} />
            <span>Estimated Uptime: Under 30 minutes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <ShieldAlert size={16} />
            <span>Client Assets are Secure</span>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="btn btn-gold"
          style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '12px', fontWeight: 700 }}
        >
          Check Connectivity
        </button>
      </div>
    </div>
  );
}
