import { useState } from 'react';
import { getSettings } from '../lib/utils';
import './SettingsPage.css';

const getProfile = () => {
  try {
    const auth = JSON.parse(localStorage.getItem('ca_auth') || '{}');
    const extra = JSON.parse(localStorage.getItem('ca_profile') || '{}');
    return { ...auth, ...extra };
  } catch { return {}; }
};

export default function SettingsPage({ user, setUser, showToast }) {
  const savedProfile = getProfile();
  const savedSettings = getSettings();

  const [profile, setProfile] = useState({
    name:  savedProfile.name  || '',
    email: savedProfile.email || '',
    firm:  savedProfile.firm  || '',
    city:  savedProfile.city  || '',
    phone: savedProfile.phone || '',
  });

  const [keys, setKeys] = useState({
    razorpayKey: savedSettings.razorpayKey || '',
    gupshupKey:  savedSettings.gupshupKey  || '',
    resendKey:   savedSettings.resendKey   || '',
  });

  const [showKeys, setShowKeys] = useState({});
  const [tab, setTab] = useState('profile');

  const setP = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const setK = (k, v) => setKeys(k2 => ({ ...k2, [k]: v }));
  const toggleShow = (k) => setShowKeys(s => ({ ...s, [k]: !s[k] }));

  const saveProfile = () => {
    const extra = { firm: profile.firm, city: profile.city, phone: profile.phone };
    localStorage.setItem('ca_profile', JSON.stringify(extra));
    const updatedAuth = { ...JSON.parse(localStorage.getItem('ca_auth') || '{}'), name: profile.name };
    localStorage.setItem('ca_auth', JSON.stringify(updatedAuth));
    setUser(u => ({ ...u, name: profile.name }));
    showToast('Profile saved');
  };

  const saveKeys = () => {
    localStorage.setItem('ca_settings', JSON.stringify(keys));
    showToast('Integration keys saved');
  };

  const exportData = () => {
    const data = {
      profile,
      clients: JSON.parse(localStorage.getItem('ca_clients') || '[]'),
      reminders: JSON.parse(localStorage.getItem('ca_reminders') || '[]'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `caportal-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported');
  };

  const clearData = () => {
    if (!window.confirm('This will delete ALL client data. Are you sure?')) return;
    localStorage.removeItem('ca_clients');
    showToast('All client data cleared. Reload to see the empty state.');
  };

  const initials = profile.name
    ? profile.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'CA';

  return (
    <div className="page">
      <div className="page-toolbar">
        <span className="page-title">Settings</span>
      </div>

      <div className="settings-layout">
        <div className="settings-tabs">
          {[['profile','Profile'],['integrations','Integrations'],['practice','Practice'],['data','Data']].map(([id, label]) => (
            <button key={id} className={`stab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {tab === 'profile' && (
            <div className="settings-section">
              <div className="settings-avatar-row">
                <div className="settings-avatar">{initials}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{profile.name || 'Your Name'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{profile.email}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Display name</label>
                  <input className="input" placeholder="Rahul Mishra" value={profile.name} onChange={e => setP('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="input" value={profile.email} readOnly style={{ opacity: 0.6 }} />
                  <span className="form-hint">Email cannot be changed here</span>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Firm / Practice name</label>
                  <input className="input" placeholder="Mishra & Associates" value={profile.firm} onChange={e => setP('firm', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="input" placeholder="Bengaluru" value={profile.city} onChange={e => setP('city', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="input" placeholder="+91 98765 43210" value={profile.phone} onChange={e => setP('phone', e.target.value)} style={{ maxWidth: 260 }} />
              </div>
              <div style={{ marginTop: 6 }}>
                <button className="btn btn-primary" onClick={saveProfile}>Save profile</button>
              </div>
              <div className="settings-note">Your name and firm appear on invoices sent to clients.</div>
            </div>
          )}

          {tab === 'integrations' && (
            <div className="settings-section">
              <div className="int-card">
                <div className="int-header">
                  <div className="int-logo int-razorpay">₹</div>
                  <div>
                    <div className="int-name">Razorpay</div>
                    <div className="int-desc">Collect fees via UPI, cards, netbanking. Get your key at razorpay.com/app/keys</div>
                  </div>
                  <span className={`pill ${keys.razorpayKey ? 'pill-green' : 'pill-gray'}`}>
                    {keys.razorpayKey ? 'Connected' : 'Not set'}
                  </span>
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="form-label">API Key</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className="input" style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11 }}
                      type={showKeys.razorpay ? 'text' : 'password'}
                      placeholder="rzp_test_XXXXXXXXXX"
                      value={keys.razorpayKey} onChange={e => setK('razorpayKey', e.target.value)} />
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleShow('razorpay')}>
                      {showKeys.razorpay ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <span className="form-hint">Use rzp_test_... for testing, rzp_live_... for production</span>
                </div>
              </div>

              <div className="int-card">
                <div className="int-header">
                  <div className="int-logo int-whatsapp">💬</div>
                  <div>
                    <div className="int-name">Gupshup (WhatsApp)</div>
                    <div className="int-desc">Send automated document reminders via WhatsApp. India-first, ₹0.35/message. gupshup.io</div>
                  </div>
                  <span className={`pill ${keys.gupshupKey ? 'pill-green' : 'pill-gray'}`}>
                    {keys.gupshupKey ? 'Connected' : 'Not set'}
                  </span>
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="form-label">API Key</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className="input" style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11 }}
                      type={showKeys.gupshup ? 'text' : 'password'}
                      placeholder="gupshup_api_key_here"
                      value={keys.gupshupKey} onChange={e => setK('gupshupKey', e.target.value)} />
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleShow('gupshup')}>
                      {showKeys.gupshup ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="int-card">
                <div className="int-header">
                  <div className="int-logo int-email">✉</div>
                  <div>
                    <div className="int-name">Resend (Email)</div>
                    <div className="int-desc">Email clients when ITR is filed, or when you need documents. resend.com — free up to 3,000/month</div>
                  </div>
                  <span className={`pill ${keys.resendKey ? 'pill-green' : 'pill-gray'}`}>
                    {keys.resendKey ? 'Connected' : 'Not set'}
                  </span>
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="form-label">API Key</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className="input" style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11 }}
                      type={showKeys.resend ? 'text' : 'password'}
                      placeholder="re_xxxxxxxxxx"
                      value={keys.resendKey} onChange={e => setK('resendKey', e.target.value)} />
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleShow('resend')}>
                      {showKeys.resend ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={saveKeys}>Save integration keys</button>
              <div className="settings-note">Keys are saved locally. When you deploy to Vercel, add them as environment variables instead.</div>
            </div>
          )}

          {tab === 'practice' && (
            <div className="settings-section">
              <div className="plan-card">
                <div className="plan-name">Pro plan</div>
                <div className="plan-limit">Up to 100 clients · ₹1,799/month</div>
                <div className="plan-features">
                  {['Document portal for all clients','WhatsApp reminders','Filing status tracker','Fee invoicing + UPI payments','Practice analytics dashboard','Priority support'].map(f => (
                    <div key={f} className="plan-feature"><span style={{ color: 'var(--green)' }}>✓</span> {f}</div>
                  ))}
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => showToast('Plan upgrade — contact support@caportal.in')}>
                  Upgrade to Firm plan
                </button>
              </div>
              <div className="settings-note">
                To upgrade or cancel, contact support@caportal.in · Billing powered by Razorpay
              </div>
            </div>
          )}

          {tab === 'data' && (
            <div className="settings-section">
              <div className="settings-card">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Export all data</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Download all your clients, documents, and reminders as a JSON file. Use this as a backup before migrating to Supabase.</div>
                <button className="btn btn-ghost" onClick={exportData}>📥 Download backup (JSON)</button>
              </div>

              <div className="settings-card" style={{ borderColor: 'rgba(245,101,101,0.2)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 6 }}>Clear all client data</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Permanently deletes all clients from this browser. This cannot be undone. Export a backup first.</div>
                <button className="btn btn-danger" onClick={clearData}>⚠ Clear all data</button>
              </div>

              <div className="settings-card">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Connect Supabase</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.7 }}>
                  Right now data lives in this browser only. Connect Supabase to sync across devices and share with team members.<br /><br />
                  <strong style={{ color: 'var(--text2)' }}>Steps:</strong> Create a project at supabase.com → copy URL + anon key → add to your Vercel environment variables as <code style={{ fontFamily: 'var(--mono)', background: 'var(--bg3)', padding: '1px 4px', borderRadius: 3, fontSize: 11 }}>REACT_APP_SUPABASE_URL</code> and <code style={{ fontFamily: 'var(--mono)', background: 'var(--bg3)', padding: '1px 4px', borderRadius: 3, fontSize: 11 }}>REACT_APP_SUPABASE_ANON_KEY</code> → run the SQL from <code style={{ fontFamily: 'var(--mono)', background: 'var(--bg3)', padding: '1px 4px', borderRadius: 3, fontSize: 11 }}>supabase-schema.sql</code>.
                </div>
                <button className="btn btn-ghost" onClick={() => window.open('https://supabase.com', '_blank')}>Open Supabase →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
