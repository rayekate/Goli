'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ArrowDownCircle, ShieldCheck, Wallet, AlertTriangle, Loader2, Check, ChevronDown } from 'lucide-react';
import CoinIcon from '@/components/CoinIcon';
import { useRouter } from 'next/navigation';

export default function WithdrawPage() {
  const { user, loading } = useAuth();
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('USDT_TRC20');
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [limits, setLimits] = useState({ minWithdrawal: 10, maxWithdrawal: 50000 });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const networkOptions = [
    { value: 'USDT_TRC20', label: 'USDT (TRC20 / Tron)', coin: 'USDT' },
    { value: 'USDT_ERC20', label: 'USDT (ERC20 / Ethereum)', coin: 'USDT' },
    { value: 'BTC', label: 'Bitcoin (BTC)', coin: 'Bitcoin' },
    { value: 'ETH', label: 'Ethereum (ETH)', coin: 'Ethereum' },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  const sendOtp = async () => {
    setOtpSending(true);
    setError('');
    try {
      const res = await fetch('/api/user/send-otp', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpCooldown(60);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch { setError('Network error sending OTP'); }
    finally { setOtpSending(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numAmount = Math.round(Number(amount) * 100) / 100;
    if (!numAmount || numAmount < limits.minWithdrawal) { setError(`Minimum withdrawal is $${limits.minWithdrawal}.`); return; }
    if (numAmount > limits.maxWithdrawal) { setError(`Maximum withdrawal is $${limits.maxWithdrawal}.`); return; }
    if (numAmount > (user?.balance || 0)) { setError('Amount exceeds your available balance.'); return; }
    if (!walletAddress.trim() || walletAddress.trim().length < 10) { setError('Please enter a valid wallet address.'); return; }
    if (user?.withdrawalOtpEnabled && otpCode.trim().length !== 6) { setError('Please enter a valid 6-digit OTP code.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'withdrawal', amount: numAmount, walletAddress: walletAddress.trim(), cryptoType: network, otpCode: user?.withdrawalOtpEnabled ? otpCode.trim() : undefined }),
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
          <div className="input-group">
            <label>Network / Currency</label>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '0.7rem 1rem', color: '#fff', fontSize: '0.92rem',
                  cursor: 'pointer', transition: 'border-color 0.2s',
                  borderColor: dropdownOpen ? 'var(--gold)' : 'var(--border)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CoinIcon symbol={networkOptions.find(o => o.value === network)?.coin || ''} size={20} />
                  {networkOptions.find(o => o.value === network)?.label}
                </span>
                <ChevronDown size={16} color="var(--gold)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                  background: 'rgba(10, 18, 34, 0.98)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px',
                  overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                  {networkOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setNetwork(opt.value); setDropdownOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.75rem 1rem', background: network === opt.value ? 'rgba(212,175,55,0.1)' : 'transparent',
                        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        color: network === opt.value ? 'var(--gold)' : '#e0e4ea',
                        fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.15s',
                        fontWeight: network === opt.value ? 600 : 400, textAlign: 'left',
                      }}
                      onMouseEnter={(e) => { if (network !== opt.value) (e.currentTarget.style.background = 'rgba(255,255,255,0.04)'); }}
                      onMouseLeave={(e) => { if (network !== opt.value) (e.currentTarget.style.background = 'transparent'); }}
                    >
                      <CoinIcon symbol={opt.coin} size={18} />
                      {opt.label}
                      {network === opt.value && <Check size={14} color="var(--gold)" style={{ marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="input-group"><label>Your Wallet Address</label><input type="text" placeholder="Enter your withdrawal wallet address" required value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} /></div>
          <div style={{ background: 'rgba(0,230,138,0.03)', padding: '0.85rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', gap: '0.6rem', border: '1px solid rgba(0,230,138,0.08)' }}><ShieldCheck size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '1px' }} /><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Once approved, funds are sent directly to your wallet. Processing time: 1-24 hours.</p></div>
          {user?.withdrawalOtpEnabled && (
            <div style={{ padding: '1.25rem', background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '12px', marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                <ShieldCheck size={16} /> Email Verification
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  style={{ letterSpacing: '4px', fontFamily: 'monospace', fontSize: '1.1rem', textAlign: 'center', flex: 1 }}
                />
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={otpSending || otpCooldown > 0}
                  className="btn btn-outline"
                  style={{ whiteSpace: 'nowrap', padding: '0.6rem 1rem', fontSize: '0.8rem', borderColor: 'var(--gold)', color: 'var(--gold)', minWidth: '110px' }}
                >
                  {otpSending ? <Loader2 size={14} className="animate-spin" /> : otpCooldown > 0 ? `Resend (${otpCooldown}s)` : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              </div>
              {otpSent && <p style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: '0.5rem' }}>OTP sent to your registered email. Valid for 5 minutes.</p>}
            </div>
          )}
          <button type="submit" className="btn btn-gold" style={{ width: '100%', fontSize: '0.95rem', padding: '0.85rem', borderRadius: '10px' }} disabled={submitting}>{submitting ? 'Processing...' : 'Request Withdrawal'}</button>
        </form>
      </div>
    </div>
  );
}