'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeftRight, Check, X, ExternalLink, Search, Plus, 
  ArrowDownCircle, ArrowUpCircle, Eye,
  Clock, ShieldCheck, AlertCircle, TrendingUp, Filter,
  Maximize2, Copy, Wallet
} from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

type ManualTxModal = { type: 'deposit' | 'withdrawal' } | null;

export default function AdminTransactionsPage() {
  const { user, loading } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [manualModal, setManualModal] = useState<ManualTxModal>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');
  const [fulfillmentHash, setFulfillmentHash] = useState('');
  const [saving, setSaving] = useState(false);
  const [proofModal, setProofModal] = useState<{ image: string; txId: string } | null>(null);
  const [fulfillmentModal, setFulfillmentModal] = useState<{ txId: string; type: string } | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'tx-modal-portal';
    document.body.appendChild(el);
    portalRef.current = el;
    return () => { document.body.removeChild(el); };
  }, []);

  const fetchData = async () => {
    try {
      const [txRes, uRes] = await Promise.all([
        fetch('/api/admin/transactions'),
        fetch('/api/admin/users'),
      ]);
      if (txRes.ok) { const d = await txRes.json(); setTransactions(d.transactions); }
      if (uRes.ok) { const d = await uRes.json(); setUsers(d.users); }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
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
      const status = action === 'approve' ? 'approved' : 'rejected';
      const res = await fetch('/api/admin/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, status, transactionHash: hash }),
      });
      if (res.ok) { 
        setFulfillmentModal(null);
        setFulfillmentHash('');
        fetchData(); 
      } else { 
        const d = await res.json(); 
        alert(d.error || 'Action failed'); 
      }
    } catch { 
      console.error('Network error - Action failed'); 
    } finally {
      setSaving(false);
    }
  };

  const viewProofImage = async (txId: string) => {
    try {
      const res = await fetch(`/api/admin/transactions/proof?id=${txId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.proofImage) {
          setProofModal({ image: data.proofImage, txId });
        } else {
          alert('No proof image available.');
        }
      }
    } catch { console.error('Network error during proof fetch'); }
  };

  const submitManualTx = async () => {
    if (!manualModal || !selectedUserId || !txAmount || Number(txAmount) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, type: manualModal.type, amount: Number(txAmount), note: txNote || undefined }),
      });
      if (res.ok) { 
        setManualModal(null); 
        setSelectedUserId(''); 
        setTxAmount(''); 
        setTxNote(''); 
        fetchData(); 
      } else { 
        const d = await res.json(); 
        alert(d.error || 'Failed'); 
      }
    } catch { console.error('Network error - Manual Tx failed'); } finally { setSaving(false); }
  };

  const stats = useMemo(() => {
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const todayVol = transactions
      .filter(t => t.status === 'approved' && new Date(t.createdAt).toLocaleDateString() === new Date().toLocaleDateString())
      .reduce((sum, t) => sum + t.amount, 0);
    const withdrawalPressure = transactions
      .filter(t => t.status === 'pending' && t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);
    return { pendingCount, todayVol, withdrawalPressure };
  }, [transactions]);

  const filtered = transactions.filter((t) => {
    const userName = t.userId?.name?.toLowerCase() ?? '';
    const userEmail = t.userId?.email?.toLowerCase() ?? '';
    const matchSearch = !searchTerm || userName.includes(searchTerm.toLowerCase()) || userEmail.includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || t.type === filterType;
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const pending = filtered.filter(t => t.status === 'pending');
  const past = filtered.filter(t => t.status !== 'pending');

  if (loading || dataLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--gold)' }}>
      <GoldCoinLoader label="Initializing Financial Terminal..." />
    </div>
  );

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 99999,
    background: 'rgba(5, 8, 15, 0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
  };

  const modalCard: React.CSSProperties = {
    background: 'rgba(12, 20, 38, 0.98)',
    border: '1px solid rgba(212, 175, 55, 0.15)',
    borderRadius: '16px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
  };

  return (
    <div className="animate-in" style={{ padding: '24px 16px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Proof Image Modal (Zoom Ready) */}
      {proofModal && portalRef.current && createPortal(
        <div style={modalOverlay} onClick={() => setProofModal(null)}>
          <div style={{ ...modalCard, maxWidth: '900px', width: '100%', padding: '10px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setProofModal(null)} style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', zIndex: 10 }}><X size={16} /></button>
            <img src={proofModal.image} alt="Payment Receipt" style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Transaction ID: {proofModal.txId}</p>
            </div>
          </div>
        </div>,
        portalRef.current
      )}

      {/* Fulfillment Modal */}
      {fulfillmentModal && portalRef.current && createPortal(
        <div style={modalOverlay} onClick={() => setFulfillmentModal(null)}>
          <div style={{ ...modalCard, maxWidth: '480px', width: '100%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck color="var(--success)" /> Fulfill Withdrawal
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Enter the External Transaction Hash or ID used to pay the user. This will be visible to the user.
            </p>
            <div className="input-group">
              <label>External Hash / Receipt ID</label>
              <input 
                type="text" 
                placeholder="0x... or TxID" 
                value={fulfillmentHash} 
                onChange={e => setFulfillmentHash(e.target.value)} 
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setFulfillmentModal(null)}>Cancel</button>
              <button 
                className="btn btn-gold" 
                style={{ flex: 1 }} 
                onClick={() => handleAction(fulfillmentModal.txId, 'approve', fulfillmentHash)}
                disabled={saving || !fulfillmentHash}
              >
                {saving ? <GoldCoinLoader mini label={null} /> : 'Complete Payment'}
              </button>
            </div>
          </div>
        </div>,
        portalRef.current
      )}

      {/* Manual Action Modal */}
      {manualModal && portalRef.current && createPortal(
        <div style={modalOverlay} onClick={() => setManualModal(null)}>
          <div style={{ ...modalCard, maxWidth: '440px', width: '100%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {manualModal.type === 'deposit' ? <ArrowDownCircle color="var(--success)" /> : <ArrowUpCircle color="var(--danger)" />}
              Manual {manualModal.type}
            </h3>
            <div className="input-group">
              <label>Select User</label>
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.35)', color: selectedUser ? '#fff' : 'rgba(255,255,255,0.4)',
                    border: '1px solid rgba(212,175,55,0.15)', borderRadius: '10px', width: '100%', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem',
                    transition: 'border-color 0.2s',
                    ...(userDropdownOpen ? { borderColor: 'rgba(212,175,55,0.4)' } : {})
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedUser ? `${selectedUser.name} (@${selectedUser.username || '—'})` : 'Choose User...'}
                  </span>
                  <span style={{ transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', fontSize: '0.7rem', opacity: 0.5 }}>▼</span>
                </div>
                {userDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 10,
                    background: 'rgba(10, 15, 30, 0.98)', border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: '10px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
                  }}>
                    <div style={{ padding: '8px' }}>
                      <input
                        type="text" placeholder="Search users..." value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        autoFocus
                        style={{
                          width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff',
                          fontSize: '0.85rem', outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {filteredUsers.length === 0 && (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No users found</div>
                      )}
                      {filteredUsers.map(u => (
                        <div
                          key={u._id}
                          onClick={() => { setSelectedUserId(u._id); setUserDropdownOpen(false); setUserSearch(''); }}
                          style={{
                            padding: '0.6rem 1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                            gap: '0.15rem', fontSize: '0.88rem', transition: 'background 0.15s',
                            background: selectedUserId === u._id ? 'rgba(212,175,55,0.12)' : 'transparent',
                            color: selectedUserId === u._id ? 'var(--gold)' : '#fff',
                            borderLeft: selectedUserId === u._id ? '2px solid var(--gold)' : '2px solid transparent',
                          }}
                          onMouseEnter={e => { if (selectedUserId !== u._id) (e.currentTarget.style.background = 'rgba(255,255,255,0.05)'); }}
                          onMouseLeave={e => { if (selectedUserId !== u._id) (e.currentTarget.style.background = 'transparent'); }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{u.name} {u.username && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>@{u.username}</span>}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--gold)', opacity: 0.8 }}>${u.balance.toLocaleString()}</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="input-group">
              <label>Amount (USD)</label>
              <input type="number" placeholder="0.00" value={txAmount} onChange={e => setTxAmount(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Admin Note</label>
              <input type="text" placeholder="Internal reference..." value={txNote} onChange={e => setTxNote(e.target.value)} />
            </div>
            <button className="btn btn-gold" style={{ width: '100%', marginTop: '1rem' }} onClick={submitManualTx} disabled={saving || !selectedUserId || !txAmount}>
              {saving ? <GoldCoinLoader mini label={null} /> : `Execute ${manualModal.type}`}
            </button>
          </div>
        </div>,
        portalRef.current
      )}

      {/* Header & Stats Dock */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 900, marginBottom: '0.25rem' }} className="text-gradient-gold">Transactions</h1>
          <p style={{ color: 'var(--text-muted)' }}>Financial Control Terminal & Verification Queue</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ padding: '0.75rem 1.5rem', textAlign: 'center', border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.03)', flex: '1 1 120px', minWidth: 0 }}>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Pending</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold)' }}>{stats.pendingCount}</p>
          </div>
          <div className="glass-card" style={{ padding: '0.75rem 1.5rem', textAlign: 'center', flex: '1 1 120px', minWidth: 0 }}>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Today's Vol</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>${stats.todayVol.toLocaleString()}</p>
          </div>
          <div className="glass-card" style={{ padding: '0.75rem 1.5rem', textAlign: 'center', border: '1px solid rgba(255,71,87,0.1)', flex: '1 1 120px', minWidth: 0 }}>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Withdrawal Req</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>${stats.withdrawalPressure.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setManualModal({ type: 'deposit' })} className="btn btn-gold" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}><Plus size={16} /> Manual Deposit</button>
        <button onClick={() => setManualModal({ type: 'withdrawal' })} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}><Plus size={16} /> Manual Withdrawal</button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="search-box" style={{ width: '100%', maxWidth: '240px', minWidth: '150px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              type="text" 
              placeholder="Search user or email..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '0.5rem 1rem 0.5rem 2.2rem', color: '#fff', fontSize: '0.85rem', width: '100%' }}
            />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '0.5rem 1rem', color: '#fff', fontSize: '0.85rem' }}>
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '0.5rem 1rem', color: '#fff', fontSize: '0.85rem' }}>
            <option value="all">All Stats</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Queue */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ color: 'var(--gold)', marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} /> Active Approvals Queue
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pending.map((t, i) => (
              <div key={t._id} className={`glass-card animate-in stagger-${(i % 5) + 1}`} style={{
                padding: '1.5rem',
                borderLeft: `4px solid ${t.type === 'deposit' ? 'var(--success)' : 'var(--warning)'}`,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ fontWeight: 800, color: '#fff', fontSize: '1.05rem', marginBottom: '0.2rem' }}>{t.userId?.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{t.userId?.email}</p>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <span className={`badge ${t.type === 'deposit' ? 'badge-approved' : 'badge-primary'}`} style={{ fontSize: '0.6rem' }}>{t.type.toUpperCase()}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>#{t._id.slice(-6)}</span>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Amount</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>${t.amount.toLocaleString()}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>User Bal: ${t.userId?.balance.toLocaleString()}</p>
                </div>

                <div>
                  <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Reference / Proof</p>
                  {t.transactionHash || t.walletAddress ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <code style={{ fontSize: '0.7rem', color: 'var(--gold)', background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '4px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.transactionHash || t.walletAddress}</code>
                      <Copy size={12} className="cursor-pointer opacity-50 hover:opacity-100" />
                    </div>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No External Ref</span>}
                  
                  {t.type === 'deposit' && (
                    <button onClick={() => viewProofImage(t._id)} style={{ marginTop: '0.5rem', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: 'var(--gold)', fontSize: '0.65rem', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Eye size={12} /> View Payment Receipt
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleAction(t._id, 'reject')} className="btn btn-outline" style={{ padding: '0.6rem', color: 'var(--danger)', borderColor: 'rgba(255,71,87,0.2)' }} title="Reject Request"><X size={18} /></button>
                  <button 
                    onClick={() => {
                      if (t.type === 'withdrawal') setFulfillmentModal({ txId: t._id, type: t.type });
                      else handleAction(t._id, 'approve');
                    }} 
                    className="btn btn-gold" 
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Check size={18} /> {t.type === 'withdrawal' ? 'Fulfill' : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Transactions Table */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>Transaction Audit Log</h3>
        </div>
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timestamp / User</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descriptor</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reference</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Proof</th>
              </tr>
            </thead>
            <tbody>
              {past.map(t => (
                <tr key={t._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1rem' }}>
                    <p style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{t.userId?.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{new Date(t.createdAt).toLocaleString()}</p>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${t.type === 'deposit' ? 'badge-approved' : 'badge-primary'}`} style={{ fontSize: '0.6rem' }}>{t.type}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: '#fff', fontWeight: 800 }}>${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span className={`badge badge-${t.status}`} style={{ fontSize: '0.6rem' }}>{t.status}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <code style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t.transactionHash || t.walletAddress || '—'}</code>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {(t.proofImage || t.type === 'deposit') ? (
                      <button 
                        onClick={() => viewProofImage(t._id)}
                        className="interactive-haptic"
                        style={{ 
                          background: 'rgba(212,175,55,0.1)', 
                          border: '1px solid rgba(212,175,55,0.2)', 
                          color: 'var(--gold)',
                          padding: '0.4rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="View Submission Proof"
                      >
                        <Eye size={16} />
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {past.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>No historical logs found.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    </div>
  );
}
