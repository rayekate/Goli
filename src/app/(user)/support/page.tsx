'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Plus, Send, XCircle } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
    const id = setInterval(fetchTickets, 10000);
    return () => clearInterval(id);
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      if (!res.ok) {
        if (res.status === 401) router.push('/login');
        return;
      }
      const data = await res.json();
      setTickets(data.tickets);
      // Keep active ticket in sync with latest data
      if (activeTicket) {
        const updated = data.tickets.find((t: any) => t._id === activeTicket._id);
        if (updated) setActiveTicket(updated);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message })
      });
      if (res.ok) {
        const data = await res.json();
        setTickets([data.ticket, ...tickets]);
        setTitle('');
        setMessage('');
        setView('list');
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${activeTicket._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTicket(data.ticket);
        setTickets(tickets.map(t => t._id === data.ticket._id ? data.ticket : t));
        setReply('');
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const closeTicket = async () => {
    if (!activeTicket) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${activeTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTicket(data.ticket);
        setTickets(tickets.map(t => t._id === data.ticket._id ? data.ticket : t));
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <GoldCoinLoader label="Loading support tickets..." />
      </div>
    );
  }

  return (
    <div className="container animate-in" style={{ padding: '0', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Institutional Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)' }}>SUPPORT MATRIX</div>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--success)', letterSpacing: '0.2em' }}>DIRECT LINK ESTABLISHED</span>
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2.2rem, 5vw, 3rem)', 
            marginBottom: '0.5rem', 
            fontWeight: 950,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: '#fff' 
          }}>
            Technical <span className="text-gradient-gold">Command Center</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500, opacity: 0.8 }}>
            Real-time synchronization with our specialized encryption and liquidation support team.
          </p>
        </div>
        {view === 'list' && (
          <button className="btn btn-gold" onClick={() => setView('new')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 950 }}>
            <Plus size={20} strokeWidth={3} /> INITIALIZE TICKET
          </button>
        )}
        {view !== 'list' && (
          <button className="btn btn-outline" onClick={() => setView('list')} style={{ borderRadius: '100px', padding: '1rem 2rem', fontWeight: 800, fontSize: '0.85rem' }}>
            RETURN TO MATRIX
          </button>
        )}
      </div>

      {view === 'list' && (
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '32px', overflow: 'hidden' }}>
          {tickets.length === 0 ? (
            <div style={{ padding: '6rem 3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ opacity: 0.1, margin: '0 auto 2rem' }} />
              <h3 style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.5rem' }}>NO ACTIVE TICKETS</h3>
              <p>Your support communication history will be logged here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tickets.map(t => (
                <div 
                  key={t._id} 
                  onClick={() => { setActiveTicket(t); setView('detail'); }}
                  className="hover-glow"
                  style={{ 
                    padding: '1.5rem 2rem', 
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ 
                      width: '12px', height: '12px', borderRadius: '50%', 
                      background: t.status === 'open' ? 'var(--success)' : t.status === 'pending' ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
                      boxShadow: t.status === 'open' ? '0 0 15px var(--success)' : t.status === 'pending' ? '0 0 15px var(--gold)' : 'none',
                      animation: (t.status === 'open' || t.status === 'pending') ? 'pulse 2s infinite' : 'none'
                    }} />
                    <div>
                      <h3 style={{ color: '#fff', marginBottom: '0.4rem', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>{t.title}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        LAST UPDATE: {new Date(t.updatedAt).toLocaleString().toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="badge" style={{ 
                    background: t.status === 'open' ? 'rgba(16, 185, 129, 0.1)' : t.status === 'pending' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.05)',
                    color: t.status === 'open' ? 'var(--success)' : t.status === 'pending' ? 'var(--gold)' : 'var(--text-muted)',
                    border: `1px solid ${t.status === 'open' ? 'rgba(16, 185, 129, 0.2)' : t.status === 'pending' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                    fontSize: '0.65rem', padding: '0.3rem 1rem'
                  }}>
                    {t.status?.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'new' && (
        <form onSubmit={createTicket} className="glass-card" style={{ padding: '4rem', borderRadius: '32px', borderTop: '2px solid var(--gold)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 950, color: '#fff', letterSpacing: '-0.04em', marginBottom: '2.5rem' }}>Initialize New <span className="text-gradient-gold">Support Session</span></h2>
          <div className="input-group">
            <label>SESSION SUBJECT</label>
            <input 
              type="text" 
              placeholder="Brief summary of the inquiry" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group" style={{ marginTop: '2rem' }}>
            <label>DETAILED INTEL</label>
            <textarea 
              style={{ minHeight: '180px', resize: 'vertical' }} 
              placeholder="Provide comprehensive details regarding your issue..." 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-gold" style={{ marginTop: '3rem', width: '100%', padding: '1.25rem', borderRadius: '100px', fontWeight: 950, fontSize: '1.1rem' }} disabled={submitting}>
            {submitting ? <GoldCoinLoader mini label="DISPATCHING..." /> : 'INITIALIZE SESSION'}
          </button>
        </form>
      )}

      {view === 'detail' && activeTicket && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Messages Feed */}
          <div className="glass-card" style={{ 
            padding: '2.5rem', 
            borderRadius: '32px',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2rem', 
            maxHeight: '70vh', 
            overflowY: 'auto',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div className="badge" style={{ alignSelf: 'center', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              TRANSCRIPT INITIALIZED: {new Date(activeTicket.createdAt).toLocaleString().toUpperCase()}
            </div>
            {activeTicket.messages.map((m: any, i: number) => {
              const out = m.sender === 'user';
              return (
                <div key={i} style={{ 
                  display: 'flex', flexDirection: 'column', 
                  alignItems: out ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  alignSelf: out ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{ marginBottom: '0.6rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                    {out ? 'CLIENT TERMINAL' : 'SUPPORT ADMIN'} • {new Date(m.createdAt).toLocaleTimeString()}
                  </div>
                  <div style={{
                    background: out ? 'rgba(212,175,55,0.08)' : 'rgba(8,10,15,0.8)',
                    border: `1px solid ${out ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.1)'}`,
                    color: out ? 'var(--gold)' : '#fff',
                    padding: '1.25rem 1.75rem',
                    borderRadius: '24px',
                    borderBottomRightRadius: out ? '4px' : '24px',
                    borderBottomLeftRadius: out ? '24px' : '4px',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    boxShadow: out ? '0 10px 30px rgba(212,175,55,0.05)' : 'none'
                  }}>
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          {activeTicket.status !== 'closed' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <form onSubmit={sendReply} className="glass-card" style={{ padding: '1rem', borderRadius: '100px', display: 'flex', gap: '1rem', border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.02)' }}>
                <input 
                  type="text" 
                  placeholder="Transmit message to support matrix..." 
                  value={reply} 
                  onChange={e => setReply(e.target.value)} 
                  required 
                  style={{ flex: 1, margin: 0, background: 'transparent', border: 'none', paddingLeft: '2rem', fontSize: '1rem', color: '#fff' }}
                />
                <button type="submit" className="btn btn-gold" disabled={submitting} style={{ 
                  margin: 0, padding: '0', 
                  width: '56px', height: '56px', 
                  borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  {submitting ? <GoldCoinLoader mini label={null} /> : <Send size={20} strokeWidth={3} />}
                </button>
              </form>
              <button
                type="button"
                onClick={closeTicket}
                disabled={submitting}
                style={{ 
                  alignSelf: 'center', background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 900,
                  letterSpacing: '0.2em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '1rem'
                }}
              >
                <XCircle size={14} /> TERMINATE SESSION
              </button>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
              <div className="badge" style={{ margin: '0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>SESSION ARCHIVED</div>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>This support transcript has been permanently finalized and archived.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
