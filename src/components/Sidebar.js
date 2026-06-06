import { useState } from 'react';
import './Sidebar.css';

const FAQS = [
  {
    q: 'How does the client portal link work?',
    a: 'Every client gets a unique private URL generated when you add them. Copy it from the client detail page and send via WhatsApp. They open it on their phone — no app, no login — to upload documents and check status.',
  },
  {
    q: 'How do I collect fees via UPI?',
    a: 'Go to Settings → Integrations, enter your UPI ID. A "Pay ₹X" button appears inside each client\'s portal. Mobile clients tap to pay via GPay/PhonePe; desktop clients get a QR code. Money goes directly to your bank.',
  },
  {
    q: 'Is my clients\' data secure?',
    a: 'All data is encrypted in transit (TLS) and at rest. Each CA account is fully isolated with Row Level Security — you can only access your own clients\' data, stored on Supabase (AWS Mumbai region).',
  },
  {
    q: 'How do I record an ITR acknowledgment number?',
    a: 'Open the client\'s detail page → Acknowledgments card → click "+ Add". Or go to Ack Tracker in the sidebar to add and search across all clients at once.',
  },
];

export default function Sidebar({ active, onSelect, clients = [], open, onClose, user, billing }) {
  const [showHelp, setShowHelp] = useState(false);
  const [openFaq, setOpenFaq]   = useState(null);
  const docsMissing = clients.filter(c => c.status === 'docs_pending' || c.status === 'waiting_docs').length;
  const unpaidCount = clients.filter(c => !c.feePaid).length;
  const totalDocs = clients.reduce((s, c) => s + c.docsReceived, 0);

  const nav = [
    { id: 'dashboard',   icon: '⊞', label: 'Dashboard' },
    { id: 'clients',     icon: '◎', label: 'Clients', count: String(clients.length) },
    { id: 'documents',   icon: '◫', label: 'Documents', count: String(totalDocs) },
    { id: 'deadlines',   icon: '◷', label: 'Deadlines', badge: 2 },
    { id: 'invoices',    icon: '₹', label: 'Invoices', badge: unpaidCount || undefined },
    { id: 'reminders',   icon: '◉', label: 'Reminders', badge: docsMissing || undefined },
    { id: 'computation',  icon: '⌗', label: 'Tax Compute' },
    { id: 'balancesheet',   icon: '⊟', label: 'Balance Sheet' },
    { id: 'acknowledgments', icon: '◈', label: 'Ack Tracker' },
    { id: 'templates',       icon: '▤', label: 'Templates' },
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
        <button className="sb-item" onClick={() => setShowHelp(true)}><span className="sb-icon">?</span><span className="sb-label">Help & Support</span></button>
      </div>
      <div className="sb-footer">
        <div className="sb-plan">
          <span className="sb-plan-label">{billing?.planName || 'Free trial'}</span>
          <span className="sb-plan-badge">
            {billing?.clientLimit ? `${clients.length}/${billing.clientLimit}` : `${clients.length} clients`}
          </span>
        </div>
        <div className="sb-profile">
          <div className="sb-avatar">
            {user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'CA'}
          </div>
          <div>
            <div className="sb-name">{user?.name || 'CA User'}</div>
            <div className="sb-role">{user?.city ? `CA · ${user.city}` : (user?.role || 'CA')}</div>
          </div>
        </div>
      </div>
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal sb-help-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Help &amp; Support</span>
              <button className="modal-close" onClick={() => setShowHelp(false)}>✕</button>
            </div>

            <p className="sb-help-lead">We're here to help. Typical response within 4 hours on working days.</p>

            <div className="sb-help-contact">
              <div className="sb-help-contact-icon">📧</div>
              <div className="sb-help-contact-body">
                <div className="sb-help-contact-title">Email support</div>
                <div className="sb-help-contact-email">support@caportal.co</div>
                <div className="sb-help-contact-hours">Mon – Sat · 9 am – 6 pm IST</div>
              </div>
              <a href="mailto:support@caportal.co" className="btn btn-primary btn-sm sb-help-send">
                Send email →
              </a>
            </div>

            <div className="sb-help-faq-label">Common questions</div>
            <div className="sb-help-faqs">
              {FAQS.map((f, i) => (
                <div key={i} className={`sb-help-faq ${openFaq === i ? 'open' : ''}`}>
                  <button className="sb-help-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{f.q}</span>
                    <span className="sb-help-faq-chevron">{openFaq === i ? '▲' : '▼'}</span>
                  </button>
                  {openFaq === i && <div className="sb-help-faq-a">{f.a}</div>}
                </div>
              ))}
            </div>

            <div className="sb-help-footer">
              <span>caportal.co</span>
              <a href="mailto:support@caportal.co">support@caportal.co</a>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
