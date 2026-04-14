'use client';

import React, { useEffect, useState, useCallback } from 'react';
import CoinIcon from '@/components/CoinIcon';
import {
  Wallet,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  GripVertical,
  AtSign,
  Copy,
  Check,
} from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

interface WalletEntry {
  coinName: string;
  network: string;
  address: string;
  logo: string;
}

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setWallets(data.settings.wallets || []);
      }
    } catch { /* keep empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const handleSave = async () => {
    // Validate before saving
    for (let i = 0; i < wallets.length; i++) {
      const w = wallets[i];
      if (!w.coinName.trim()) { setFeedback({ type: 'error', message: `Wallet #${i + 1}: Coin name is required` }); return; }
      if (!w.network.trim()) { setFeedback({ type: 'error', message: `Wallet #${i + 1}: Network is required` }); return; }
      if (!w.address.trim()) { setFeedback({ type: 'error', message: `Wallet #${i + 1}: Wallet address is required` }); return; }
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallets }),
      });
      const data = await res.json();
      if (res.ok) {
        setWallets(data.settings.wallets || []);
        setFeedback({ type: 'success', message: 'Wallets saved successfully' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to save' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const addWallet = () => {
    setWallets(prev => [...prev, { coinName: '', network: '', address: '', logo: '💰' }]);
  };

  const removeWallet = (idx: number) => {
    setWallets(prev => prev.filter((_, i) => i !== idx));
  };

  const updateWallet = (idx: number, field: keyof WalletEntry, value: string) => {
    setWallets(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const copyAddress = (idx: number) => {
    navigator.clipboard.writeText(wallets[idx].address);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (loading) return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <GoldCoinLoader label="Loading wallet configurations..." />
    </div>
  );

  const inputStyle: React.CSSProperties = {
    background: 'var(--border)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '0.6rem 0.9rem',
    color: 'var(--text)',
    fontSize: '0.9rem',
    width: '100%',
    outline: 'none',
  };

  return (
    <div className="container animate-in stagger-1" style={{ padding: '20px 15px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <h1
          style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)', marginBottom: '0.5rem', flexWrap: 'wrap' }}
          className="text-gradient-gold"
        >
          <Wallet size={30} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 10px var(--gold-glow))' }} />
          Deposit Wallets
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Manage crypto wallet addresses that users see on the deposit page. Add the logo, coin name, network, and wallet address for each.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '0.65rem',
            padding: '0.85rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem',
            background: feedback.type === 'success' ? 'rgba(0,255,102,0.08)' : 'rgba(255,0,85,0.08)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(0,255,102,0.3)' : 'rgba(255,0,85,0.3)'}`,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle size={18} color="var(--success)" /> : <AlertCircle size={18} color="var(--danger)" />}
          <span style={{ fontSize: '0.9rem', color: feedback.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>{feedback.message}</span>
        </div>
      )}

      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap',
      }}>
        <div style={{
          background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '12px',
          padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <Wallet size={16} color="var(--accent)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Wallets:</span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>{wallets.length}</span>
        </div>
      </div>

      {/* Wallet Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {wallets.map((w, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--surface)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.5rem',
              position: 'relative',
              transition: 'border-color 0.2s',
            }}
          >
            {/* Card header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <GripVertical size={16} color="var(--text-muted)" style={{ opacity: 0.4 }} />
                <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(212,175,55,0.08)', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.15)' }}>
                  <CoinIcon symbol={w.coinName || w.logo || '?'} size={22} />
                </div>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>
                    {w.coinName || 'New Wallet'}
                  </span>
                  {w.network && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      {w.network}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.72rem', color: 'var(--text-muted)',
                  background: 'var(--border)', padding: '0.2rem 0.65rem', borderRadius: '6px',
                  fontWeight: 600,
                }}>#{idx + 1}</span>
                <button
                  onClick={() => removeWallet(idx)}
                  style={{
                    background: 'rgba(255,0,85,0.06)', border: '1px solid rgba(255,0,85,0.15)', borderRadius: '8px',
                    padding: '0.4rem 0.65rem', cursor: 'pointer', color: 'var(--danger)',
                    display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }} className="grid-responsive-2col">
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Coin Name</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Bitcoin"
                  maxLength={50}
                  value={w.coinName}
                  onChange={(e) => updateWallet(idx, 'coinName', e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Network</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. BTC Network"
                  maxLength={100}
                  value={w.network}
                  onChange={(e) => updateWallet(idx, 'network', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Wallet Address</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.85rem', flex: 1 }}
                  placeholder="e.g. bc1q... / 0x... / T..."
                  maxLength={256}
                  value={w.address}
                  onChange={(e) => updateWallet(idx, 'address', e.target.value)}
                />
                {w.address && (
                  <button
                    onClick={() => copyAddress(idx)}
                    style={{
                      background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
                      borderRadius: '8px', padding: '0.5rem 0.65rem', cursor: 'pointer', color: 'var(--accent)',
                      flexShrink: 0, transition: 'all 0.2s',
                    }}
                    title="Copy address"
                  >
                    {copiedIdx === idx ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {wallets.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem 2rem',
          background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)',
          marginBottom: '1rem',
        }}>
          <Wallet size={40} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.3rem' }}>No wallets configured yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', opacity: 0.7 }}>Add a wallet below so users can deposit crypto</p>
        </div>
      )}

      {/* Add Wallet Button */}
      <button
        onClick={addWallet}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center',
          padding: '0.95rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700,
          background: 'rgba(212,175,55,0.06)', border: '1px dashed rgba(212,175,55,0.3)', color: 'var(--accent)',
          marginTop: '1rem', transition: 'all 0.2s',
        }}
      >
        <Plus size={20} /> Add Wallet
      </button>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', paddingBottom: '3rem' }}>
        <button
          className="btn btn-gold"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 700,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? <GoldCoinLoader mini label={null} /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Wallets'}
        </button>
      </div>
    </div>
  );
}
