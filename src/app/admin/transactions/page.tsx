'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeftRight, Check, X, Search, Plus,
  ArrowDownCircle, ArrowUpCircle, Eye,
  Clock, ShieldCheck, AlertCircle, RefreshCw,
  Copy, Wallet, DollarSign, TrendingUp,
} from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

type ManualTxModal = { type: 'deposit' | 'withdrawal' } | null;

/* ─── tiny helpers ─── */
const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MODAL_OVERLAY: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 99999,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
};

const MODAL_CARD: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '20px',
  boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'var(--border-subtle)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '0.75rem 1rem',
  color: 'var(--text)',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  outline: 'none',
};

export default function AdminTransactionsPage() {
  const { loading } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers]               = useState<any[]>([]);
  const [dataLoading, setDataLoading]   = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterType, setFilterType]     = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [manualModal, setManualModal]   = useState<ManualTxModal>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearch, setUserSearch]     = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [txAmount, setTxAmount]         = useState('');
  const [txNote, setTxNote]             = useState('');
  const [fulfillmentHash, setFulfillmentHash] = useState('');
  const [saving, setSaving]             = useState(false);
  const [proofModal, setProofModal]     = useState<{ image: string; txId: string } | null>(null);
  const [fulfillmentModal, setFulfillmentModal] = useState<{ txId: string; type: string } | null>(null);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);
  const [copiedId, setCopiedId]         = useState<string | null>(null);
  const portalRef   = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'tx-modal-portal';
    document.body.appendChild(el);
    portalRef.current = el;
    return () => { document.body.removeChild(el); };
  }, []);

  const fetchData = async (silent = false) => {
    if (silent) setRefreshing(true); else setDataLoading(true);
    try {
      const [txRes, uRes] = await Promise.all([
        fetch('/api/admin/transactions'),
        fetch('/api/admin/users'),
      ]);
      if (txRes.ok) { const d = await txRes.json(); setTransactions(d.transactions); }
      if (uRes.ok)  { const d = await uRes.json();  setUsers(d.users); }
      setLastUpdated(new Date());
    } catch (err) { console.error(err); }
    finally { setDataLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); const id = setInterval(() => fetchData(true), 30000); return () => clearInterval(id); }, []); // eslint-disable-line

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setUserDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q));
  }, [users, userSearch]);

  const selectedUser = useMemo(() => users.find(u => u._id === selectedUserId), [users, selectedUserId]);

  const handleAction = async (transactionId: string, action: 'approve' | 'reject', hash?: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, status: action === 'approve' ? 'approved' : 'rejected', transactionHash: hash }),
      });
      if (res.ok) { setFulfillmentModal(null); setFulfillmentHash(''); fetchData(); }
      else { const d = await res.json(); alert(d.error || 'Action failed'); }
    } catch { console.error('Network error'); } finally { setSaving(false); }
  };

  const viewProofImage = async (txId: string) => {
    try {
      const res = await fetch(`/api/admin/transactions/proof?id=${txId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.proofImage) setProofModal({ image: data.proofImage, txId });
        else alert('No proof image available.');
      }
    } catch { console.error('Proof fetch error'); }
  };

  const submitManualTx = async () => {
    if (!manualModal || !selectedUserId || !txAmount || Number(txAmount) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, type: manualModal.type, amount: Number(txAmount), note: txNote || undefined }),
      });
      if (res.ok) { setManualModal(null); setSelectedUserId(''); setTxAmount(''); setTxNote(''); fetchData(); }
      else { const d = await res.json(); alert(d.error || 'Failed'); }
    } catch { console.error('Manual TX error'); } finally { setSaving(false); }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); });
  };

  const stats = useMemo(() => ({
    pendingCount:  transactions.filter(t => t.status === 'pending').length,
    pendingDeposits: transactions.filter(t => t.status === 'pending' && t.type === 'deposit').length,
    pendingWithdrawals: transactions.filter(t => t.status === 'pending' && t.type === 'withdrawal').length,
    todayVol: transactions
      .filter(t => t.status === 'approved' && new Date(t.createdAt).toLocaleDateString() === new Date().toLocaleDateString())
      .reduce((s, t) => s + t.amount, 0),
    withdrawalPressure: transactions.filter(t => t.status === 'pending' && t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0),
    totalApproved: transactions.filter(t => t.status === 'approved').length,
  }), [transactions]);

  const filtered = useMemo(() => transactions.filter(t => {
    const term = searchTerm.toLowerCase();
    return (!term || t.userId?.name?.toLowerCase().includes(term) || t.userId?.email?.toLowerCase().includes(term))
      && (filterType === 'all' || t.type === filterType)
      && (filterStatus === 'all' || t.status === filterStatus);
  }), [transactions, searchTerm, filterType, filterStatus]);

  const pending = filtered.filter(t => t.status === 'pending');
  const past    = filtered.filter(t => t.status !== 'pending');

  if (loading || dataLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GoldCoinLoader label="Initializing Financial Terminal…" />
    </div>
  );

  return (
    <div className="animate-in" style={{ maxWidth: 1400, width: '100%' }}>

      {/* ══ PROOF IMAGE MODAL ══ */}
      {proofModal && portalRef.current && createPortal(
        <div style={MODAL_OVERLAY} onClick={() => setProofModal(null)}>
          <div style={{ ...MODAL_CARD, maxWidth: 900, width: '100%', padding: 10, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setProofModal(null)} style={{ position: 'absolute', top: -14, right: -14, background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
            <img src={proofModal.image} alt="Payment Receipt" style={{ width: '100%', borderRadius: 12, display: 'block' }} />
            <p style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>ID: {proofModal.txId}</p>
          </div>
        </div>,
        portalRef.current
      )}

      {/* ══ FULFILLMENT MODAL ══ */}
      {fulfillmentModal && portalRef.current && createPortal(
        <div style={MODAL_OVERLAY} onClick={() => setFulfillmentModal(null)}>
          <div style={{ ...MODAL_CARD, maxWidth: 480, width: '100%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} color="var(--success)" />
              </div>
              <div>
                <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Fulfill Withdrawal</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>Enter external hash to confirm payment</p>
              </div>
            </div>
            <div style={{ height: 1, background: 'var(--border)', margin: '1.25rem 0' }} />
            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.45rem' }}>External Hash / Receipt ID</label>
            <input type="text" placeholder="0x... or TxID" value={fulfillmentHash} onChange={e => setFulfillmentHash(e.target.value)} style={INPUT_STYLE} autoFocus />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.25rem' }}>This reference will be shown to the user as payment confirmation.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setFulfillmentModal(null)} style={{ flex: 1, padding: '0.8rem', background: 'var(--border-subtle)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
              <button onClick={() => handleAction(fulfillmentModal.txId, 'approve', fulfillmentHash)} disabled={saving || !fulfillmentHash}
                style={{ flex: 1.5, padding: '0.8rem', background: 'var(--primary)', border: 'none', borderRadius: 12, color: 'var(--primary-text)', fontWeight: 700, cursor: saving || !fulfillmentHash ? 'not-allowed' : 'pointer', opacity: saving || !fulfillmentHash ? 0.6 : 1, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {saving ? <GoldCoinLoader mini label={null} /> : <><Check size={16} /> Complete Payment</>}
              </button>
            </div>
          </div>
        </div>,
        portalRef.current
      )}

      {/* ══ MANUAL TX MODAL ══ */}
      {manualModal && portalRef.current && createPortal(
        <div style={MODAL_OVERLAY} onClick={() => setManualModal(null)}>
          <div style={{ ...MODAL_CARD, maxWidth: 440, width: '100%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: manualModal.type === 'deposit' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${manualModal.type === 'deposit' ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {manualModal.type === 'deposit' ? <ArrowDownCircle size={20} color="var(--success)" /> : <ArrowUpCircle size={20} color="var(--danger)" />}
              </div>
              <div>
                <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'capitalize' }}>Manual {manualModal.type}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>Override — balance adjusted immediately</p>
              </div>
            </div>
            <div style={{ height: 1, background: 'var(--border)', margin: '1.25rem 0' }} />

            {/* User selector */}
            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.45rem' }}>Select User</label>
            <div ref={dropdownRef} style={{ position: 'relative', marginBottom: '1rem' }}>
              <div onClick={() => setUserDropdownOpen(!userDropdownOpen)} style={{ ...INPUT_STYLE, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: userDropdownOpen ? 'var(--primary)' : 'var(--border)' }}>
                <span style={{ color: selectedUser ? 'var(--text)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedUser ? `${selectedUser.name} · @${selectedUser.username || selectedUser.email}` : 'Choose user…'}
                </span>
                <span style={{ transform: userDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)', fontSize: '0.7rem', flexShrink: 0 }}>▼</span>
              </div>
              {userDropdownOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 32px rgba(0,0,0,0.3)' }}>
                  <div style={{ padding: 8 }}>
                    <input type="text" placeholder="Search…" value={userSearch} onChange={e => setUserSearch(e.target.value)} autoFocus style={{ ...INPUT_STYLE, fontSize: '0.85rem', padding: '0.55rem 0.75rem' }} />
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {filteredUsers.length === 0
                      ? <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No users found</div>
                      : filteredUsers.map(u => (
                        <div key={u._id} onClick={() => { setSelectedUserId(u._id); setUserDropdownOpen(false); setUserSearch(''); }}
                          style={{ padding: '0.6rem 1rem', cursor: 'pointer', background: selectedUserId === u._id ? 'rgba(52,211,153,0.06)' : 'transparent', borderLeft: `3px solid ${selectedUserId === u._id ? 'var(--primary)' : 'transparent'}`, transition: 'background 0.15s' }}
                          onMouseEnter={e => { if (selectedUserId !== u._id) e.currentTarget.style.background = 'var(--border-subtle)'; }}
                          onMouseLeave={e => { if (selectedUserId !== u._id) e.currentTarget.style.background = 'transparent'; }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{u.name}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700 }}>${u.balance?.toLocaleString()}</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.45rem' }}>Amount (USD)</label>
            <input type="number" placeholder="0.00" value={txAmount} onChange={e => setTxAmount(e.target.value)} style={{ ...INPUT_STYLE, marginBottom: '1rem' }} />

            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.45rem' }}>Internal Note</label>
            <input type="text" placeholder="Admin override reference…" value={txNote} onChange={e => setTxNote(e.target.value)} style={{ ...INPUT_STYLE, marginBottom: '1.5rem' }} />

            <button onClick={submitManualTx} disabled={saving || !selectedUserId || !txAmount}
              style={{ width: '100%', padding: '0.9rem', background: 'var(--primary)', border: 'none', borderRadius: 12, color: 'var(--primary-text)', fontWeight: 700, cursor: saving || !selectedUserId || !txAmount ? 'not-allowed' : 'pointer', opacity: saving || !selectedUserId || !txAmount ? 0.5 : 1, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {saving ? <GoldCoinLoader mini label={null} /> : `Execute ${manualModal.type}`}
            </button>
          </div>
        </div>,
        portalRef.current
      )}

      {/* ══ PAGE HEADER ══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeftRight size={20} color="var(--accent)" />
            </div>
            <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2.1rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', margin: 0 }}>Transactions</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginLeft: '3.25rem' }}>Financial Control Terminal &amp; Verification Queue</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {lastUpdated && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={() => fetchData(true)} disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 100, background: 'var(--border-subtle)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {/* ══ STAT CARDS ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <TxStatCard icon={<Clock size={18} />} iconColor="var(--accent)" iconBg="rgba(245,158,11,0.1)" iconBorder="rgba(245,158,11,0.2)" label="Pending" value={String(stats.pendingCount)} highlight={stats.pendingCount > 0}
          sub={<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stats.pendingDeposits}D · {stats.pendingWithdrawals}W</span>} />
        <TxStatCard icon={<DollarSign size={18} />} iconColor="var(--primary)" iconBg="rgba(52,211,153,0.08)" iconBorder="rgba(52,211,153,0.15)" label="Today's Volume" value={`$${fmt(stats.todayVol)}`} />
        <TxStatCard icon={<ArrowUpCircle size={18} />} iconColor="var(--danger)" iconBg="rgba(239,68,68,0.08)" iconBorder="rgba(239,68,68,0.15)" label="Withdrawal Queue" value={`$${fmt(stats.withdrawalPressure)}`} valueColor={stats.withdrawalPressure > 0 ? 'var(--danger)' : undefined} />
        <TxStatCard icon={<TrendingUp size={18} />} iconColor="var(--success)" iconBg="rgba(52,211,153,0.08)" iconBorder="rgba(52,211,153,0.15)" label="Approved Total" value={String(stats.totalApproved)} valueColor="var(--success)" />
        <TxStatCard icon={<Wallet size={18} />} iconColor="var(--accent)" iconBg="rgba(245,158,11,0.08)" iconBorder="rgba(245,158,11,0.15)" label="All Records" value={String(transactions.length)} />
      </div>

      {/* ══ ACTION + FILTER BAR ══ */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.75rem', padding: '0.875rem 1rem', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: 'var(--glass-border)', borderRadius: 14 }}>
        <button onClick={() => setManualModal({ type: 'deposit' })}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 10, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--success)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
          <Plus size={14} /> Manual Deposit
        </button>
        <button onClick={() => setManualModal({ type: 'withdrawal' })}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
          <Plus size={14} /> Manual Withdrawal
        </button>

        <div style={{ height: 24, width: 1, background: 'var(--border)', margin: '0 0.25rem' }} />

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 260 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input type="text" placeholder="Search user…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2rem', background: 'var(--border-subtle)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }} />
        </div>

        {/* Type filter */}
        <div style={{ display: 'flex', background: 'var(--border-subtle)', padding: '2px', borderRadius: 8, border: '1px solid var(--border)', gap: 2 }}>
          {(['all', 'deposit', 'withdrawal'] as const).map(v => (
            <button key={v} onClick={() => setFilterType(v)}
              style={{ padding: '0.38rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: filterType === v ? 'var(--primary)' : 'transparent', color: filterType === v ? 'var(--primary-text)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
              {v === 'all' ? 'All Types' : v === 'deposit' ? 'Deposits' : 'Withdrawals'}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', background: 'var(--border-subtle)', padding: '2px', borderRadius: 8, border: '1px solid var(--border)', gap: 2 }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(v => (
            <button key={v} onClick={() => setFilterStatus(v)}
              style={{ padding: '0.38rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: filterStatus === v ? 'var(--primary)' : 'transparent', color: filterStatus === v ? 'var(--primary-text)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
              {v === 'all' ? 'All Status' : v}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{filtered.length} records</span>
      </div>

      {/* ══ PENDING QUEUE ══ */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.1rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 800, margin: 0 }}>Active Approvals Queue</h3>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'rgba(245,158,11,0.12)', color: 'var(--accent)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 100, padding: '0.15rem 0.6rem' }}>{pending.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pending.map((t, i) => {
              const isDeposit = t.type === 'deposit';
              const accent = isDeposit ? 'var(--success)' : 'var(--warning, #f59e0b)';
              return (
                <div key={t._id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr auto', alignItems: 'center', gap: '1.25rem', padding: '1.1rem 1.25rem', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: 'var(--glass-border)', borderRadius: 14, borderLeft: `3px solid ${accent}` }}>
                  {/* User */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: isDeposit ? 'rgba(52,211,153,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${isDeposit ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isDeposit ? <ArrowDownCircle size={17} color="var(--success)" /> : <ArrowUpCircle size={17} color="#f59e0b" />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.userId?.name}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.userId?.email}</p>
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.1rem 0.5rem', borderRadius: 100, background: isDeposit ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)', color: isDeposit ? 'var(--success)' : '#f59e0b', border: `1px solid ${isDeposit ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.2)'}` }}>{t.type}</span>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>#{t._id.slice(-6)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem' }}>Amount</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>${t.amount?.toLocaleString()}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bal: ${t.userId?.balance?.toLocaleString()}</p>
                  </div>

                  {/* Reference */}
                  <div>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Reference</p>
                    {(t.transactionHash || t.walletAddress) ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <code style={{ fontSize: '0.68rem', color: 'var(--accent)', background: 'var(--border-subtle)', padding: '0.25rem 0.5rem', borderRadius: 6, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{t.transactionHash || t.walletAddress}</code>
                        <button onClick={() => copyToClipboard(t.transactionHash || t.walletAddress, t._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === t._id ? 'var(--success)' : 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center' }}>
                          <Copy size={12} />
                        </button>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No external ref</span>}

                    {isDeposit && (
                      <button onClick={() => viewProofImage(t._id)}
                        style={{ marginTop: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--accent)', fontSize: '0.68rem', fontWeight: 700, borderRadius: 100, cursor: 'pointer' }}>
                        <Eye size={11} /> View Receipt
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 120 }}>
                    <button onClick={() => { if (t.type === 'withdrawal') setFulfillmentModal({ txId: t._id, type: t.type }); else handleAction(t._id, 'approve'); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.55rem 1rem', background: 'var(--primary)', border: 'none', borderRadius: 10, color: 'var(--primary-text)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                      <Check size={14} /> {t.type === 'withdrawal' ? 'Fulfill' : 'Approve'}
                    </button>
                    <button onClick={() => handleAction(t._id, 'reject')}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: 'var(--danger)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ AUDIT LOG TABLE ══ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.1rem' }}>
          <ShieldCheck size={16} color="var(--text-muted)" />
          <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 800, margin: 0 }}>Transaction Audit Log</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 500 }}>{past.length} entries</span>
        </div>

        <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: 'var(--glass-border)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 80px', gap: '1rem', padding: '0.75rem 1.25rem', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border)' }}>
            {['User / Time', 'Type', 'Amount', 'Status', 'Reference', 'Proof'].map(h => (
              <span key={h} style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{h}</span>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            {past.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                <p style={{ fontWeight: 600 }}>No records found</p>
              </div>
            ) : past.map((t, i) => {
              const isDeposit = t.type === 'deposit';
              const statusColors: Record<string, { color: string; bg: string; border: string }> = {
                approved: { color: 'var(--success)', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
                rejected: { color: 'var(--danger)',  bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'  },
                pending:  { color: 'var(--accent)',  bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
              };
              const sc = statusColors[t.status] || statusColors.pending;
              const ref = t.transactionHash || t.walletAddress;

              return (
                <div key={t._id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 80px', gap: '1rem', padding: '0.85rem 1.25rem', borderBottom: i < past.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--border-subtle)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.1rem' }}>{t.userId?.name}</p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: 100, background: isDeposit ? 'rgba(52,211,153,0.08)' : 'rgba(245,158,11,0.08)', color: isDeposit ? 'var(--success)' : '#f59e0b', border: `1px solid ${isDeposit ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.2)'}`, display: 'inline-block' }}>{t.type}</span>
                  <p style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}>${t.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize', padding: '0.2rem 0.6rem', borderRadius: 100, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, display: 'inline-block' }}>{t.status}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                    {ref ? (
                      <>
                        <code style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--border-subtle)', padding: '0.2rem 0.45rem', borderRadius: 5, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{ref}</code>
                        <button onClick={() => copyToClipboard(ref, `${t._id}-ref`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === `${t._id}-ref` ? 'var(--success)' : 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center' }}><Copy size={11} /></button>
                      </>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {isDeposit ? (
                      <button onClick={() => viewProofImage(t._id)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--accent)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Eye size={14} />
                      </button>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg);}} @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}`}</style>
    </div>
  );
}

/* ── Stat pill ── */
function TxStatCard({ icon, iconColor, iconBg, iconBorder, label, value, valueColor, sub, highlight }: {
  icon: React.ReactNode; iconColor: string; iconBg: string; iconBorder: string;
  label: string; value: string; valueColor?: string; sub?: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div style={{ position: 'relative', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: highlight ? `1px solid ${iconBorder}` : 'var(--glass-border)', borderRadius: 16, padding: '1.1rem 1.25rem', overflow: 'hidden', boxShadow: 'var(--glass-shadow)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${iconColor},transparent)`, opacity: 0.5 }} />
      <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, marginBottom: '0.75rem' }}>{icon}</div>
      <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{label}</p>
      <p style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', color: valueColor ?? 'var(--text)', lineHeight: 1.1 }}>{value}</p>
      {sub && <div style={{ marginTop: '0.35rem' }}>{sub}</div>}
    </div>
  );
}
