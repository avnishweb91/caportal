import { useState, useMemo } from 'react';
import './AcknowledgmentPage.css';

export const ACK_TYPES = [
  { val: 'itr',   label: 'ITR',   cls: 'pill-blue'   },
  { val: 'gst',   label: 'GST',   cls: 'pill-green'  },
  { val: 'tds',   label: 'TDS',   cls: 'pill-purple' },
  { val: 'other', label: 'Other', cls: 'pill-gray'   },
];

const EMPTY = { clientId: '', type: 'itr', refNo: '', period: '', filedDate: '', notes: '' };

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

export default function AcknowledgmentPage({ clients, onUpdateClient, showToast, onSelectClient }) {
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAdd,    setShowAdd]    = useState(false);
  const [form,       setForm]       = useState(EMPTY);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const allAcks = useMemo(() => {
    const rows = [];
    for (const c of clients) {
      for (const a of (c.acknowledgments || [])) {
        rows.push({ ...a, clientId: c.id, clientName: c.name, pan: c.pan });
      }
    }
    return rows.sort((a, b) => new Date(b.filedDate) - new Date(a.filedDate));
  }, [clients]);

  const filtered = allAcks.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || a.clientName.toLowerCase().includes(q)
      || a.pan.toLowerCase().includes(q)
      || a.refNo.toLowerCase().includes(q)
      || (a.notes || '').toLowerCase().includes(q)
      || (a.period || '').toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || a.type === typeFilter;
    return matchSearch && matchType;
  });

  const save = () => {
    if (!form.clientId || !form.refNo.trim()) {
      showToast('Select a client and enter a ref number', 'error'); return;
    }
    const client = clients.find(c => String(c.id) === String(form.clientId));
    if (!client) return;
    const ti = ACK_TYPES.find(t => t.val === form.type);
    const newAck = {
      id: Date.now(), type: form.type,
      refNo: form.refNo.trim(), period: form.period.trim(),
      filedDate: form.filedDate || new Date().toISOString().split('T')[0],
      notes: form.notes.trim(),
    };
    onUpdateClient(client.id, {
      acknowledgments: [...(client.acknowledgments || []), newAck],
      timeline: [
        { action: `${ti.label} ack recorded: ${newAck.refNo}`, time: 'Just now', type: 'green' },
        ...client.timeline,
      ],
    });
    showToast(`Acknowledgment saved for ${client.name}`);
    setForm(EMPTY);
    setShowAdd(false);
  };

  const typeInfo = (val) => ACK_TYPES.find(t => t.val === val) || ACK_TYPES[3];

  return (
    <div className="page">
      <div className="page-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="page-title">Acknowledgment Tracker</span>
          <span className="page-breadcrumb">/ ITR · GST · TDS filings</span>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(a => !a)}>
            {showAdd ? '✕ Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="ack-add-panel">
          <div className="ack-add-row">
            <div className="ack-field">
              <label className="ack-label">Client</label>
              <select className="select input" value={form.clientId} onChange={e => set('clientId', e.target.value)}>
                <option value="">— Select —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="ack-field">
              <label className="ack-label">Type</label>
              <select className="select input" value={form.type} onChange={e => set('type', e.target.value)}>
                {ACK_TYPES.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
              </select>
            </div>
            <div className="ack-field ack-field-grow">
              <label className="ack-label">Ref / Ack No.</label>
              <input className="input" placeholder="e.g. 327010170920256 or ARN…"
                value={form.refNo} onChange={e => set('refNo', e.target.value)} />
            </div>
            <div className="ack-field">
              <label className="ack-label">Period / AY</label>
              <input className="input" style={{ maxWidth: 130 }} placeholder="AY 2025-26"
                value={form.period} onChange={e => set('period', e.target.value)} />
            </div>
            <div className="ack-field">
              <label className="ack-label">Filed date</label>
              <input className="input" type="date" style={{ maxWidth: 140 }}
                value={form.filedDate} onChange={e => set('filedDate', e.target.value)} />
            </div>
            <div className="ack-field ack-field-grow">
              <label className="ack-label">Notes (optional)</label>
              <input className="input" placeholder="e.g. e-verified via Aadhaar OTP"
                value={form.notes} onChange={e => set('notes', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && save()} />
            </div>
            <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end', marginBottom: 1 }}
              onClick={save}>Save</button>
          </div>
        </div>
      )}

      <div className="ack-toolbar">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input className="input search-input" placeholder="Search client, PAN, ref no, period…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="ack-type-filters">
          {[{ val: 'all', label: 'All' }, ...ACK_TYPES].map(t => (
            <button key={t.val}
              className={`ack-type-btn ${typeFilter === t.val ? 'active' : ''}`}
              onClick={() => setTypeFilter(t.val)}>{t.label}
            </button>
          ))}
        </div>
        <span className="ack-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="ack-table-wrap">
        <div className="ack-thead">
          <div className="ack-th">Client</div>
          <div className="ack-th">Type</div>
          <div className="ack-th">Ref / Ack No.</div>
          <div className="ack-th">Period / AY</div>
          <div className="ack-th">Filed date</div>
          <div className="ack-th">Notes</div>
        </div>

        {filtered.map(a => {
          const ti = typeInfo(a.type);
          return (
            <div className="ack-row" key={a.id}
              onClick={() => onSelectClient(clients.find(c => c.id === a.clientId))}>
              <div className="ack-td">
                <div className="ack-client-name">{a.clientName}</div>
                <div className="ack-client-pan">{a.pan}</div>
              </div>
              <div className="ack-td"><span className={`pill ${ti.cls}`}>{ti.label}</span></div>
              <div className="ack-td ack-ref">{a.refNo || '—'}</div>
              <div className="ack-td">{a.period || '—'}</div>
              <div className="ack-td ack-date">{fmtDate(a.filedDate)}</div>
              <div className="ack-td ack-notes">{a.notes || '—'}</div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="ack-empty">
            {search || typeFilter !== 'all'
              ? `No records match "${search || typeFilter}"`
              : 'No acknowledgments yet — click + Add to record your first filing'}
          </div>
        )}
      </div>
    </div>
  );
}
