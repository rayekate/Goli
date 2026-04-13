import React from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone, Shield, TrendingUp, HelpCircle, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ 
      background: 'rgba(8, 14, 26, 0.9)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(212, 175, 55, 0.06)',
      marginTop: 'auto',
      padding: '3.5rem 2rem 1.5rem',
      position: 'relative',
    }}>
      {/* Top gold line accent */}
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)' }} />
      
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
          
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-1px' }}>
              <span style={{ color: '#fff' }}>GOLD</span>
              <span className="text-gradient-gold">TRADEX</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>
              The premium destination for active traders. Execute trades on global XAU/USD aggregates with institutional speed.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--gold)', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link href="/trade" style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={14} color="var(--gold)" /> Live Trading
              </Link>
              <Link href="/deposit" style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={14} color="var(--gold)" /> Secure Deposit
              </Link>
              <Link href="/support" style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={14} color="var(--gold)" /> Support Center
              </Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--gold)', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={14} color="var(--success)" /> 2FA Protection
              </span>
              <Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Terms of Service</Link>
              <Link href="#" style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Privacy Policy</Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--gold)', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={14} color="var(--gold)" /> support@goldtradex.com
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={14} color="var(--gold)" /> +1 (888) 123-GOLD
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} color="var(--gold)" /> Global Financial Hub
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid rgba(212, 175, 55, 0.06)', 
          paddingTop: '1.5rem', 
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', opacity: 0.7 }}>
            © {new Date().getFullYear()} GoldTradex. All market data is aggregated and does not constitute financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
