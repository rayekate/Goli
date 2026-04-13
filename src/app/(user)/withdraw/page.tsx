'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ArrowDownCircle, ShieldCheck, Wallet, AlertTriangle, Loader2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WithdrawPage() {
  const { user, loading } = useAuth();
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('USDT_TRC20');
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [limits, setLimits] = useState({ minWithdrawal: 10, maxWithdrawal: 50000 });
  const router = useRouter();

  // Fetch withdrawal limits from platform settings
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const { settings } = await res.json();
          setLimits({
            minWithdrawal: settings.minWithdrawal ?? 10,
            maxWithdrawal: settings.maxWithdrawal ?? 50000,
          });
        }
      } catch { /* keep defaults */ }
    })();
  }, []);

  // Pre-fill wallet address/network from saved payout wallet
  useEffect(() => {
    if (user?.payoutWallet?.address) {
      setWalletAddress(user.payoutWallet.address);
    }
    if (user?.payoutWallet?.network) {
      setNetwork(user.payoutWallet.network);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numAmount = Number(amount);
    if (!numAmount || numAmount < limits.minWithdrawal) { setError(`Minimum withdrawal is $${limits.minWithdrawal}.`); return; }
    if (numAmount > (user?.balance || 0)) { setError('Amount exceeds your available balance.'); return; }
    if (!walletAddress.trim()) { setError('Please enter your wallet address.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'withdrawal', amount: numAmount, walletAddress: walletAddress.trim(), cryptoType: network, otpCode: user?.twoFactorEnabled ? otpCode.trim() : undefined }),
      });
      if (res.ok) { setSubmitted(true); }
      else { const data = await res.json(); setError(data.error || 'Failed to submit'); }
    } catch { setError('Network error.'); }
    finally { setSubmitting(false); }
  };

  if (loading || !user) return (<div style={{ padding: '60px 20px', textAlign: 'center' }}><div className="skeleton" style={{ width: '200px', height: '32px', margin: '0 auto 1rem' }} /><div className="skeleton" style={{ width: '300px', height: '16px', margin: '0 auto' }} /></div>);

  if (submitted) {
    return (
      <div className="animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', background: 'rgba(8,14,26,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '20px', padding: '3rem 2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
          <div style={{ width: '64px', height: '64px', margin: '0 auto 1.25rem', background: 'rgba(0,230,138,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,230,138,0.2)' }}>
            <Check size={28} color="var(--success)" />
          </div>
          <h2 className="text-gradient-gold" style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>Request Submitted</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: 1.7, fontSize: '0.92rem' }}>
            Your withdrawal of <strong style={{ color: '#fff' }}>${Number(amount).toFixed(2)}</strong> will be reviewed and processed within 1-24 hours.
          </p>
          <button className="btn btn-gold" style={{ padding: '0.8rem 2rem', marginTop: '1.5rem' }} onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ padding: '24px 16px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ background: 'rgba(8,14,26,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '16px', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
        <div style={{ marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', color: '#fff', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowDownCircle size={22} color="var(--gold)" /> <span className="text-gradient-gold">Withdraw Funds</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>All withdrawals are manually reviewed by our admin team.</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(212,175,55,0.03)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(212,175,55,0.08)' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}><Wallet size={18} color="var(--gold)" /><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Available Balance</span></div>
          <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '1.05rem', fontFamily: 'var(--font-mono, monospace)' }}>${user.balance.toFixed(2)}</span>
        </div>
        {error && (<div style={{ background: 'rgba(255,71,87,0.08)', color: 'var(--danger)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', border: '1px solid rgba(255,71,87,0.15)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}><AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} /> {error}</div>)}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Withdrawal Amount (USD)</label>
            <input type="number" placeholder={`Min $${limits.minWithdrawal}`} required min={limits.minWithdrawal} max={user.balance} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {Number(amount) > 0 && (<p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>You will receive approx. <strong style={{ color: 'var(--gold)' }}>${Number(amount).toFixed(2)}</strong></p>)}
          </div>
          <div className="input-group"><label>Network / Currency</label><select value={network} onChange={(e) => setNetwork(e.target.value)}><option value="USDT_TRC20">USDT (TRC20 / Tron)</option><option value="USDT_ERC20">USDT (ERC20 / Ethereum)</option><option value="BTC">Bitcoin (BTC)</option><option value="ETH">Ethereum (ETH)</option></select></div>
          <div className="input-group"><label>Your Wallet Address</label><input type="text" placeholder="Enter your withdrawal wallet address" required value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} /></div>
          <div style={{ background: 'rgba(0,230,138,0.03)', padding: '0.85rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', gap: '0.6rem', border: '1px solid rgba(0,230,138,0.08)' }}><ShieldCheck size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '1px' }} /><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Once approved, funds are sent directly to your wallet. Processing time: 1-24 hours.</p></div>
          {user?.twoFactorEnabled && (<div className="input-group" style={{ padding: '1.25rem', background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '12px', marginBottom: '1.25rem' }}><label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold)', fontSize: '0.85rem' }}><ShieldCheck size={16} /> Two-Step Verification</label><input type="text" placeholder="Enter 6-digit code" required value={otpCode} onChange={(e) => setOtpCode(e.target.value)} maxLength={6} style={{ letterSpacing: '4px', fontFamily: 'monospace', fontSize: '1.1rem', textAlign: 'center' }} /></div>)}
          <button type="submit" className="btn btn-gold" style={{ width: '100%', fontSize: '0.95rem', padding: '0.85rem', borderRadius: '10px' }} disabled={submitting}>{submitting ? 'Processing...' : 'Request Withdrawal'}</button>
        </form>
      </div>
    </div>
  );
}