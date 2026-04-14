'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Shield, Eye, EyeOff, ArrowRight, Lock, Command } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setFormData({ identifier: '', password: '' });
        await login(data.user);
        router.push('/admin');
      } else {
        setFormData(prev => ({ ...prev, password: '' }));
        setError(data.error || 'Identity verification failed');
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, password: '' }));
      setError('A secure connection could not be established.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background-base)', overflow: 'hidden' }}>
      {/* Background Ambience */}
      <div className="noise-texture" />
      <div className="mesh-gradient" />
      <div className="grid-overlay" />
      
      <div className="ambient-orb orb-gold" style={{ top: '20%', right: '10%', width: '600px', height: '600px', opacity: 0.15 }} />
      <div className="ambient-orb orb-purple" style={{ bottom: '10%', left: '5%', width: '500px', height: '500px', opacity: 0.1 }} />

      <div className="container animate-in" style={{ maxWidth: '440px', width: '100%', padding: '40px 20px', zIndex: 1 }}>
        <div className="glass-card" style={{ padding: '3.5rem 2.5rem', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
          {/* Decorative Elements */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--gradient-gold)' }} />
          <div style={{ position: 'absolute', top: '20px', right: '20px', opacity: 0.05, pointerEvents: 'none' }}>
            <Command size={120} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative' }}>
            <div className="icon-box" style={{ 
              width: '72px', 
              height: '72px', 
              margin: '0 auto 1.5rem', 
              borderRadius: '20px', 
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.1)'
            }}>
              <Shield size={32} />
            </div>
            <h1 style={{ 
              fontSize: '2.2rem', 
              marginBottom: '0.6rem', 
              fontWeight: 900,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, var(--text) 30%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Admin Portal
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
              Secure Terminal Access Protocol
            </p>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              color: 'var(--danger)', 
              padding: '0.85rem 1rem', 
              borderRadius: '12px', 
              marginBottom: '2rem', 
              fontSize: '0.85rem', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              textAlign: 'center',
              fontWeight: 600
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label style={{ fontSize: '0.75rem', letterSpacing: '0.15em' }}>Access Identifier</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6 }} />
                <input 
                  type="text" 
                  placeholder="Username or Admin Email" 
                  required 
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  style={{ paddingLeft: '2.8rem', background: 'var(--surface-hover)', border: '1px solid var(--border-highlight)' }}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '2.5rem' }}>
              <label style={{ fontSize: '0.75rem', letterSpacing: '0.15em' }}>Security Key</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6 }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••••••" 
                  required 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ paddingLeft: '2.8rem', paddingRight: '3rem', background: 'var(--surface-hover)', border: '1px solid var(--border-highlight)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-gold" style={{ 
              width: '100%', 
              padding: '1.1rem', 
              borderRadius: '16px', 
              fontSize: '1rem', 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: '0 12px 24px rgba(212, 175, 55, 0.15)'
            }} disabled={loading}>
              {loading ? (
                <><GoldCoinLoader mini label={null} /> Initializing...</>
              ) : (
                <>Authorize Session <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'underline', opacity: 0.6, transition: '0.3s' }}>
              Cancel & Return to Public Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
