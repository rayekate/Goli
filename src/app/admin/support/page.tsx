'use client';

import React, { useState, useEffect } from 'react';
import { Headset, Send, Info } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';
import { useRouter } from 'next/navigation';

export default function AdminSupportQueue() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTickets();
    const id = setInterval(fetchTickets, 10000);
    return () => clearInterval(id);
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setTickets(data.tickets);
      // Keep active ticket in sync with latest data
      if (activeTicket) {
        const updated = data.tickets.find((t: any) => t._id === activeTicket._id);
        if (updated) setActiveTicket(updated);
      }
      setLoading(false);
    } catch (err) {
      router.push('/admin');
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !activeTicket) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${activeTicket._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply })
      });
      if (res.ok) {
        const data = await res.json();
        // Since we populated userId in the GET, we must maintain it
        const newTicket = { ...data.ticket, userId: activeTicket.userId };
        setActiveTicket(newTicket);
        setTickets(tickets.map(t => t._id === newTicket._id ? newTicket : t));
        setReply('');
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const changeStatus = async (status: string) => {
    if (!activeTicket) return;
    try {
      const res = await fetch(`/api/tickets/${activeTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        const newTicket = { ...data.ticket, userId: activeTicket.userId };
        setActiveTicket(newTicket);
        setTickets(tickets.map(t => t._id === newTicket._id ? newTicket : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <GoldCoinLoader label="Loading support queue..." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--text)' }}>Global Help Desk</h1>
          <p style={{ color: 'var(--text-muted)' }}>Respond to active user priority queries.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="card glass" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
             <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffaa00', boxShadow: '0 0 10px #ffaa00' }} />
             <span>{tickets.filter(t => t.status === 'open').length} Open Action Required</span>
          </div>
        </div>
      </div>

      <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 2fr', gap: '1.5rem', height: 'calc(100vh - 220px)' }}>
        
        {/* Master Active List */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Headset size={18} color="#d4af37" /> Queue
            </h3>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {tickets.map(t => (
              <div 
                key={t._id} 
                onClick={() => setActiveTicket(t)}
                style={{ 
                  padding: '1.5rem', 
                  borderBottom: '1px solid var(--border)', 
                  cursor: 'pointer', 
                  background: activeTicket?._id === t._id ? 'rgba(212,175,55,0.1)' : 'transparent',
                  borderLeft: activeTicket?._id === t._id ? '3px solid #d4af37' : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t.title}</span>
                  <span style={{
                    fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', textTransform: 'uppercase', fontWeight: 'bold',
                    background: t.status === 'open' ? 'rgba(255, 170, 0, 0.2)' : t.status === 'pending' ? 'rgba(0, 255, 102, 0.2)' : 'var(--border-highlight)',
                    color: t.status === 'open' ? '#ffaa00' : t.status === 'pending' ? '#00ff66' : 'var(--text-muted)'
                  }}>
                    {t.status === 'open' ? 'ACTION REQ' : t.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  User: {t.userId?.name || 'Unknown'} <br/>
                  <span style={{ opacity: 0.5 }}>Updated: {new Date(t.updatedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tickets found.</div>
            )}
          </div>
        </div>

        {/* Focus Communication View */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTicket ? (
            <>
              {/* Ticket Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, color: 'var(--text)' }}>{activeTicket.title}</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {activeTicket.userId?.email || 'N/A'} • Created {new Date(activeTicket.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {activeTicket.status !== 'closed' ? (
                  <button onClick={() => changeStatus('closed')} className="btn" style={{ padding: '0.5rem 1rem', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                    Close Ticket
                  </button>
                ) : (
                  <button onClick={() => changeStatus('open')} className="btn" style={{ padding: '0.5rem 1rem', border: '1px solid #d4af37', color: '#d4af37' }}>
                    Reopen Ticket
                  </button>
                )}
              </div>

              {/* Chat Thread */}
              <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 0 }}>
                {activeTicket.messages.map((m: any, i: number) => {
                  const isAdmin = m.sender === 'admin';
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                      <div style={{ marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {isAdmin ? 'System Admin' : activeTicket.userId?.name || 'User'} • {new Date(m.createdAt).toLocaleString()}
                      </div>
                      <div style={{
                        background: isAdmin ? 'rgba(212,175,55,0.15)' : 'var(--border)',
                        border: `1px solid ${isAdmin ? 'rgba(212,175,55,0.3)' : 'var(--border-highlight)'}`,
                        color: 'var(--text)', padding: '1rem 1.5rem',
                        borderRadius: '15px', borderBottomRightRadius: isAdmin ? '2px' : '15px', borderBottomLeftRadius: isAdmin ? '15px' : '2px',
                        maxWidth: '85%', whiteSpace: 'pre-wrap'
                      }}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Form */}
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
                {activeTicket.status !== 'closed' ? (
                  <form onSubmit={sendReply} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input 
                      type="text" className="input" placeholder="Enter official admin directive..." 
                      value={reply} onChange={e => setReply(e.target.value)} required 
                      style={{ flex: 1, margin: 0, padding: '1.2rem', borderRadius: '12px' }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '0 2rem' }}>
                      {submitting ? <GoldCoinLoader mini label={null} /> : <Send size={20} />}
                    </button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Info size={18} /> Ticket permanently archived. Reopen to broadcast new directives.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Select a ticket to begin resolution protocol.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
