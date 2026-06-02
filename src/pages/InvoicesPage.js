import { useState } from 'react';
import { openPayment } from '../lib/razorpay';
import './InvoicesPage.css';

export default function InvoicesPage({ clients, onUpdateClient, onSelectClient, showToast }) {
  const [filter, setFilter] = useState('all');
  const [collecting, setCollecting] = useState(null);

  const invoices = clients.map(c => ({
    clientId: c.id, clientName: c.name, pan: c.pan,
    phone: c.phone || '', email: c.email || '',
    amount: c.feeAmount, paid: c.feePaid,
    type: c.type + ' FY 2025–26', plan: c.plan,
  }));

  const shown = filter === 'all' ? invoices
    : filter === 'paid'   ? invoices.filter(i =>  i.paid)
    : invoices.filter(i => !i.paid);

  const totalPending   = invoices.filter(i => !i.paid).reduce((s, i) => s + i.amount, 0);
  const totalCollected = invoices.filter(i =>  i.paid).reduce((s, i) => s + i.amount, 0);
  const totalAll       = invoices.reduce((s, i) => s + i.amount, 0);

  const togglePaid = (clientId, currentPaid) => {
    onUpdateClient(clientId, { feePaid: !currentPaid });
    showToast(!currentPaid ? 'Fee marked as paid' : 'Fee marked as unpaid');
  };

  const handleCollect = async (inv) => {
    setCollecting(inv.clientId);
    await openPayment({
      amount:       inv.amount,
      clientName:   inv.clientName,
      clientEmail:  inv.email,
      clientPhone:  inv.phone,
      description:  inv.type,
      onSuccess: (resp) => {
        onUpdateClient(inv.clientId, { feePaid: true });
        showToast(`₹${inv.amount.toLocaleString()} collected from ${inv.clientName} · ID: ${resp.paymentId}`);
      },
      onDismiss: (msg) => {
        if (msg) showToast(msg, 'error');
      },
    });
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
                <span className={`pill ${inv.paid ? 'pill-green' : 'pill-amber'}`}>
                  {inv.paid ? '✓ Paid' : 'Pending'}
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
                    title="Opens Razorpay checkout — add REACT_APP_RAZORPAY_KEY in .env">
                    {collecting === inv.clientId ? '…' : '₹ Collect'}
                  </button>
                )}
                <button className={`btn btn-sm ${inv.paid ? 'btn-ghost' : 'btn-ghost'}`}
                  style={{ fontSize: 10, color: 'var(--text3)' }}
                  onClick={() => togglePaid(inv.clientId, inv.paid)}>
                  {inv.paid ? 'Unmark' : 'Manual ✓'}
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
            ⓘ &nbsp;"₹ Collect" opens Razorpay checkout. Add <code style={{ fontFamily: 'var(--mono)', background: 'var(--bg3)', padding: '1px 4px', borderRadius: 3 }}>REACT_APP_RAZORPAY_KEY</code> in <code style={{ fontFamily: 'var(--mono)', background: 'var(--bg3)', padding: '1px 4px', borderRadius: 3 }}>.env</code> to activate. Get your key at razorpay.com.
          </span>
        </div>
      </div>
    </div>
  );
}
