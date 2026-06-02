import { useState } from 'react';
import './ClientDetail.css';

const dotColors = { green: 'var(--green)', blue: 'var(--accent)', amber: 'var(--amber)', gray: 'var(--bg4)', red: 'var(--red)' };

const statusOptions = [
  { val: 'waiting_docs', label: 'Waiting docs',  cls: 'pill-amber' },
  { val: 'docs_pending', label: 'Docs pending',  cls: 'pill-red'   },
  { val: 'under_review', label: 'Under review',  cls: 'pill-blue'  },
  { val: 'filed',        label: 'Filed',         cls: 'pill-green' },
];

export default function ClientDetail({ client, onBack, onUpdateClient, onArchive, onEdit, onViewPortal, onGoInvoices, showToast }) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [showDocInput, setShowDocInput] = useState(false);

  if (!client) return null;

  const currentStatus = statusOptions.find(s => s.val === client.status) || statusOptions[0];

  const markAsFiled = () => {
    onUpdateClient(client.id, {
      status: 'filed',
      timeline: [
        { action: 'ITR filed successfully', time: 'Just now', type: 'green' },
        ...client.timeline,
      ],
    });
    showToast(`${client.name} marked as filed`);
  };

  const changeStatus = (val) => {
    const s = statusOptions.find(o => o.val === val);
    onUpdateClient(client.id, {
      status: val,
      timeline: [
        { action: `Status changed to "${s.label}"`, time: 'Just now', type: 'blue' },
        ...client.timeline,
      ],
    });
    setShowStatusMenu(false);
    showToast('Status updated');
  };

  const toggleFeePaid = () => {
    const next = !client.feePaid;
    onUpdateClient(client.id, {
      feePaid: next,
      timeline: [
        { action: next ? `Fee ₹${client.feeAmount.toLocaleString()} marked as paid` : 'Fee marked as unpaid', time: 'Just now', type: next ? 'green' : 'amber' },
        ...client.timeline,
      ],
    });
    showToast(next ? 'Fee marked as paid' : 'Fee marked as unpaid');
  };

  const requestDoc = () => {
    if (!newDocName.trim()) return;
    const updatedDocs = [...client.documents, { name: newDocName.trim(), uploaded: false, date: null }];
    onUpdateClient(client.id, {
      documents: updatedDocs,
      docsTotal: updatedDocs.length,
      timeline: [
        { action: `Document requested: ${newDocName.trim()}`, time: 'Just now', type: 'amber' },
        ...client.timeline,
      ],
    });
    setNewDocName('');
    setShowDocInput(false);
    showToast('Document request added');
  };

  const handleArchive = () => {
    if (showArchiveConfirm) {
      onArchive(client.id);
    } else {
      setShowArchiveConfirm(true);
      setTimeout(() => setShowArchiveConfirm(false), 3000);
    }
  };

  return (
    <div className="client-detail">
      <div className="detail-header">
        <button className="detail-back" onClick={onBack}>← Dashboard / Clients</button>
        <div className="detail-header-right">
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(client)}>Edit client</button>
          <button
            className={`btn btn-sm ${showArchiveConfirm ? 'btn-danger' : 'btn-ghost'}`}
            onClick={handleArchive}>
            {showArchiveConfirm ? 'Confirm archive?' : '◌ Archive'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={markAsFiled}
            disabled={client.status === 'filed'}
            style={client.status === 'filed' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
            {client.status === 'filed' ? '✓ Filed' : 'Mark as filed ✓'}
          </button>
        </div>
      </div>

      <div className="detail-hero">
        <div className="detail-hero-top">
          <div>
            <div className="detail-name">{client.name}</div>
            <div className="detail-meta">
              <span className="detail-meta-item">PAN: {client.pan}</span>
              <span className="detail-meta-item">{client.phone}</span>
              <span className="detail-meta-item">{client.email}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="pill pill-gray" style={{ marginBottom: 4 }}>FY 2025–26</div>
          </div>
        </div>
        <div className="detail-chips">
          <div style={{ position: 'relative' }}>
            <span className={`pill ${currentStatus.cls}`} style={{ cursor: 'pointer' }}
              onClick={() => setShowStatusMenu(m => !m)}>
              {currentStatus.label} ▾
            </span>
            {showStatusMenu && (
              <div className="status-menu">
                {statusOptions.map(s => (
                  <button key={s.val} className={`status-menu-item ${client.status === s.val ? 'active' : ''}`}
                    onClick={() => changeStatus(s.val)}>
                    <span className={`pill ${s.cls}`} style={{ pointerEvents: 'none' }}>{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="pill pill-gray">{client.type}</span>
          <span className="pill pill-gray">{client.plan} plan</span>
          <span className={`pill ${client.feePaid ? 'pill-green' : 'pill-amber'}`}
            style={{ cursor: 'pointer' }} onClick={toggleFeePaid}
            title="Click to toggle payment status">
            {client.feePaid ? '✓ Fee paid' : `Fee pending — ₹${client.feeAmount.toLocaleString()}`}
          </span>
          <span className="pill pill-gray">{client.docsReceived}/{client.docsTotal} docs</span>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-info-row">
          {[
            { label: 'Filing type', val: client.type, sub: 'Current FY' },
            { label: 'Fee amount',  val: `₹${client.feeAmount.toLocaleString()}`, sub: client.feePaid ? 'Paid' : 'Unpaid', valCls: client.feePaid ? 'val-paid' : 'val-unpaid' },
            { label: 'Documents',   val: `${client.docsReceived}/${client.docsTotal}`, sub: `${client.docsTotal - client.docsReceived} pending` },
            { label: 'Plan',        val: client.plan, sub: 'Active subscription' },
          ].map((t, i) => (
            <div className="card info-tile" key={i}>
              <div className="info-tile-label">{t.label}</div>
              <div className={`info-tile-val ${t.valCls || ''}`}>{t.val}</div>
              <div className="info-tile-sub">{t.sub}</div>
            </div>
          ))}
        </div>

        <div className="detail-grid">
          <div className="card">
            <div className="card-header">
              <span className="card-header-title">Documents</span>
              <span className="card-header-meta">{client.docsReceived}/{client.docsTotal} received</span>
            </div>
            {client.documents.map((doc, i) => (
              <div className="doc-row" key={i}>
                <div className={`doc-status-icon ${doc.uploaded ? 'doc-si-ok' : 'doc-si-miss'}`}>
                  {doc.uploaded ? '✓' : '!'}
                </div>
                <div className="doc-name">{doc.name}</div>
                {doc.uploaded
                  ? <div className="doc-date">{doc.date}</div>
                  : (
                    <button className="doc-action-btn"
                      onClick={() => showToast(`Reminder sent to ${client.name} for ${doc.name}`)}>
                      Send reminder
                    </button>
                  )}
              </div>
            ))}
            <div style={{ padding: '10px 14px' }}>
              {showDocInput ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="input" style={{ flex: 1, fontSize: 11 }}
                    placeholder="Document name..."
                    value={newDocName}
                    onChange={e => setNewDocName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && requestDoc()}
                    autoFocus />
                  <button className="btn btn-primary btn-sm" onClick={requestDoc}>Add</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowDocInput(false)}>✕</button>
                </div>
              ) : (
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setShowDocInput(true)}>
                  + Request document
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-header-title">Activity timeline</span>
            </div>
            {client.timeline.map((item, i) => (
              <div className="tl-row" key={i}>
                <div className="tl-left">
                  <div className="tl-dot" style={{ background: dotColors[item.type] || dotColors.gray }} />
                  {i < client.timeline.length - 1 && <div className="tl-line" />}
                </div>
                <div className="tl-content">
                  <div className="tl-action">{item.action}</div>
                  <div className="tl-time">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="detail-actions">
        <button className="btn btn-primary" onClick={() => showToast('WhatsApp message sent (integration ready for Gupshup API key)')}>
          💬 Send WhatsApp
        </button>
        <button className="btn btn-ghost" onClick={onGoInvoices}>
          📄 View invoice
        </button>
        <button className="btn btn-ghost" onClick={() => onViewPortal(client)}>
          🔗 Preview portal
        </button>
        <button className="btn btn-ghost" onClick={() => showToast('PDF bundling available in Phase 2')}>
          📥 Download docs
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-danger" onClick={() => showToast(`Issue flagged for ${client.name}`)}>
            ⚠ Flag issue
          </button>
        </div>
      </div>
    </div>
  );
}
