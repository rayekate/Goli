'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Plus, Loader2, Send, XCircle } from 'lucide-react';
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
        <Loader2 className="animate-spin glow-icon" size={40} color="#d4af37" />
      </div>
    );
  }

  return (
    <div className="container animate-in stagger-1" style={{ padding: '20px 15px 40px', maxWidth: '900px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#fff' }} className="text-gradient-gold">Support Center</h1>
          <p style={{ color: 'var(--text-muted)' }}>Get help directly from our specialized support team.</p>
        </div>
        {view === 'list' && (
          <button className="btn btn-primary" onClick={() => setView('new')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> New Ticket
          </button>
        )}
        {view !== 'list' && (
          <button className="btn" onClick={() => setView('list')} style={{ border: '1px solid var(--border)' }}>
            Back to List
          </button>
        )}
      </div>

      {view === 'list' && (
        <div className="glass-card" style={{ padding: '1rem' }}>
          {tickets.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={40} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <p>You have no open support tickets.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tickets.map(t => (
                <div 
                  key={t._id} 
                  onClick={() => { setActiveTicket(t); setView('detail'); }}
                  style={{ 
                    padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer', transition: 'background 0.2s ease', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <h3 style={{ color: '#fff', marginBottom: '0.3rem' }}>{t.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Updated {new Date(t.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span style={{
                      padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                      background: t.status === 'open' ? 'rgba(0, 255, 102, 0.1)' : t.status === 'pending' ? 'rgba(255, 170, 0, 0.1)' : 'rgba(255,255,255,0.1)',
                      color: t.status === 'open' ? '#00ff66' : t.status === 'pending' ? '#ffaa00' : 'var(--text-muted)',
                      border: `1px solid ${t.status === 'open' ? 'rgba(0, 255, 102, 0.3)' : t.status === 'pending' ? 'rgba(255, 170, 0, 0.3)' : 'rgba(255,255,255,0.1)'}`
                    }}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'new' && (
        <form onSubmit={createTicket} className="glass-card" style={{ padding: '2.5rem' }}>
          <h2 style={{ color: '#d4af37', marginBottom: '1.5rem' }}>Open a New Support Ticket</h2>
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Brief summary of issue" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label>Message</label>
            <textarea 
              className="input" 
              style={{ minHeight: '150px', resize: 'vertical' }} 
              placeholder="Describe your issue in detail..." 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '2rem', width: '100%' }} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      )}

      {view === 'detail' && activeTicket && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Messages Feed */}
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
            {activeTicket.messages.map((m: any, i: number) => {
              const out = m.sender === 'user';
              return (
                <div key={i} style={{ 
                  display: 'flex', flexDirection: 'column', 
                  alignItems: out ? 'flex-end' : 'flex-start' 
                }}>
                  <div style={{ marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {out ? 'You' : 'Support Admin'} • {new Date(m.createdAt).toLocaleString()}
                  </div>
                  <div style={{
                    background: out ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${out ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    color: '#fff',
                    padding: '1rem 1.5rem',
                    borderRadius: '15px',
                    borderBottomRightRadius: out ? '2px' : '15px',
                    borderBottomLeftRadius: out ? '15px' : '2px',
                    maxWidth: '80%',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          {activeTicket.status !== 'closed' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <form onSubmit={sendReply} className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Type a reply..." 
                  value={reply} 
                  onChange={e => setReply(e.target.value)} 
                  required 
                  style={{ flex: 1, margin: 0 }}
                />
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ margin: 0, padding: '0 1.5rem' }}>
                  <Send size={18} />
                </button>
              </form>
              <button
                type="button"
                onClick={closeTicket}
                disabled={submitting}
                className="btn btn-outline"
                style={{ alignSelf: 'flex-end', padding: '0.5rem 1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', borderColor: 'var(--border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <XCircle size={14} /> Close Ticket
              </button>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              This ticket has been closed.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
