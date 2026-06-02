import './Sidebar.css';

export default function Sidebar({ active, onSelect, clients = [], open, onClose }) {
  const docsMissing = clients.filter(c => c.status === 'docs_pending' || c.status === 'waiting_docs').length;
  const unpaidCount = clients.filter(c => !c.feePaid).length;
  const totalDocs = clients.reduce((s, c) => s + c.docsReceived, 0);

  const nav = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'clients',   icon: '◎', label: 'Clients', count: String(clients.length) },
    { id: 'documents', icon: '◫', label: 'Documents', count: String(totalDocs) },
    { id: 'deadlines', icon: '◷', label: 'Deadlines', badge: 2 },
    { id: 'invoices',  icon: '₹', label: 'Invoices', badge: unpaidCount || undefined },
    { id: 'reminders', icon: '◉', label: 'Reminders', badge: docsMissing || undefined },
  ];

  const isActive = (id) => {
    if (id === 'clients' && active === 'dashboard') return false;
    if (id === 'dashboard' && active === 'clients') return false;
    return active === id;
  };

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sb-section">
        <div className="sb-section-label">Workspace</div>
        {nav.map(item => (
          <button key={item.id} className={`sb-item ${isActive(item.id) ? 'active' : ''}`} onClick={() => onSelect(item.id)}>
            <span className="sb-icon">{item.icon}</span>
            <span className="sb-label">{item.label}</span>
            {item.badge != null && <span className="sb-badge">{item.badge}</span>}
            {item.count != null && <span className="sb-count">{item.count}</span>}
          </button>
        ))}
      </div>
      <div className="sb-divider" />
      <div className="sb-section">
        <div className="sb-section-label">Settings</div>
        <button className={`sb-item ${active==='settings'?'active':''}`} onClick={()=>onSelect('settings')}><span className="sb-icon">⚙</span><span className="sb-label">Settings</span></button>
        <button className="sb-item" onClick={()=>window.open('https://github.com/avnishweb91/caportal','_blank')}><span className="sb-icon">?</span><span className="sb-label">Help</span></button>
      </div>
      <div className="sb-footer">
        <div className="sb-plan">
          <span className="sb-plan-label">Pro plan</span>
          <span className="sb-plan-badge">{clients.length}/100</span>
        </div>
        <div className="sb-profile">
          <div className="sb-avatar">RM</div>
          <div>
            <div className="sb-name">Rahul Mishra</div>
            <div className="sb-role">CA · Bengaluru</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
