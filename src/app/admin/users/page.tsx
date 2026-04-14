'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, Search, X, DollarSign, Plus, Minus, ArrowDownCircle, ArrowUpCircle, Shield, ShieldOff, ChevronDown, ChevronUp, UserCircle } from 'lucide-react';

type BalanceModal = { userId: string; name: string; balance: number } | null;
type ManualTxModal = { userId: string; name: string; balance: number; type: 'deposit' | 'withdrawal' } | null;

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [balanceModal, setBalanceModal] = useState<BalanceModal>(null);
  const [manualTxModal, setManualTxModal] = useState<ManualTxModal>(null);
  const [balanceInput, setBalanceInput] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');
  const [adjustMode, setAdjustMode] = useState<'set' | 'add' | 'subtract'>('set');
  const [saving, setSaving] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
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

  const openBalanceModal = (u: any) => {
    setBalanceModal({ userId: u._id, name: u.name, balance: u.balance });
    setBalanceInput('');
    setAdjustMode('set');
  };

  const openManualTx = (u: any, type: 'deposit' | 'withdrawal') => {
    setManualTxModal({ userId: u._id, name: u.name, balance: u.balance, type });
    setTxAmount('');
    setTxNote('');
  };

  const computeNewBalance = (): number => {
    const val = Number(balanceInput);
    if (isNaN(val) || val < 0) return balanceModal?.balance ?? 0;
    if (adjustMode === 'set') return val;
    if (adjustMode === 'add') return (balanceModal?.balance ?? 0) + val;
    if (adjustMode === 'subtract') return Math.max(0, (balanceModal?.balance ?? 0) - val);
    return val;
  };

  const submitBalanceUpdate = async () => {
    if (!balanceModal || balanceInput === '') return;
    const newBal = computeNewBalance();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: balanceModal.userId, balance: newBal }),
      });
      if (res.ok) { setBalanceModal(null); fetchData(); }
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const submitManualTx = async () => {
    if (!manualTxModal || !txAmount || Number(txAmount) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: manualTxModal.userId,
          type: manualTxModal.type,
          amount: Number(txAmount),
          note: txNote || undefined,
        }),
      });
      if (res.ok) { setManualTxModal(null); fetchData(); }
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const updateField = async (userId: string, field: string, value: any) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, [field]: value }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  if (loading || dataLoading) return (
    <div className="admin-users-page" style={{ padding: 'clamp(12px, 3vw, 20px)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1,2,3].map(i => (
          <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
        ))}
      </div>
    </div>
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const previewBalance = balanceModal && balanceInput !== '' ? computeNewBalance() : null;

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  };

  const modalCard: React.CSSProperties = {
    width: '100%', maxWidth: '440px', padding: 'clamp(1.25rem, 4vw, 2rem)', border: '1px solid rgba(212,175,55,0.4)',
  };

  return (
    <div className="admin-users-page" style={{ padding: 'clamp(12px, 3vw, 20px)', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .admin-users-page .user-card-grid {
          display: grid;
          grid-template-columns: minmax(180px, 1.5fr) 100px 130px 110px auto;
          align-items: center;
          padding: 1.25rem 1.5rem;
          gap: 1rem;
        }
        .admin-users-page .user-card-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          align-items: center;
          flex-wrap: wrap;
        }
        .admin-users-page .user-card-actions .action-divider {
          width: 1px;
          height: 24px;
          background: var(--border);
          margin: 0 0.15rem;
        }
        .admin-users-page .stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
        }
        .admin-users-page .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .admin-users-page .header-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .admin-users-page .search-box {
          position: relative;
          width: 280px;
        }
        .admin-users-page .mobile-user-header {
          display: none;
        }
        .admin-users-page .desktop-user-grid {
          display: block;
        }
        .admin-users-page .action-btn {
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          min-width: 34px;
          min-height: 34px;
        }
        .admin-users-page .action-btn:hover {
          transform: translateY(-1px);
        }
        .admin-users-page .select-field {
          padding: 0.4rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          outline: none;
          cursor: pointer;
          width: 100%;
        }
        .admin-users-page .user-count-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.85rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(212,175,55,0.08);
          color: #d4af37;
          border: 1px solid rgba(212,175,55,0.2);
        }

        /* ─── Tablet ─── */
        @media (max-width: 1100px) {
          .admin-users-page .user-card-grid {
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            padding: 1.25rem;
          }
          .admin-users-page .user-card-actions {
            grid-column: 1 / -1;
            justify-content: flex-start;
            padding-top: 0.75rem;
            border-top: 1px solid var(--border-subtle);
          }
        }

        /* ─── Mobile ─── */
        @media (max-width: 640px) {
          .admin-users-page .header-row {
            flex-direction: column;
            align-items: stretch;
          }
          .admin-users-page .header-controls {
            flex-direction: column;
            align-items: stretch;
          }
          .admin-users-page .search-box {
            width: 100%;
          }
          .admin-users-page .user-card-grid {
            display: none;
          }
          .admin-users-page .mobile-user-header {
            display: block;
          }
          .admin-users-page .desktop-user-grid {
            display: none;
          }
          .admin-users-page .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .admin-users-page .stats-grid > :last-child:nth-child(odd) {
            grid-column: 1 / -1;
          }
        }
      `}</style>

      {/* Balance Adjustment Modal */}
      {balanceModal && (
        <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setBalanceModal(null); }}>
          <div className="card animate-in" style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#d4af37', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}>
                <DollarSign size={20} /> Adjust Balance
              </h3>
              <button onClick={() => setBalanceModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ background: 'rgba(212,175,55,0.06)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid rgba(212,175,55,0.15)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>User</p>
              <p style={{ fontWeight: 700, color: '#fff' }}>{balanceModal.name}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Current: <strong style={{ color: '#d4af37' }}>${balanceModal.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {([
                { mode: 'set' as const, label: 'Set to', icon: <DollarSign size={14} /> },
                { mode: 'add' as const, label: 'Add', icon: <Plus size={14} /> },
                { mode: 'subtract' as const, label: 'Subtract', icon: <Minus size={14} /> },
              ]).map(({ mode, label, icon }) => (
                <button key={mode} onClick={() => setAdjustMode(mode)} style={{
                  flex: 1, padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                  background: adjustMode === mode ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${adjustMode === mode ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: adjustMode === mode ? '#d4af37' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}>{icon} {label}</button>
              ))}
            </div>

            <div className="input-group">
              <label>Amount (USD)</label>
              <input type="number" min="0" step="0.01" placeholder={adjustMode === 'set' ? 'New balance…' : 'Amount…'} value={balanceInput} onChange={(e) => setBalanceInput(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && submitBalanceUpdate()} />
            </div>

            {previewBalance !== null && (
              <div style={{ background: 'rgba(0,255,102,0.06)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(0,255,102,0.2)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>New balance</p>
                <p style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 800, color: '#00ff66', fontFamily: 'monospace' }}>
                  ${previewBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setBalanceModal(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #d4af37, #f5e06e)', color: '#000' }} onClick={submitBalanceUpdate} disabled={saving || balanceInput === ''}>{saving ? 'Saving…' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Deposit/Withdrawal Modal */}
      {manualTxModal && (
        <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setManualTxModal(null); }}>
          <div className="card animate-in" style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: manualTxModal.type === 'deposit' ? '#00ff66' : '#ff0055', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}>
                {manualTxModal.type === 'deposit' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                Manual {manualTxModal.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
              </h3>
              <button onClick={() => setManualTxModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ background: 'rgba(212,175,55,0.06)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid rgba(212,175,55,0.15)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>User</p>
              <p style={{ fontWeight: 700, color: '#fff' }}>{manualTxModal.name}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Balance: <strong style={{ color: '#d4af37' }}>${manualTxModal.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </p>
            </div>

            <div className="input-group">
              <label>Amount (USD)</label>
              <input type="number" min="0" step="0.01" placeholder="Enter amount…" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && submitManualTx()} />
            </div>

            <div className="input-group">
              <label>Note (optional)</label>
              <input type="text" placeholder="Reason for this transaction…" value={txNote} onChange={(e) => setTxNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitManualTx()} />
            </div>

            {txAmount && Number(txAmount) > 0 && (
              <div style={{
                background: manualTxModal.type === 'deposit' ? 'rgba(0,255,102,0.06)' : 'rgba(255,0,85,0.06)',
                padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem',
                border: `1px solid ${manualTxModal.type === 'deposit' ? 'rgba(0,255,102,0.2)' : 'rgba(255,0,85,0.2)'}`,
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>New balance after {manualTxModal.type}</p>
                <p style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 800, color: manualTxModal.type === 'deposit' ? '#00ff66' : '#ff0055', fontFamily: 'monospace' }}>
                  ${(manualTxModal.type === 'deposit'
                    ? manualTxModal.balance + Number(txAmount)
                    : Math.max(0, manualTxModal.balance - Number(txAmount))
                  ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setManualTxModal(null)}>Cancel</button>
              <button className="btn" style={{
                flex: 1, color: '#fff', border: 'none',
                background: manualTxModal.type === 'deposit' ? '#00ff66' : '#ff0055',
              }} onClick={submitManualTx} disabled={saving || !txAmount || Number(txAmount) <= 0}>
                {saving ? 'Processing…' : `Confirm ${manualTxModal.type === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="header-row" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }} className="text-gradient-gold">
            <Users size={28} color="var(--gold)" style={{ filter: 'drop-shadow(0 0 10px var(--gold-glow))', flexShrink: 0 }} /> User Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.82rem, 2vw, 0.95rem)' }}>Balance, deposits, withdrawals, roles, trading control — complete platform authority.</p>
        </div>
        <div className="header-controls">
          <span className="user-count-badge">
            <Users size={14} /> {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </span>
          <div className="search-box">
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
            <input type="text" placeholder="Search by name or email..." className="input" style={{ paddingLeft: '2.5rem', fontSize: '0.85rem', width: '100%', background: 'rgba(255,255,255,0.05)' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* User Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredUsers.map((u: any, i: number) => {
          const isExpanded = expandedUser === u._id;
          const stats = u.stats || {};

          const statusBadge = (
            <span style={{
              display: 'inline-block',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              background: u.isBlocked ? 'rgba(255, 0, 85, 0.1)' : 'rgba(0, 255, 102, 0.1)',
              color: u.isBlocked ? '#ff0055' : '#00ff66',
              border: `1px solid ${u.isBlocked ? 'rgba(255, 0, 85, 0.3)' : 'rgba(0, 255, 102, 0.3)'}`
            }}>
              {u.isBlocked ? 'Blocked' : 'Active'}
            </span>
          );

          const adminBadge = u.role === 'admin' && (
            <span className="badge" style={{ fontSize: '0.55rem', padding: '0.15rem 0.45rem', background: 'rgba(212,175,55,0.1)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)', lineHeight: 1.3 }}>ADMIN</span>
          );
          
          const twofaBadge = u.twoFactorEnabled && (
            <span style={{
              display: 'inline-block',
              padding: '0.25rem 0.45rem',
              borderRadius: '20px',
              fontSize: '0.6rem',
              fontWeight: 700,
              background: 'rgba(212,175,55,0.1)',
              color: '#d4af37',
              border: '1px solid rgba(212,175,55,0.3)'
            }}>2FA</span>
          );

          const actionButtons = (
            <div className="user-card-actions">
              <button onClick={() => openBalanceModal(u)} className="action-btn btn btn-outline" style={{ border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }} title="Adjust Balance">
                <DollarSign size={15} />
              </button>
              <button onClick={() => openManualTx(u, 'deposit')} className="action-btn btn btn-outline" style={{ border: '1px solid rgba(0,255,102,0.3)', color: '#00ff66' }} title="Manual Deposit">
                <ArrowDownCircle size={15} />
              </button>
              <button onClick={() => openManualTx(u, 'withdrawal')} className="action-btn btn btn-outline" style={{ border: '1px solid rgba(255,0,85,0.3)', color: '#ff0055' }} title="Manual Withdrawal">
                <ArrowUpCircle size={15} />
              </button>
              <span className="action-divider" />
              <button onClick={() => updateField(u._id, 'isBlocked', !u.isBlocked)} className="action-btn btn btn-outline" style={{ border: 'none', background: u.isBlocked ? 'rgba(255,0,85,0.15)' : 'rgba(255,255,255,0.05)', color: u.isBlocked ? '#ff0055' : 'var(--text-muted)' }} title={u.isBlocked ? 'Unblock User' : 'Block User'}>
                {u.isBlocked ? <ShieldOff size={15} /> : <Shield size={15} />}
              </button>
              <button onClick={() => updateField(u._id, 'twoFactorEnabled', !u.twoFactorEnabled)} className="action-btn btn btn-outline" style={{ border: 'none', background: u.twoFactorEnabled ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', color: u.twoFactorEnabled ? '#d4af37' : 'var(--text-muted)' }} title={u.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}>
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>2FA</span>
              </button>
              <button onClick={() => setExpandedUser(isExpanded ? null : u._id)} className="action-btn btn btn-outline" style={{ border: '1px solid var(--border)' }} title="View Statistics">
                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>
          );

          const expandedStats = isExpanded && (
            <div style={{ padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
              <div className="stats-grid">
                <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 700, color: '#00f0ff' }}>{stats.totalTrades}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Trades</p>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 700, color: '#00ff66' }}>{stats.wins} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>W</span> / <span style={{ color: '#ff0055' }}>{stats.losses}</span> <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>L</span></p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Win / Loss</p>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 700, color: (stats.totalProfitLoss || 0) >= 0 ? '#00ff66' : '#ff0055' }}>
                    ${Math.abs(stats.totalProfitLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Net P&L</p>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 700, color: '#00ff66' }}>${(stats.totalDeposited || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Deposited</p>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 700, color: '#ff0055' }}>${(stats.totalWithdrawn || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Withdrawn</p>
                </div>
              </div>
              {(stats.pendingDeposits > 0 || stats.pendingWithdrawals > 0) && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', background: 'rgba(0,240,255,0.06)', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.15)', fontSize: '0.75rem', color: '#00f0ff' }}>
                  Pending: {stats.pendingDeposits > 0 && `${stats.pendingDeposits} deposit(s)`}{stats.pendingDeposits > 0 && stats.pendingWithdrawals > 0 && ' · '}{stats.pendingWithdrawals > 0 && `${stats.pendingWithdrawals} withdrawal(s)`}
                </div>
              )}
            </div>
          );

          return (
            <div key={u._id} className={`glass-card animate-in stagger-${Math.min((i % 5) + 1, 5)}`} style={{
              padding: 0, overflow: 'hidden',
              opacity: u.isBlocked ? 0.7 : 1,
              borderColor: u.isBlocked ? 'rgba(255,0,85,0.3)' : 'rgba(255,255,255,0.05)',
            }}>
              {/* Desktop Grid Layout */}
              <div className="desktop-user-grid">
                <div className="user-card-grid">
                  {/* Identity */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '1rem', color: u.role === 'admin' ? '#d4af37' : '#fff' }}>{u.name}</p>
                      {adminBadge}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{u.email}</p>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.25rem' }}>
                      Joined {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column', alignItems: 'center' }}>
                    {statusBadge}
                    {twofaBadge}
                  </div>

                  {/* Role */}
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</p>
                    <select
                      value={u.role}
                      onChange={(e) => updateField(u._id, 'role', e.target.value)}
                      className="select-field"
                      style={{
                        background: u.role === 'admin' ? 'rgba(212,175,55,0.05)' : 'rgba(0,0,0,0.2)',
                        color: u.role === 'admin' ? '#d4af37' : '#fff',
                        border: `1px solid ${u.role === 'admin' ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Balance */}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance</p>
                    <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d4af37', fontFamily: 'monospace' }}>
                      ${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Actions */}
                  {actionButtons}
                </div>
              </div>

              {/* Mobile Card Layout */}
              <div className="mobile-user-header" style={{ padding: '1rem' }}>
                {/* Top: Avatar + Identity + Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                      background: u.role === 'admin' ? 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))' : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                      border: `1px solid ${u.role === 'admin' ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <UserCircle size={22} color={u.role === 'admin' ? '#d4af37' : 'var(--text-muted)'} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '0.95rem', color: u.role === 'admin' ? '#d4af37' : '#fff' }}>{u.name}</p>
                        {adminBadge}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                      <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.15rem' }}>
                        Joined {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end', flexShrink: 0 }}>
                    {statusBadge}
                    {twofaBadge}
                  </div>
                </div>

                {/* Balance bar */}
                <div style={{
                  background: 'rgba(212,175,55,0.04)', borderRadius: '12px', padding: '0.75rem 1rem',
                  border: '1px solid rgba(212,175,55,0.1)', marginBottom: '0.75rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}>
                  <DollarSign size={16} color="#d4af37" />
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#d4af37', fontFamily: 'monospace' }}>
                    ${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Selects row */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div>
                    <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</p>
                    <select
                      value={u.role}
                      onChange={(e) => updateField(u._id, 'role', e.target.value)}
                      className="select-field"
                      style={{
                        background: u.role === 'admin' ? 'rgba(212,175,55,0.05)' : 'rgba(0,0,0,0.2)',
                        color: u.role === 'admin' ? '#d4af37' : '#fff',
                        border: `1px solid ${u.role === 'admin' ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                {/* Action buttons */}
                {actionButtons}
              </div>

              {/* Expanded Stats */}
              {expandedStats}
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}

