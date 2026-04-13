'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, subject, message }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send message.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container animate-in stagger-1" style={{ padding: '30px 15px', maxWidth: '1000px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#fff' }}>
          Contact <span className="text-gradient-gold">GoldTradex</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Have legal inquiries, partnership proposals, or need help before opening an account? Our global support team is available 24/7.
        </p>
      </div>

      <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'clamp(1.5rem, 4vw, 3rem)' }}>
        
        {/* Contact Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass" style={{ padding: '2rem' }}>
            <h3 style={{ color: '#d4af37', marginBottom: '1.5rem' }}>Global Headquarters</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: '#fff' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212,175,55,0.3)' }}>
                <MapPin size={20} color="#d4af37" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Financial District</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>100 Wall Street, Suite 500<br/>New York, NY 10005</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: '#fff' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212,175,55,0.3)' }}>
                <Phone size={20} color="#d4af37" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Phone Support</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>+1 (888) 123-GOLD<br/>Mon-Fri, 9am - 5pm EST</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#fff' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212,175,55,0.3)' }}>
                <Mail size={20} color="#d4af37" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Email Address</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>support@goldtradex.com<br/>partners@goldtradex.com</p>
              </div>
            </div>

          </div>

          <div className="glass-card" style={{ background: 'rgba(0, 255, 102, 0.05)', border: '1px solid rgba(0, 255, 102, 0.2)', padding: '1.5rem' }}>
            <h4 style={{ color: '#00ff66', margin: '0 0 0.5rem 0' }}>Existing Member?</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              For faster resolution regarding account issues, deposits, and withdrawals, please use the internal Support Ticket System.
            </p>
            <Link href="/support" className="btn btn-outline" style={{ display: 'inline-block', color: '#00ff66', borderColor: 'rgba(0, 255, 102, 0.3)' }}>
              Open Member Support
            </Link>
          </div>
        </div>

        {/* Public Form */}
        <div className="card glass" style={{ padding: '2.5rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
              <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Message Sent</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Thank you for reaching out. Our team will respond to your inquiry within 24 hours.</p>
            </div>
          ) : (
            <>
              <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Send an Inquiry</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Fill out the form below and our representatives will reach out to you.</p>
              
              {error && <div style={{ background: 'rgba(255,71,87,0.08)', color: 'var(--danger)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', border: '1px solid rgba(255,71,87,0.15)', marginBottom: '1rem' }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>First Name</label>
                    <input type="text" className="input" required placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Last Name</label>
                    <input type="text" className="input" required placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Email Address</label>
                  <input type="email" className="input" required placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Subject</label>
                  <select className="input" required value={subject} onChange={(e) => setSubject(e.target.value)}>
                    <option value="general">General Inquiry</option>
                    <option value="partnership">Partnership & Affiliates</option>
                    <option value="legal">Legal & Compliance</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label>Message</label>
                  <textarea className="input" required placeholder="How can we help?" style={{ minHeight: '120px', resize: 'vertical' }} value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </>
          )}
        </div>

      </div>

    </div>
  );
}
