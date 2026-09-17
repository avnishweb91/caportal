import { useState } from 'react';
import './InvoicesPage.css';

export default function InvoicesPage({ clients, onUpdateClient, onSelectClient, showToast }) {
  const [filter, setFilter] = useState('all');
  const [collecting, setCollecting] = useState(null);
  const [upiInvoice, setUpiInvoice] = useState(null);

  const invoices = clients.map(c => ({
    clientId: c.id, clientName: c.name, pan: c.pan,
    phone: c.phone || '', email: c.email || '',
    amount: c.feeAmount, paid: c.feePaid,
    paymentReported: c.feePaymentStatus === 'reported',
    type: c.type + ' FY 2025–26', plan: c.plan,
  }));

  const shown = filter === 'all' ? invoices
    : filter === 'paid'   ? invoices.filter(i =>  i.paid)
    : invoices.filter(i => !i.paid);

  const totalPending   = invoices.filter(i => !i.paid).reduce((s, i) => s + i.amount, 0);
  const totalCollected = invoices.filter(i =>  i.paid).reduce((s, i) => s + i.amount, 0);
  const totalAll       = invoices.reduce((s, i) => s + i.amount, 0);

  const togglePaid = (clientId, currentPaid) => {
    onUpdateClient(clientId, { feePaid: !currentPaid, feePaymentStatus: currentPaid ? 'pending' : 'paid' });
    showToast(!currentPaid ? 'Fee marked as paid' : 'Fee marked as unpaid');
  };

  const handleCollect = async (inv) => {
    setCollecting(inv.clientId);
    let settings = {};
    try { settings = JSON.parse(localStorage.getItem('ca_settings') || '{}'); } catch { settings = {}; }
    if (!settings.upiId) {
      showToast('Add your UPI ID in Settings → Integrations first.', 'error');
      setCollecting(null);
      return;
    }
    const params = new URLSearchParams({
      pa: settings.upiId,
      pn: settings.upiName || 'Your CA',
      am: String(inv.amount),
      tn: `${inv.clientName} · ${inv.type}`,
      cu: 'INR',
    });
    const link = `upi://pay?${params.toString()}`;
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) window.location.href = link;
    else setUpiInvoice({ ...inv, upiId: settings.upiId, upiName: settings.upiName || 'Your CA', link });
    setCollecting(null);
  };

  return (
    <div className="page">
      <div className="page-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="page-title">Invoices</span>
          <span className="page-breadcrumb">/ FY 2025–26</span>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => showToast('PDF export coming in Phase 2')}>
            Export PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Add your Razorpay key in .env to activate UPI payment links')}>
            ₹ Send payment link
          </button>
        </div>
      </div>

      <div className="inv-metrics">
        {[
          { label: 'Total billed',   val: `₹${totalAll.toLocaleString()}`,       sub: `${invoices.length} clients`,                    color: 'var(--text)' },
          { label: 'Collected',      val: `₹${totalCollected.toLocaleString()}`,  sub: `${invoices.filter(i => i.paid).length} paid`,   color: 'var(--green)' },
          { label: 'Outstanding',    val: `₹${totalPending.toLocaleString()}`,    sub: `${invoices.filter(i => !i.paid).length} unpaid`, color: 'var(--amber)' },
          { label: 'Collection rate',val: `${totalAll > 0 ? Math.round(totalCollected / totalAll * 100) : 0}%`, sub: 'of total billed', color: 'var(--text)' },
        ].map(m => (
          <div className="inv-tile" key={m.label}>
            <div className="inv-tile-label">{m.label}</div>
            <div className="inv-tile-val" style={{ color: m.color }}>{m.val}</div>
            <div className="inv-tile-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="page-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['all','All'],['unpaid','Unpaid'],['paid','Paid']].map(([v, l]) => (
              <button key={v} className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{shown.length} invoices</span>
        </div>

        <div className="card inv-table">
          <div className="inv-head">
            <div className="inv-th">Client</div>
            <div className="inv-th">Filing</div>
            <div className="inv-th">Plan</div>
            <div className="inv-th">Amount</div>
            <div className="inv-th">Status</div>
            <div className="inv-th">Actions</div>
          </div>
          {shown.map(inv => (
            <div className="inv-row" key={inv.clientId}>
              <div className="inv-td">
                <div className="inv-name">{inv.clientName}</div>
                <div className="inv-pan">{inv.pan}</div>
              </div>
              <div className="inv-td">
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>{inv.type}</span>
              </div>
              <div className="inv-td">
                <span className="pill pill-gray">{inv.plan}</span>
              </div>
              <div className="inv-td">
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                  ₹{inv.amount.toLocaleString()}
                </span>
              </div>
              <div className="inv-td">
                <span className={`pill ${inv.paid ? 'pill-green' : inv.paymentReported ? 'pill-blue' : 'pill-amber'}`}>
                  {inv.paid ? '✓ Paid' : inv.paymentReported ? 'Reported · confirm' : 'Pending'}
                </span>
              </div>
              <div className="inv-td" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => onSelectClient({ id: inv.clientId })}>View</button>
                {!inv.paid && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={collecting === inv.clientId}
                    onClick={() => handleCollect(inv)}
                    title="Creates a UPI payment request. Confirm payment after it reaches your bank.">
                    {collecting === inv.clientId ? '…' : '₹ UPI'}
                  </button>
                )}
                <button className={`btn btn-sm ${inv.paid ? 'btn-ghost' : 'btn-ghost'}`}
                  style={{ fontSize: 10, color: 'var(--text3)' }}
                  onClick={() => togglePaid(inv.clientId, inv.paid)}>
                  {inv.paid ? 'Unmark' : inv.paymentReported ? 'Confirm paid ✓' : 'Manual ✓'}
                </button>
              </div>
            </div>
          ))}
          {shown.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
              No invoices in this category
            </div>
          )}
        </div>

        <div className="inv-note">
          <span style={{ color: 'var(--text3)', fontSize: 10 }}>
            ⓘ &nbsp;UPI transfers are confirmed manually. Mark an invoice paid only after you verify the payment in your bank or UPI app.
          </span>
        </div>
      </div>
      {upiInvoice && (
        <div role="dialog" aria-modal="true" className="upi-modal-overlay" onClick={() => setUpiInvoice(null)}>
          <div className="upi-modal" onClick={event => event.stopPropagation()}>
            <div className="upi-modal-title">Collect ₹{upiInvoice.amount.toLocaleString()}</div>
            <div className="upi-modal-sub">{upiInvoice.clientName} · Scan with any UPI app</div>
            <img className="upi-qr" alt="UPI payment QR code" src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiInvoice.link)}`} />
            <div className="upi-id-row"><span className="upi-id-label">UPI ID</span><span className="upi-id-val">{upiInvoice.upiId}</span></div>
            <div className="upi-amount-row"><span className="upi-id-label">Status</span><span className="upi-id-val">Awaiting bank confirmation</span></div>
            <button className="upi-close-btn" onClick={() => setUpiInvoice(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
