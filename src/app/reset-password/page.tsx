'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, ShieldCheck, CheckCircle, RefreshCw, KeyRound, Eye, EyeOff } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialEmail = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    email: initialEmail,
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ width: '72px', height: '72px', margin: '0 auto 1.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <CheckCircle size={40} color="#10B981" />
        </div>
        <h2 className="text-gradient-gold" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Password Reset!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Your password has been updated securely. Redirecting to login...
        </p>
        <Link href="/login" className="btn btn-gold" style={{ display: 'inline-flex', padding: '0.85rem 2rem' }}>
          Go to Login <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: '56px', height: '56px', margin: '0 auto 1rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212,175,55,0.15)' }}>
          <KeyRound size={24} color="var(--accent)" />
        </div>
        <h2 className="text-gradient-gold" style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Set New Password</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Enter the 6-digit code from your email and your new password.
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
              required 
              value={formData.email}
              readOnly={!!initialEmail}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ paddingLeft: '2.5rem', opacity: initialEmail ? 0.7 : 1 }}
            />
          </div>
        </div>

        <div className="input-group">
          <label>6-Digit Reset Code</label>
          <div style={{ position: 'relative' }}>
            <ShieldCheck size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input 
              type="text" 
              maxLength={6}
              placeholder="000000"
              required 
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
              style={{ paddingLeft: '2.5rem', letterSpacing: '4px', fontWeight: 'bold' }}
            />
          </div>
        </div>

        <div className="input-group">
          <label>New Password</label>
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
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
          </div>
        </div>

        <div className="input-group">
          <label>Confirm New Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="••••••••" 
              required 
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '1rem', fontSize: '1rem', padding: '0.85rem', borderRadius: '10px' }} disabled={loading}>
          {loading ? (
            <><GoldCoinLoader mini label={null} /> Resetting...</>
          ) : (
            <>Reset Password <RefreshCw size={16} /></>
          )}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
        Didn't receive a code?{' '}
        <Link href="/forgot-password" style={{ color: 'var(--accent)', fontWeight: 600 }}>Try again</Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="ambient-orb orb-gold" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px' }} />
      
      <div className="container animate-in" style={{ maxWidth: '440px', width: '100%', padding: '40px 20px', zIndex: 1 }}>
        <div style={{
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.1)',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />

          <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}><GoldCoinLoader /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
