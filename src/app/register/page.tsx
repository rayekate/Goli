'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Mail, Lock, Eye, EyeOff, User, AtSign,
  CheckCircle2, XCircle, ArrowRight, AlertCircle, RefreshCw,
} from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

/* ─── Shared style tokens ─── */
const ICON_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: '13px',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  flexShrink: 0,
};

const INPUT_BASE: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '0.8rem 1rem 0.8rem 2.5rem',
  color: 'var(--text)',
  fontSize: '0.9rem',
  fontWeight: 500,
  outline: 'none',
  transition: 'all 0.25s',
  fontFamily: 'inherit',
};

const INPUT_FOCUS: React.CSSProperties = {
  ...INPUT_BASE,
  borderColor: 'var(--primary)',
  background: 'rgba(52,211,153,0.04)',
  boxShadow: '0 0 0 3px rgba(52,211,153,0.1)',
};

const LABEL: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--text-muted)',
  marginBottom: '0.45rem',
  display: 'block',
};

/* ─── Password strength ─── */
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (s === 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
  if (s === 3) return { score: 3, label: 'Good', color: '#34d399' };
  return { score: 4, label: 'Strong', color: '#10b981' };
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const { login } = useAuth();

  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, sum: 0 });
  const [captchaInput, setCaptchaInput] = useState('');

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setCaptcha({ num1: n1, num2: n2, sum: n1 + n2 });
    setCaptchaInput('');
  };

  useEffect(() => { generateCaptcha(); setMounted(true); }, []);

  const pwStrength = useMemo(() => getStrength(formData.password), [formData.password]);
  const pwMatch = formData.confirmPassword
    ? formData.password === formData.confirmPassword
    : null;

  const iStyle = (field: string): React.CSSProperties => ({
    ...ICON_STYLE,
    color: focused === field ? 'var(--primary)' : 'var(--text-muted)',
  });

  const inStyle = (field: string, extra?: React.CSSProperties): React.CSSProperties =>
    focused === field ? { ...INPUT_FOCUS, ...extra } : { ...INPUT_BASE, ...extra };

  const lStyle = (field: string): React.CSSProperties => ({
    ...LABEL,
    color: focused === field ? 'var(--primary)' : 'var(--text-muted)',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    if (parseInt(captchaInput) !== captcha.sum) { setError('Incorrect captcha answer.'); generateCaptcha(); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, username: formData.username, email: formData.email, password: formData.password }),
      });
      const data = await res.json();
      if (res.ok) { data.requiresOtp ? setIsRegistered(true) : login(data.user); }
      else { setError(data.error || 'Registration failed. Please try again.'); }
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  };

  /* ─── Page root wrapper ─── */
  const pageRoot: React.CSSProperties = {
    position: 'relative', minHeight: '100vh', display: 'flex',
    overflow: 'hidden', background: 'var(--background)',
  };

  /* ── Success Screen ── */
  if (isRegistered) {
    return (
      <div style={pageRoot}>
        <div className="noise-texture" /><div className="mesh-gradient" /><div className="grid-overlay" />
        <div style={{ position: 'fixed', width: 500, height: 500, top: -150, right: -150, borderRadius: '50%', background: 'radial-gradient(circle,rgba(52,211,153,0.05) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', width: 400, height: 400, bottom: -100, left: -100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,175,55,0.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem 1.5rem', width: '100%' }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', border: 'var(--glass-border)', borderRadius: 24, padding: '2.75rem 2rem', boxShadow: 'var(--glass-shadow)', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,var(--accent),transparent)' }} />

            <div style={{ width: 72, height: 72, margin: '0 auto 1.5rem', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={28} color="var(--accent)" />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '0.75rem', color: 'var(--text)' }}>Check your inbox</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              We sent a verification link to{' '}<strong style={{ color: 'var(--text)' }}>{formData.email}</strong>.
              Click the link to activate your account.
            </p>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 12, padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'left', marginBottom: '2rem' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Can't find it? Check your <strong>Spam</strong> or <strong>Junk</strong> folder. Link expires in <strong>10 minutes</strong>.</span>
            </div>

            <Link href="/login" style={{ width: '100%', padding: '1rem', borderRadius: 12, background: 'var(--primary)', color: 'var(--primary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
              Back to Sign In <ArrowRight size={18} />
            </Link>

            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}<Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main Registration Form ── */
  return (
    <div style={pageRoot}>
      <div className="noise-texture" /><div className="mesh-gradient" /><div className="grid-overlay" />
      <div style={{ position: 'fixed', width: 500, height: 500, top: -150, right: -150, borderRadius: '50%', background: 'radial-gradient(circle,rgba(52,211,153,0.05) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', width: 400, height: 400, bottom: -100, left: -100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,175,55,0.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', minHeight: '100vh', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* ── LEFT BRAND PANEL ── */}
        <div className="reg-brand-panel">
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Logo */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,rgba(212,175,55,0.15) 0%,rgba(212,175,55,0.05) 100%)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(212,175,55,0.1)' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'serif', background: 'linear-gradient(135deg,var(--accent) 0%,#d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>G</span>
              </div>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '0.85rem', background: 'linear-gradient(135deg,var(--text) 0%,var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GoldXchange</h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 340, marginBottom: '2.5rem' }}>
              Join thousands of smart investors trading gold digitally — fast, secure, and always at spot price.
            </p>

            {/* Steps */}
            <div style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Getting started is easy</p>
              {[
                { step: '01', title: 'Create your account', desc: 'Free signup in under 2 minutes' },
                { step: '02', title: 'Verify your email', desc: 'Secure your account instantly' },
                { step: '03', title: 'Start trading gold', desc: 'Buy, sell or hold at any time' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem', animationDelay: `${i * 0.12}s` }}>
                  <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)', fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>{s.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '2.5rem', left: '3.5rem', right: '3.5rem', opacity: 0.6 }}>
            <svg viewBox="0 0 300 100" fill="none" style={{ width: '100%', height: 'auto' }}>
              <polyline points="0,80 40,60 80,65 120,40 160,45 200,20 240,30 300,10" stroke="url(#gg2)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="gg2" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', overflowY: 'auto' }}>
          <div className='' style={{ width: '100%', maxWidth: 450, paddingTop: '50px' }}>

            {/* Mobile logo */}
            <div className="reg-mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,rgba(212,175,55,0.15) 0%,rgba(212,175,55,0.05) 100%)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, fontFamily: 'serif', background: 'linear-gradient(135deg,var(--accent) 0%,#d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>G</span>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, background: 'linear-gradient(135deg,var(--text) 0%,var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GoldXchange</span>
            </div>

            {/* Header */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: '0.4rem' }}>Create account</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Start trading gold in minutes</p>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.85rem 1rem', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.5rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} /><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Name + Username row */}
              <div className="reg-two-col">
                {/* Full Name */}
                <div>
                  <label style={lStyle('name')}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={iStyle('name')} />
                    <input type="text" placeholder="John Doe" required value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                      style={inStyle('name')} />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label style={lStyle('user')}>Username</label>
                  <div style={{ position: 'relative' }}>
                    <AtSign size={14} style={iStyle('user')} />
                    <input type="text" placeholder="johndoe123" required minLength={3} maxLength={20}
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                      onFocus={() => setFocused('user')} onBlur={() => setFocused(null)}
                      style={inStyle('user')} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>3–20 chars, letters/numbers/_</p>
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={lStyle('email')}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={iStyle('email')} />
                  <input type="email" placeholder="you@example.com" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    style={inStyle('email')} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={lStyle('pw')}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={iStyle('pw')} />
                  <input type={showPassword ? 'text' : 'password'} placeholder="Create a strong password"
                    required minLength={8} value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocused('pw')} onBlur={() => setFocused(null)}
                    style={inStyle('pw', { paddingRight: '2.75rem' })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {/* Strength bar */}
                {formData.password && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                      {[1, 2, 3, 4].map((lvl) => (
                        <div key={lvl} style={{ height: 4, flex: 1, borderRadius: 100, background: lvl <= pwStrength.score ? pwStrength.color : 'var(--border)', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: pwStrength.color, minWidth: 40, textAlign: 'right' }}>{pwStrength.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={lStyle('cpw')}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={iStyle('cpw')} />
                  <input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password"
                    required value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    onFocus={() => setFocused('cpw')} onBlur={() => setFocused(null)}
                    style={{
                      ...inStyle('cpw', { paddingRight: '2.75rem' }),
                      borderColor: pwMatch === false ? 'rgba(239,68,68,0.5)' : pwMatch === true ? 'rgba(52,211,153,0.5)' : undefined,
                    }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}>
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {pwMatch === false && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <XCircle size={12} /> Passwords do not match
                  </p>
                )}
                {pwMatch === true && (
                  <p style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={12} /> Passwords match
                  </p>
                )}
              </div>

              {/* Captcha */}
              <div>
                <label style={lStyle('cap')}>Security Check</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flex: '0 0 auto', minWidth: 140, padding: '0.8rem 0.9rem', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 12, userSelect: 'none' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, fontFamily: 'monospace' }}>{captcha.num1} + {captcha.num2} = ?</span>
                    <button type="button" onClick={generateCaptcha} title="Refresh captcha"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 3, borderRadius: 4, flexShrink: 0 }}>
                      <RefreshCw size={13} />
                    </button>
                  </div>
                  <input type="text" inputMode="numeric" placeholder="Answer" required
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                    onFocus={() => setFocused('cap')} onBlur={() => setFocused(null)}
                    style={{ ...inStyle('cap'), flex: 1, paddingLeft: '1rem' }} />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !formData.password || formData.password !== formData.confirmPassword}
                style={{ width: '100%', padding: '0.95rem', borderRadius: 12, background: 'var(--primary)', color: 'var(--primary-text)', border: 'none', fontSize: '0.95rem', fontWeight: 700, cursor: (loading || !formData.password || formData.password !== formData.confirmPassword) ? 'not-allowed' : 'pointer', opacity: (loading || !formData.password || formData.password !== formData.confirmPassword) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.25s', marginTop: '0.15rem', boxShadow: '0 4px 14px rgba(52,211,153,0.15)' }}
              >
                {loading ? <><GoldCoinLoader mini label={null} /><span>Creating account…</span></> : <><span>Create Account</span><ArrowRight size={18} /></>}
              </button>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                By creating an account you agree to our{' '}
                <Link href="#" style={{ color: 'var(--accent)', fontWeight: 600 }}>Terms</Link> and{' '}
                <Link href="#" style={{ color: 'var(--accent)', fontWeight: 600 }}>Privacy Policy</Link>.
              </p>

            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Responsive layout via non-scoped style tag */}
      <style>{`
        @media (min-width: 900px) {
          .reg-brand-panel {
            display: flex !important;
            flex: 0 0 44%;
            position: relative;
            background: linear-gradient(145deg,rgba(52,211,153,0.04) 0%,rgba(5,5,5,0) 60%);
            border-right: 1px solid var(--border);
            flex-direction: column;
            justify-content: center;
            padding: 4rem 3.5rem;
            overflow: hidden;
          }
          .reg-mobile-logo { display: none !important; }
          .reg-two-col { grid-template-columns: 1fr 1fr !important; }
        }
        .reg-brand-panel { display: none; }
        .reg-two-col {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.9rem;
        }
      `}</style>
    </div>
  );
}
