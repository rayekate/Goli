'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle, Lock } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to request reset');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
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

          {!submitted ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '56px', height: '56px', margin: '0 auto 1rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212,175,55,0.15)' }}>
                  <Lock size={24} color="var(--gold)" />
                </div>
                <h2 className="text-gradient-gold" style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Reset Password</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Enter your email address and we'll send you a 6-digit code to reset your password.
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '1rem', fontSize: '1rem', padding: '0.85rem', borderRadius: '10px' }} disabled={loading}>
                  {loading ? (
                    <><GoldCoinLoader mini label={null} /> Processing...</>
                  ) : (
                    <>Send Request <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Remember your password?{' '}
                <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600 }}>Login here</Link>
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle size={32} color="#10B981" />
              </div>
              <h2 className="text-gradient-gold" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Check Your Email</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                If an account exists for <strong style={{ color: '#fff' }}>{email}</strong>, a verification code has been sent.
              </p>
              
              <Link 
                href={`/reset-password?email=${encodeURIComponent(email)}`} 
                className="btn btn-gold" 
                style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                Proceed to Reset <ArrowRight size={16} />
              </Link>
              
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'block', margin: '1.5rem auto 0', fontSize: '0.85rem' }}
              >
                ← Back to email entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
