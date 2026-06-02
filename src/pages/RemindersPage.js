import { useState } from 'react';
import { reminderLog as initialLog } from '../data/mockData';

const statusPill = { sent: 'pill-gray', delivered: 'pill-blue', read: 'pill-green' };

export default function RemindersPage({ clients, showToast }) {
  const [log, setLog] = useState(initialLog);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [message, setMessage] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  const pendingClients = clients.filter(c => c.status === 'docs_pending' || c.status === 'waiting_docs');

  const sendReminder = () => {
    if (!selectedClientId || !message.trim()) {
      showToast('Select a client and write a message', 'error');
      return;
    }
    const client = clients.find(c => c.id === Number(selectedClientId));
    const entry = {
      id: Date.now(),
      clientId: client.id,
      clientName: client.name,
      message: message.trim(),
      sentAt: 'Just now',
      via: 'WhatsApp',
      status: 'sent',
    };
    setLog(prev => [entry, ...prev]);
    setMessage('');
    setSelectedClientId('');
    setShowCompose(false);
    showToast(`Reminder sent to ${client.name} via WhatsApp`);
  };

  const sendBulkReminder = () => {
    const newEntries = pendingClients.map(c => ({
      id: Date.now() + c.id,
      clientId: c.id,
      clientName: c.name,
      message: `Reminder: Please upload your pending documents at the earliest for timely ITR filing.`,
      sentAt: 'Just now',
      via: 'WhatsApp',
      status: 'sent',
    }));
    setLog(prev => [...newEntries, ...prev]);
    showToast(`Bulk reminder sent to ${pendingClients.length} clients`);
  };

  return (
    <div className="page">
      <div className="page-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="page-title">Reminders</span>
          <span className="page-breadcrumb">/ WhatsApp log</span>
        </div>
        <div className="page-actions">
          {pendingClients.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={sendBulkReminder}>
              💬 Bulk remind ({pendingClients.length})
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowCompose(s => !s)}>
            + Send reminder
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {[
          { label: 'Total sent',     val: log.length,                                                            sub: 'this season' },
          { label: 'Delivered',      val: log.filter(l => l.status !== 'sent').length,                          sub: 'confirmed received' },
          { label: 'Pending clients',val: pendingClients.length,                                                 sub: 'awaiting documents' },
        ].map(m => (
          <div key={m.label} style={{ padding: '14px 20px', borderRight: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)', lineHeight: 1 }}>{m.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="page-body">
        {showCompose && (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Compose reminder</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Send to</label>
                <select className="select input" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                  <option value="">Select client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.pan}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="input" rows={3} style={{ resize: 'vertical', fontFamily: 'var(--font)' }}
                  placeholder="Hi [Name], this is a reminder to please upload your pending documents..."
                  value={message} onChange={e => setMessage(e.target.value)} />
                <span className="form-hint">
                  {selectedClientId && clients.find(c => c.id === Number(selectedClientId)) && (
                    <>Pending docs: {clients.find(c => c.id === Number(selectedClientId)).documents.filter(d => !d.uploaded).map(d => d.name).join(', ') || 'None'}</>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={sendReminder}>Send via WhatsApp</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowCompose(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {log.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
              No reminders sent yet
            </div>
          )}
          {log.map((r, i) => (
            <div key={r.id} className="card" style={{ borderRadius: i === 0 ? undefined : 0, marginTop: i === 0 ? 0 : -1, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, background: 'var(--bg3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginTop: 2 }}>💬</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{r.clientName}</span>
                  <span className="pill pill-gray">{r.via}</span>
                  <span className={`pill ${statusPill[r.status] || 'pill-gray'}`}>{r.status}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{r.sentAt}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{r.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
