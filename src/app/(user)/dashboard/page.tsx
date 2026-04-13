'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  TrendingUp, Wallet, Activity, ArrowUpRight, ArrowDownLeft,
  Clock, AlertCircle, XCircle, TrendingDown
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import ProfitChart from '@/components/ProfitChart';
import LivePriceTicker from '@/components/LivePriceTicker';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalProfit: 0, winRate: 0, activeTrades: 0 });

  const fetchData = async () => {
    try {
      const [tradeRes, transRes] = await Promise.all([
        fetch('/api/trades'),
        fetch('/api/transactions'),
      ]);
      if (tradeRes.ok) {
        const data = await tradeRes.json();
        setTrades(data.trades);
        const wins = data.trades.filter((t: any) => t.result === 'win').length;
        const totalProfit = data.trades.reduce((sum: number, t: any) => sum + t.profitOrLoss, 0);
        setStats({
          totalProfit,
          winRate: data.trades.length > 0 ? (wins / data.trades.length) * 100 : 0,
          activeTrades: data.trades.filter((t: any) => t.result === 'pending').length,
        });
      }
      if (transRes.ok) {
        const transData = await transRes.json();
        setTransactions(transData.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, [user]);

  if (loading || !user) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="skeleton" style={{ width: '200px', height: '32px', margin: '0 auto 1rem' }} />
        <div className="skeleton" style={{ width: '300px', height: '16px', margin: '0 auto' }} />
      </div>
    );
  }

  const sortedTrades = [...trades].reverse();
  let runningPL = 0;
  const chartData: { time: string; balance: number }[] = [{ time: 'Start', balance: 0 }];
  sortedTrades.forEach((t) => {
    runningPL = Number((runningPL + t.profitOrLoss).toFixed(2));
    chartData.push({
      time: new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      balance: runningPL,
    });
  });

  const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending');
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending');
  const recentRejections = transactions.filter(t => t.status === 'rejected').slice(0, 3);

  return (
    <div className="animate-in" style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.2rem)', marginBottom: '0.3rem', color: '#fff' }}>
            Welcome back, <span className="text-gradient-gold">{user.name}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Here&apos;s an overview of your trading activity.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/deposit" className="btn btn-gold" style={{ padding: '0.7rem 1.3rem', fontSize: '0.88rem' }}>
            <ArrowUpRight size={16} /> Deposit
          </Link>
          <Link href="/withdraw" className="btn btn-outline" style={{ padding: '0.7rem 1.3rem', fontSize: '0.88rem' }}>
            <ArrowDownLeft size={16} /> Withdraw
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0 || recentRejections.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {pendingDeposits.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <AlertCircle size={16} color="var(--gold)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.82rem', color: '#E2E8F0', flex: 1 }}>
                <strong style={{ color: 'var(--gold)' }}>{pendingDeposits.length} deposit{pendingDeposits.length > 1 ? 's' : ''}</strong> pending verification.
              </p>
              <Link href="/history" style={{ fontSize: '0.75rem', color: 'var(--gold)', flexShrink: 0 }}>View →</Link>
            </div>
          )}
          {pendingWithdrawals.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255,179,71,0.04)', border: '1px solid rgba(255,179,71,0.1)' }}>
              <Clock size={16} color="var(--warning)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.82rem', color: '#E2E8F0', flex: 1 }}>
                <strong style={{ color: 'var(--warning)' }}>{pendingWithdrawals.length} withdrawal{pendingWithdrawals.length > 1 ? 's' : ''}</strong> under review.
              </p>
              <Link href="/history" style={{ fontSize: '0.75rem', color: 'var(--warning)', flexShrink: 0 }}>View →</Link>
            </div>
          )}
          {recentRejections.map((t: any) => (
            <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255,71,87,0.04)', border: '1px solid rgba(255,71,87,0.1)' }}>
              <XCircle size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.82rem', color: '#E2E8F0' }}>
                <strong style={{ color: 'var(--danger)' }}>{t.type}</strong> of <strong style={{ color: '#fff' }}>${t.amount.toFixed(2)}</strong> was rejected.
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginTop: 0 }}>
        <StatCard title="Current Balance" value={`$${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Wallet} />
        <StatCard title="Total Profit / Loss" value={`${stats.totalProfit >= 0 ? '+' : ''}$${stats.totalProfit.toFixed(2)}`} icon={TrendingUp} trend={{ value: stats.totalProfit >= 0 ? 'Profitable' : 'In Loss', isPositive: stats.totalProfit >= 0 }} />
        <StatCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Activity} trend={{ value: `${trades.filter((t: any) => t.result === 'win').length}W / ${trades.filter((t: any) => t.result === 'loss').length}L`, isPositive: stats.winRate >= 50 }} />

        {/* Live Gold Price Card */}
        <div style={{
          background: 'rgba(8, 14, 26, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212,175,55,0.1)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
          <LivePriceTicker />
        </div>
      </div>

      {/* Chart + Recent Trades */}
      <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div>
          <ProfitChart />
        </div>
        <div style={{
          background: 'rgba(8, 14, 26, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212,175,55,0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          marginTop: '1.5rem',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)' }} />
          <h3 style={{ marginBottom: '1rem', color: '#fff', fontSize: '1rem' }}>Recent Trades</h3>
          {trades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
              <Clock size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.88rem' }}>No trades yet.</p>
              <Link href="/trade" style={{ color: 'var(--gold)', display: 'block', marginTop: '0.75rem', fontWeight: 600, fontSize: '0.85rem' }}>Start Trading →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {trades.slice(0, 6).map((trade: any) => (
                <div key={trade._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.65rem 0.75rem',
                  background: 'rgba(212,175,55,0.02)',
                  borderRadius: '10px',
                  border: `1px solid ${trade.result === 'win' ? 'rgba(0,230,138,0.08)' : 'rgba(255,71,87,0.08)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {trade.direction === 'up' ? <TrendingUp size={14} color="var(--success)" /> : <TrendingDown size={14} color="var(--danger)" />}
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Gold {trade.direction === 'up' ? 'UP' : 'DOWN'}</p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>${trade.amount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: trade.result === 'win' ? 'var(--success)' : 'var(--danger)' }}>
                      {trade.profitOrLoss >= 0 ? '+' : ''}${trade.profitOrLoss.toFixed(2)}
                    </p>
                    <span className={`badge ${trade.result === 'win' ? 'badge-approved' : 'badge-rejected'}`} style={{ fontSize: '0.58rem', padding: '0.1rem 0.5rem' }}>{trade.result}</span>
                  </div>
                </div>
              ))}
              <Link href="/history" style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--gold)', marginTop: '0.25rem', display: 'block' }}>View full history →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
