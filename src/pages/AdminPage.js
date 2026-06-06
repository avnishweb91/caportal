import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseSignOut } from '../lib/supabase';
import './AdminPage.css';

const ADMIN_EMAIL = 'avnishweb91@gmail.com';

const PLAN_COLORS = {
  trial:   'var(--text3)',
  starter: 'var(--accent)',
  pro:     'var(--green)',
  firm:    'var(--purple)',
};

export default function AdminPage({ user }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('admin_get_stats');
      if (rpcError) throw rpcError;
      setStats(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin, fetchStats]);

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <div className="admin-denied-icon">⛔</div>
        <div className="admin-denied-title">Access denied</div>
        <div className="admin-denied-sub">This page is restricted to CAPortal administrators.</div>
      </div>
    );
  }

  const paid = stats ? (stats.starter ?? 0) + (stats.pro ?? 0) + (stats.firm ?? 0) : 0;

  return (
    <div className="admin-root">
      <div className="admin-header">
        <div>
          <div className="admin-title">Admin Dashboard</div>
          <div className="admin-subtitle">{user.email}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="admin-refresh-btn" onClick={fetchStats} disabled={loading}>
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
          <button className="admin-refresh-btn" onClick={async () => { await supabaseSignOut(); window.location.href = '/'; }}>
            Sign out
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* Stat cards */}
      <div className="admin-stats-grid">
        {[
          { label: 'Total signups',  value: stats?.total       ?? '—' },
          { label: 'This week',      value: stats?.this_week   ?? '—' },
          { label: 'This month',     value: stats?.this_month  ?? '—' },
          { label: 'Paid accounts',  value: loading ? '—' : paid },
        ].map(s => (
          <div className="admin-stat-card" key={s.label}>
            <div className="admin-stat-val">{s.value}</div>
            <div className="admin-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="admin-section">
        <div className="admin-section-title">Plan breakdown</div>
        <div className="admin-plan-chips">
          {['trial', 'starter', 'pro', 'firm'].map(p => (
            <div className="admin-plan-chip" key={p} style={{ borderColor: PLAN_COLORS[p] }}>
              <span className="admin-chip-name" style={{ color: PLAN_COLORS[p] }}>{p}</span>
              <span className="admin-chip-count">{stats?.[p] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User table */}
      <div className="admin-section">
        <div className="admin-section-title">
          All users
          {stats?.users && <span className="admin-count-badge">{stats.users.length}</span>}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Plan</th>
                <th>City</th>
                <th>Signed up</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="admin-table-empty">Loading users…</td></tr>
              )}
              {!loading && !stats?.users?.length && (
                <tr><td colSpan={5} className="admin-table-empty">No users yet</td></tr>
              )}
              {(stats?.users || []).map(u => (
                <tr key={u.id}>
                  <td className="admin-td-name">{u.name || '—'}</td>
                  <td className="admin-td-email">{u.email}</td>
                  <td>
                    <span className="admin-plan-badge" style={{ color: PLAN_COLORS[u.plan], borderColor: PLAN_COLORS[u.plan] }}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="admin-td-muted">{u.city || '—'}</td>
                  <td className="admin-td-muted">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
