'use client';

import React, { useState, useEffect } from 'react';
import { Shield, User as UserIcon, Lock, CheckCircle2, AlertCircle, Bell, Wallet, Send, Eye, EyeOff, Settings, Save, KeyRound, XCircle, AtSign } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'wallet'>('profile');
  const router = useRouter();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [withdrawalOtpEnabled, setWithdrawalOtpEnabled] = useState(false);
  const [notifications, setNotifications] = useState({
    platformBroadcasts: true,
    financialConfirmations: true,
    marketAlerts: false,
    securityAlerts: true,
  });
  const [payoutWallet, setPayoutWallet] = useState({ address: '', network: '' });

  const [msg, setMsg] = useState({ text: '', type: '' });
  const [initialized, setInitialized] = useState(false);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);



  // Populate form fields from live user context
  useEffect(() => {
    if (user && !initialized) {
      setName(user.name);
      setUsername(user.username || '');
      setTwoFactorEnabled(user.twoFactorEnabled || false);
      setWithdrawalOtpEnabled(user.withdrawalOtpEnabled || false);
      if (user.notifications) setNotifications(user.notifications);
      if (user.payoutWallet) setPayoutWallet(user.payoutWallet);
      setInitialized(true);
    }
  }, [user, initialized]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          twoFactorEnabled,
          withdrawalOtpEnabled,
          notifications,
          payoutWallet,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: 'Settings updated successfully.', type: 'success' });
        await refreshUser();
      } else {
        setMsg({ text: data.error || 'Update failed', type: 'error' });
      }
    } catch {
      setMsg({ text: 'Network error', type: 'error' });
    }
    setSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg({ text: '', type: '' });

    if (newPassword !== confirmNewPassword) {
      setPwMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ text: 'New password must be at least 8 characters.', type: 'error' });
      return;
    }

    setChangingPw(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ text: 'Password changed successfully.', type: 'success' });
      } else {
        setPwMsg({ text: data.error || 'Password change failed', type: 'error' });
      }
    } catch {
      setPwMsg({ text: 'Network error', type: 'error' });
    }
    // Always clear password fields from memory
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setChangingPw(false);
  };

  if (authLoading || !user) {
    return (
      <div style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <GoldCoinLoader label="Loading your preferences..." />
      </div>
    );
  }

  const tabs = [
    { key: 'profile' as const, label: 'Profile', icon: <UserIcon size={18} /> },
    { key: 'security' as const, label: 'Security', icon: <Shield size={18} /> },
    { key: 'notifications' as const, label: 'Notifications', icon: <Bell size={18} /> },
    { key: 'wallet' as const, label: 'Payout Wallet', icon: <Wallet size={18} /> },
  ];

  return (
    <div className="container animate-in stagger-1" style={{ padding: '20px 15px 40px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))',
            border: '1px solid rgba(234,179,8,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings size={22} color="var(--gold)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: '#fff', lineHeight: 1.2 }} className="text-gradient-gold">Account Settings</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Manage your profile, security, and preferences</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1.5rem',
        background: 'var(--glass-bg)', borderRadius: '12px', padding: '4px',
        border: '1px solid var(--border)', overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: '1 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.65rem 0.75rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s',
              background: activeTab === tab.key ? 'rgba(234,179,8,0.12)' : 'transparent',
              color: activeTab === tab.key ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--gold)' : '2px solid transparent',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Global Message */}
      {msg.text && (
        <div style={{
          padding: '0.85rem 1rem', marginBottom: '1.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          color: msg.type === 'success' ? '#10B981' : '#EF4444',
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <div className="glass-card animate-in" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--gold), #B8860B)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem', fontWeight: 700, color: '#000',
              }}>
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.15rem' }}>{user.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{user.username && <span style={{ color: 'var(--gold)' }}>@{user.username}</span>} · {user.email}</p>
              </div>
            </div>

            <div className="input-group">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div className="input-group">
              <label>Username</label>
              <div style={{ position: 'relative' }}>
                <AtSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text" value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  required minLength={3} maxLength={20}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>3-20 characters. Letters, numbers, and underscores only.</small>
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input type="email" value={user.email} disabled style={{ opacity: 0.4, cursor: 'not-allowed' }} />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Email cannot be changed</small>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap: '0.5rem' }}>
                {saving ? <GoldCoinLoader mini label={null} /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* ── Security Tab ── */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card animate-in" style={{ padding: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '1.25rem', fontSize: '1.1rem' }}>
                <Shield size={20} color="#10B981" /> Security Options
              </h3>

              <div style={toggleCardStyle}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#fff', marginBottom: '0.2rem', fontSize: '0.95rem' }}>Two-Factor Authentication</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {twoFactorEnabled ? 'Enabled — OTP will be sent to your email on login' : 'Add an extra layer of security to your account'}
                  </p>
                </div>
                <ToggleSwitch checked={twoFactorEnabled} onChange={() => setTwoFactorEnabled(!twoFactorEnabled)} />
              </div>

              <div style={toggleCardStyle}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#fff', marginBottom: '0.2rem', fontSize: '0.95rem' }}>Withdrawal OTP</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Require a 6-digit OTP code before processing withdrawals</p>
                </div>
                <ToggleSwitch checked={withdrawalOtpEnabled} onChange={() => setWithdrawalOtpEnabled(!withdrawalOtpEnabled)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap: '0.5rem' }}>
                  {saving ? <GoldCoinLoader mini label={null} /> : <Save size={18} />}
                  Save Security Settings
                </button>
              </div>
            </div>

            {/* Password Change Card */}
            <div className="glass-card animate-in stagger-2" style={{ padding: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '1.25rem', fontSize: '1.1rem' }}>
                <KeyRound size={20} color="var(--gold)" /> Change Password
              </h3>

              {pwMsg.text && (
                <div style={{
                  padding: '0.75rem 1rem', marginBottom: '1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: pwMsg.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${pwMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  color: pwMsg.type === 'success' ? '#10B981' : '#EF4444', fontSize: '0.88rem',
                }}>
                  {pwMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {pwMsg.text}
                </div>
              )}

              <div className="input-group">
                <label>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} style={eyeBtnStyle}>
                    {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      minLength={8}
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={eyeBtnStyle}>
                      {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter password"
                      minLength={8}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <XCircle size={12} /> Does not match
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  className="btn btn-outline"
                  disabled={changingPw || !currentPassword || !newPassword || newPassword !== confirmNewPassword}
                  style={{ borderColor: 'var(--gold)', color: 'var(--gold)', gap: '0.5rem' }}
                >
                  {changingPw ? <GoldCoinLoader mini label={null} /> : <KeyRound size={18} />}
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Notifications Tab ── */}
        {activeTab === 'notifications' && (
          <div className="glass-card animate-in" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              <Send size={20} color="var(--primary)" /> Notifications
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
              Manage your notification preferences
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { key: 'platformBroadcasts' as const, label: 'Platform Broadcasts', desc: 'Maintenance alerts, announcements, system updates', icon: '📢' },
                { key: 'financialConfirmations' as const, label: 'Financial Confirmations', desc: 'Deposit approvals, withdrawal processed, balance updates', icon: '💰' },
                { key: 'marketAlerts' as const, label: 'Market Alerts', desc: 'Gold price movements and trading signals', icon: '📈' },
                { key: 'securityAlerts' as const, label: 'Security Alerts', desc: 'Login notifications, password changes, suspicious activity', icon: '🔒' },
              ].map(item => (
                <div key={item.key} style={toggleCardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                    <div>
                      <h4 style={{ color: '#fff', marginBottom: '0.15rem', fontSize: '0.95rem' }}>{item.label}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{item.desc}</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={notifications[item.key]}
                    onChange={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap: '0.5rem' }}>
                {saving ? <GoldCoinLoader mini label={null} /> : <Save size={18} />}
                Save Notification Settings
              </button>
            </div>
          </div>
        )}

        {/* ── Wallet Tab ── */}
        {activeTab === 'wallet' && (
          <div className="glass-card animate-in" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              <Wallet size={20} color="var(--gold)" /> Payout Wallet
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
              Set your default wallet address for receiving withdrawal payouts
            </p>

            <div style={{
              background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.12)',
              borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--gold)',
            }}>
              <AlertCircle size={16} />
              Make sure the wallet address is correct. Incorrect addresses may result in permanent loss of funds.
            </div>

            <div className="input-group">
              <label>Wallet Address</label>
              <div style={{ position: 'relative' }}>
                <Wallet size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="e.g. 0x... or TRC20 address"
                  value={payoutWallet.address}
                  onChange={(e) => setPayoutWallet(w => ({ ...w, address: e.target.value }))}
                  style={{ paddingLeft: '2.5rem', fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Network</label>
              <select
                value={payoutWallet.network}
                onChange={(e) => setPayoutWallet(w => ({ ...w, network: e.target.value }))}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select Network</option>
                <option value="TRC20">TRC20 (Tron)</option>
                <option value="ERC20">ERC20 (Ethereum)</option>
                <option value="BEP20">BEP20 (BSC)</option>
                <option value="SOL">Solana</option>
                <option value="BTC">Bitcoin</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap: '0.5rem' }}>
                {saving ? <GoldCoinLoader mini label={null} /> : <Save size={18} />}
                Save Wallet Settings
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────── */
const toggleCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem 1.25rem',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  marginBottom: '0.5rem',
  transition: 'border-color 0.2s',
};

const eyeBtnStyle: React.CSSProperties = {
  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0,
};

/* ─── Toggle Switch Component ─────────────────────────────────────── */
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        position: 'relative',
        width: '48px',
        height: '26px',
        borderRadius: '13px',
        border: 'none',
        cursor: 'pointer',
        background: checked ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
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
