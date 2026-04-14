'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProfitChart from '@/components/ProfitChart';
import LivePriceTicker from '@/components/LivePriceTicker';
import {
  TrendingUp, TrendingDown, Clock, DollarSign,
  Target, History, AlertTriangle, Lock, ShieldCheck
} from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';
import Link from 'next/link';
import { getTradeTier } from '@/lib/trade-utils';
import { ALLOWED_DURATIONS } from '@/lib/validations';

const DURATION_PRESETS = ALLOWED_DURATIONS;

export default function TradePage() {
  const { user, loading, refreshUser } = useAuth();

  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<{ time: string; price: number }[]>([]);
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const [placingTrade, setPlacingTrade] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    minTrade: 1,
    maxTrade: 1000000,
    profitPercent: 80,
    tradeDuration: 60,
    tradingStartTime: '00:00',
    tradingEndTime: '23:59',
    tradingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  });
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [, setTick] = useState(0); // force re-render for countdown

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch('/api/trades');
      if (res.ok) {
        const data = await res.json();
        const all = data.trades || [];
        setActiveTrades(all.filter((t: any) => t.result === 'pending'));
        setRecentTrades(all.filter((t: any) => t.result !== 'pending').slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching trades:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          minTrade: data.settings.minTrade ?? 1,
          maxTrade: data.settings.maxTrade ?? 10000,
          profitPercent: data.settings.profitPercent ?? 80,
          tradeDuration: data.settings.tradeDuration ?? 60,
          tradingStartTime: data.settings.tradingStartTime ?? '00:00',
          tradingEndTime: data.settings.tradingEndTime ?? '23:59',
          tradingDays: data.settings.tradingDays ?? [],
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchTrades();
    fetchSettings();
    const tradeInterval = setInterval(fetchTrades, 5000);
    const tickInterval = setInterval(() => setTick(t => t + 1), 1000); // countdown tick
    return () => {
      clearInterval(tradeInterval);
      clearInterval(tickInterval);
    };
  }, [user, fetchTrades, fetchSettings]);

  // Callback for LivePriceTicker — receives per-second price + history
  const handlePriceUpdate = useCallback((price: number, history: { time: string; price: number }[]) => {
    setGoldPrice(price);
    setPriceHistory(history);
  }, []);

  const handleTrade = async () => {
    if (!direction || !amount) return;
    setError('');
    setSuccess('');
    setPlacingTrade(true);
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          direction, 
          amount: parseFloat(amount),
          duration: selectedDuration 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Trade placed successfully!');
        setAmount('');
        setDirection(null);
        fetchTrades();
        refreshUser();
      } else {
        setError(data.error || 'Failed to place trade');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setPlacingTrade(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="skeleton" style={{ width: '200px', height: '32px', margin: '0 auto 1rem' }} />
        <div className="skeleton" style={{ width: '300px', height: '16px', margin: '0 auto' }} />
      </div>
    );
  }

  const currentAmount = parseFloat(amount) || 0;
  const activeTier = getTradeTier(currentAmount);

  const presets = currentAmount >= 5000
    ? [1000, 5000, 10000, 25000, 50000]
    : [10, 25, 50, 100, 250, 500];

  // Check if market is open
  const checkMarketStatus = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const isDayAllowed = settings.tradingDays.length === 0 || settings.tradingDays.includes(currentDay);
    const isTimeAllowed = currentTime >= settings.tradingStartTime && currentTime <= settings.tradingEndTime;

    return { isOpen: isDayAllowed && isTimeAllowed, currentDay, currentTime };
  };

  const marketStatus = checkMarketStatus();

  return (
    <div className="animate-in trade-page-root" style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .trade-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr);
          gap: 1.5rem;
          width: 100%;
          align-items: stretch;
        }
        .trade-chart-col {
          min-width: 0;
        }
        .trade-panel-col {
          width: 100%;
          padding: 1.5rem 2rem !important;
        }

        @media (max-width: 1000px) {
          .trade-main-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 860px) {
          .trade-panel-col {
            max-width: 100%;
            padding: 1.25rem 1rem !important;
          }
          /* Hide the big header panel on mobile — price is already in the navbar */
          .trade-header-panel {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .trade-page-root { padding: 12px 8px !important; }
          .trade-price-box { padding: 0.75rem 1rem !important; gap: 1rem !important; }
          .trade-price-box .trade-divider { display: none; }
        }
      `}</style>
      {/* Header & Live Price Ticker (Unified Dashboard Panel) */}
      <div className="glass-card mb-8 trade-header-panel" style={{ padding: '1.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--gradient-gold)' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: 'var(--text)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center' }}>
              <Target size={28} style={{ marginRight: '10px', color: 'var(--accent)', filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.4))' }} />
              Trade Gold
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Predict market direction and earn up to <strong className="text-gold text-gradient-gold">80% profit</strong> per winning cycle.</p>
          </div>

          <div className="trade-price-box" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', background: 'var(--surface-hover)', padding: '1rem 1.5rem', borderRadius: '14px', border: '1px solid var(--border-subtle)', width: '100%', maxWidth: '500px' }}>
            <LivePriceTicker onPriceUpdate={handlePriceUpdate} />
            <div className="trade-divider" style={{ width: '1px', height: '40px', background: 'var(--border)' }}></div>
            <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.2rem' }}>Balance</p>
              <p className="text-gradient-gold" style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)' }}>
                ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid: chart LEFT on desktop, trade RIGHT on desktop | trade TOP on mobile, chart BOTTOM */}
      <div className="trade-main-grid">
        {/* Left Chart Panel */}
        <div className="trade-chart-col">
          <ProfitChart symbol="XAU/USD" />
        </div>

        {/* Right Trade Panel */}
        <div className="neon-pulse animate-float trade-panel-col" style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 40px var(--border)',
          animationDuration: '6s',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--gradient-gold)' }} />

          {!marketStatus.isOpen && (
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 100,
              background: 'var(--surface)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center',
            }}>
              <div style={{
                width: '64px', height: '64px',
                background: 'rgba(212,175,55,0.1)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem',
                border: '1px solid rgba(212,175,55,0.2)'
              }}>
                <Lock size={32} color="var(--accent)" />
              </div>
              <h3 style={{ color: 'var(--text)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>Market Closed</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Trading is currently disabled. <br />
                Hours: <strong style={{ color: 'var(--accent)' }}>{settings.tradingStartTime} - {settings.tradingEndTime}</strong> <br />
                {settings.tradingDays.length < 7 && (
                  <span style={{ fontSize: '0.75rem' }}>Allowed Days: {settings.tradingDays.join(', ')}</span>
                )}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'rgba(212,175,55,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Server Time: {marketStatus.currentTime}
              </div>
            </div>
          )}

          <h3 style={{ color: 'var(--text)', marginBottom: '1.25rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={18} color="var(--accent)" /> Place Trade
          </h3>

          {error && <div style={{ background: 'rgba(255,71,87,0.08)', color: 'var(--danger)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', border: '1px solid rgba(255,71,87,0.15)', marginBottom: '1rem' }}>{error}</div>}
          {success && <div style={{ background: 'rgba(0,230,138,0.08)', color: 'var(--success)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', border: '1px solid rgba(0,230,138,0.15)', marginBottom: '1rem' }}>{success}</div>}
          <div className="trade-panel-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
            {/* Left Column: Strategy & Duration */}
            <div>
              <div style={{ marginBottom: '1.5rem', background: 'rgba(212,175,55,0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.1)', height: 'fit-content' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Strategy Tier</span>
                  <span style={{
                    fontSize: '0.7rem',
                    background: 'var(--accent)',
                    color: '#000',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}>{activeTier.label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Yield Scale</p>
                    <p style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.1rem' }}>±{activeTier.profitPercent}%</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Window</p>
                    <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: '1.1rem' }}>{selectedDuration}s</p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>Execution Duration</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {DURATION_PRESETS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDuration(d)}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: `1px solid ${selectedDuration === d ? 'var(--accent)' : 'var(--border)'}`,
                        background: selectedDuration === d ? 'rgba(212,175,55,0.1)' : 'var(--surface-hover)',
                        color: selectedDuration === d ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Amount & Direction */}
            <div>
              <div style={{ marginBottom: '1.5rem', background: 'var(--surface-hover)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>Investment Amount</label>
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', fontSize: '1.4rem', fontWeight: 800 }}>$</span>
                  <input
                    type="number"
                    min={activeTier.minAmount}
                    max={user.balance}
                    step="0.01"
                    placeholder={`${settings.minTrade.toLocaleString()}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '1.1rem 1rem 1.1rem 2.5rem',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: 'var(--text)',
                      fontFamily: 'var(--font-mono, monospace)',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  {presets.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(String(p))}
                      style={{
                        padding: '0.5rem 0',
                        borderRadius: '6px',
                        background: amount === String(p) ? 'rgba(212,175,55,0.15)' : 'var(--surface)',
                        color: amount === String(p) ? 'var(--accent)' : 'var(--text-muted)',
                        border: `1px solid ${amount === String(p) ? 'var(--accent)' : 'var(--border)'}`,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      +${p}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  onClick={() => setDirection('up')}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: `2px solid ${direction === 'up' ? 'var(--success)' : 'var(--border)'}`,
                    background: direction === 'up' ? 'rgba(0,230,138,0.1)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <TrendingUp size={24} color={direction === 'up' ? 'var(--success)' : 'rgba(0,230,138,0.5)'} style={{ marginBottom: '0.4rem' }} />
                  <span style={{ display: 'block', fontWeight: 900, color: direction === 'up' ? 'var(--success)' : 'rgba(0,230,138,0.6)' }}>CALL</span>
                </button>
                <button
                  onClick={() => setDirection('down')}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: `2px solid ${direction === 'down' ? 'var(--danger)' : 'var(--border)'}`,
                    background: direction === 'down' ? 'rgba(255,71,87,0.1)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <TrendingDown size={24} color={direction === 'down' ? 'var(--danger)' : 'rgba(255,71,87,0.5)'} style={{ marginBottom: '0.4rem' }} />
                  <span style={{ display: 'block', fontWeight: 900, color: direction === 'down' ? 'var(--danger)' : 'rgba(255,71,87,0.6)' }}>PUT</span>
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          {amount && direction && (
            <div style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.08)', borderRadius: '10px', padding: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Stake</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>${parseFloat(amount || '0').toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Direction</span>
                <span style={{ color: direction === 'up' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{direction.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Potential Profit</p>
                  <p style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1rem' }}>+${(parseFloat(amount || '0') * activeTier.profitPercent / 100).toFixed(2)}</p>
                </div>
                <div style={{ width: '1px', background: 'var(--border)' }} />
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Maximum Risk</p>
                  <p style={{ color: '#ff6b6b', fontWeight: 800, fontSize: '1rem' }}>-${(parseFloat(amount || '0') * activeTier.profitPercent / 100).toFixed(2)}</p>
                </div>
              </div>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(0,230,138,0.05)',
                border: '1px solid rgba(0,230,138,0.15)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(0,230,138,0.05), transparent)',
                  animation: 'shimmer 2s infinite'
                }} />
                <div style={{
                  background: 'var(--success)',
                  padding: '0.4rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(0,230,138,0.3)'
                }}>
                  <ShieldCheck size={16} color="#000" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.1rem' }}>Symmetric Protection Active</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>
                    <strong style={{ color: 'var(--success)' }}>{100 - activeTier.profitPercent}%</strong> of your stake is <span style={{ opacity: 0.8 }}>shielded</span>
                  </p>
                </div>
                <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
                   <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Refund on Loss</p>
                   <p style={{ color: 'var(--success)', fontWeight: 800 }}>${(parseFloat(amount || '0') * (100 - activeTier.profitPercent) / 100).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleTrade}
            disabled={!direction || !amount || placingTrade || parseFloat(amount) < activeTier.minAmount}
            className="btn btn-gold"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.1rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              borderRadius: '12px',
              opacity: (!direction || !amount || placingTrade || parseFloat(amount) < activeTier.minAmount) ? 0.3 : 1,
              filter: (!direction || !amount || placingTrade || parseFloat(amount) < activeTier.minAmount) ? 'grayscale(1)' : 'drop-shadow(0 0 15px rgba(212,175,55,0.4))',
              transform: 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {placingTrade ? (
              <><GoldCoinLoader mini label={null} /> Executing Contract...</>
            ) : (
              <>Trade</>
            )}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Min: <strong style={{ color: 'var(--text)' }}>${settings.minTrade.toLocaleString()}</strong> • Max: <strong style={{ color: 'var(--text)' }}>${settings.maxTrade > 10000 ? settings.maxTrade.toLocaleString() : '1,000,000'}</strong>
          </p>
        </div>

      </div>

      {/* Active Trades (Pending) */}
      {activeTrades.length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: '16px',
          padding: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', animation: 'pulse 2s ease-in-out infinite' }} />
          <h3 style={{ color: 'var(--text)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={16} color="var(--accent)" /> Active Trades
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeTrades.map((trade: any) => {
              const expiresAt = new Date(trade.expiresAt).getTime();
              const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
              const progress = trade.duration ? Math.max(0, Math.min(100, ((trade.duration - remaining) / trade.duration) * 100)) : 0;
              return (
                <div key={trade._id} style={{
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                      <span style={{ color: trade.direction === 'up' ? 'var(--success)' : 'var(--danger)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', background: trade.direction === 'up' ? 'rgba(0,230,138,0.1)' : 'rgba(255,71,87,0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                        {trade.direction === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {trade.direction.toUpperCase()}
                      </span>
                      <span style={{ color: 'var(--text)', fontSize: '1.05rem', fontWeight: 700 }}>${trade.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@ ${trade.entryPrice?.toFixed(2)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: remaining <= 10 ? 'var(--danger)' : 'var(--accent)',
                        textShadow: remaining <= 10 ? '0 0 10px rgba(255,71,87,0.4)' : '0 0 10px rgba(212,175,55,0.3)',
                      }}>
                        {remaining > 0 ? `${remaining}s` : 'Settling...'}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--surface-hover)' }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: remaining <= 10 ? 'var(--danger)' : 'var(--gradient-gold)',
                      boxShadow: remaining <= 10 ? '0 0 10px rgba(255,71,87,0.5)' : '0 0 10px rgba(212,175,55,0.5)',
                      borderRadius: '3px',
                      transition: 'width 1s linear',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}



      {/* Recent Trades */}
      {recentTrades.length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212,175,55,0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} color="var(--accent)" /> Recent Trades
            </h3>
            <Link href="/history" style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>View All →</Link>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '550px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Direction', 'Amount', 'Open Price', 'Close Price', 'P/L', 'Result'].map((h) => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade: any) => (
                  <tr key={trade._id} style={{ borderBottom: '1px solid var(--surface-hover)' }}>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: trade.direction === 'up' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {trade.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {trade.direction.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 0.75rem', color: 'var(--text)', fontWeight: 600 }}>${trade.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '0.8rem 0.75rem', color: 'var(--text-secondary)' }}>${trade.entryPrice?.toFixed(2) ?? '—'}</td>
                    <td style={{ padding: '0.8rem 0.75rem', color: 'var(--text-secondary)' }}>${trade.exitPrice?.toFixed(2) ?? '—'}</td>
                    <td style={{ padding: '0.8rem 0.75rem', fontWeight: 800, color: trade.profitOrLoss >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {trade.profitOrLoss >= 0 ? '+' : ''}${trade.profitOrLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span className={`badge ${trade.result === 'win' ? 'badge-approved' : trade.result === 'loss' ? 'badge-rejected' : 'badge-pending'}`}>{trade.result}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Investment Tiers Guide */}
      <div className="mb-8 mt-4 animate-in stagger-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, var(--border))' }} />
          <h2 style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800, whiteSpace: 'nowrap' }}>Yield Tiers Guide</h2>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, var(--border), transparent)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '1.25rem' }}>
          {[
            { name: 'Starter', range: '$1 - $5,000', profit: 30, color: '#94a3b8' },
            { name: 'Intermediate', range: '$5,001 - $20,000', profit: 40, color: '#38bdf8' },
            { name: 'Advanced', range: '$20,001 - $50,000', profit: 50, color: '#818cf8' },
            { name: 'Professional', range: '$50,001 - $100,000', profit: 60, color: '#fb923c' },
            { name: 'Grandmaster', range: '$100,001 - $200,000', profit: 70, color: '#f472b6' },
            { name: 'Apex', range: 'Over $200,000', profit: 80, color: 'var(--accent)' },
          ].map((tier, idx) => (
            <div key={tier.name} className="glass-card" style={{
              padding: '1.5rem',
              border: '1px solid var(--border)',
              borderTop: `2px solid ${tier.color}`,
              background: 'var(--surface-hover)',
              transition: 'all 0.3s ease',
              cursor: 'default',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }} onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.background = 'var(--surface-hover)';
              e.currentTarget.style.boxShadow = `0 10px 30px -10px ${tier.color}33`;
            }} onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'var(--surface-hover)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ color: tier.color, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Tier {idx + 1}</h4>
                  <h3 style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 800 }}>{tier.name}</h3>
                </div>
                <div style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'var(--border)', border: '1px solid var(--border-highlight)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {tier.range}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Investment Range</p>
                  <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: '1.1rem' }}>{tier.range}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Profit / Loss</p>
                  <p style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.1rem' }}>±{tier.profit}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
