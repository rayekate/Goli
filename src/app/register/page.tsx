'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Mail, Lock, Eye, EyeOff, User, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'One number', pass: /[0-9]/.test(password) },
    { label: 'One special character', pass: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  const strength = checks.filter(c => c.pass).length;

  if (!password) return null;

  const colors = ['var(--danger)', 'var(--danger)', '#F59E0B', '#10B981', '#10B981', '#10B981'];
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'];

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: i < strength ? colors[strength] : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: '0.75rem', color: colors[strength], marginBottom: '0.5rem' }}>{labels[strength]}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: c.pass ? '#10B981' : 'var(--text-muted)' }}>
            {c.pass ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const passwordValid = formData.password.length >= 8 && /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) && /[0-9]/.test(formData.password) && /[^A-Za-z0-9]/.test(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordValid) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and a number.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });

      const data = await res.json();
      if (res.ok) {
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        login(data.user);
      } else {
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
      {/* Ambient Background Orbs */}
      <div className="ambient-orb orb-purple" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px' }} />

      <div className="container animate-in stagger-1" style={{ maxWidth: '480px', width: '100%', padding: '0 20px', zIndex: 1 }}>
        <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>

          {/* Header with icon */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 1rem',
              background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))',
              border: '1px solid rgba(234,179,8,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserPlus size={26} color="var(--gold)" />
            </div>
            <h2 style={{ marginBottom: '0.4rem', fontSize: '1.75rem' }} className="text-gradient-gold">Create Account</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Join and start trading gold price movements
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)', padding: '0.75rem 1rem',
              borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem',
              border: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <XCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

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
              <PasswordStrength password={formData.password} />
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

            <button
              type="submit"
              className="btn btn-gold"
              style={{ width: '100%', marginTop: '0.5rem', fontSize: '1rem', padding: '0.85rem 1rem', gap: '0.5rem' }}
              disabled={loading || !passwordValid || formData.password !== formData.confirmPassword}
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Creating Account...</>
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

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
