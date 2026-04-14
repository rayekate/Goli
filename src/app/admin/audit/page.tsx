'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  User,
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

interface AuditLogEntry {
  _id: string;
  actorId: {
    _id: string;
    name: string;
    email: string;
  };
  actorRole: string;
  action: string;
  targetType: string;
  details: any;
  ip: string;
  createdAt: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async (p = 1) => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/audit?page=${p}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setPage(data.page);
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GoldCoinLoader label="Accessing classified logs..." />
      </div>
    );
  }

  return (
    <div className="container animate-in stagger-1" style={{ padding: '20px 15px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)', marginBottom: '0.5rem', flexWrap: 'wrap' }}
            className="text-gradient-gold"
          >
            <ShieldCheck size={32} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 10px var(--gold-glow))' }} />
            Security Audit Logs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
            Permanent immutable record of all administrative and critical system actions.
          </p>
        </div>
        
        <button 
          onClick={() => fetchLogs(page)} 
          disabled={refreshing}
          style={{
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            padding: '0.75rem 1.25rem',
            borderRadius: '100px',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: 600
          }}
        >
          {refreshing ? <GoldCoinLoader mini label={null} /> : <Activity size={18} />}
          Refresh
        </button>
      </div>

      {/* Logs Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr>
              <th style={{ background: 'var(--surface-hover)', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actor</th>
              <th style={{ background: 'var(--surface-hover)', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
              <th style={{ background: 'var(--surface-hover)', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</th>
              <th style={{ background: 'var(--surface-hover)', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IP Address</th>
              <th style={{ background: 'var(--surface-hover)', padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Activity size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                  <p>No audit entries found.</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} style={{ background: 'transparent', borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', background: 'rgba(212,175,55,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} color="var(--accent)" />
                      </div>
                      <div>
                        <div style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }}>{log.actorId?.name || 'Unknown'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{log.actorId?.email || 'System'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.35rem 0.85rem', 
                      borderRadius: '100px', 
                      background: 'var(--surface-hover)', 
                      border: '1px solid var(--border-highlight)',
                      fontSize: '0.7rem',
                      color: 'var(--text)',
                      fontWeight: 800,
                      letterSpacing: '0.05em'
                    }}>
                      {log.action.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {JSON.stringify(log.details)}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                    {log.ip || '127.0.0.1'}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem', borderTop: '1px solid var(--border)', gap: '1rem', background: 'var(--surface)' }}>
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              style={{
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                padding: '0.5rem 1rem',
                borderRadius: '100px',
                color: 'var(--text)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
              Page {page} of {totalPages}
            </div>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              style={{
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                padding: '0.5rem 1rem',
                borderRadius: '100px',
                color: 'var(--text)',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                opacity: page === totalPages ? 0.5 : 1
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
