'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Settings,
  Shield,
  DollarSign,
  Save,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';

interface WalletEntry {
  coinName: string;
  network: string;
  address: string;
  logo: string;
}

interface PlatformSettings {
  platformName: string;
  siteTitle: string;
  siteDescription: string;
  telegramUsername?: string;
  maintenanceMode: boolean;
  mandatory2FA: boolean;
  allowUser2FA: boolean;
  ticketSystem: boolean;
  withdrawalVerification: boolean;
  requireTransactionHash: boolean;
  minWithdrawal: number;
  maxWithdrawal: number;
  maxDeposit: number;
  minTrade: number;
  maxTrade: number;
  profitPercent: number;
  tradeDuration: number;
  wallets: WalletEntry[];
  walletBTC: string;
  walletETH: string;
  walletUSDT: string;
}

const defaultSettings: PlatformSettings = {
  platformName: 'Gold Trading Platform',
  siteTitle: 'GoldXchange',
  siteDescription: 'Institutional Gold Trading Terminal',
  telegramUsername: '',
  maintenanceMode: false,
  mandatory2FA: false,
  allowUser2FA: true,
  ticketSystem: true,
  withdrawalVerification: true,
  requireTransactionHash: true,
  minWithdrawal: 10,
  maxWithdrawal: 50000,
  maxDeposit: 100000,
  minTrade: 1,
  maxTrade: 10000,
  profitPercent: 80,
  tradeDuration: 60,
  wallets: [],
  walletBTC: '',
  walletETH: '',
  walletUSDT: '',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        setFeedback({ type: 'success', message: 'Settings saved successfully' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to save' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const toggle = (field: keyof PlatformSettings) => {
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const update = (field: keyof PlatformSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading)
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <GoldCoinLoader label="Loading platform settings..." />
      </div>
    );

  const sectionStyle: React.CSSProperties = {
    marginBottom: '2rem',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border)',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '10px',
    marginBottom: '0.5rem',
    border: '1px solid var(--border)',
    flexWrap: 'wrap',
    gap: '0.75rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  };

  const labelTitle: React.CSSProperties = {
    fontWeight: 600,
    color: '#fff',
    fontSize: '0.95rem',
  };

  const labelDesc: React.CSSProperties = {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '0.6rem 0.9rem',
    color: '#fff',
    fontSize: '0.9rem',
    width: '260px',
    maxWidth: '100%',
    outline: 'none',
  };

  return (
    <div className="container animate-in stagger-1" style={{ padding: '20px 15px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <h1
          style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff', marginBottom: '0.5rem', flexWrap: 'wrap' }}
          className="text-gradient-gold"
        >
          <Settings size={30} color="var(--gold)" style={{ filter: 'drop-shadow(0 0 10px var(--gold-glow))' }} />
          Platform Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Configure platform identity, security policies, financial limits, and automation.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            background: feedback.type === 'success' ? 'rgba(0,255,102,0.08)' : 'rgba(255,0,85,0.08)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(0,255,102,0.3)' : 'rgba(255,0,85,0.3)'}`,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle size={18} color="var(--success)" /> : <AlertCircle size={18} color="var(--danger)" />}
          <span style={{ fontSize: '0.9rem', color: feedback.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>{feedback.message}</span>
        </div>
      )}

      {/* ─── General ─────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <Settings size={20} color="var(--gold)" /> General
        </div>

        <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
          <div style={labelStyle}>
            <span style={labelTitle}>Platform Name</span>
            <span style={labelDesc}>Internal branding name used in emails and admin logs</span>
          </div>
          <input
            style={{ ...inputStyle, width: '100%' }}
            value={settings.platformName}
            onChange={(e) => update('platformName', e.target.value)}
          />
        </div>

        <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
          <div style={labelStyle}>
            <span style={labelTitle}>Site Title</span>
            <span style={labelDesc}>Browser tab title and SEO primary headline</span>
          </div>
          <input
            style={{ ...inputStyle, width: '100%' }}
            value={settings.siteTitle}
            onChange={(e) => update('siteTitle', e.target.value)}
          />
        </div>

        <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
          <div style={labelStyle}>
            <span style={labelTitle}>Site Description</span>
            <span style={labelDesc}>SEO meta description and social sharing text</span>
          </div>
          <textarea
            style={{ ...inputStyle, width: '100%', height: '80px', resize: 'vertical' }}
            value={settings.siteDescription}
            onChange={(e) => update('siteDescription', e.target.value)}
          />
        </div>

        <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
          <div style={labelStyle}>
            <span style={labelTitle}>Telegram Username</span>
            <span style={labelDesc}>Global support contact username (starts with @ or standard name)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              style={{ ...inputStyle, width: '260px' }}
              value={settings.telegramUsername || ''}
              onChange={(e) => update('telegramUsername', e.target.value)}
              placeholder="@goldsupport"
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Current saved handle: <strong style={{ color: 'var(--primary)' }}>{settings.telegramUsername || 'None'}</strong>
            </span>
          </div>
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={labelTitle}>Maintenance Mode</span>
            <span style={labelDesc}>Restrict user access to the platform while performing updates</span>
          </div>
          <ToggleSwitch checked={settings.maintenanceMode} onChange={() => toggle('maintenanceMode')} danger />
        </div>
      </div>

      {/* ─── Security & Access ───────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <Shield size={20} color="var(--primary)" /> Security & Access Control
        </div>

        {/* 
        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={labelTitle}>Mandatory 2FA</span>
            <span style={labelDesc}>Force all users to enable Two-Factor Authentication</span>
          </div>
          <ToggleSwitch checked={settings.mandatory2FA} onChange={() => toggle('mandatory2FA')} />
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={labelTitle}>Allow User 2FA Toggle</span>
            <span style={labelDesc}>Let users enable/disable 2FA from their settings</span>
          </div>
          <ToggleSwitch checked={settings.allowUser2FA} onChange={() => toggle('allowUser2FA')} />
        </div>
        */}

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={labelTitle}>Ticket System</span>
            <span style={labelDesc}>Enable the user support ticket system</span>
          </div>
          <ToggleSwitch checked={settings.ticketSystem} onChange={() => toggle('ticketSystem')} />
        </div>
      </div>

      {/* ─── Finance & Limits ────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <DollarSign size={20} color="var(--success)" /> Finance & Limits
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={labelTitle}>Withdrawal Verification</span>
            <span style={labelDesc}>Admin must manually approve every withdrawal request</span>
          </div>
          <ToggleSwitch checked={settings.withdrawalVerification} onChange={() => toggle('withdrawalVerification')} />
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={labelTitle}>Require Transaction Hash</span>
            <span style={labelDesc}>Users must provide a transaction hash for deposits</span>
          </div>
          <ToggleSwitch checked={settings.requireTransactionHash} onChange={() => toggle('requireTransactionHash')} />
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={labelTitle}>Minimum Withdrawal</span>
            <span style={labelDesc}>Minimum amount ($) for user withdrawal requests</span>
          </div>
          <input
            style={{ ...inputStyle, width: '140px', textAlign: 'right' }}
            type="number"
            min={0}
            step={1}
            value={settings.minWithdrawal}
            onChange={(e) => update('minWithdrawal', Math.max(0, Number(e.target.value)))}
          />
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={labelTitle}>Maximum Withdrawal</span>
            <span style={labelDesc}>Maximum amount ($) per withdrawal request</span>
          </div>
          <input
            style={{ ...inputStyle, width: '140px', textAlign: 'right' }}
            type="number"
            min={0}
            step={1}
            value={settings.maxWithdrawal}
            onChange={(e) => update('maxWithdrawal', Math.max(0, Number(e.target.value)))}
          />
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={labelTitle}>Maximum Deposit</span>
            <span style={labelDesc}>Maximum amount ($) per deposit request</span>
          </div>
          <input
            style={{ ...inputStyle, width: '140px', textAlign: 'right' }}
            type="number"
            min={0}
            step={1}
            value={settings.maxDeposit}
            onChange={(e) => update('maxDeposit', Math.max(0, Number(e.target.value)))}
          />
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={labelTitle}>Minimum Trade Amount</span>
            <span style={labelDesc}>Minimum amount ($) per trade</span>
          </div>
          <input
            style={{ ...inputStyle, width: '140px', textAlign: 'right' }}
            type="number"
            min={0}
            step={1}
            value={settings.minTrade}
            onChange={(e) => update('minTrade', Math.max(0, Number(e.target.value)))}
          />
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>
            <span style={labelTitle}>Maximum Trade Amount</span>
            <span style={labelDesc}>Maximum amount ($) per trade</span>
          </div>
          <input
            style={{ ...inputStyle, width: '140px', textAlign: 'right' }}
            type="number"
            min={0}
            step={1}
            value={settings.maxTrade}
            onChange={(e) => update('maxTrade', Math.max(0, Number(e.target.value)))}
          />
        </div>

      </div>


      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingBottom: '3rem' }}>
        <button
          className="btn btn-gold"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 2rem',
            fontSize: '1rem',
            fontWeight: 700,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? <GoldCoinLoader mini label={null} /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

/* ─── Toggle Switch Component ─────────────────────────────────────── */
function ToggleSwitch({ checked, onChange, danger }: { checked: boolean; onChange: () => void; danger?: boolean }) {
  const activeColor = danger ? 'var(--danger)' : 'var(--primary)';

  return (
    <button
      onClick={onChange}
      style={{
        position: 'relative',
        width: '48px',
        height: '26px',
        borderRadius: '13px',
        border: 'none',
        cursor: 'pointer',
        background: checked ? activeColor : 'rgba(255,255,255,0.1)',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '24px' : '3px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
}
