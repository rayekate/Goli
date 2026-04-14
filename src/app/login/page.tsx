'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  // 2FA OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.requires2FA) {
          setOtpEmail(formData.email);
          setMaskedEmail(data.email);
          setOtpStep(true);
          setResendCooldown(60);
        } else {
          setFormData({ email: '', password: '' });
          login(data.user);
        }
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setError('');
    setOtpLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp: otpCode }),
      });

      const data = await res.json();
      if (res.ok) {
        setFormData({ email: '', password: '' });
        setOtpCode('');
        login(data.user);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.requires2FA) {
        setResendCooldown(60);
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch {
      setError('Network error');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="ambient-orb orb-gold" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px' }} />
      
      <div className="container animate-in" style={{ maxWidth: '440px', width: '100%', padding: '40px 20px', zIndex: 1 }}>
        <div style={{
          background: 'rgba(8, 14, 26, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.1)',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />

          {!otpStep ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '56px', height: '56px', margin: '0 auto 1rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212,175,55,0.15)' }}>
                  <Lock size={24} color="var(--gold)" />
                </div>
                <h2 className="text-gradient-gold" style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Welcome Back</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Sign in to access your trading dashboard
                </p>
              </div>

              {error && (
                <div style={{ background: 'rgba(255, 71, 87, 0.08)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(255, 71, 87, 0.15)', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input 
                      type="email" 
                      placeholder="name@example.com" 
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
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
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
                    <>Sign In <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Don&apos;t have an account?{' '}
                <Link href="/register" style={{ color: 'var(--gold)', fontWeight: 600 }}>Create one</Link>
              </p>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '56px', height: '56px', margin: '0 auto 1rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212,175,55,0.15)' }}>
                  <ShieldCheck size={24} color="var(--gold)" />
                </div>
                <h2 className="text-gradient-gold" style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>Verify Your Identity</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: '#fff' }}>{maskedEmail}</strong>
                </p>
              </div>

              {error && (
                <div style={{ background: 'rgba(255, 71, 87, 0.08)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(255, 71, 87, 0.15)', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={14} /> Verification Code
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoFocus
                    style={{ letterSpacing: '8px', fontFamily: 'monospace', fontSize: '1.4rem', textAlign: 'center', padding: '0.85rem' }}
                  />
                </div>

                <button type="submit" className="btn btn-gold" style={{ width: '100%', fontSize: '1rem', padding: '0.85rem', borderRadius: '10px' }} disabled={otpLoading || otpCode.length !== 6}>
                  {otpLoading ? (
                    <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</>
                  ) : (
                    <>Verify & Sign In <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => { setOtpStep(false); setOtpCode(''); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}
                >
                  ← Back to login
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || otpLoading}
                  style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--gold)', cursor: resendCooldown > 0 ? 'default' : 'pointer', fontSize: '0.82rem', padding: 0 }}
                >
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend code'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
