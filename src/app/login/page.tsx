'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

/* ─── Shared inline-style tokens ─── */
const ICON_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
  pointerEvents: 'none',
  flexShrink: 0,
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--border)',
  borderRadius: '12px',
  padding: '0.875rem 1rem 0.875rem 2.6rem',
  color: 'var(--text)',
  fontSize: '0.95rem',
  fontWeight: 500,
  outline: 'none',
  transition: 'all 0.25s',
  fontFamily: 'inherit',
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--text-muted)',
  marginBottom: '0.45rem',
  display: 'block',
};

function LoginContent() {
  const searchParams = useSearchParams();
  const isVerified = searchParams.get('verified') === 'true';

  const [formData, setFormData] = useState({ identifier: '', password: '', rememberMe: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login } = useAuth();

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
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (parseInt(captchaInput) !== captcha.sum) {
      setError('Incorrect captcha answer. Please try again.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFormData({ identifier: '', password: '', rememberMe: false });
        login(data.user);
      } else {
        setFormData(prev => ({ ...prev, password: '' }));
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch {
      setFormData(prev => ({ ...prev, password: '' }));
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const focusedIconColor = 'var(--primary)';
  const iconColor = (field: string) => focusedField === field ? focusedIconColor : 'var(--text-muted)';
  const inputFocusStyle = (field: string): React.CSSProperties => focusedField === field
    ? { ...INPUT_STYLE, borderColor: 'var(--primary)', background: 'rgba(52,211,153,0.04)', boxShadow: '0 0 0 3px rgba(52,211,153,0.1)' }
    : INPUT_STYLE;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', overflow: 'hidden', background: 'var(--background)' }}>

      {/* Orbs */}
      <div style={{ position: 'fixed', width: 500, height: 500, top: -150, left: -150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', width: 400, height: 400, bottom: -100, right: -100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div
        style={{
          position: 'relative', zIndex: 1, display: 'flex', width: '100%', minHeight: '100vh',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* ── LEFT BRAND PANEL ── */}
        <div style={{
          display: 'none',
          // shown via media query below
        }} className="auth-brand-panel-lp">
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Logo */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg,rgba(212,175,55,0.15) 0%,rgba(212,175,55,0.05) 100%)',
                border: '1px solid rgba(212,175,55,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(212,175,55,0.1)',
              }}>
                <span style={{
                  fontSize: '2rem', fontWeight: 900, fontFamily: 'serif',
                  background: 'linear-gradient(135deg,var(--accent) 0%,#d97706 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>G</span>
              </div>
            </div>

            <h1 style={{
              fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '0.85rem',
              background: 'linear-gradient(135deg,var(--text) 0%,var(--accent) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>GoldXchange</h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 340, marginBottom: '2.5rem' }}>
              The premier platform for gold trading with real-time pricing, secure vaults, and instant settlements.
            </p>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '3rem' }}>
              {[
                { icon: '🔒', label: 'Bank-grade encryption' },
                { icon: '⚡', label: 'Real-time gold prices' },
                { icon: '🏛️', label: 'Insured digital vaults' },
                { icon: '📊', label: 'Advanced trade analytics' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  <span style={{
                    fontSize: '1.1rem', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 8, flexShrink: 0,
                  }}>{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>


          </div>

          {/* Chart decoration */}
          <div style={{ position: 'absolute', bottom: '2.5rem', left: '3.5rem', right: '3.5rem', opacity: 0.6 }}>
            <svg viewBox="0 0 300 100" fill="none" style={{ width: '100%', height: 'auto' }}>
              <polyline points="0,80 40,60 80,65 120,40 160,45 200,20 240,30 300,10" stroke="url(#gg1)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="gg1" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
          <div className='' style={{ width: '100%', maxWidth: 420, }}>

            {/* Mobile logo */}
            <div className="auth-mobile-logo-lp " style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg,rgba(212,175,55,0.15) 0%,rgba(212,175,55,0.05) 100%)',
                border: '1px solid rgba(212,175,55,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, fontFamily: 'serif', background: 'linear-gradient(135deg,var(--accent) 0%,#d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>G</span>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, background: 'linear-gradient(135deg,var(--text) 0%,var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GoldXchange</span>
            </div>

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: '0.4rem' }}>Welcome back</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sign in to your trading account</p>
            </div>

            {/* Verified banner */}
            {isVerified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.85rem 1rem', borderRadius: 12, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.5rem' }}>
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                <span>Email verified! You can now sign in.</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.85rem 1rem', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.5rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Identifier */}
              <div>
                <label style={{ ...LABEL_STYLE, color: focusedField === 'id' ? 'var(--primary)' : 'var(--text-muted)' }}>Email or Username</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ ...ICON_STYLE, color: iconColor('id') }} />
                  <input
                    type="text"
                    placeholder="you@example.com"
                    required
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    onFocus={() => setFocusedField('id')}
                    onBlur={() => setFocusedField(null)}
                    style={inputFocusStyle('id')}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <label style={{ ...LABEL_STYLE, marginBottom: 0, color: focusedField === 'pw' ? 'var(--primary)' : 'var(--text-muted)' }}>Password</label>
                  <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent)', opacity: 0.85, fontWeight: 500 }}>Forgot password?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ ...ICON_STYLE, color: iconColor('pw') }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocusedField('pw')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputFocusStyle('pw'), paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Captcha */}
              <div>
                <label style={{ ...LABEL_STYLE, color: focusedField === 'cap' ? 'var(--primary)' : 'var(--text-muted)' }}>Security Check</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
                    flex: '0 0 auto', minWidth: 145, padding: '0.875rem 0.9rem',
                    background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.18)',
                    borderRadius: 12, userSelect: 'none',
                  }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, fontFamily: 'monospace' }}>
                      {captcha.num1} + {captcha.num2} = ?
                    </span>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      title="Refresh captcha"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3, borderRadius: 4, flexShrink: 0, transition: 'color 0.2s' }}
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Answer"
                    required
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                    onFocus={() => setFocusedField('cap')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputFocusStyle('cap'), flex: 1, paddingLeft: '1rem' }}
                  />
                </div>
              </div>

              {/* Remember me */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ position: 'relative', width: 18, height: 18, flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    style={{ position: 'absolute', opacity: 0, width: 18, height: 18, cursor: 'pointer', zIndex: 2, margin: 0 }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 5,
                    background: formData.rememberMe ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${formData.rememberMe ? 'var(--primary)' : 'var(--border-highlight)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', color: '#000',
                  }}>
                    {formData.rememberMe && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Keep me signed in</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '1rem', borderRadius: 12,
                  background: 'var(--primary)', color: 'var(--primary-text)',
                  border: 'none', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'all 0.25s', marginTop: '0.25rem',
                  boxShadow: '0 4px 14px rgba(52,211,153,0.15)',
                }}
              >
                {loading ? (
                  <><GoldCoinLoader mini label={null} /><span>Signing in…</span></>
                ) : (
                  <><span>Sign In</span><ArrowRight size={18} /></>
                )}
              </button>

            </form>

            <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one for free</Link>
            </p>

          </div>
        </div>
      </div>

      {/* ── Responsive CSS (non-scoped, uses class selectors safe for global) ── */}
      <style>{`
        @media (min-width: 900px) {
          .auth-brand-panel-lp {
            display: flex !important;
            flex: 0 0 46%;
            position: relative;
            background: linear-gradient(145deg, rgba(212,175,55,0.05) 0%, rgba(5,5,5,0) 60%);
            border-right: 1px solid var(--border);
            flex-direction: column;
            justify-content: center;
            padding: 4rem 3.5rem;
            overflow: hidden;
          }
          .auth-mobile-logo-lp {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <GoldCoinLoader label="Loading..." />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
