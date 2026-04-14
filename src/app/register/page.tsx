'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Mail, Lock, Eye, EyeOff, User, AtSign, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

function PasswordHint({ password }: { password: string }) {
  if (!password) return null;
  return (
    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
      Tip: Use uppercase, lowercase, numbers & special characters for a stronger password.
    </p>
  );
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

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
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (parseInt(captchaInput) !== captcha.sum) {
      setError('Incorrect captcha result');
      generateCaptcha();
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.requiresOtp) {
          setMaskedEmail(data.email);
          setIsRegistered(true); // Show the success/check inbox screen
        } else {
          login(data.user);
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp }),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.user);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
      <div className="ambient-orb orb-gold" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px' }} />
      
      <div className="container animate-in" style={{ maxWidth: '480px', width: '100%', padding: '0 20px', zIndex: 1 }}>
        <div style={{
          background: 'rgba(8, 14, 26, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.1)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}>
          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '56px', height: '56px', margin: '0 auto 1rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212,175,55,0.1)' }}>
              <UserPlus size={24} color="var(--gold)" />
            </div>
            <h2 className="text-gradient-gold" style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>
              {isRegistered ? 'Verify Your Email' : 'Join Goli Trade'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              {isRegistered 
                ? <>Please check your inbox to proceed with verification</>
                : 'Start your journey into premium gold trading'}
            </p>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              color: '#ef4444', 
              padding: '0.75rem 1rem', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              fontSize: '0.85rem', 
              marginBottom: '1.5rem',
              border: '1px solid rgba(239, 68, 68, 0.15)'
            }}>
              <XCircle size={16} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}

          {isRegistered ? (
            <div className="animate-in" style={{ 
              textAlign: 'center', 
              background: 'rgba(8, 14, 26, 0.95)', 
              backdropFilter: 'blur(20px)',
              borderRadius: '24px', 
              padding: '3.5rem 2rem', 
              color: '#ffffff', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Top accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />

              {/* Brand Icon placeholder */}
              <div style={{ width: '64px', height: '64px', margin: '0 auto 1.75rem', background: 'rgba(247, 147, 26, 0.1)', border: '1px solid rgba(247, 147, 26, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f7931a', fontSize: '2rem', fontWeight: 'bold' }}>
                B
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ width: '56px', height: '56px', margin: '0 auto 1.25rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Mail size={32} color="#ffffff" style={{ opacity: 0.9 }} />
                </div>
                <h2 className="text-gradient-gold" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.75rem' }}>Check Your Email</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  We sent a verification link to<br />
                  <strong style={{ color: '#fff' }}>{formData.email}</strong>
                </p>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                Click the link in the email to verify your account. The link expires in 10 minutes.
              </p>

              <div style={{ 
                background: 'rgba(212, 175, 55, 0.05)', 
                padding: '1rem', 
                borderRadius: '16px', 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: '0.82rem', 
                border: '1px solid rgba(212, 175, 55, 0.1)', 
                marginBottom: '2.5rem',
                textAlign: 'center'
              }}>
                Can't find the email? Check your <strong>Spam</strong> or <strong>Junk</strong> folder.
              </div>

              <Link 
                href="/login"
                className="btn btn-gold"
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  fontSize: '1rem', 
                  fontWeight: 'bold', 
                  background: '#c09b2b', 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  textDecoration: 'none'
                }}
              >
                Back to Login
              </Link>

              <div style={{ marginTop: '2.5rem', fontSize: '0.85rem', color: '#666' }}>
                Already have an account? <Link href="/login" style={{ color: '#c09b2b', fontWeight: '700', textDecoration: 'none' }}>Login</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="input-group">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Username */}
            <div className="input-group">
              <label>Username</label>
              <div style={{ position: 'relative' }}>
                <AtSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="johndoe123"
                  required
                  minLength={3}
                  maxLength={20}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                3-20 characters. Letters, numbers, and underscores only.
              </p>
            </div>

            {/* Email */}
            <div className="input-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
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

            {/* Password */}
            <div className="input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordHint password={formData.password} />
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <label>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <XCircle size={12} /> Passwords do not match
                </p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={12} /> Passwords match
                </p>
              )}
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

            <button
              type="submit"
              className="btn btn-gold"
              style={{ width: '100%', marginTop: '0.5rem', fontSize: '1rem', padding: '0.85rem 1rem', gap: '0.5rem' }}
              disabled={loading || !formData.password || formData.password !== formData.confirmPassword}
            >
              {loading ? (
                <><GoldCoinLoader mini label={null} /> Sending Code...</>
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="text-gold" style={{ fontWeight: '600' }}>Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
