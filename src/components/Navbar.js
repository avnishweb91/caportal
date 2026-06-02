import { useState } from 'react';
import './Navbar.css';

export default function Navbar({ currentScreen, setScreen, user, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const screens = [
    { id: 'landing',    label: 'Landing' },
    { id: 'dashboard',  label: 'Dashboard' },
    { id: 'portal',     label: 'Client portal' },
  ];

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'CA';

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-logo">
          <div className="navbar-logo-icon">CA</div>
          CAPortal
        </div>
        <div className="navbar-screens">
          {screens.map(s => (
            <button key={s.id}
              className={`navbar-tab ${currentScreen === s.id || (currentScreen === 'detail' && s.id === 'dashboard') ? 'active' : ''}`}
              onClick={() => setScreen(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-status">
          <div className="status-dot" />
          ITR season active
        </div>

        {user ? (
          <>
            <button className="btn btn-primary btn-sm" onClick={() => setScreen('dashboard')}>Open app</button>
            <div className="navbar-avatar-wrap">
              <div className="navbar-avatar" onClick={() => setShowUserMenu(m => !m)}>
                {initials}
              </div>
              {showUserMenu && (
                <div className="navbar-user-menu" onClick={() => setShowUserMenu(false)}>
                  <div className="num-user-info">
                    <div className="num-name">{user.name || user.email}</div>
                    <div className="num-email">{user.email || user.role || 'CA'}</div>
                  </div>
                  <div className="num-divider" />
                  <button className="num-item" onClick={() => setScreen('dashboard')}>⊞ Dashboard</button>
                  <button className="num-item" onClick={() => setScreen('invoices')}>₹ Invoices</button>
                  <div className="num-divider" />
                  <button className="num-item num-item-danger" onClick={onLogout}>⎋ Sign out</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setScreen('auth')}>Sign in</button>
            <button className="btn btn-primary btn-sm" onClick={() => setScreen('auth')}>Start free trial</button>
          </>
        )}
      </div>
    </nav>
  );
}
