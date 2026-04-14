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
    <div className="animate-in" style={{ padding: '0', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ 
        marginBottom: '3rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        flexWrap: 'wrap', 
        gap: '2rem',
        position: 'relative'
      }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="badge" style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>INSTITUTIONAL TERMINAL</div>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--success)', letterSpacing: '0.2em' }}>SYSTEM LIVE</span>
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', 
            marginBottom: '0.5rem', 
            fontWeight: 950,
            letterSpacing: '-0.04em',
            lineHeight: 0.9,
            color: 'var(--text)' 
          }}>
            Welcome, <span className="text-gold" style={{ filter: 'drop-shadow(0 0 10px var(--border))' }}>{user.name}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', opacity: 0.8 }}>
            Accessing encrypted markets. Your terminal is synchronized with global bullion reserves.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', flexWrap: 'wrap' }}>
          <Link href="/deposit" className="btn btn-gold" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 900, fontSize: '0.9rem' }}>
            <ArrowUpRight size={18} /> Initialize Deposit
          </Link>
          <Link href="/withdraw" className="btn btn-outline" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 900, fontSize: '0.9rem' }}>
            <ArrowDownLeft size={18} /> Asset Withdrawal
          </Link>
          <Link href="/trade" className="btn btn-primary" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 900, fontSize: '0.9rem' }}>
            <TrendingUp size={18} /> Open Trading Terminal
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0 || recentRejections.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {pendingDeposits.length > 0 && (
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderLeft: '4px solid var(--accent)', borderRadius: '12px' }}>
              <AlertCircle size={20} color="var(--accent)" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700 }}>Deposit Pending</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pendingDeposits.length} transaction awaiting terminal verification.</p>
              </div>
              <Link href="/history" className="btn-outline" style={{ padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.75rem' }}>Track Status</Link>
            </div>
          )}
          {pendingWithdrawals.length > 0 && (
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderLeft: '4px solid var(--accent)', borderRadius: '12px' }}>
              <Clock size={20} color="var(--accent)" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700 }}>Withdrawal Processing</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Security review in progress for {pendingWithdrawals.length} assets.</p>
              </div>
              <Link href="/history" className="btn-outline" style={{ padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.75rem' }}>View Detail</Link>
            </div>
          )}
        </div>
      )}

      {/* Stats Section */}
      <div className="dashboard-grid" style={{ marginTop: 0, gap: '1.5rem' }}>
        <StatCard title="Liquidity Balance" value={`$${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Wallet} />
        <StatCard title="Session Performance" value={`$${Math.abs(stats.totalProfit).toFixed(2)}`} icon={TrendingUp} trend={{ value: stats.totalProfit >= 0 ? 'Profit' : 'Loss', isPositive: stats.totalProfit >= 0 }} />
        <StatCard title="Success Frequency" value={`${stats.winRate.toFixed(1)}%`} icon={Activity} trend={{ value: `${trades.filter((t: any) => t.result === 'win').length} Wins`, isPositive: stats.winRate >= 50 }} />

        {/* Tactical Live Price Feed */}
        <div className="glass-card" style={{
          padding: '1.25rem 1.5rem',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '120px'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />
          <LivePriceTicker />
        </div>
      </div>

      {/* Analytical Terminal */}
      <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
        <div style={{ minWidth: 0 }}>
          <ProfitChart />
        </div>
        <div className="glass-card" style={{
          padding: 'clamp(1rem, 4vw, 2rem)',
          borderRadius: '24px',
          minWidth: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.02em' }}>MISSION ACTIVITY</h3>
            <div className="badge" style={{ padding: '0.25rem 0.6rem', background: 'var(--surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>RECENT</div>
          </div>
          
          {trades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>No tactical data found.</p>
              <Link href="/trade" style={{ color: 'var(--accent)', display: 'block', marginTop: '1rem', fontWeight: 800, fontSize: '0.85rem' }}>INITIALIZE TRADE →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {trades.slice(0, 6).map((trade: any) => (
                <div key={trade._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem',
                  gap: '0.5rem',
                  background: 'var(--surface)',
                  borderRadius: '16px',
                  border: `1px solid ${trade.result === 'win' ? 'var(--success)' : 'var(--danger)'}`,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      padding: '0.5rem', 
                      borderRadius: '10px', 
                      background: trade.result === 'win' ? 'rgba(0,230,138,0.05)' : 'rgba(255,71,87,0.05)'
                    }}>
                      {trade.direction === 'up' ? <TrendingUp size={16} color="var(--success)" /> : <TrendingDown size={16} color="var(--danger)" />}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>BU-GOLD {trade.direction.toUpperCase()}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>VALUE: ${trade.amount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 900, color: trade.result === 'win' ? 'var(--success)' : 'var(--danger)', letterSpacing: '-0.02em' }}>
                      {trade.profitOrLoss >= 0 ? '+' : ''}${trade.profitOrLoss.toFixed(2)}
                    </p>
                    <div style={{ 
                      fontSize: '0.6rem', 
                      fontWeight: 900, 
                      color: trade.result === 'win' ? 'var(--success)' : 'var(--danger)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      opacity: 0.8
                    }}>{trade.result}</div>
                  </div>
                </div>
              ))}
              <Link href="/history" style={{ 
                textAlign: 'center', 
                fontSize: '0.8rem', 
                color: 'var(--accent)', 
                marginTop: '1rem', 
                fontWeight: 900,
                letterSpacing: '0.1em' 
              }}>ACCESS ARCHIVE ACCESS →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
