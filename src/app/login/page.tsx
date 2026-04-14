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

  const [formData, setFormData] = useState({ identifier: '', password: '', rememberMe: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();



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
          identifier: formData.identifier, 
          password: formData.password,
          rememberMe: formData.rememberMe 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFormData({ identifier: '', password: '', rememberMe: false });
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
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {/* Immersive Background System */}
      <div className="noise-texture" />
      <div className="mesh-gradient" />
      <div className="grid-overlay" />
      
      <div className="container animate-in" style={{ maxWidth: '440px', width: '100%', padding: '40px 20px', zIndex: 1 }}>
        <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
          {/* Internal Polish Glows */}
          <div style={{ 
            position: 'absolute', 
            top: '-50px', 
            right: '-50px', 
            width: '200px', 
            height: '200px', 
            background: 'var(--accent)', 
            filter: 'blur(100px)', 
            opacity: 0.03,
            zIndex: 0 
          }} />


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

              <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
                <div className="icon-box" style={{ width: '64px', height: '64px', margin: '0 auto 1.25rem', borderRadius: '16px' }}>
                  <Lock size={26} />
                </div>
                <h2 style={{ 
                  fontSize: '2rem', 
                  marginBottom: '0.5rem', 
                  fontWeight: 950,
                  background: 'linear-gradient(135deg, var(--text) 0%, var(--accent) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Security Access
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                  Enter credentials to initialize session
                </p>
              </div>

              {error && (
                <div style={{ background: 'rgba(255, 71, 87, 0.08)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(255, 71, 87, 0.15)', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>Username or Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Enter username or email"
                      required
                      value={formData.identifier}
                      onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
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
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Captcha</label>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
                    <div style={{
                      flex: '0 0 140px',
                      background: 'var(--border)',
                      border: '1px solid var(--border-highlight)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: 'var(--accent)',
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
                        background: formData.rememberMe ? 'var(--accent)' : 'var(--border)',
                        border: `1px solid ${formData.rememberMe ? 'var(--accent)' : 'rgba(212,175,55,0.2)'}`,
                        borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}>
                        {formData.rememberMe && <ShieldCheck size={12} color="#000" />}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Remember me</span>
                  </label>
                  <Link href="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--accent)', opacity: 0.8 }}>Forgot password?</Link>
                </div>

                <button type="submit" className="btn btn-gold" style={{ 
                  width: '100%', 
                  marginTop: '0.5rem', 
                  fontSize: '1rem', 
                  padding: '1rem', 
                  borderRadius: '100px',
                  fontWeight: 900,
                  boxShadow: '0 10px 30px rgba(212, 175, 55, 0.1)'
                }} disabled={loading}>
                  {loading ? (
                    <><GoldCoinLoader mini label={null} /> Authenticating...</>
                  ) : (
                    <>Initialize Session <ArrowRight size={18} /></>
                  )}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Don&apos;t have an account?{' '}
                <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one</Link>
              </p>
            </>
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
