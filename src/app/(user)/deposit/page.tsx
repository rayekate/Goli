'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Copy, Check, ArrowUpCircle, Info, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
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
        <div style={{ textAlign: 'center', maxWidth: '500px', background: 'rgba(8,14,26,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '20px', padding: '3rem 2rem' }}>
          <AlertTriangle size={36} color="var(--gold)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.5rem' }}>Deposits Unavailable</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No wallet addresses are configured yet. Please contact support.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', background: 'rgba(8,14,26,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '20px', padding: '3rem 2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
          <div style={{ width: '64px', height: '64px', margin: '0 auto 1.25rem', background: 'rgba(0,230,138,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,230,138,0.2)' }}>
            <Check size={28} color="var(--success)" />
          </div>
          <h2 className="text-gradient-gold" style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>Deposit Submitted</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: 1.7, fontSize: '0.92rem' }}>
            Your deposit of <strong style={{ color: '#fff' }}>${Number(amount).toFixed(2)}</strong> via <strong style={{ color: '#fff' }}>{selectedCrypto?.name}</strong> is being reviewed.
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Typical verification: 1-6 hours</p>
          <button className="btn btn-gold" style={{ padding: '0.8rem 2rem' }} onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ padding: '24px 16px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2rem)', color: '#fff', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowUpCircle size={24} color="var(--gold)" /> <span className="text-gradient-gold">Deposit Funds</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Send crypto to our wallet and submit your transaction proof.</p>
      </div>
      <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <div>
          <h3 style={{ 
            marginBottom: '1.5rem', 
            fontSize: '0.75rem', 
            color: '#7B8CA8', 
            textTransform: 'uppercase', 
            letterSpacing: '2px', 
            fontWeight: 700 
          }}>
            Step 1 - Select Currency
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
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
                  style={{ 
                    padding: '1.25rem', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderRadius: '16px', 
                    border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)', 
                    background: isSelected ? 'rgba(212,175,55,0.08)' : 'rgba(12,18,32,0.4)', 
                    boxShadow: isSelected ? '0 0 20px rgba(212,175,55,0.1)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Selected Indicator Glow */}
                  {isSelected && (
                    <div style={{ 
                      position: 'absolute', 
                      top: 0, left: 0, bottom: 0, 
                      width: '3px', background: 'var(--gold)' 
                    }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '44px', height: '44px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      background: isSelected ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)', 
                      borderRadius: '12px',
                      transition: 'all 0.3s'
                    }}>
                      <CoinIcon symbol={coinName} size={24} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{coinName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{option?.network} Network</span>
                    </div>
                  </div>

                  {isSelected ? (
                    <div style={{ 
                      width: '20px', height: '20px', 
                      background: 'var(--gold)', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <Check size={12} color="#000" strokeWidth={4} />
                    </div>
                  ) : (
                    <div style={{ 
                      width: '20px', height: '20px', 
                      border: '1.5px solid rgba(255,255,255,0.1)', 
                      borderRadius: '50%' 
                    }} />
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
                      border: isSelected ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.04)', 
                      background: isSelected ? 'rgba(212,175,55,0.1)' : 'rgba(8,14,26,0.3)', 
                      transition: 'all 0.2s' 
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--gold)' : 'var(--text-muted)' }}>{crypto.network}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedCrypto && (
            <div style={{ padding: '1rem', background: 'rgba(212,175,55,0.03)', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedCoin} Address ({selectedNetwork})</p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.65rem 0.7rem', borderRadius: '8px', flex: 1, fontSize: '0.75rem', wordBreak: 'break-all', color: 'var(--gold)', border: '1px solid rgba(255,255,255,0.04)' }}>{selectedCrypto.address}</code>
                <button onClick={handleCopy} style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px', padding: '0.65rem', cursor: 'pointer', color: 'var(--gold)', flexShrink: 0 }}>{copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}</button>
              </div>
              {copied && <p style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '0.5rem' }}>Copied to clipboard!</p>}
            </div>
          )}

          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', padding: '0.7rem', background: 'rgba(212,175,55,0.02)', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.06)' }}>
            <Info size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Only send <strong style={{ color: '#fff' }}>{selectedCoin}</strong> via the <strong style={{ color: '#fff' }}>{selectedNetwork}</strong> network. Incorrect sends will result in permanent loss.</p>
          </div>
        </div>
        <div style={{ background: 'rgba(8,14,26,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '16px', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
          <h3 style={{ marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Step 2 - Submit Proof</h3>
          {error && (<div style={{ background: 'rgba(255,71,87,0.08)', color: 'var(--danger)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', border: '1px solid rgba(255,71,87,0.15)', marginBottom: '1rem' }}>{error}</div>)}
          <form onSubmit={handleSubmit}>
            <div className="input-group"><label>Amount Sent (USD)</label><input type="number" placeholder="e.g. 100" required min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="input-group"><label>Transaction Hash / ID</label><input type="text" placeholder="Paste your transaction hash" required value={txHash} onChange={(e) => setTxHash(e.target.value)} /></div>
            <div className="input-group">
              <label>Payment Screenshot (max 2MB)</label>
              <div style={{ border: '1px dashed rgba(212,175,55,0.2)', padding: '1.25rem', borderRadius: '12px', textAlign: 'center', background: 'rgba(212,175,55,0.02)', position: 'relative', cursor: 'pointer' }}>
                {proofImage ? (<div><img src={proofImage} alt="proof" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', objectFit: 'contain' }} /><button type="button" onClick={() => setProofImage('')} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem', display: 'block', margin: '0.5rem auto 0' }}>Remove</button></div>) : (<div><ImageIcon size={24} style={{ color: 'rgba(212,175,55,0.4)', marginBottom: '0.4rem' }} /><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to upload</p><p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>PNG, JPG - max 2MB</p><input type="file" accept="image/*" onChange={handleImageChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} /></div>)}
              </div>
            </div>
            <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.95rem', padding: '0.85rem', borderRadius: '10px' }} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Deposit Request'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}