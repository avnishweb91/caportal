import { useState } from 'react';
import { deadlines } from '../data/mockData';
import './Dashboard.css';

const statusMap = {
  filed:        { label: 'Filed',        cls: 'pill-green' },
  under_review: { label: 'Under review', cls: 'pill-blue'  },
  docs_pending: { label: 'Docs pending', cls: 'pill-red'   },
  waiting_docs: { label: 'Waiting docs', cls: 'pill-amber' },
};

const docsInfo = c => {
  const m = c.docsTotal - c.docsReceived;
  if (m === 0) return { text: 'All received', cls: 'docs-ok' };
  if (m === 1) return { text: '1 missing',    cls: 'docs-warn' };
  return { text: `${m} missing`,              cls: 'docs-bad' };
};

const statusFilters = [
  { val: 'all',         label: 'All clients' },
  { val: 'filed',       label: 'Filed' },
  { val: 'under_review',label: 'Under review' },
  { val: 'docs_pending',label: 'Docs pending' },
  { val: 'waiting_docs',label: 'Waiting docs' },
];

export default function Dashboard({ clients, onSelectClient, onAddClient, showToast }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || c.pan.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filed   = clients.filter(c => c.status === 'filed').length;
  const missing = clients.filter(c => c.status === 'docs_pending' || c.status === 'waiting_docs').length;
  const unpaidAmt = clients.filter(c => !c.feePaid).reduce((s, c) => s + c.feeAmount, 0);

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelected(selected.length === filtered.length ? [] : filtered.map(c => c.id));
  };

  const exportCSV = () => {
    const headers = ['Name', 'PAN', 'Phone', 'Email', 'Type', 'Plan', 'Status', 'Docs', 'Fee Amount', 'Fee Paid'];
    const target = selected.length > 0 ? clients.filter(c => selected.includes(c.id)) : clients;
    const rows = target.map(c => [
      c.name, c.pan, c.phone, c.email, c.type, c.plan,
      statusMap[c.status]?.label || c.status,
      `${c.docsReceived}/${c.docsTotal}`,
      c.feeAmount, c.feePaid ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'caportal-clients.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded');
    setSelected([]);
  };

  const sendBulkReminder = () => {
    const n = selected.length;
    showToast(`WhatsApp reminder sent to ${n} client${n > 1 ? 's' : ''}`);
    setSelected([]);
  };

  const recentActivity = [
    { text: `${clients.find(c=>c.id===1)?.name || 'Priya Sharma'} uploaded Form 16`, time: '2 min ago', color: 'var(--green)' },
    { text: 'Reminder sent to Vikram Textiles (bank statement)', time: '14 min ago', color: 'var(--amber)' },
    { text: 'Anand Mehta — ITR filed successfully', time: '1 hr ago', color: 'var(--green)' },
    { text: `New client added: ${clients[clients.length - 1]?.name || 'Kavitha Nair'}`, time: '3 hrs ago', color: 'var(--accent)' },
    { text: 'Invoice ₹3,500 paid by Priya Sharma', time: '5 hrs ago', color: 'var(--purple)' },
  ];

  return (
    <div className="dashboard">
      <div className="dash-toolbar">
        <div className="dash-title-row">
          <span className="dash-title">Dashboard</span>
          <span className="dash-breadcrumb">/ FY 2025–26 / ITR season</span>
        </div>
        <div className="dash-actions">
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            {deadlines[0]?.daysLeft}d to {deadlines[0]?.date.split(',')[0]}
          </span>
          <div className="pill pill-amber" style={{ marginLeft: 4 }}>⚡ Peak season</div>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={onAddClient}>+ Add client</button>
        </div>
      </div>

      <div className="metrics-strip">
        {[
          { label: 'Total clients',  val: String(clients.length), sub: `${clients.filter(c=>c.plan==='Pro'||c.plan==='Firm').length} on paid plans`, trend: String(clients.length), tc: 'trend-up' },
          { label: 'ITR filed',      val: String(filed), sub: `${Math.round(filed / clients.length * 100)}% of season`, trend: `${Math.round(filed / clients.length * 100)}%`, tc: 'trend-up' },
          { label: 'Docs missing',   val: String(missing), sub: 'Auto-reminders active', trend: String(missing), tc: 'trend-warn' },
          { label: 'Fees pending',   val: `₹${(unpaidAmt / 1000).toFixed(1)}k`, sub: `${clients.filter(c => !c.feePaid).length} invoices unpaid`, trend: '!', tc: 'trend-down' },
        ].map(m => (
          <div className="metric-tile" key={m.label}>
            <div className="metric-label-row">
              <span className="metric-label">{m.label}</span>
              <span className={`metric-trend ${m.tc}`}>{m.trend}</span>
            </div>
            <div className="metric-val">{m.val}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="dash-body">
        <div className="dash-main">
          <div className="sec-header">
            <span className="sec-title">Clients — {filtered.length} shown</span>
            <div className="sec-actions">
              {selected.length > 0 && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={sendBulkReminder}>
                    💬 Remind ({selected.length})
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={exportCSV}>
                    Export ({selected.length})
                  </button>
                </>
              )}
              <div className="search-wrap">
                <span className="search-icon">⌕</span>
                <input className="input search-input" type="search" placeholder="Search clients, PAN..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ position: 'relative' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowFilter(f => !f)}>
                  {statusFilter === 'all' ? 'Filter ▾' : `${statusFilters.find(f => f.val === statusFilter)?.label} ▾`}
                </button>
                {showFilter && (
                  <div className="filter-dropdown">
                    {statusFilters.map(f => (
                      <button key={f.val}
                        className={`filter-item ${statusFilter === f.val ? 'active' : ''}`}
                        onClick={() => { setStatusFilter(f.val); setShowFilter(false); }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="client-table">
            <div className="table-head">
              <div className="th">
                <input type="checkbox" className="tr-checkbox"
                  checked={filtered.length > 0 && selected.length === filtered.length}
                  onChange={toggleSelectAll} />
              </div>
              <div className="th">Client</div>
              <div className="th">Type</div>
              <div className="th">Documents</div>
              <div className="th">Status</div>
              <div className="th">Actions</div>
            </div>
            {filtered.map(client => {
              const d = docsInfo(client);
              const s = statusMap[client.status];
              return (
                <div className="table-row" key={client.id} onClick={() => onSelectClient(client)}>
                  <div className="tr-check">
                    <input type="checkbox" className="tr-checkbox"
                      checked={selected.includes(client.id)}
                      onChange={e => toggleSelect(client.id, e)} />
                  </div>
                  <div className="td">
                    <div className="client-name">{client.name}</div>
                    <div className="client-pan">{client.pan}</div>
                  </div>
                  <div className="td"><span className="td-type">{client.type}</span></div>
                  <div className="td">
                    <span className={`td-docs ${d.cls}`}>{d.text}</span>
                    <div className="mini-progress">
                      <div className="mini-progress-fill" style={{ width: `${(client.docsReceived / client.docsTotal) * 100}%` }} />
                    </div>
                  </div>
                  <div className="td"><span className={`pill ${s.cls}`}>{s.label}</span></div>
                  <div className="td-actions">
                    <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onSelectClient(client); }}>View</button>
                    <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); showToast(`WhatsApp sent to ${client.name}`); }}>💬</button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
                {search ? `No clients match "${search}"` : 'No clients found'}
              </div>
            )}
          </div>

          <div className="sec-header" style={{ marginTop: 8 }}>
            <span className="sec-title">Season progress</span>
          </div>
          <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>ITR filings complete</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{filed} / {clients.length}</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--purple))', borderRadius: 4, width: `${(filed / clients.length) * 100}%`, transition: 'width 0.4s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--text3)' }}>
              <span>{Math.round((filed / clients.length) * 100)}% complete</span>
              <span>{clients.length - filed} remaining</span>
            </div>
          </div>
        </div>

        <div className="dash-sidebar">
          <div className="sec-header"><span className="sec-title">Deadlines</span></div>
          <div className="card deadline-card">
            {deadlines.slice(0, 5).map((d, i) => (
              <div className="dl-row" key={i}>
                <div>
                  <div className="dl-name">{d.name}</div>
                  <div className="dl-date">{d.date}</div>
                </div>
                <span className={`dl-days ${d.urgency === 'urgent' ? 'dl-urgent' : d.urgency === 'soon' ? 'dl-soon' : 'dl-ok'}`}>
                  {d.daysLeft}d
                </span>
              </div>
            ))}
          </div>

          <div className="sec-header" style={{ marginTop: 14 }}><span className="sec-title">Recent activity</span></div>
          <div className="card" style={{ padding: '8px 12px' }}>
            {recentActivity.map((a, i) => (
              <div className="activity-item" key={i}>
                <div className="act-dot" style={{ background: a.color }} />
                <div>
                  <div className="act-text">{a.text}</div>
                  <div className="act-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
