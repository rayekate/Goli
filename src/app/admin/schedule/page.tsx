'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock,
  Calendar,
  Save,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

interface ScheduleSettings {
  tradingStartTime: string;
  tradingEndTime: string;
  tradingDays: string[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleSettings>({
    tradingStartTime: '00:00',
    tradingEndTime: '23:59',
    tradingDays: DAYS_OF_WEEK
  });
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/schedule');
      if (res.ok) {
        const data = await res.json();
        setSchedule({
          tradingStartTime: data.tradingStartTime,
          tradingEndTime: data.tradingEndTime,
          tradingDays: data.tradingDays
        });
        if (data.serverTime) {
          setServerTime(new Date(data.serverTime));
        }
      }
    } catch {
      // stay with defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Tick the server clock every second
  useEffect(() => {
    if (!serverTime) return;
    const interval = setInterval(() => {
      setServerTime(prev => prev ? new Date(prev.getTime() + 1000) : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [serverTime]);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });
      const data = await res.json();
      if (res.ok) {
        setSchedule(data.schedule);
        setFeedback({ type: 'success', message: 'Trading schedule updated successfully' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update schedule' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error. Please check your connection.' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const toggleDay = (day: string) => {
    setSchedule(prev => {
      const isSelected = prev.tradingDays.includes(day);
      const newDays = isSelected
        ? prev.tradingDays.filter(d => d !== day)
        : [...prev.tradingDays, day];
      return { ...prev, tradingDays: newDays };
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GoldCoinLoader label="Syncing vault schedules..." />
      </div>
    );
  }

  return (
    <div className="container animate-in stagger-1" style={{ padding: '20px 15px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <h1
          style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff', marginBottom: '0.5rem', flexWrap: 'wrap' }}
          className="text-gradient-gold"
        >
          <Clock size={32} color="var(--gold)" style={{ filter: 'drop-shadow(0 0 10px var(--gold-glow))' }} />
          Trading Schedule
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Define operational hours and active days for the trading floor.
        </p>
      </div>

      {/* Info Banner */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        padding: '1.25rem', 
        background: 'rgba(212,175,55,0.05)', 
        border: '1px solid rgba(212,175,55,0.15)', 
        borderRadius: '12px',
        marginBottom: '2rem',
        alignItems: 'flex-start'
      }}>
        <Info size={20} color="var(--gold)" style={{ marginTop: '3px', flexShrink: 0 }} />
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Trading restrictions are enforced both in the UI and on the server. If the market is closed, 
          users will see an overlay and all trade requests will be rejected with a 403 error.
          <br />
          <strong style={{ color: 'var(--gold)' }}>Current Server Time:</strong> {serverTime ? serverTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Syncing...'}
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            background: feedback.type === 'success' ? 'rgba(0,255,102,0.08)' : 'rgba(255,0,85,0.08)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(0,255,102,0.3)' : 'rgba(255,0,85,0.3)'}`,
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {feedback.type === 'success' ? <CheckCircle size={18} color="var(--success)" /> : <AlertCircle size={18} color="var(--danger)" />}
          <span style={{ fontSize: '0.95rem', color: feedback.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>{feedback.message}</span>
        </div>
      )}

      {/* Configuration Cards */}
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        
        {/* Hours Card */}
        <div className="audit-glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Clock size={20} color="var(--gold)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Daily Trading Hours</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Start Time</label>
              <input
                type="time"
                value={schedule.tradingStartTime}
                onChange={(e) => setSchedule(prev => ({ ...prev, tradingStartTime: e.target.value }))}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', alignSelf: 'flex-end', paddingBottom: '12px', color: 'var(--text-muted)' }}>to</div>
            
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>End Time</label>
              <input
                type="time"
                value={schedule.tradingEndTime}
                onChange={(e) => setSchedule(prev => ({ ...prev, tradingEndTime: e.target.value }))}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Days Card */}
        <div className="audit-glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Calendar size={20} color="var(--gold)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Trading Days</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = schedule.tradingDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: `1px solid ${isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.05)'}`,
                    background: isSelected ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)',
                    color: isSelected ? 'var(--gold)' : 'var(--text-muted)',
                    fontSize: '0.9rem',
                    fontWeight: isSelected ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    textAlign: 'center'
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem', paddingBottom: '3rem' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-gold"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 3rem',
            fontSize: '1.1rem',
            fontWeight: 800,
            borderRadius: '14px',
            boxShadow: '0 10px 20px rgba(212,175,55,0.2)',
            transition: 'all 0.3s ease',
            opacity: saving ? 0.7 : 1,
            transform: saving ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          {saving ? <GoldCoinLoader mini label={null} /> : <Save size={20} />}
          {saving ? 'Updating...' : 'Save Schedule'}
        </button>
      </div>

    </div>
  );
}
