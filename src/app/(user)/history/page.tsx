'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Clock, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, History, BarChart2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

const ITEMS_PER_PAGE = 15;

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'trades' | 'transactions'>('trades');
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [tradePage, setTradePage] = useState(1);
  const [tradeTotalPages, setTradeTotalPages] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [tradeTotal, setTradeTotal] = useState(0);
  const [txTotal, setTxTotal] = useState(0);

  const fetchData = async (tp?: number, txp?: number) => {
    const currentTradePage = tp ?? tradePage;
    const currentTxPage = txp ?? txPage;
    try {
      setFetchError('');
      const [tradeRes, transRes] = await Promise.all([
        fetch(`/api/trades?page=${currentTradePage}&limit=${ITEMS_PER_PAGE}`),
        fetch(`/api/transactions?page=${currentTxPage}&limit=${ITEMS_PER_PAGE}`)
      ]);
      
      if (tradeRes.ok) {
        const tradeData = await tradeRes.json();
        setTrades(tradeData.trades || []);
        setTradeTotalPages(tradeData.totalPages || 1);
        setTradeTotal(tradeData.total || 0);
      } else {
        setFetchError('Failed to load trades.');
      }
      
      if (transRes.ok) {
        const transData = await transRes.json();
        setTransactions(transData.transactions || []);
        setTxTotalPages(transData.totalPages || 1);
        setTxTotal(transData.total || 0);
      } else {
        setFetchError(prev => prev ? prev + ' Failed to load transactions.' : 'Failed to load transactions.');
      }
    } catch (err) {
      setFetchError('Network error. Data may be outdated.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, [user]);

  if (loading || !user) return <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>Loading history...</div>;

  const totalProfit = trades.reduce((sum, t) => sum + t.profitOrLoss, 0);
  const wins = trades.filter(t => t.result === 'win').length;
  const losses = trades.filter(t => t.result === 'loss').length;

  const handleTradePage = (newPage: number) => {
    setTradePage(newPage);
    fetchData(newPage, txPage);
  };

  const handleTxPage = (newPage: number) => {
    setTxPage(newPage);
    fetchData(tradePage, newPage);
  };

  return (
    <div className="container animate-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Institutional Header */}
      <div style={{ marginBottom: '3.5rem', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)' }}>AUDIT LOGS</div>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 10px var(--gold)' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.2em' }}>TERMINAL SYNCHRONIZED</span>
        </div>
        <h1 style={{ 
          fontSize: 'clamp(2.2rem, 5vw, 3rem)', 
          marginBottom: '0.5rem', 
          fontWeight: 950,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: '#fff' 
        }}>
          Activity <span className="text-gradient-gold">Archives</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500, opacity: 0.8 }}>
          Immutable ledger of trading operations and financial settlements.
        </p>
      </div>

      {fetchError && (
        <div style={{ 
          background: 'rgba(255,170,0,0.08)', 
          color: '#ffaa00', 
          padding: '1.25rem', 
          borderRadius: '16px', 
          marginBottom: '2rem', 
          fontSize: '0.85rem', 
          border: '1px solid rgba(255,170,0,0.2)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          <AlertTriangle size={18} /> {fetchError}
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.05)' }} />
          <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Total Operations</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <p style={{ fontSize: '1.8rem', fontWeight: 950, color: '#fff', letterSpacing: '-0.05em' }}>{tradeTotal}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{wins}W / {losses}L</p>
          </div>
        </div>
        
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: totalProfit >= 0 ? 'var(--success)' : 'var(--danger)', opacity: 0.3 }} />
          <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Performance</p>
          <p style={{ 
            fontSize: '1.8rem', 
            fontWeight: 950, 
            color: totalProfit >= 0 ? 'var(--success)' : 'var(--danger)', 
            letterSpacing: '-0.05em'
          }}>
            {totalProfit >= 0 ? '+' : '-'}${Math.abs(totalProfit).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--gold)', opacity: 0.3 }} />
          <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Precision</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--gold)', letterSpacing: '-0.05em' }}>
            {trades.length > 0 ? ((wins / trades.length) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)', width: '100%', maxWidth: '500px' }}>
        <button 
          onClick={() => setActiveTab('trades')}
          className="hover-glow"
          style={{ 
            flex: 1,
            padding: '0.75rem 0.5rem', 
            borderRadius: '100px',
            fontSize: 'clamp(0.65rem, 2.5vw, 0.85rem)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.3s ease',
            background: activeTab === 'trades' ? 'var(--gold)' : 'transparent',
            color: activeTab === 'trades' ? '#000' : 'var(--text-muted)',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          TRADES ({tradeTotal})
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className="hover-glow"
          style={{ 
            flex: 1,
            padding: '0.75rem 0.5rem', 
            borderRadius: '100px',
            fontSize: 'clamp(0.65rem, 2.5vw, 0.85rem)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.3s ease',
            background: activeTab === 'transactions' ? 'var(--gold)' : 'transparent',
            color: activeTab === 'transactions' ? '#000' : 'var(--text-muted)',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          FINANCE ({txTotal})
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {fetching ? (
          <div className="glass-card" style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '24px' }}>
            <GoldCoinLoader label="SYNCHRONIZING ARCHIVES..." />
          </div>
        ) : (
          <>
            {activeTab === 'trades' ? (
              trades.length > 0 ? (
                <>
                  {trades.map((trade, i) => (
                    <div key={trade._id} className="glass-card" style={{ 
                      padding: 'clamp(0.75rem, 3vw, 1.25rem) clamp(0.75rem, 4vw, 1.5rem)', 
                      borderRadius: '20px',
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      borderLeft: `4px solid ${trade.result === 'win' ? 'var(--success)' : 'var(--danger)'}`,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 2vw, 1rem)', flex: '1 1 180px', minWidth: 0 }}>
                        <div style={{ 
                          width: 'clamp(32px, 8vw, 44px)', height: 'clamp(32px, 8vw, 44px)', borderRadius: '12px', 
                          flexShrink: 0,
                          background: 'rgba(255,255,255,0.03)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          {trade.direction === 'up' 
                            ? <TrendingUp size={16} color="var(--success)" /> 
                            : <TrendingDown size={16} color="var(--danger)" />
                          }
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: 'clamp(0.8rem, 3vw, 1rem)', fontWeight: 900, color: '#fff', display: 'block', marginBottom: '0.25rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            XAU/USD {trade.direction === 'up' ? 'LONG' : 'SHORT'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'clamp(0.6rem, 2vw, 0.75rem)', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            <span>$<strong style={{ color: '#fff' }}>{trade.amount?.toFixed(0)}</strong></span>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                            <span>@{trade.entryPrice?.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ 
                          fontWeight: 950,
                          fontSize: 'clamp(1rem, 4vw, 1.4rem)',
                          color: trade.result === 'win' ? 'var(--success)' : 'var(--danger)',
                          letterSpacing: '-0.04em',
                          lineHeight: 1
                        }}>
                          {trade.profitOrLoss >= 0 ? '+' : '-'}${trade.profitOrLoss != null ? Math.abs(trade.profitOrLoss).toFixed(1) : trade.amount?.toFixed(1)}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.4rem' }}>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {new Date(trade.createdAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                          </span>
                          <span className="badge" style={{ 
                            fontSize: '0.55rem', padding: '0.15rem 0.4rem', 
                            background: trade.result === 'win' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: trade.result === 'win' ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${trade.result === 'win' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                          }}>
                            {trade.result?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {tradeTotalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '2.5rem' }}>
                      <button className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800 }} onClick={() => handleTradePage(tradePage - 1)} disabled={tradePage <= 1}>
                        <ChevronLeft size={16} /> PREV
                      </button>
                      <div className="glass-card" style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 900 }}>
                        <span style={{ color: 'var(--gold)' }}>{tradePage}</span> <span style={{ opacity: 0.3 }}>/</span> {tradeTotalPages}
                      </div>
                      <button className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800 }} onClick={() => handleTradePage(tradePage + 1)} disabled={tradePage >= tradeTotalPages}>
                        NEXT <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="glass-card" style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '32px' }}>
                  <History size={48} style={{ marginBottom: '1.5rem', opacity: 0.1, margin: '0 auto' }} />
                  <h3 style={{ color: '#fff', marginBottom: '0.75rem', fontWeight: 900, fontSize: '1.5rem' }}>NO OPERATIONAL HISTORY</h3>
                  <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>Your initialized trade contracts will be archived and presented here for terminal audits.</p>
                </div>
              )
            ) : (
              transactions.length > 0 ? (
                <>
                  {transactions.map((tx, i) => (
                    <div key={tx._id} className="glass-card" style={{ 
                      padding: 'clamp(0.75rem, 3vw, 1.25rem) clamp(0.75rem, 4vw, 1.5rem)', 
                      borderRadius: '20px',
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      borderLeft: `4px solid ${tx.type === 'deposit' ? 'var(--success)' : 'var(--gold)'}`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 2vw, 1rem)', flex: '1 1 180px', minWidth: 0 }}>
                        <div style={{ 
                          width: 'clamp(32px, 8vw, 44px)', height: 'clamp(32px, 8vw, 44px)', borderRadius: '12px', 
                          flexShrink: 0,
                          background: 'rgba(255,255,255,0.03)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          {tx.type === 'deposit' 
                            ? <ArrowUpRight size={16} color="var(--success)" /> 
                            : <ArrowDownLeft size={16} color="var(--gold)" />
                          }
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 950, fontSize: 'clamp(0.8rem, 3vw, 1rem)', color: '#fff', display: 'block', marginBottom: '0.25rem', letterSpacing: '-0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tx.type} ARCHIVE {tx.cryptoType && `(${tx.cryptoType})`}
                          </span>
                          <span className="badge" style={{ 
                            fontSize: '0.6rem', padding: '0.2rem 0.6rem', 
                            background: tx.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : tx.status === 'pending' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.05)',
                            color: tx.status === 'approved' ? 'var(--success)' : tx.status === 'pending' ? 'var(--gold)' : 'var(--text-muted)',
                            border: `1px solid ${tx.status === 'approved' ? 'rgba(16,185,129,0.2)' : tx.status === 'pending' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.1)'}`
                          }}>{tx.status?.toUpperCase()}</span>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontWeight: 950, fontSize: 'clamp(1rem, 4vw, 1.4rem)', color: tx.type === 'deposit' ? 'var(--success)' : '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                          {tx.type === 'deposit' ? '+' : '-'}${tx.amount?.toLocaleString(undefined, { minimumFractionDigits: tx.amount >= 1000 ? 0 : 1, maximumFractionDigits: 1 })}
                        </span>
                        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 700 }}>
                          {new Date(tx.createdAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {txTotalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '2.5rem' }}>
                      <button className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800 }} onClick={() => handleTxPage(txPage - 1)} disabled={txPage <= 1}>
                        <ChevronLeft size={16} /> PREV
                      </button>
                      <div className="glass-card" style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 900 }}>
                        <span style={{ color: 'var(--gold)' }}>{txPage}</span> <span style={{ opacity: 0.3 }}>/</span> {txTotalPages}
                      </div>
                      <button className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800 }} onClick={() => handleTxPage(txPage + 1)} disabled={txPage >= txTotalPages}>
                        NEXT <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="glass-card" style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '32px' }}>
                  <Clock size={48} style={{ marginBottom: '1.5rem', opacity: 0.1, margin: '0 auto' }} />
                  <h3 style={{ color: '#fff', marginBottom: '0.75rem', fontWeight: 900, fontSize: '1.5rem' }}>NO FINANCIAL ARCHIVES</h3>
                  <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>Your funding events and extraction settlements will be logged here for fiscal tracking.</p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
