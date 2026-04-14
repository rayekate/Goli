'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Activity, Search, TrendingUp, TrendingDown, Clock, User, DollarSign, BarChart3 } from 'lucide-react';

export default function AdminTradesPage() {
  const { user, loading } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss' | 'pending'>('all');
  const [dataLoading, setDataLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/trades');
      if (res.ok) {
        const data = await res.json();
        setTrades(data.trades);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || dataLoading) return <div>Monitoring global activity...</div>;

  const filteredTrades = trades.filter(t => {
    const name = t.userId?.name?.toLowerCase() ?? '';
    const email = t.userId?.email?.toLowerCase() ?? '';
    const term = searchTerm.toLowerCase();
    const matchSearch = !term || name.includes(term) || email.includes(term);
    const matchResult = filterResult === 'all' || t.result === filterResult;
    return matchSearch && matchResult;
  });


  // Platform stats from backend
  const totalVolume = stats.totalVolume || 0;
  const totalWins = stats.totalWins || 0;
  const totalLosses = stats.totalLosses || 0;
  const winPayouts = stats.winPayouts || 0;
  const lossCollected = stats.lossCollected || 0;
  const houseNet = stats.houseNet || 0;

  return (
    <div className="container animate-in stagger-1" style={{ padding: '20px 15px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }} className="text-gradient-gold">
            <Activity size={32} color="var(--gold)" style={{ filter: 'drop-shadow(0 0 10px var(--gold-glow))' }} /> Trade Surveillance
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Complete oversight of all platform trading activity and house profit/loss.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ 
            display: 'flex', 
            background: 'rgba(0,0,0,0.2)', 
            padding: '3px', 
            borderRadius: '10px', 
            border: '1px solid rgba(255,255,255,0.05)',
            gap: '2px'
          }}>
            {[
              { id: 'all', label: 'All Results' },
              { id: 'pending', label: 'Pending' },
              { id: 'win', label: 'Wins' },
              { id: 'loss', label: 'Losses' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterResult(f.id as any)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '7px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: filterResult === f.id ? 'rgba(212,175,55,0.1)' : 'transparent',
                  color: filterResult === f.id ? '#d4af37' : 'var(--text-muted)',
                  boxShadow: filterResult === f.id ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', width: '260px', maxWidth: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search by user..." className="input" style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <DollarSign size={20} style={{ color: '#d4af37', marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d4af37' }}>${totalVolume.toLocaleString()}</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Volume</p>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <BarChart3 size={20} style={{ color: '#00f0ff', marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00f0ff' }}>{stats.totalTrades || 0}</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Trades</p>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <TrendingUp size={20} style={{ color: '#00ff66', marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            <span style={{ color: '#00ff66' }}>{totalWins}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> / </span>
            <span style={{ color: '#ff0055' }}>{totalLosses}</span>
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Win / Loss Count</p>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <DollarSign size={20} style={{ color: '#ff0055', marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ff0055' }}>${winPayouts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Paid Out (User Wins)</p>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <DollarSign size={20} style={{ color: '#00ff66', marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00ff66' }}>${lossCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Collected (User Losses)</p>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', border: `1px solid ${houseNet >= 0 ? 'rgba(0,255,102,0.3)' : 'rgba(255,0,85,0.3)'}` }}>
          <BarChart3 size={20} style={{ color: houseNet >= 0 ? '#00ff66' : '#ff0055', marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: houseNet >= 0 ? '#00ff66' : '#ff0055' }}>
            {houseNet >= 0 ? '+' : '-'}${Math.abs(houseNet).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>House Net P&L</p>
        </div>
      </div>

      {/* Trades List */}
      <h3 style={{ marginBottom: '1.5rem', color: '#fff', fontSize: '1.25rem' }}>Recent Activity Feed</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredTrades.slice(0, 100).map((t: any, i: number) => (
          <div key={t._id} className={`glass-card stagger-${Math.min((i % 5) + 1, 5)}`} style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', borderLeft: `4px solid ${t.result === 'win' ? 'var(--success)' : t.result === 'loss' ? 'var(--danger)' : 'var(--text-muted)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '200px' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <User size={24} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{t.userId?.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.userId?.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '130px' }}>
              {t.direction === 'up' ? <TrendingUp size={20} color="var(--success)" style={{ filter: 'drop-shadow(0 0 5px var(--success-glow))' }} /> : <TrendingDown size={20} color="var(--danger)" style={{ filter: 'drop-shadow(0 0 5px var(--danger-glow))' }} />}
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Direction</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: t.direction === 'up' ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase' }}>{t.direction}</p>
              </div>
            </div>

            <div style={{ minWidth: '100px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stake</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d4af37' }}>${t.amount.toLocaleString()}</p>
            </div>

            <div style={{ minWidth: '120px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Entry / Exit</p>
              <p style={{ fontSize: '0.85rem', color: '#fff' }}>${t.entryPrice?.toFixed(2)} → {t.exitPrice ? `$${t.exitPrice.toFixed(2)}` : '—'}</p>
            </div>

            <div style={{ textAlign: 'right', minWidth: '120px' }}>
              <p style={{ fontWeight: 900, fontSize: '1.2rem', color: t.result === 'win' ? 'var(--success)' : t.result === 'loss' ? 'var(--danger)' : '#fff', textShadow: t.result === 'win' ? '0 0 10px var(--success-glow)' : t.result === 'loss' ? '0 0 10px var(--danger-glow)' : 'none' }}>
                {t.result === 'win' ? `+$${Math.abs(t.profitOrLoss).toFixed(2)}` : t.result === 'loss' ? `-$${Math.abs(t.profitOrLoss).toFixed(2)}` : 'PENDING'}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.2rem' }}>
                <Clock size={12} /> {new Date(t.createdAt).toLocaleTimeString()}
              </p>
            </div>


          </div>
        ))}
        {filteredTrades.length === 0 && (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No trades found.
          </div>
        )}
      </div>
    </div>
  );
}
