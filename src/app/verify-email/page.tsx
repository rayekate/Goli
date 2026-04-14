'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, ArrowRight, XCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const otp = searchParams.get('otp');

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (email && otp && status === 'idle') {
      handleFinalVerify();
    }
  }, [email, otp, status]);

  const handleFinalVerify = async () => {
    if (!email || !otp) {
      setErrorMessage('Invalid verification link. Please check your email again.');
      setStatus('error');
      return;
    }

    setStatus('verifying');
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/verify-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        // Do NOT auto-redirect — user clicks the login button themselves.
      } else {
        setErrorMessage(data.error || 'Verification failed. This link may have expired.');
        setStatus('error');
      }
    } catch (err) {
      setErrorMessage('A network error occurred. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
      <div className="ambient-orb orb-gold" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px' }} />
      
      <div className="container animate-in" style={{ maxWidth: '440px', width: '100%', padding: '0 20px', zIndex: 1 }}>
        <div style={{
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.1)',
          borderRadius: '24px',
          padding: '3rem 2rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px var(--border)',
          textAlign: 'center'
        }}>
          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />

          {status === 'success' ? (
            <div className="animate-in" style={{ 
              textAlign: 'center', 
              background: 'var(--surface)', 
              backdropFilter: 'blur(20px)',
              borderRadius: '32px', 
              padding: '4rem 2rem', 
              color: 'var(--text)', 
              boxShadow: '0 20px 40px var(--border)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Top accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />

              <div style={{ width: '64px', height: '64px', margin: '0 auto 1.75rem', background: 'rgba(247, 147, 26, 0.1)', border: '1px solid rgba(247, 147, 26, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f7931a', fontSize: '2rem', fontWeight: 'bold' }}>
                B
              </div>

              <h1 className="text-gradient-gold" style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.25rem' }}>Verified!</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', fontWeight: '500' }}>Your account is ready</p>

              <div style={{ width: '60px', height: '60px', margin: '0 auto 2.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <CheckCircle size={32} color="#10B981" />
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '3rem', padding: '0 2.5rem' }}>
                Your email has been successfully verified! Click the button below to login and start trading.
              </p>

              <Link 
                href="/login?verified=true"
                className="btn btn-gold"
                style={{ 
                  width: '100%', 
                  padding: '1.25rem', 
                  borderRadius: '16px', 
                  fontSize: '1.1rem', 
                  fontWeight: '800', 
                  background: 'var(--accent)', 
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  border: 'none',
                  textDecoration: 'none',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 25px rgba(212, 175, 55, 0.3)'
                }}
              >
                Go to Login <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem' }}>
              <div style={{ width: '70px', height: '70px', margin: '0 auto 2rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212,175,55,0.2)' }}>
                {status === 'verifying' ? (
                  <GoldCoinLoader size={48} label={null} />
                ) : (
                  <Mail size={36} color="var(--accent)" />
                )}
              </div>
              
              <h2 className="text-gradient-gold" style={{ fontSize: '1.9rem', marginBottom: '1rem', fontWeight: '800' }}>
                {status === 'verifying' ? 'Verifying Account' : 'Account Verification'}
              </h2>
              
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                {status === 'verifying' 
                  ? 'Please wait while we activate your account and secure your profile.' 
                  : 'Preparing to verify your credentials. One moment...'}
              </p>

              {status === 'error' && (
                <div style={{ 
                  background: 'rgba(255, 71, 87, 0.08)', 
                  color: '#ff4757', 
                  padding: '1.25rem', 
                  borderRadius: '16px', 
                  marginBottom: '2.5rem', 
                  fontSize: '0.9rem', 
                  lineHeight: 1.5,
                  border: '1px solid rgba(255, 71, 87, 0.2)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  gap: '0.75rem' 
                }}>
                  <XCircle size={32} />
                  <span style={{ fontWeight: '600' }}>Verification Failed</span>
                  <span style={{ opacity: 0.8, textAlign: 'center' }}>{errorMessage}</span>
                </div>
              )}

              {status === 'error' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Link 
                    href="/register" 
                    className="btn btn-gold" 
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: '700', textDecoration: 'none', display: 'flex', justifyContent: 'center' }}
                  >
                    Try Registering Again
                  </Link>
                  <Link href="/login" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500', textDecoration: 'none' }}>
                    Return to Login
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Verification indicator */}
          <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10B981', fontSize: '0.75rem', fontWeight: 'bold' }}>
              <ShieldCheck size={14} /> SSL SECURE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 'bold' }}>
              <ShieldCheck size={14} /> IDENTITY VERIFIED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[80vh]">
        <GoldCoinLoader label="Loading verification module..." />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
