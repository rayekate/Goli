'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  ArrowLeftRight, 
  Activity, 
  DollarSign, 
  TrendingUp,
  BarChart3,
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import GoldCoinLoader from '@/components/GoldCoinLoader';
import Link from 'next/link';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentPending, setRecentPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [transRes, usersRes, tradesRes] = await Promise.all([
        fetch('/api/admin/transactions'),
        fetch('/api/admin/users'),
        fetch('/api/admin/trades'),
      ]);

      if (transRes.ok && usersRes.ok && tradesRes.ok) {
        const transData = await transRes.json();
        const usersData = await usersRes.json();
        const tradesData = await tradesRes.json();
        
        const users = usersData.users;
        const trades = tradesData.trades;
        const txns = transData.transactions;

        const totalBalance = users.reduce((s: number, u: any) => s + u.balance, 0);
        const pendingDeposits = txns.filter((t: any) => t.status === 'pending' && t.type === 'deposit');
        const pendingWithdrawals = txns.filter((t: any) => t.status === 'pending' && t.type === 'withdrawal');
        const approvedDeposits = txns.filter((t: any) => t.status === 'approved' && t.type === 'deposit');
        const approvedWithdrawals = txns.filter((t: any) => t.status === 'approved' && t.type === 'withdrawal');
        const totalDeposited = approvedDeposits.reduce((s: number, t: any) => s + t.amount, 0);
        const totalWithdrawn = approvedWithdrawals.reduce((s: number, t: any) => s + t.amount, 0);
        const wins = trades.filter((t: any) => t.result === 'win');
        const losses = trades.filter((t: any) => t.result === 'loss');
        const winPayouts = wins.reduce((s: number, t: any) => s + Math.abs(t.profitOrLoss), 0);
        const lossCollected = losses.reduce((s: number, t: any) => s + Math.abs(t.profitOrLoss), 0);
        const houseNet = lossCollected - winPayouts;

        setStats({
          totalUsers: users.length,
          activeUsers: users.filter((u: any) => !u.isBlocked).length,
          blockedUsers: users.filter((u: any) => u.isBlocked).length,
          totalBalance,
          pendingDeposits: pendingDeposits.length,
          pendingWithdrawals: pendingWithdrawals.length,
          pendingDepositAmount: pendingDeposits.reduce((s: number, t: any) => s + t.amount, 0),
          pendingWithdrawalAmount: pendingWithdrawals.reduce((s: number, t: any) => s + t.amount, 0),
          totalDeposited,
          totalWithdrawn,
          totalTrades: trades.length,
          winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
          winPayouts,
          lossCollected,
          houseNet,
        });
        setRecentPending(txns.filter((t: any) => t.status === 'pending').slice(0, 5));
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !stats) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GoldCoinLoader label="Loading platform data…" />
    </div>
  );

  return (
    <div className="container animate-in stagger-1" style={{ padding: '20px 15px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)', marginBottom: '0.5rem', flexWrap: 'wrap' }} className="text-gradient-gold">
          <BarChart3 size={32} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 10px var(--gold-glow))' }} /> Command Center
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Full platform overview — users, finances, trades, and house profitability.</p>
      </div>

      {/* Alert */}
      {(stats.pendingDeposits + stats.pendingWithdrawals) > 0 && (
        <div className="glass-card" style={{ background: 'var(--surface)', border: '1px solid var(--border-highlight)', borderLeft: '4px solid var(--accent)', borderRadius: '24px', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertCircle size={24} color="var(--accent)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1rem', marginBottom: '0.2rem' }}>ACTION REQUIRED</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {stats.pendingDeposits > 0 && `${stats.pendingDeposits} deposit(s) ($${stats.pendingDepositAmount.toLocaleString()}) `}
              {stats.pendingDeposits > 0 && stats.pendingWithdrawals > 0 && '· '}
              {stats.pendingWithdrawals > 0 && `${stats.pendingWithdrawals} withdrawal(s) ($${stats.pendingWithdrawalAmount.toLocaleString()}) `}
              awaiting review.
            </p>
          </div>
          <Link href="/admin/transactions" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.82rem', flexShrink: 0, borderRadius: '100px', fontWeight: 900 }}>
            Review Queue
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="dashboard-grid" style={{ marginBottom: '0.5rem' }}>
        <StatCard title="Users" value={`${stats.activeUsers} / ${stats.totalUsers}`} icon={Users} trend={{ value: `${stats.blockedUsers} blocked`, isPositive: stats.blockedUsers === 0 }} />
        <StatCard title="Platform Balance" value={`$${stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={Wallet} />
        <StatCard title="House Net P&L" value={`${stats.houseNet >= 0 ? '+' : '-'}$${Math.abs(stats.houseNet).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={DollarSign} trend={{ value: stats.houseNet >= 0 ? 'Profitable' : 'In deficit', isPositive: stats.houseNet >= 0 }} />
        <StatCard title="Total Deposited" value={`$${stats.totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={ArrowDownCircle} trend={{ value: `${stats.pendingDeposits} pending`, isPositive: stats.pendingDeposits === 0 }} />
        <StatCard title="Total Withdrawn" value={`$${stats.totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={ArrowUpCircle} trend={{ value: `${stats.pendingWithdrawals} pending`, isPositive: stats.pendingWithdrawals === 0 }} />
        <StatCard title="Net Flow" value={`$${(stats.totalDeposited - stats.totalWithdrawn).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={ArrowLeftRight} />
      </div>

      {/* Quick Links */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <Link href="/admin/users" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '100px', fontWeight: 800 }}>
          <Users size={18} /> Manage Users
        </Link>
        <Link href="/admin/transactions" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '100px', fontWeight: 800 }}>
          <ArrowLeftRight size={18} /> Transactions
        </Link>
        <Link href="/admin/trades" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '100px', fontWeight: 800 }}>
          <Activity size={18} /> Trade Surveillance
        </Link>
      </div>

      {/* Recent Pending */}
      {recentPending.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="text-gradient-gold">
              <AlertCircle size={20} color="var(--accent)" /> Recent Pending Requests
            </h3>
            <Link href="/admin/transactions" style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600 }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentPending.map((t: any, i: number) => (
              <div key={t._id} className={`glass-card stagger-${Math.min((i % 4) + 1, 4)}`} style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: `4px solid ${t.type === 'deposit' ? 'var(--success)' : 'var(--warning)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0, flex: '1 1 auto' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                    {t.type === 'deposit' ? <ArrowDownCircle size={24} color="var(--success)" style={{ filter: 'drop-shadow(0 0 5px var(--success-glow))' }} /> : <ArrowUpCircle size={24} color="var(--warning)" style={{ filter: 'drop-shadow(0 0 5px rgba(255,204,0,0.3))' }} />}
                  </div>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', display: 'block', marginBottom: '0.2rem' }}>
                      {t.userId?.name}
                    </span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {t.userId?.email}
                    </p>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 900, fontSize: '1.2rem', color: t.type === 'deposit' ? 'var(--success)' : 'var(--text)', textShadow: t.type === 'deposit' ? '0 0 10px var(--success-glow)' : 'none' }}>
                    ${t.amount.toLocaleString()}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`badge ${t.type === 'deposit' ? 'badge-approved' : 'badge-primary'}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.6rem', textTransform: 'uppercase' }}>
                      {t.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
