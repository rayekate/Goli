'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Activity, Search, TrendingUp, TrendingDown, Clock, User, DollarSign, BarChart3, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AdminTradesPage() {
  const { user, loading } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss' | 'pending'>('all');
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/trades');
      if (res.ok) {
        const data = await res.json();
        setTrades(data.trades);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleForceResult = async (tradeId: string, action: 'force_win' | 'force_loss') => {
    setActionLoading(tradeId);
    try {
      const res = await fetch('/api/admin/trades', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, action }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Force action error:', err);
    } finally {
      setActionLoading(null);
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

  const exportTradesCSV = () => {
    if (trades.length === 0) return;
    const headers = ['Trade ID', 'User Name', 'User Email', 'Direction', 'Amount', 'Entry Price', 'Exit Price', 'Result', 'Profit/Loss', 'Time'];
    const csvContent = [
      headers.join(','),
      ...trades.map(t => [
        t._id,
        `"${(t.userId?.name || '').replace(/"/g, '""')}"`,
        `"${(t.userId?.email || '').replace(/"/g, '""')}"`,
        t.direction,
        t.amount,
        t.entryPrice || '',
        t.exitPrice || '',
        t.result,
        t.profitOrLoss || 0,
        new Date(t.createdAt).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goldtradex_trades_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  // Platform stats
  const totalVolume = trades.reduce((s, t) => s + t.amount, 0);
  const totalWins = trades.filter(t => t.result === 'win').length;
  const totalLosses = trades.filter(t => t.result === 'loss').length;
  const winPayouts = trades.filter(t => t.result === 'win').reduce((s, t) => s + Math.abs(t.profitOrLoss), 0);
  const lossCollected = trades.filter(t => t.result === 'loss').reduce((s, t) => s + Math.abs(t.profitOrLoss), 0);
  const houseNet = lossCollected - winPayouts;

  return (
    <div className="container animate-in stagger-1" style={{ padding: '20px 15px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }} className="text-gradient-gold">
            <Activity size={32} color="var(--gold)" style={{ filter: 'drop-shadow(0 0 10px var(--gold-glow))' }} /> Trade Surveillance
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Complete oversight of all platform trading activity and house profit/loss.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={exportTradesCSV} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem' }}>
            <Download size={16} /> Export CSV
          </button>
          <select value={filterResult} onChange={(e) => setFilterResult(e.target.value as any)} style={{ width: '150px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', outline: 'none' }}>
            <option value="all">All Results</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
            <option value="pending">Pending</option>
          </select>
          <div style={{ position: 'relative', width: '260px' }}>
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
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00f0ff' }}>{trades.length}</p>
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

            {t.result === 'pending' && (
              <div style={{ display: 'flex', gap: '0.5rem', minWidth: '160px' }}>
                <button
                  onClick={() => handleForceResult(t._id, 'force_win')}
                  disabled={actionLoading === t._id}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,255,102,0.3)',
                    background: 'rgba(0,255,102,0.08)',
                    color: '#00ff66',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: actionLoading === t._id ? 0.5 : 1,
                  }}
                >
                  {actionLoading === t._id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={12} />} Win
                </button>
                <button
                  onClick={() => handleForceResult(t._id, 'force_loss')}
                  disabled={actionLoading === t._id}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,0,85,0.3)',
                    background: 'rgba(255,0,85,0.08)',
                    color: '#ff0055',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: actionLoading === t._id ? 0.5 : 1,
                  }}
                >
                  {actionLoading === t._id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={12} />} Loss
                </button>
              </div>
            )}
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
