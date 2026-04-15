'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Activity, Search, TrendingUp, TrendingDown, Clock,
  User, DollarSign, BarChart3, RefreshCw, ArrowUpRight,
  ArrowDownRight, Minus, Target, Zap,
} from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

/* ─── tiny helpers ─── */
const fmt  = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`;

type Filter = 'all' | 'win' | 'loss' | 'pending';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',     label: 'All'     },
  { id: 'pending', label: 'Live'    },
  { id: 'win',     label: 'Wins'    },
  { id: 'loss',    label: 'Losses'  },
];

export default function AdminTradesPage() {
  const { loading } = useAuth();
  const [trades, setTrades]           = useState<any[]>([]);
  const [stats, setStats]             = useState<any>({});
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterResult, setFilterResult] = useState<Filter>('all');
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setDataLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/admin/trades');
      if (res.ok) {
        const data = await res.json();
        setTrades(data.trades ?? []);
        if (data.stats) setStats(data.stats);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  const filteredTrades = useMemo(() =>
    trades.filter(t => {
      const name  = t.userId?.name?.toLowerCase()  ?? '';
      const email = t.userId?.email?.toLowerCase() ?? '';
      const term  = searchTerm.toLowerCase();
      return (!term || name.includes(term) || email.includes(term))
        && (filterResult === 'all' || t.result === filterResult);
    }),
    [trades, searchTerm, filterResult]
  );

  const totalVolume    = stats.totalVolume    || 0;
  const totalTrades    = stats.totalTrades    || 0;
  const totalWins      = stats.totalWins      || 0;
  const totalLosses    = stats.totalLosses    || 0;
  const winPayouts     = stats.winPayouts     || 0;
  const lossCollected  = stats.lossCollected  || 0;
  const houseNet       = stats.houseNet       || 0;
  const winRate        = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : '0.0';

  const isProfit = houseNet >= 0;

  /* ━━━ Loading skeleton ━━━ */
  if (loading || dataLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GoldCoinLoader label="Loading trade surveillance…" />
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ maxWidth: 1200, width: '100%' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="var(--accent)" />
            </div>
            <h1 style={{ fontSize: 'clamp(1.5rem,3.5vw,2.2rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', margin: 0 }}>
              Trade Surveillance
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '3.25rem' }}>
            Live oversight of all platform trading activity and house P&amp;L.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 100, background: 'var(--border-subtle)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat cards grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }}>

        {/* Volume */}
        <StatPill icon={<DollarSign size={18} />} iconColor="var(--accent)" iconBg="rgba(245,158,11,0.1)" iconBorder="rgba(245,158,11,0.2)"
          label="Total Volume" value={`$${fmt(totalVolume)}`} />

        {/* Total trades */}
        <StatPill icon={<BarChart3 size={18} />} iconColor="var(--primary)" iconBg="rgba(52,211,153,0.08)" iconBorder="rgba(52,211,153,0.15)"
          label="Total Trades" value={String(totalTrades)} />

        {/* Win rate */}
        <StatPill icon={<Target size={18} />} iconColor="var(--primary)" iconBg="rgba(52,211,153,0.08)" iconBorder="rgba(52,211,153,0.15)"
          label="User Win Rate" value={`${winRate}%`}
          sub={<span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{totalWins}W / {totalLosses}L</span>} />

        {/* Paid out */}
        <StatPill icon={<TrendingDown size={18} />} iconColor="var(--danger)" iconBg="rgba(239,68,68,0.08)" iconBorder="rgba(239,68,68,0.15)"
          label="Paid Out (Wins)" value={`$${fmt(winPayouts)}`} valueColor="var(--danger)" />

        {/* Collected */}
        <StatPill icon={<TrendingUp size={18} />} iconColor="var(--success)" iconBg="rgba(52,211,153,0.08)" iconBorder="rgba(52,211,153,0.15)"
          label="Collected (Losses)" value={`$${fmt(lossCollected)}`} valueColor="var(--success)" />

        {/* House Net */}
        <StatPill
          icon={<Zap size={18} />}
          iconColor={isProfit ? 'var(--success)' : 'var(--danger)'}
          iconBg={isProfit ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)'}
          iconBorder={isProfit ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}
          label="House Net P&L"
          value={`${isProfit ? '+' : '-'}$${fmt(Math.abs(houseNet))}`}
          valueColor={isProfit ? 'var(--success)' : 'var(--danger)'}
          highlight={isProfit}
        />
      </div>

      {/* ── Filter + Search bar ── */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>

        {/* Filter pills */}
        <div style={{ display: 'flex', background: 'var(--border-subtle)', padding: '3px', borderRadius: 10, border: '1px solid var(--border)', gap: 2 }}>
          {FILTERS.map(f => {
            const active = filterResult === f.id;
            const count  = f.id === 'all' ? trades.length : trades.filter(t => t.result === f.id).length;
            return (
              <button key={f.id} onClick={() => setFilterResult(f.id)}
                style={{
                  padding: '0.38rem 0.85rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: active ? 'var(--primary)' : 'transparent',
                  color: active ? 'var(--primary-text)' : 'var(--text-muted)',
                  boxShadow: active ? '0 2px 8px rgba(52,211,153,0.2)' : 'none',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                }}>
                {f.label}
                <span style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  background: active ? 'rgba(0,0,0,0.2)' : 'var(--border)',
                  color: active ? 'var(--primary-text)' : 'var(--text-muted)',
                  borderRadius: 100, padding: '0 0.4rem', lineHeight: 1.7,
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', paddingLeft: '2.2rem', paddingRight: '1rem',
              padding: '0.6rem 1rem 0.6rem 2.2rem',
              background: 'var(--border-subtle)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text)', fontSize: '0.85rem', fontWeight: 500,
              outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 500 }}>
          {filteredTrades.length} record{filteredTrades.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Trade rows ── */}
      {filteredTrades.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: 16, color: 'var(--text-muted)' }}>
          <Activity size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>No trades found</p>
          <p style={{ fontSize: '0.85rem' }}>Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filteredTrades.slice(0, 100).map((t: any, i: number) => {
            const isWin     = t.result === 'win';
            const isLoss    = t.result === 'loss';
            const isPending = !isWin && !isLoss;
            const accentColor = isWin ? 'var(--success)' : isLoss ? 'var(--danger)' : 'var(--text-muted)';
            const pnl = isWin ? `+$${Math.abs(t.profitOrLoss).toFixed(2)}` : isLoss ? `-$${Math.abs(t.profitOrLoss).toFixed(2)}` : null;

            return (
              <div key={t._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'var(--glass-blur)',
                  WebkitBackdropFilter: 'var(--glass-blur)',
                  border: 'var(--glass-border)',
                  borderRadius: 14,
                  borderLeft: `3px solid ${accentColor}`,
                  transition: 'background 0.2s',
                }}
              >
                {/* User */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--border-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={15} color="var(--text-muted)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.userId?.name ?? '—'}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.userId?.email}</p>
                  </div>
                </div>

                {/* Direction + Stake */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    {t.direction === 'up'
                      ? <ArrowUpRight size={15} color="var(--success)" />
                      : <ArrowDownRight size={15} color="var(--danger)" />}
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: t.direction === 'up' ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase' }}>{t.direction}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>${t.amount?.toLocaleString()}</p>
                </div>

                {/* Entry / Exit */}
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Entry → Exit</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    ${t.entryPrice?.toFixed(2)} →{' '}
                    {t.exitPrice ? <span style={{ color: accentColor }}>${t.exitPrice.toFixed(2)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </p>
                </div>

                {/* Time */}
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Time</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={11} color="var(--text-muted)" />
                    {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                      {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </p>
                </div>

                {/* Result */}
                <div style={{ textAlign: 'right' }}>
                  {isPending ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--border-subtle)', border: '1px solid var(--border)', borderRadius: 100, padding: '0.25rem 0.7rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 2s infinite' }} />
                      LIVE
                    </span>
                  ) : (
                    <>
                      <p style={{ fontSize: '1rem', fontWeight: 900, color: accentColor, letterSpacing: '-0.02em', lineHeight: 1 }}>
                        {pnl}
                      </p>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', fontWeight: 800, color: accentColor, background: `${accentColor}12`, border: `1px solid ${accentColor}30`, borderRadius: 100, padding: '0.15rem 0.55rem', marginTop: '0.3rem', textTransform: 'uppercase' }}>
                        {isWin ? '✓' : '✕'} {t.result}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredTrades.length > 100 && (
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing 100 of {filteredTrades.length} records.
        </p>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg);}} @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}`}</style>
    </div>
  );
}

/* ── Stat pill card ── */
function StatPill({ icon, iconColor, iconBg, iconBorder, label, value, valueColor, sub, highlight }: {
  icon: React.ReactNode;
  iconColor: string; iconBg: string; iconBorder: string;
  label: string; value: string;
  valueColor?: string; sub?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div style={{
      position: 'relative',
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      border: highlight ? `1px solid ${iconBorder}` : 'var(--glass-border)',
      borderRadius: 16,
      padding: '1.1rem 1.25rem',
      overflow: 'hidden',
      transition: 'all 0.3s',
      boxShadow: 'var(--glass-shadow)',
    }}>
      {/* accent top line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${iconColor},transparent)`, opacity: 0.5 }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
          {icon}
        </div>
      </div>

      <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{label}</p>
      <p style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', color: valueColor ?? 'var(--text)', lineHeight: 1.1 }}>{value}</p>
      {sub && <div style={{ marginTop: '0.35rem' }}>{sub}</div>}
    </div>
  );
}
