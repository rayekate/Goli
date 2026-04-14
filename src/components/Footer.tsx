'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone, Shield, TrendingUp, HelpCircle, Lock, MessageCircle } from 'lucide-react';

export default function Footer() {
  const [telegramUsername, setTelegramUsername] = useState<string>('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        const username = data.settings?.telegramUsername;
        if (typeof username === 'string' && username.trim() !== '') {
          setTelegramUsername(username.trim());
        } else {
          setTelegramUsername('');
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      marginTop: 'auto',
      padding: '4rem 1.5rem 2rem',
      position: 'relative',
    }}>
      {/* Top gradient accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', opacity: 0.5 }} />
      
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '3rem', marginBottom: '3rem' }}>
          
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 1rem 0', letterSpacing: '-0.5px' }}>
              <span style={{ color: 'var(--text)' }}>GOLD</span>
              <span style={{ color: 'var(--accent)' }}>XCHANGE</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '300px' }}>
              The premium destination for institutional gold traders. Execute trades on global XAU/USD aggregates with unparalleled precision.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: '1.25rem', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link href="/trade" className="interactive-haptic" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}>
                <TrendingUp size={14} /> Live Trading
              </Link>
              <Link href="/deposit" className="interactive-haptic" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}>
                <Lock size={14} /> Secure Deposit
              </Link>
              <Link href="/support" className="interactive-haptic" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}>
                <HelpCircle size={14} /> Support Center
              </Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: '1.25rem', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={14} style={{ color: 'var(--primary)' }} /> 2FA Protection
              </div>
              <Link href="#" className="interactive-haptic" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', transition: 'color 0.2s' }}>Terms of Service</Link>
              <Link href="#" className="interactive-haptic" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', transition: 'color 0.2s' }}>Privacy Policy</Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: '1.25rem', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={14} /> support@goldxchange.org
              </div>
              
              {telegramUsername ? (
                <a 
                  href={`https://t.me/${telegramUsername.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="interactive-haptic"
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}
                >
                  <MessageCircle size={14} /> Telegram
                </a>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} /> +1 (888) 123-GOLD
                </div>
              )}

              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} /> Global Financial Hub
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid var(--border)', 
          paddingTop: '2rem', 
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            © {new Date().getFullYear()} GoldXchange. All market data is aggregated and does not constitute financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
