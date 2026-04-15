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



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numAmount = Math.round(Number(amount) * 100) / 100;
    if (!numAmount || numAmount < limits.minWithdrawal) { setError(`Minimum withdrawal is $${limits.minWithdrawal}.`); return; }
    if (numAmount > limits.maxWithdrawal) { setError(`Maximum withdrawal is $${limits.maxWithdrawal}.`); return; }
    if (numAmount > (user?.balance || 0)) { setError('Amount exceeds your available balance.'); return; }
    if (!walletAddress.trim() || walletAddress.trim().length < 10) { setError('Please enter a valid wallet address.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'withdrawal', amount: numAmount, walletAddress: walletAddress.trim(), cryptoType: network }),
      });
      if (res.ok) { setSubmitted(true); }
      else { const data = await res.json(); setError(data.error || 'Failed to submit'); }
    } catch { setError('Network error.'); }
    finally { setSubmitting(false); }
  };

  if (loading || !user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GoldCoinLoader label="Loading withdrawal terminal…" />
    </div>
  );

  return (
    <div className="animate-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Institutional Header */}
      <div style={{ marginBottom: '2rem', position: 'relative' }}>

        <h1 style={{
          fontSize: 'clamp(1rem, 6vw, 3.5rem)',
          marginBottom: '1rem',
          color: 'var(--text)'
        }}>
          WITHDRAW <span style={{ color: 'var(--primary)' }}>RESERVE ASSETS</span>
        </h1>
        <p className="meta-text" style={{ fontSize: '11px', opacity: 0.6, letterSpacing: '0.1em' }}>
          FINALIZE ASSET EXTRACTION VIA INSTITUTIONAL-GRADE ENCRYPTED BRIDGE.
        </p>
      </div>

      <div className="ghost-border-wrapper">
        <div className="card-asymmetric" style={{ padding: '2rem 2rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', position: 'relative' }}>

          {/* Balance Module */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 2rem',
            background: 'rgba(var(--text), 0.03)',
            borderRadius: '40px 10px 40px 10px',
            marginBottom: '4rem',
            border: '1px solid var(--border-subtle)',
          }}>
            <div>
              <span className="meta-text" style={{ fontSize: '9px', color: 'var(--primary)', marginBottom: '0.75rem', display: 'block' }}>AVAILABLE LIQUIDITY</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Wallet size={22} color="var(--primary)" />
                <span style={{ fontWeight: 950, color: 'var(--text)', fontSize: '2.5rem', letterSpacing: '-0.05em' }}>${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />
          </div>

          {error && (
            <div style={{
              background: 'rgba(180, 83, 9, 0.08)',
              color: 'var(--accent)',
              padding: '1.25rem 2rem',
              borderRadius: '8px',
              fontSize: '9px',
              border: '1px solid var(--accent)',
              marginBottom: '3rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              <AlertTriangle size={20} /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label className="meta-text" style={{ fontSize: '9px', marginBottom: '1rem' }}>EXTRACTION AMOUNT (USD)</label>
              <input
                type="number"
                placeholder={`MINIMUM TIER: $${limits.minWithdrawal}`}
                required
                min={limits.minWithdrawal}
                max={user.balance}
                step="0.01"
                className="btn-asymmetric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ background: 'rgba(var(--text), 0.03)', border: '1px solid var(--border)', padding: '1.25rem 1.5rem', fontWeight: 700 }}
              />
              {Number(amount) > 0 && (<p className="meta-text" style={{ fontSize: '9px', color: 'var(--primary)', marginTop: '1rem' }}>NET WITHDRAWAL VALUE: ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>)}
            </div>

            <div className="input-group">
              <label className="meta-text" style={{ fontSize: '9px', marginBottom: '1rem' }}>SETTLEMENT CHAIN / NETWORK</label>
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="interactive-haptic"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(var(--text), 0.03)', border: '1px solid var(--border)',
                    borderRadius: '40px 10px 40px 10px', padding: '1.25rem 2rem', color: 'var(--text)', fontSize: '1rem',
                    cursor: 'pointer', transition: 'all 0.3s ease',
                    borderColor: dropdownOpen ? 'var(--primary)' : 'var(--border)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.1em' }}>
                    <CoinIcon symbol={networkOptions.find(o => o.value === network)?.coin || ''} size={22} />
                    {networkOptions.find(o => o.value === network)?.label}
                  </span>
                  <ChevronDown size={18} color="var(--primary)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </button>
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 12px)', left: 0, right: 0, zIndex: 100,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: '15px',
                    overflow: 'hidden', boxShadow: '0 20px 60px var(--border)',
                    animation: 'scale-up-center 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    {networkOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setNetwork(opt.value); setDropdownOpen(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '1.5rem',
                          padding: '1.5rem 2rem', background: network === opt.value ? 'rgba(var(--text), 0.05)' : 'transparent',
                          border: 'none', borderBottom: '1px solid var(--border-subtle)',
                          color: network === opt.value ? 'var(--primary)' : 'var(--text)',
                          fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s',
                          fontWeight: 900, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.1em'
                        }}
                      >
                        <CoinIcon symbol={opt.coin} size={20} />
                        {opt.label}
                        {network === opt.value && <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="input-group">
              <label className="meta-text" style={{ fontSize: '9px', marginBottom: '1rem' }}>DESTINATION WALLET ADDRESS</label>
              <input
                type="text"
                placeholder="ENTER_INSTITUTIONAL_GRADE_WALLET"
                required
                className="btn-asymmetric"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                style={{ background: 'rgba(var(--text), 0.03)', border: '1px solid var(--border)', padding: '1.25rem 1.5rem', fontWeight: 700, fontFamily: 'monospace' }}
              />
            </div>



            <div style={{
              background: 'rgba(52, 211, 153, 0.05)',
              padding: '2rem',
              borderRadius: '8px',
              border: '1px solid var(--primary)',
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center'
            }}>
              <ShieldCheck size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
              <p className="meta-text" style={{ fontSize: '9px', color: 'var(--text)', opacity: 0.8, lineHeight: 1.6 }}>
                UPON AUTHORIZATION, YOUR EXTRACTION REQUEST WILL UNDERGO INSTITUTIONAL REVIEW. <strong style={{ color: 'var(--primary)' }}>ETA: 1-24 HOURS</strong>.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-asymmetric interactive-haptic"
              style={{
                width: '100%',
                fontSize: '11px',
                padding: '2rem',
                fontWeight: 900,
                backgroundColor: 'var(--text)',
                color: 'var(--background)',
                textTransform: 'uppercase',
                letterSpacing: '0.4em'
              }}
              disabled={submitting}
            >
              {submitting ? <GoldCoinLoader mini label="PROCESSING..." /> : 'REQUEST WITHDRAW'}
            </button>
          </form>
        </div>
        <div className="ghost-border" />
      </div>
    </div>
  );
}