import { useState } from 'react';
import { deadlines as initialDeadlines } from '../data/mockData';

const categories = ['All', 'Income Tax', 'GST', 'TDS'];

export default function DeadlinesPage({ showToast }) {
  const [deadlines, setDeadlines] = useState(initialDeadlines);
  const [catFilter, setCatFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [newDl, setNewDl] = useState({ name: '', date: '', category: 'Income Tax', daysLeft: '' });

  const shown = catFilter === 'All' ? deadlines : deadlines.filter(d => d.category === catFilter);

  const addDeadline = () => {
    if (!newDl.name.trim() || !newDl.date.trim()) return;
    const urgency = Number(newDl.daysLeft) < 14 ? 'urgent' : Number(newDl.daysLeft) < 30 ? 'soon' : 'ok';
    setDeadlines(prev => [...prev, { ...newDl, id: Date.now(), daysLeft: Number(newDl.daysLeft) || 0, urgency }]);
    setNewDl({ name: '', date: '', category: 'Income Tax', daysLeft: '' });
    setShowAdd(false);
    showToast('Deadline added');
  };

  const removeDeadline = (id) => {
    setDeadlines(prev => prev.filter(d => d.id !== id));
    showToast('Deadline removed');
  };

  const urgencyColor = (u) => u === 'urgent' ? 'var(--red)' : u === 'soon' ? 'var(--amber)' : 'var(--green)';
  const urgencyBg    = (u) => u === 'urgent' ? 'var(--red-dim)' : u === 'soon' ? 'var(--amber-dim)' : 'var(--green-dim)';
  const pillCls      = (u) => u === 'urgent' ? 'pill-red' : u === 'soon' ? 'pill-amber' : 'pill-green';

  return (
    <div className="page">
      <div className="page-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="page-title">Deadlines</span>
          <span className="page-breadcrumb">/ FY 2025–26</span>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(s => !s)}>
            + Add deadline
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 4, flexShrink: 0 }}>
        {categories.map(c => (
          <button key={c} className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setCatFilter(c)}>{c}</button>
        ))}
      </div>

      <div className="page-body">
        {showAdd && (
          <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>New deadline</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.8fr auto', gap: 8, alignItems: 'end' }}>
              <div className="form-group">
                <label className="form-label">Deadline name</label>
                <input className="input" placeholder="e.g. Advance tax Q2" value={newDl.name} onChange={e => setNewDl(d => ({ ...d, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="input" placeholder="Sep 15, 2026" value={newDl.date} onChange={e => setNewDl(d => ({ ...d, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="select input" value={newDl.category} onChange={e => setNewDl(d => ({ ...d, category: e.target.value }))}>
                  {['Income Tax','GST','TDS','Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Days left</label>
                <input className="input" type="number" placeholder="105" value={newDl.daysLeft} onChange={e => setNewDl(d => ({ ...d, daysLeft: e.target.value }))} style={{ fontFamily: 'var(--mono)' }} />
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-primary btn-sm" onClick={addDeadline}>Add</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>✕</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map(d => (
            <div key={d.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: urgencyBg(d.urgency), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--mono)', color: urgencyColor(d.urgency), lineHeight: 1 }}>{d.daysLeft}</div>
                <div style={{ fontSize: 8, color: urgencyColor(d.urgency), textTransform: 'uppercase', letterSpacing: '0.05em' }}>days</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{d.date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pill pill-gray">{d.category}</span>
                <span className={`pill ${pillCls(d.urgency)}`}>
                  {d.urgency === 'urgent' ? '⚡ Urgent' : d.urgency === 'soon' ? '⏰ Soon' : '✓ On track'}
                </span>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text3)' }}
                  onClick={() => removeDeadline(d.id)}>✕</button>
              </div>
            </div>
          ))}
          {shown.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
              No deadlines in this category
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
