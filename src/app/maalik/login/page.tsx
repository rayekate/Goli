'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Shield, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

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
        setFormData({ email: '', password: '' });
        login(data.user);
      } else {
        setFormData(prev => ({ ...prev, password: '' }));
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, password: '' }));
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="ambient-orb orb-gold" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px', opacity: 0.5 }} />
      
      <div className="container animate-in" style={{ maxWidth: '440px', width: '100%', padding: '40px 20px', zIndex: 1 }}>
        <div style={{
          background: 'rgba(8, 14, 26, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(212, 175, 55, 0.1)'
        }}>
          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '56px', height: '56px', margin: '0 auto 1rem', background: 'rgba(212, 175, 55, 0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212,175,55,0.3)' }}>
              <Shield size={28} color="var(--gold)" />
            </div>
            <h2 className="text-gradient-gold" style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Admin Portal</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Sign in to access your administrative dashboard
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(255, 71, 87, 0.08)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(255, 71, 87, 0.15)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Admin Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input 
                  type="email" 
                  placeholder="admin@example.com" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  required 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '0.5rem', fontSize: '1rem', padding: '0.85rem', borderRadius: '10px' }} disabled={loading}>
              {loading ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Authenticating...</>
              ) : (
                <>Authorize Access <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Return to User Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
