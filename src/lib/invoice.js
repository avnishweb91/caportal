import { getProfile } from './utils';

export const printInvoice = (client) => {
  const ca = getProfile();
  const invNum = `INV-${new Date().getFullYear()}-${String(client.id).slice(-4).padStart(4, '0')}`;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const win = window.open('', '_blank');
  if (!win) { alert('Allow pop-ups to download invoice.'); return; }

  win.document.write(`<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<title>Invoice ${invNum} — ${client.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; background: #fff; padding: 48px; max-width: 640px; margin: 0 auto; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .brand span { color: #5b8af5; }
  .ca-info { font-size: 12px; color: #555; margin-top: 4px; line-height: 1.6; }
  .inv-meta { text-align: right; }
  .inv-title { font-size: 28px; font-weight: 800; color: #111; letter-spacing: -1px; }
  .inv-no { font-size: 12px; color: #777; margin-top: 4px; font-family: monospace; }
  .inv-date { font-size: 12px; color: #555; margin-top: 2px; }
  .divider { height: 1px; background: #e5e7eb; margin: 28px 0; }
  .section-label { font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
  .client-name { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
  .client-meta { font-size: 12px; color: #555; line-height: 1.8; }
  .line-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 0; }
  .item-desc { font-size: 14px; font-weight: 600; }
  .item-sub { font-size: 11px; color: #777; margin-top: 2px; }
  .item-amt { font-size: 14px; font-weight: 700; }
  .total-row { display: flex; justify-content: space-between; align-items: center; padding: 20px 0 4px; }
  .total-label { font-size: 13px; font-weight: 600; color: #555; }
  .total-amount { font-size: 32px; font-weight: 800; letter-spacing: -1px; }
  .status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 8px; }
  .paid   { background: #d1fae5; color: #065f46; }
  .unpaid { background: #fef3c7; color: #92400e; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #aaa; line-height: 1.8; }
  @media print {
    body { padding: 24px; }
    @page { margin: 1cm; }
  }
</style>
</head><body>

<div class="top">
  <div>
    <div class="brand">CA<span>Portal</span></div>
    <div class="ca-info">
      ${ca.name || 'Your CA Firm'}<br>
      ${ca.firm ? ca.firm + '<br>' : ''}
      ${ca.city || ''} ${ca.phone ? '· ' + ca.phone : ''}<br>
      ${ca.email || ''}
    </div>
  </div>
  <div class="inv-meta">
    <div class="inv-title">INVOICE</div>
    <div class="inv-no">${invNum}</div>
    <div class="inv-date">Date: ${today}</div>
    <div class="inv-date">Due: ${client.feePaid ? 'Paid' : 'On receipt'}</div>
  </div>
</div>

<div class="divider"></div>

<div class="section-label">Billed to</div>
<div class="client-name">${client.name}</div>
<div class="client-meta">
  PAN: ${client.pan}<br>
  ${client.email}<br>
  ${client.phone}
</div>

<div class="divider"></div>

<div class="section-label">Services</div>
<div class="line-item">
  <div>
    <div class="item-desc">${client.type} Filing — FY 2025–26</div>
    <div class="item-sub">Professional preparation, filing & advisory services</div>
  </div>
  <div class="item-amt">₹${client.feeAmount.toLocaleString()}</div>
</div>

<div class="divider"></div>

<div class="total-row">
  <div class="total-label">Total amount</div>
  <div class="total-amount">₹${client.feeAmount.toLocaleString()}</div>
</div>
<div>
  <span class="status-badge ${client.feePaid ? 'paid' : 'unpaid'}">
    ${client.feePaid ? '✓ Paid' : '⏳ Payment pending'}
  </span>
</div>

<div class="footer">
  <p>Thank you for your business.</p>
  <p>${ca.firm || 'CAPortal'} · ${ca.email || ''} · Generated via CAPortal</p>
</div>

<script>window.onload = () => { window.print(); }</script>
</body></html>`);
  win.document.close();
};
