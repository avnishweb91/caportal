import { useState } from 'react';
import { getSettings } from '../lib/utils';
import { PLANS, getBillingStatus, payForPlan, cancelPlan } from '../lib/billing';
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
  const [payingPlan, setPayingPlan] = useState(null);
  const billing = getBillingStatus();

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
          {[['profile','Profile'],['billing','Billing'],['integrations','Integrations'],['data','Data']].map(([id, label]) => (
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

          {tab === 'billing' && (
            <div className="settings-section">
              <div className="settings-card">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:3 }}>Current plan</div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>
                      {billing.isPaid
                        ? `${billing.planName} · renews in ${billing.daysLeft} day${billing.daysLeft!==1?'s':''}`
                        : billing.isExpired
                          ? `Trial ended · ${billing.graceDaysLeft} grace day${billing.graceDaysLeft!==1?'s':''} left`
                          : `Free trial · ${billing.daysLeft} day${billing.daysLeft!==1?'s':''} remaining`}
                    </div>
                  </div>
                  <span className={`pill ${billing.isPaid?'pill-green':billing.isExpired?'pill-red':'pill-amber'}`}>
                    {billing.isPaid ? `✓ ${billing.planName}` : billing.isExpired ? 'Trial ended' : 'Free trial'}
                  </span>
                </div>
                {billing.isPaid && (
                  <button className="btn btn-ghost btn-sm" onClick={() => {
                    if (window.confirm('Cancel your subscription? You keep access until the period ends.')) {
                      cancelPlan(); showToast('Subscription cancelled');
                    }
                  }}>Cancel subscription</button>
                )}
              </div>

              {(!billing.isPaid || billing.plan !== 'firm') && (
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:10 }}>
                    {billing.isPaid ? 'Upgrade plan' : 'Subscribe now'}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {Object.values(PLANS)
                      .filter(p => !billing.isPaid || (PLANS[billing.plan]?.price || 0) < p.price)
                      .map(plan => (
                        <div key={plan.id} className="settings-card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{plan.name}</div>
                            <div style={{ fontSize:11, color:'var(--text3)' }}>
                              {plan.clientLimit ? `Up to ${plan.clientLimit} clients` : 'Unlimited'} · ₹{plan.price.toLocaleString()}/month
                            </div>
                          </div>
                          <button className="btn btn-primary btn-sm"
                            disabled={payingPlan === plan.id}
                            onClick={async () => {
                              setPayingPlan(plan.id);
                              await payForPlan(plan.id, profile.name, profile.email,
                                () => { setPayingPlan(null); showToast(`${plan.name} plan activated!`); },
                                () => setPayingPlan(null)
                              );
                              setPayingPlan(null);
                            }}>
                            {payingPlan === plan.id ? '...' : `₹${plan.price.toLocaleString()}/mo`}
                          </button>
                        </div>
                    ))}
                  </div>
                </div>
              )}

              {billing.payments.length > 0 && (
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:10 }}>Payment history</div>
                  <div className="settings-card" style={{ padding:0, overflow:'hidden' }}>
                    {billing.payments.map((p, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', borderBottom: i < billing.payments.length-1 ? '1px solid var(--border)' : 'none', fontSize:12 }}>
                        <div>
                          <div style={{ color:'var(--text)', fontWeight:500 }}>{PLANS[p.plan]?.name || p.plan} plan</div>
                          <div style={{ color:'var(--text3)', fontSize:10, fontFamily:'var(--mono)', marginTop:2 }}>
                            {new Date(p.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                            {p.id && !p.id.startsWith('manual_') ? ` · ${p.id}` : ''}
                          </div>
                        </div>
                        <div style={{ color:'var(--green)', fontWeight:700, fontFamily:'var(--mono)' }}>₹{p.amount?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="settings-note">Payments processed by Razorpay. For billing queries email support@caportal.co</div>
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
