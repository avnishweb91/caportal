import { useState } from 'react';
import './AuthPage.css';

const DEMO = { email: 'demo@caportal.in', password: 'demo1234', name: 'Rahul Mishra', role: 'CA · Bengaluru' };

export default function AuthPage({ onLogin, defaultTab = 'signin' }) {
  const [tab, setTab] = useState(defaultTab);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '', general: '' })); };

  const signIn = async () => {
    const e = {};
    if (!form.email.trim())    e.email    = 'Email is required';
    if (!form.password.trim()) e.password = 'Password is required';
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    await delay(700);

    if (form.email === DEMO.email && form.password === DEMO.password) {
      return commit(DEMO);
    }
    const users = getUsers();
    const user = users.find(u => u.email === form.email && u.password === form.password);
    if (user) return commit(user);
    setErrors({ general: 'Incorrect email or password' });
    setLoading(false);
  };

  const signUp = async () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!form.email.trim())   e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password)       e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'At least 8 characters';
    if (form.password !== form.confirm) e.confirm = "Passwords don't match";
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    await delay(700);

    const users = getUsers();
    if (users.find(u => u.email === form.email)) {
      setErrors({ email: 'Account already exists — sign in instead' });
      setLoading(false);
      return;
    }
    const newUser = { name: form.name.trim(), email: form.email.trim(), password: form.password, role: 'CA' };
    localStorage.setItem('ca_users', JSON.stringify([...users, newUser]));
    commit(newUser);
  };

  const commit = (user) => {
    const { password: _, ...safe } = user;
    localStorage.setItem('ca_auth', JSON.stringify(safe));
    onLogin(safe);
  };

  const useDemo = () => {
    setForm(f => ({ ...f, email: DEMO.email, password: DEMO.password }));
    setErrors({});
    setTab('signin');
    setTimeout(async () => {
      setLoading(true);
      await delay(600);
      commit(DEMO);
    }, 50);
  };

  const submit = tab === 'signin' ? signIn : signUp;

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-box">CA</div>
          CAPortal
        </div>
        <p className="auth-tagline-text">Modern practice management for Indian CAs</p>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'signin' ? 'active' : ''}`} onClick={() => setTab('signin')}>Sign in</button>
          <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>Create account</button>
        </div>

        {errors.general && <div className="auth-alert">{errors.general}</div>}

        <div className="auth-form">
          {tab === 'signup' && (
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Rahul Mishra, CA"
                value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className={`input ${errors.email ? 'input-error' : ''}`} type="email" placeholder="you@yourfirm.com"
              value={form.email} onChange={e => set('email', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="form-label">Password</label>
              {tab === 'signin' && <button className="auth-link-btn" type="button">Forgot password?</button>}
            </div>
            <input className={`input ${errors.password ? 'input-error' : ''}`} type="password"
              placeholder={tab === 'signup' ? 'Min. 8 characters' : '••••••••'}
              value={form.password} onChange={e => set('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          {tab === 'signup' && (
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input className={`input ${errors.confirm ? 'input-error' : ''}`} type="password" placeholder="••••••••"
                value={form.confirm} onChange={e => set('confirm', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && signUp()} />
              {errors.confirm && <span className="form-error">{errors.confirm}</span>}
            </div>
          )}

          <button className="btn btn-primary auth-submit" onClick={submit} disabled={loading}>
            {loading ? <span className="auth-spinner" /> : tab === 'signin' ? 'Sign in →' : 'Create account →'}
          </button>

          <div className="auth-divider"><span>or</span></div>

          <button className="btn btn-ghost auth-demo-btn" onClick={useDemo} disabled={loading}>
            ▷ &nbsp;Continue with demo account
          </button>
        </div>

        <p className="auth-legal">
          By continuing you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>
        </p>
      </div>

      <div className="auth-side">
        <div className="auth-quote">"Saves me 2 hours every day during ITR season."</div>
        <div className="auth-quote-name">— Preethi Venkataraman, CA · Chennai</div>
        <div className="auth-stats">
          {[['4L+','Registered CAs'],['₹0','WhatsApp chasing'],['2h','Saved per day']].map(([v, l]) => (
            <div key={l} className="auth-stat">
              <div className="auth-stat-val">{v}</div>
              <div className="auth-stat-label">{l}</div>
            </div>
          ))}
        </div>
        <div className="auth-features">
          {['Document collection portal','Auto WhatsApp reminders','ITR & GST deadline calendar','Fee invoicing + UPI payments'].map(f => (
            <div key={f} className="auth-feature-item">
              <span className="auth-feature-check">✓</span> {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const delay = ms => new Promise(r => setTimeout(r, ms));
const getUsers = () => { try { return JSON.parse(localStorage.getItem('ca_users') || '[]'); } catch { return []; } };
