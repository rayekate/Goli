'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ArrowDownCircle, ShieldCheck, Wallet, AlertTriangle, Check, ChevronDown } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';
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
      <div className="animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0' }}>
        <div className="glass-card" style={{ 
          textAlign: 'center', 
          maxWidth: '540px', 
          width: '100%',
          padding: '4rem 2.5rem', 
          borderRadius: '32px',
          borderTop: '2px solid var(--success)',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
          
          <div className="icon-box" style={{ 
            width: '80px', height: '80px', margin: '0 auto 2rem', 
            background: 'rgba(16, 185, 129, 0.1)', 
            borderRadius: '50%', 
            color: 'var(--success)' 
          }}>
            <Check size={36} strokeWidth={3} />
          </div>
          
          <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1rem' }}>
            EXTRACTION REQUEST LOGGED
          </div>
          
          <h2 style={{ fontSize: '2.5rem', fontWeight: 950, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1.5rem' }}>
            Liquidation <span style={{ color: 'var(--success)' }}>Submitted</span>
          </h2>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
              Your extraction of <strong style={{ color: '#fff' }}>${Number(amount).toLocaleString()}</strong> is queued for institutional review.
            </p>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '1rem 0' }} />
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '0.1em' }}>
              SETTLEMENT VERIFICATION IN PROGRESS
            </p>
          </div>
          
          <button 
            className="btn btn-gold" 
            style={{ width: '100%', padding: '1.15rem', borderRadius: '100px', fontWeight: 950 }} 
            onClick={() => router.push('/dashboard')}
          >
            RETURN TO TERMINAL
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ padding: '0', maxWidth: '800px', margin: '0 auto' }}>
      {/* Institutional Header */}
      <div style={{ marginBottom: '3rem', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)' }}>LIQUIDATION TERMINAL</div>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--success)', letterSpacing: '0.2em' }}>SECURE CHANNEL ACTIVE</span>
        </div>
        <h1 style={{ 
          fontSize: 'clamp(2.2rem, 5vw, 3rem)', 
          marginBottom: '0.5rem', 
          fontWeight: 950,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: '#fff' 
        }}>
          Liquidate <span className="text-gradient-gold">Reserve Assets</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500, opacity: 0.8 }}>
          Finalize asset extraction via institutional-grade encrypted bridge.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '3rem', borderRadius: '32px', borderTop: '2px solid var(--gold)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'radial-gradient(circle at 50% 0%, rgba(212,175,55,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        {/* Balance Module */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1.5rem 2rem', 
          background: 'rgba(212,175,55,0.04)', 
          borderRadius: '20px', 
          marginBottom: '2.5rem', 
          border: '1px solid rgba(212,175,55,0.1)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: '0.25rem' }}>AVAILABLE LIQUIDITY</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Wallet size={18} color="var(--gold)" />
              <span style={{ fontWeight: 950, color: '#fff', fontSize: '1.8rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '-0.05em' }}>${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 15px var(--gold)', animation: 'pulse-gold 2s infinite' }} />
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(255,71,87,0.08)', 
            color: 'var(--danger)', 
            padding: '1.25rem', 
            borderRadius: '16px', 
            fontSize: '0.85rem', 
            border: '1px solid rgba(255,71,87,0.15)', 
            marginBottom: '2rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            <AlertTriangle size={20} /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="input-group">
            <label>EXTRACTION AMOUNT (USD)</label>
            <input type="number" placeholder={`MINIMUM TIER: $${limits.minWithdrawal}`} required min={limits.minWithdrawal} max={user.balance} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {Number(amount) > 0 && (<p style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 800, marginTop: '0.6rem', letterSpacing: '0.05em' }}>NET LIQUIDATION VALUE: ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>)}
          </div>

          <div className="input-group">
            <label>SETTLEMENT CHAIN / NETWORK</label>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="hover-glow"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(8,10,15,0.6)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '1rem 1.5rem', color: '#fff', fontSize: '1rem',
                  cursor: 'pointer', transition: 'all 0.3s ease',
                  borderColor: dropdownOpen ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 700 }}>
                  <CoinIcon symbol={networkOptions.find(o => o.value === network)?.coin || ''} size={22} />
                  {networkOptions.find(o => o.value === network)?.label}
                </span>
                <ChevronDown size={18} color="var(--gold)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </button>
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 100,
                  background: 'rgba(8, 10, 15, 0.98)', backdropFilter: 'blur(32px)',
                  border: '1px solid rgba(212,175,55,0.3)', borderRadius: '20px',
                  overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                  animation: 'scale-up-center 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  {networkOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setNetwork(opt.value); setDropdownOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '1.15rem 1.5rem', background: network === opt.value ? 'rgba(212,175,55,0.12)' : 'transparent',
                        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
                        color: network === opt.value ? 'var(--gold)' : '#e0e4ea',
                        fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s',
                        fontWeight: network === opt.value ? 800 : 500, textAlign: 'left',
                      }}
                      className="hover-white"
                    >
                      <CoinIcon symbol={opt.coin} size={20} />
                      {opt.label}
                      {network === opt.value && <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 10px var(--gold)' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label>DESTINATION WALLET ADDRESS</label>
            <input type="text" placeholder="Enter institutional-grade wallet address" required value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.95rem', letterSpacing: '0.05em' }} />
          </div>

          {user?.withdrawalOtpEnabled && (
            <div className="glass-card animate-in" style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <ShieldCheck size={20} color="var(--gold)" />
                <h4 style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Biometric / Email Authorization</h4>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="000000"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  style={{ letterSpacing: '0.8em', fontFamily: 'var(--font-mono, monospace)', fontSize: '1.4rem', textAlign: 'center', flex: 1, padding: '1rem', background: 'rgba(0,0,0,0.3)' }}
                />
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={otpSending || otpCooldown > 0}
                  className="btn btn-outline"
                  style={{ 
                    whiteSpace: 'nowrap', padding: '0 1.5rem', fontSize: '0.85rem', fontWeight: 900,
                    borderColor: 'var(--gold)', color: 'var(--gold)', minWidth: '140px', borderRadius: '16px'
                  }}
                >
                  {otpSending ? <GoldCoinLoader mini label={null} /> : otpCooldown > 0 ? `RETRY (${otpCooldown}s)` : 'GENERATE OTP'}
                </button>
              </div>
              {otpSent && <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '1rem', fontWeight: 700, textAlign: 'center' }}>[!] AUTHENTICATION TOKEN DISPATCHED TO REGISTERED TERMINAL</p>}
            </div>
          )}

          <div style={{ 
            background: 'rgba(16, 185, 129, 0.05)', 
            padding: '1.25rem', 
            borderRadius: '16px', 
            border: '1px solid rgba(16, 185, 129, 0.15)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <ShieldCheck size={20} color="var(--success)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}>
              Upon authorization, your extraction request will undergo institutional review. <strong style={{ color: '#fff' }}>ETA: 1-24 HOURS</strong>.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-gold" 
            style={{ 
              width: '100%', 
              fontSize: '1.1rem', 
              padding: '1.25rem', 
              borderRadius: '100px', 
              fontWeight: 950,
              boxShadow: '0 20px 50px rgba(212, 175, 55, 0.2)' 
            }} 
            disabled={submitting}
          >
            {submitting ? <GoldCoinLoader mini label="PROCESSING..." /> : 'INITIALIZE LIQUIDATION'}
          </button>
        </form>
      </div>
    </div>
  );
}