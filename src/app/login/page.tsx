'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

function LoginContent() {
  const searchParams = useSearchParams();
  const isVerified = searchParams.get('verified') === 'true';

  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
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

  // Captcha state
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, sum: 0 });
  const [captchaInput, setCaptchaInput] = useState('');

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setCaptcha({ num1: n1, num2: n2, sum: n1 + n2 });
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (parseInt(captchaInput) !== captcha.sum) {
      setError('Incorrect captcha result');
      generateCaptcha();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password,
          rememberMe: formData.rememberMe 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.requires2FA) {
          setOtpEmail(formData.email);
          setMaskedEmail(data.email);
          setOtpStep(true);
          setResendCooldown(60);
        } else {
          setFormData({ email: '', password: '', rememberMe: false });
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
        body: JSON.stringify({ email: otpEmail, otp: otpCode, rememberMe: formData.rememberMe }),
      });

      const data = await res.json();
      if (res.ok) {
        setFormData({ email: '', password: '', rememberMe: false });
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
              {/* Email verified success banner */}
              {isVerified && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  padding: '0.85rem 1.1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  color: '#10B981',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                }}>
                  <CheckCircle size={18} style={{ flexShrink: 0 }} />
                  Email verified! You can now sign in to your account.
                </div>
              )}

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

                {/* Captcha */}
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Captcha</label>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
                    <div style={{
                      flex: '0 0 140px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: 'var(--gold)',
                      letterSpacing: '2px',
                      userSelect: 'none'
                    }}>
                      {captcha.num1} + {captcha.num2} = ?
                    </div>
                    <input
                      type="text"
                      placeholder="Your answer"
                      required
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                      <input
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                        style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 2 }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: formData.rememberMe ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${formData.rememberMe ? 'var(--gold)' : 'rgba(212,175,55,0.2)'}`,
                        borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}>
                        {formData.rememberMe && <ShieldCheck size={12} color="#000" />}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Remember me</span>
                  </label>
                  <Link href="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--gold)', opacity: 0.8 }}>Forgot password?</Link>
                </div>

                <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '0.5rem', fontSize: '1rem', padding: '0.85rem', borderRadius: '10px' }} disabled={loading}>
                  {loading ? (
                    <><GoldCoinLoader mini label={null} /> Authenticating...</>
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
                    <><GoldCoinLoader mini label={null} /> Verifying...</>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <GoldCoinLoader label="Loading security module..." />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
