'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Clock, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, History, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="container animate-in stagger-1" style={{ padding: '30px 15px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: '#fff' }} className="text-gradient-gold">Activity History</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Complete record of your trading and financial activities.</p>
      </div>

      {/* Summary stats */}
      {fetchError && (
        <div style={{ background: 'rgba(255,170,0,0.08)', color: '#ffaa00', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(255,170,0,0.2)' }}>
          {fetchError}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Trades</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>{trades.length}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{wins}W / {losses}L</p>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Net Profit / Loss</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: totalProfit >= 0 ? 'var(--success)' : 'var(--danger)', textShadow: totalProfit >= 0 ? '0 0 10px var(--success-glow)' : '0 0 10px var(--danger-glow)' }}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Win Rate</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gold)', textShadow: '0 0 10px var(--gold-glow)' }}>
            {trades.length > 0 ? ((wins / trades.length) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('trades')}
          className={`btn ${activeTab === 'trades' ? 'btn-gold' : 'btn-outline'}`}
          style={{ padding: '0.7rem 1.5rem', flex: 1, minWidth: '140px' }}
        >
          <BarChart2 size={18} /> Trades ({tradeTotal})
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`btn ${activeTab === 'transactions' ? 'btn-gold' : 'btn-outline'}`}
          style={{ padding: '0.7rem 1.5rem', flex: 1, minWidth: '140px' }}
        >
          <ArrowUpRight size={18} /> Transactions ({txTotal})
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {fetching ? (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</div>
        ) : (
          <>
            {activeTab === 'trades' ? (
              trades.length > 0 ? (
                <>
                  {trades.map((trade, i) => (
                <div key={trade._id} className={`glass-card stagger-${Math.min(i % 4 + 1, 4)}`} style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: `4px solid ${trade.result === 'win' ? 'var(--success)' : 'var(--danger)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0, flex: '1 1 auto' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                      {trade.direction === 'up' 
                        ? <TrendingUp size={24} color="var(--success)" style={{ filter: 'drop-shadow(0 0 5px var(--success-glow))' }} /> 
                        : <TrendingDown size={24} color="var(--danger)" style={{ filter: 'drop-shadow(0 0 5px var(--danger-glow))' }} />
                      }
                    </div>
                    <div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'block', marginBottom: '0.2rem' }}>
                        Gold {trade.direction === 'up' ? 'UP' : 'DOWN'}
                      </span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Stake: <strong style={{ color: '#fff' }}>${trade.amount?.toFixed(2)}</strong> • Entry: ${trade.entryPrice?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ 
                      fontWeight: 900,
                      fontSize: '1.2rem',
                      color: trade.result === 'win' ? 'var(--success)' : 'var(--danger)',
                      textShadow: trade.result === 'win' ? '0 0 10px var(--success-glow)' : '0 0 10px var(--danger-glow)',
                    }}>
                      {trade.profitOrLoss >= 0 ? '+' : ''}{trade.profitOrLoss != null ? `$${trade.profitOrLoss.toFixed(2)}` : `-$${trade.amount?.toFixed(2)}`}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(trade.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <span className={`badge ${trade.result === 'win' ? 'badge-approved' : 'badge-rejected'}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.6rem' }}>
                        {trade.result}
                      </span>
                    </div>
                  </div>
                </div>
                  ))}
                  {tradeTotalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                      <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => handleTradePage(tradePage - 1)} disabled={tradePage <= 1}>
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Page <strong style={{ color: '#fff' }}>{tradePage}</strong> of {tradeTotalPages}
                      </span>
                      <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => handleTradePage(tradePage + 1)} disabled={tradePage >= tradeTotalPages}>
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <History size={48} style={{ marginBottom: '1.5rem', opacity: 0.3, margin: '0 auto' }} />
                  <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No trades recorded yet</h3>
                  <p>Your trading history will appear here once you place a trade.</p>
                </div>
              )
            ) : (
              transactions.length > 0 ? (
                <>
                  {transactions.map((tx, i) => (
                <div key={tx._id} className={`glass-card stagger-${Math.min(i % 4 + 1, 4)}`} style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: `4px solid ${tx.type === 'deposit' ? 'var(--success)' : 'var(--warning)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0, flex: '1 1 auto' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                      {tx.type === 'deposit' 
                        ? <ArrowUpRight size={24} color="var(--success)" style={{ filter: 'drop-shadow(0 0 5px var(--success-glow))' }} /> 
                        : <ArrowDownLeft size={24} color="var(--warning)" style={{ filter: 'drop-shadow(0 0 5px rgba(255,204,0,0.3))' }} />
                      }
                    </div>
                    <div>
                      <span style={{ textTransform: 'capitalize', fontWeight: 800, fontSize: '1.1rem', color: '#fff', display: 'block', marginBottom: '0.2rem' }}>
                        {tx.type} {tx.cryptoType && `(${tx.cryptoType})`}
                      </span>
                      <span className={`badge badge-${tx.status}`} style={{ fontSize: '0.65rem' }}>{tx.status}</span>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 900, fontSize: '1.2rem', color: tx.type === 'deposit' ? 'var(--success)' : '#fff' }}>
                      {tx.type === 'deposit' ? '+' : '-'}${tx.amount?.toFixed(2)}
                    </span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {new Date(tx.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                  ))}
                  {txTotalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                      <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => handleTxPage(txPage - 1)} disabled={txPage <= 1}>
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Page <strong style={{ color: '#fff' }}>{txPage}</strong> of {txTotalPages}
                      </span>
                      <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => handleTxPage(txPage + 1)} disabled={txPage >= txTotalPages}>
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Clock size={48} style={{ marginBottom: '1.5rem', opacity: 0.3, margin: '0 auto' }} />
                  <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No transactions found</h3>
                  <p>Your deposit and withdrawal history will appear here.</p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
