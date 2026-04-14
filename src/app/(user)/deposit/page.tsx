'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Copy, Check, ArrowUpCircle, Info, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';
import { useRouter } from 'next/navigation';
import CoinIcon from '@/components/CoinIcon';

interface CryptoOption {
  id: string;
  name: string;
  network: string;
  address: string;
  logo: string;
}

export default function DepositPage() {
  const { user, loading } = useAuth();
  const [cryptoOptions, setCryptoOptions] = useState<CryptoOption[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [proofImage, setProofImage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(true);
  const router = useRouter();

  // Load wallet addresses from platform settings
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const { settings } = await res.json();
          const options: CryptoOption[] = (settings.wallets || [])
            .filter((w: any) => w.address && w.coinName)
            .map((w: any, i: number) => ({
              id: w.coinName.replace(/\s+/g, '_').toUpperCase() + '_' + i,
              name: w.coinName,
              network: w.network || '',
              address: w.address,
              logo: w.logo || '💰',
            }));
          if (options.length > 0) {
            setCryptoOptions(options);
            setSelectedCoin(options[0].name);
            setSelectedNetwork(options[0].network);
          }
        }
      } catch { /* ignore */ }
      finally { setSettingsLoading(false); }
    })();
  }, []);

  const selectedCrypto = cryptoOptions.find(c => c.name === selectedCoin && c.network === selectedNetwork) || null;

  const handleCopy = () => {
    if (!selectedCrypto) return;
    navigator.clipboard.writeText(selectedCrypto.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { setError('Image too large. Maximum 2MB.'); return; }
      const reader = new FileReader();
      reader.onloadend = () => setProofImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!amount || Number(amount) <= 0) { setError('Enter a valid deposit amount.'); return; }
    if (!txHash.trim()) { setError('Transaction hash is required.'); return; }
    if (!proofImage) { setError('Upload a screenshot as payment proof.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'deposit', amount: Number(amount), transactionHash: txHash.trim(), cryptoType: selectedCrypto!.id, proofImage }),
      });
      if (res.ok) { setProofImage(''); setSubmitted(true); }
      else { const data = await res.json(); setError(data.error || 'Failed to submit'); }
    } catch { setError('Network error.'); }
    finally { setSubmitting(false); }
  };

  if (loading || !user || settingsLoading) return (<div style={{ padding: '60px 20px', textAlign: 'center' }}><div className="skeleton" style={{ width: '200px', height: '32px', margin: '0 auto 1rem' }} /><div className="skeleton" style={{ width: '300px', height: '16px', margin: '0 auto' }} /></div>);

  if (cryptoOptions.length === 0) {
    return (
      <div className="animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', background: 'var(--surface)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '20px', padding: '3rem 2rem' }}>
          <AlertTriangle size={36} color="var(--accent)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.3rem', color: 'var(--text)', marginBottom: '0.5rem' }}>Deposits Unavailable</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No wallet addresses are configured yet. Please contact support.</p>
        </div>
      </div>
    );
  }

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
            TRANSACTION CAPTURED
          </div>
          
          <h2 style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1.5rem' }}>
            Asset <span style={{ color: 'var(--success)' }}>Initialization</span>
          </h2>
          
          <div style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '2.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
              Your deposit of <strong style={{ color: 'var(--text)' }}>${Number(amount).toLocaleString()}</strong> via <strong style={{ color: 'var(--text)' }}>{selectedCoin}</strong> has been received by the terminal.
            </p>
            <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }} />
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '0.1em' }}>
              RESERVE SYNCHRONIZATION IN PROGRESS
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
    <div className="animate-in" style={{ padding: '24px 16px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Institutional Header */}
      <div style={{ 
        marginBottom: '3rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '2rem',
        position: 'relative'
      }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="badge" style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>FUNDING TERMINAL</div>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--success)', letterSpacing: '0.2em' }}>SECURE CHANNEL ESTABLISHED</span>
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 2.8rem)', 
            marginBottom: '0.5rem', 
            fontWeight: 950,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: 'var(--text)' 
          }}>
            Initialize <span className="text-gradient-gold">Asset Funding</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500, maxWidth: '600px', opacity: 0.8 }}>
            Synchronize your local reserves with our institutional bullion vault via encrypted blockchain bridge.
          </p>
        </div>
      </div>

      <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '2.5rem', alignItems: 'start' }}>
        {/* Left Column: Asset Selection */}
        <div className="animate-in stagger-1">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '20px', height: '1px', background: 'var(--accent)' }} />
            <h3 style={{ 
              fontSize: '0.7rem', 
              color: 'var(--text)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.25em', 
              fontWeight: 900 
            }}>
              01 CONFIGURATION
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            {Array.from(new Set(cryptoOptions.map(c => c.name))).map((coinName) => {
              const isSelected = selectedCoin === coinName;
              const option = cryptoOptions.find(c => c.name === coinName);
              
              return (
                <div 
                  key={coinName} 
                  onClick={() => {
                    setSelectedCoin(coinName);
                    const firstNetwork = cryptoOptions.find(c => c.name === coinName)?.network || '';
                    setSelectedNetwork(firstNetwork);
                  }} 
                  className="glass-card"
                  style={{ 
                    padding: '1.5rem', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderRadius: '20px', 
                    background: isSelected ? 'rgba(212,175,55,0.06)' : 'var(--surface)', 
                    borderColor: isSelected ? 'rgba(212,175,55,0.4)' : 'var(--border)', 
                    boxShadow: isSelected ? '0 0 40px rgba(212,175,55,0.05)' : 'none',
                    transform: isSelected ? 'translateX(4px)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ 
                      width: '48px', height: '48px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      background: isSelected ? 'var(--accent)' : 'var(--surface-hover)', 
                      borderRadius: '14px',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      color: isSelected ? '#000' : 'var(--accent)',
                      boxShadow: isSelected ? '0 0 20px rgba(212, 175, 55, 0.3)' : 'none'
                    }}>
                      <CoinIcon symbol={coinName} size={24} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 900, color: 'var(--text)', fontSize: '1.1rem', letterSpacing: '-0.02em', display: 'block' }}>{coinName}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{option?.network} NETWORK</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="icon-box" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)', color: '#000' }}>
                      <Check size={14} strokeWidth={4} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Network</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {cryptoOptions.filter(c => c.name === selectedCoin).map((crypto) => {
                const isSelected = selectedNetwork === crypto.network;
                return (
                  <div 
                    key={crypto.id} 
                    onClick={() => setSelectedNetwork(crypto.network)} 
                    style={{ 
                      padding: '0.6rem 1.25rem', 
                      cursor: 'pointer', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      borderRadius: '10px', 
                      border: isSelected ? '1px solid rgba(212,175,55,0.4)' : '1px solid var(--border)', 
                      background: isSelected ? 'rgba(212,175,55,0.1)' : 'var(--surface)', 
                      transition: 'all 0.2s' 
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}>{crypto.network}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {selectedCrypto && (
            <div className="glass-card animate-in" style={{ padding: '2rem', borderRadius: '24px', borderStyle: 'dashed' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(212,175,55,0.1)' }}>
                  <ImageIcon size={18} color="var(--accent)" />
                </div>
                <h4 style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>DEPOSIT ADDRESS</h4>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ 
                  background: 'var(--surface-hover)', 
                  padding: '1.25rem', 
                  borderRadius: '16px', 
                  border: '1px solid var(--border)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700, wordBreak: 'break-all', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {selectedCrypto.address}
                  </p>
                </div>
                
                <button 
                  onClick={handleCopy} 
                  className="btn btn-gold" 
                  style={{ width: '100%', borderRadius: '14px', fontWeight: 900 }}
                >
                  {copied ? <><Check size={18} /> COPIED</> : <><Copy size={18} /> COPY ADDRESS</>}
                </button>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', padding: '1rem', background: 'rgba(255,71,87,0.05)', borderRadius: '12px', border: '1px solid rgba(255,71,87,0.1)' }}>
                <AlertTriangle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Strictly send <strong style={{ color: 'var(--text)' }}>{selectedCoin}</strong> via <strong style={{ color: 'var(--text)' }}>{selectedNetwork}</strong> network. External chain errors are irreversible.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Submission Form */}
        <div className="animate-in stagger-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '20px', height: '1px', background: 'var(--accent)' }} />
            <h3 style={{ 
              fontSize: '0.7rem', 
              color: 'var(--text)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.25em', 
              fontWeight: 900 
            }}>
              02 VERIFICATION
            </h3>
          </div>

          <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '28px', borderTop: '2px solid var(--accent)' }}>
            {error && (
              <div style={{ 
                background: 'rgba(255,71,87,0.08)', 
                color: 'var(--danger)', 
                padding: '1rem', 
                borderRadius: '12px', 
                fontSize: '0.85rem', 
                border: '1px solid rgba(255,71,87,0.15)', 
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                <AlertTriangle size={18} /> {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="input-group">
                <label className="meta-text" style={{ fontSize: '9px', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AMOUNT (USD VALUE)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  required 
                  min="1" 
                  step="0.01" 
                  className="btn-asymmetric"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', padding: '1.25rem 1.5rem', fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}
                />
              </div>
              
              <div className="input-group">
                <label className="meta-text" style={{ fontSize: '9px', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>INSTITUTIONAL TX HASH</label>
                <input 
                  type="text" 
                  placeholder="ENTER TRANSACTION FINGERPRINT" 
                  required 
                  className="btn-asymmetric"
                  value={txHash} 
                  onChange={(e) => setTxHash(e.target.value)} 
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', padding: '1.25rem 1.5rem', fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}
                />
              </div>
              
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TRANSFER PROOF SCAN</label>
                <div style={{ 
                  border: '1px dashed var(--border-highlight)', 
                  padding: '2.5rem 1.5rem', 
                  borderRadius: '20px', 
                  textAlign: 'center', 
                  background: 'var(--surface)', 
                  position: 'relative', 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }} className="hover-glow">
                  {proofImage ? (
                    <div>
                      <img src={proofImage} alt="proof" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 10px 30px var(--border)' }} />
                      <button type="button" onClick={() => setProofImage('')} style={{ marginTop: '1rem', background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.2)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900, padding: '0.4rem 1rem', borderRadius: '100px' }}>REMOVE SCAN</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(212,175,55,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid rgba(212,175,55,0.1)' }}>
                        <ImageIcon size={28} style={{ opacity: 0.4, color: 'var(--accent)' }} />
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700 }}>Inject Terminal Proof</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>PNG, JPG, HEIC · MAXIMUM 2MB</p>
                      <input type="file" accept="image/*" onChange={handleImageChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-gold" 
                style={{ width: '100%', marginTop: '1rem', fontSize: '1rem', padding: '1.15rem', borderRadius: '100px', fontWeight: 950, letterSpacing: '0.02em', boxShadow: '0 20px 40px rgba(212,175,55,0.15)' }} 
                disabled={submitting}
              >
                {submitting ? <GoldCoinLoader mini label="VERIFYING..." /> : 'AUTHORIZE DEPOSIT REQUEST'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}