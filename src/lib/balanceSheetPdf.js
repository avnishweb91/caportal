import { fmtBS } from './balanceSheet';
import { getProfile } from './utils';

export const printBalanceSheet = (inp, result, clientName) => {
  const ca    = getProfile();
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const fy    = inp.fy || '2025-26';
  const r     = result;

  const trow = (label, val, bold = false, indent = false, isTotal = false) => {
    const cls = [bold ? 'bold' : '', indent ? 'indent' : '', isTotal ? 'total' : ''].filter(Boolean).join(' ');
    const formatted = val === null || val === undefined ? '' : `₹&nbsp;${fmtBS(val)}`;
    return `<tr class="${cls}"><td>${label}</td><td class="num">${formatted}</td></tr>`;
  };

  const secHead = (t) => `<tr class="sec-head"><td colspan="2">${t}</td></tr>`;
  const blank   = () => `<tr class="blank"><td colspan="2">&nbsp;</td></tr>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Allow pop-ups to download.'); return; }

  win.document.write(`<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<title>Balance Sheet — ${clientName} — FY ${fy}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #111; padding: 28px; }
  h1 { font-size: 15px; font-weight: 800; text-align: center; margin-bottom: 4px; }
  h2 { font-size: 12px; font-weight: 600; text-align: center; margin-bottom: 2px; color: #444; }
  .sub { font-size: 10px; text-align: center; color: #777; margin-bottom: 20px; }
  .section-title { font-size: 12px; font-weight: 800; text-align: center; background: #111; color: #fff; padding: 5px; margin: 16px 0 0; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #ddd; }
  .col { }
  .col-head { background: #f0f0f0; font-weight: 700; font-size: 11px; text-align: center; padding: 5px; border-bottom: 1px solid #ddd; }
  .col:first-child { border-right: 1px solid #ddd; }

  table { width: 100%; border-collapse: collapse; }
  tr { border-bottom: 1px solid #f0f0f0; }
  td { padding: 3px 6px; }
  td.num { text-align: right; font-family: 'Courier New', monospace; white-space: nowrap; }
  tr.sec-head td { background: #e8e8e8; font-weight: 700; font-size: 10px; text-transform: uppercase; padding: 4px 6px; border-bottom: 1px solid #ccc; }
  tr.bold td { font-weight: 700; background: #f8f8f8; }
  tr.indent td:first-child { padding-left: 18px; color: #444; }
  tr.total td { font-weight: 800; background: #111; color: #fff; padding: 5px 6px; font-size: 12px; }
  tr.total td.num { font-family: 'Courier New', monospace; }
  tr.blank td { padding: 2px; background: #fff; border: none; }

  .profit-box { text-align: center; padding: 12px; margin: 12px 0; border-radius: 6px; }
  .profit-box.profit { background: #f0fdf4; border: 1px solid #86efac; }
  .profit-box.loss   { background: #fef2f2; border: 1px solid #fca5a5; }
  .profit-label { font-size: 11px; color: #666; margin-bottom: 4px; }
  .profit-val   { font-size: 22px; font-weight: 800; font-family: 'Courier New'; }
  .profit-val.p { color: #16a34a; }
  .profit-val.l { color: #dc2626; }

  .balance-check { text-align: center; font-size: 11px; padding: 6px; margin-top: 8px; border-radius: 4px; }
  .balanced   { background: #f0fdf4; color: #16a34a; font-weight: 700; }
  .unbalanced { background: #fef2f2; color: #dc2626; font-weight: 700; }

  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 9px; color: #aaa; }
  .sign-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding-top: 10px; border-top: 1px solid #ccc; }
  .sign-box { text-align: center; font-size: 10px; color: #555; }
  .sign-line { border-top: 1px solid #111; margin-bottom: 4px; padding-top: 4px; }

  @media print { body { padding: 12px; } @page { margin: 0.8cm; size: A4; } }
</style>
</head><body>

<h1>${inp.businessName || clientName || 'Business Name'}</h1>
<h2>${inp.businessType || 'Proprietorship'}</h2>
<div class="sub">
  Trading, Profit & Loss Account and Balance Sheet for the year ended 31st March ${fy.split('-')[1] ? '20' + fy.split('-')[1] : '2026'}
  &nbsp;·&nbsp; PAN: ${inp.pan || '—'}
</div>

<!-- Trading Account -->
<div class="section-title">TRADING ACCOUNT</div>
<div class="two-col">
  <div class="col">
    <div class="col-head">Dr. (Debit)</div>
    <table>
      ${trow('Opening stock', r.openingStock, false, true)}
      ${trow('Purchases', r.netPurchases, false, true)}
      ${r.totalDirectExp > 0 ? trow('Direct expenses', r.totalDirectExp, false, true) : ''}
      ${r.grossProfit > 0 ? trow('Gross profit c/d', r.grossProfit, false, true) : ''}
      ${trow('Total', r.tradingDebit + (r.grossProfit > 0 ? r.grossProfit : 0), true)}
    </table>
  </div>
  <div class="col">
    <div class="col-head">Cr. (Credit)</div>
    <table>
      ${trow('Sales (net)', r.netSales, false, true)}
      ${trow('Closing stock', r.closingStock, false, true)}
      ${r.grossProfit < 0 ? trow('Gross loss c/d', Math.abs(r.grossProfit), false, true) : ''}
      ${trow('Total', r.tradingCredit + (r.grossProfit < 0 ? Math.abs(r.grossProfit) : 0), true)}
    </table>
  </div>
</div>

<!-- P&L Account -->
<div class="section-title">PROFIT & LOSS ACCOUNT</div>
<div class="two-col">
  <div class="col">
    <div class="col-head">Dr. (Expenses)</div>
    <table>
      ${r.grossProfit < 0 ? trow('Gross loss b/d', Math.abs(r.grossProfit), false, true) : ''}
      ${r.salaries       ? trow('Salaries', r.salaries, false, true) : ''}
      ${r.rent           ? trow('Rent', r.rent, false, true) : ''}
      ${r.electricity    ? trow('Electricity', r.electricity, false, true) : ''}
      ${r.telephone      ? trow('Telephone', r.telephone, false, true) : ''}
      ${r.advertising    ? trow('Advertising', r.advertising, false, true) : ''}
      ${r.depreciation   ? trow('Depreciation', r.depreciation, false, true) : ''}
      ${r.auditFees      ? trow('Audit fees', r.auditFees, false, true) : ''}
      ${r.bankCharges    ? trow('Bank charges', r.bankCharges, false, true) : ''}
      ${r.interestPaid   ? trow('Interest paid', r.interestPaid, false, true) : ''}
      ${r.badDebts       ? trow('Bad debts', r.badDebts, false, true) : ''}
      ${r.otherIndirectExp ? trow('Other expenses', r.otherIndirectExp, false, true) : ''}
      ${r.netProfit > 0  ? trow('Net profit (transferred to Capital)', r.netProfit, false, true) : ''}
      ${trow('Total', r.totalPLDebit + (r.netProfit > 0 ? r.netProfit : 0), true)}
    </table>
  </div>
  <div class="col">
    <div class="col-head">Cr. (Income)</div>
    <table>
      ${r.grossProfit > 0 ? trow('Gross profit b/d', r.grossProfit, false, true) : ''}
      ${r.commission      ? trow('Commission received', r.commission, false, true) : ''}
      ${r.discountReceived? trow('Discount received', r.discountReceived, false, true) : ''}
      ${r.interestEarned  ? trow('Interest earned', r.interestEarned, false, true) : ''}
      ${r.rentReceived    ? trow('Rent received', r.rentReceived, false, true) : ''}
      ${r.otherIncome     ? trow('Other income', r.otherIncome, false, true) : ''}
      ${r.netProfit < 0   ? trow('Net loss (transferred to Capital)', Math.abs(r.netProfit), false, true) : ''}
      ${trow('Total', r.netProfit < 0 ? r.totalPLDebit : r.totalPLCredit, true)}
    </table>
  </div>
</div>

<!-- Net Profit summary -->
<div class="profit-box ${r.netProfit >= 0 ? 'profit' : 'loss'}">
  <div class="profit-label">${r.netProfit >= 0 ? 'Net Profit for the year' : 'Net Loss for the year'}</div>
  <div class="profit-val ${r.netProfit >= 0 ? 'p' : 'l'}">₹ ${fmtBS(Math.abs(r.netProfit))}</div>
</div>

<!-- Balance Sheet -->
<div class="section-title">BALANCE SHEET AS ON 31ST MARCH ${fy.split('-')[1] ? '20' + fy.split('-')[1] : '2026'}</div>
<div class="two-col">
  <div class="col">
    <div class="col-head">Liabilities</div>
    <table>
      ${secHead("Capital Account")}
      ${trow("Opening capital", r.openingCapital, false, true)}
      ${trow(`Add: Net ${r.netProfit >= 0 ? 'Profit' : 'Loss'}`, r.netProfit, false, true)}
      ${r.drawings ? trow("Less: Drawings", -r.drawings, false, true) : ''}
      ${trow("Closing Capital", r.adjustedCapital, true)}
      ${blank()}
      ${secHead("Loans")}
      ${r.securedLoans   ? trow("Secured loans", r.securedLoans, false, true) : ''}
      ${r.unsecuredLoans ? trow("Unsecured loans", r.unsecuredLoans, false, true) : ''}
      ${blank()}
      ${secHead("Current Liabilities")}
      ${r.sundryCreditors ? trow("Sundry creditors", r.sundryCreditors, false, true) : ''}
      ${r.outstandingExp  ? trow("Outstanding expenses", r.outstandingExp, false, true) : ''}
      ${r.advanceReceived ? trow("Advance received", r.advanceReceived, false, true) : ''}
      ${r.otherCurrentLiab? trow("Other current liabilities", r.otherCurrentLiab, false, true) : ''}
      ${blank()}
      ${trow("TOTAL", r.totalLiabilities, false, false, true)}
    </table>
  </div>
  <div class="col">
    <div class="col-head">Assets</div>
    <table>
      ${secHead("Fixed Assets (Net of Depreciation)")}
      ${r.land              ? trow("Land & site", r.land, false, true) : ''}
      ${r.buildingNet       ? trow("Building (net)", r.buildingNet, false, true) : ''}
      ${r.machineryNet      ? trow("Machinery (net)", r.machineryNet, false, true) : ''}
      ${r.furnitureNet      ? trow("Furniture (net)", r.furnitureNet, false, true) : ''}
      ${r.vehiclesNet       ? trow("Vehicles (net)", r.vehiclesNet, false, true) : ''}
      ${r.otherFixedAssets  ? trow("Other fixed assets", r.otherFixedAssets, false, true) : ''}
      ${trow("Total Fixed Assets", r.netFixedAssets, true)}
      ${blank()}
      ${r.investments ? `${secHead("Investments")}${trow("Investments", r.investments, false, true)}` : ''}
      ${secHead("Current Assets")}
      ${r.closingStock    ? trow("Closing stock", r.closingStock, false, true) : ''}
      ${r.sundryDebtors   ? trow("Sundry debtors", r.sundryDebtors, false, true) : ''}
      ${r.advancePaid     ? trow("Advance paid", r.advancePaid, false, true) : ''}
      ${r.cash            ? trow("Cash in hand", r.cash, false, true) : ''}
      ${r.bankBalance     ? trow("Bank balance", r.bankBalance, false, true) : ''}
      ${r.prepaidExp      ? trow("Prepaid expenses", r.prepaidExp, false, true) : ''}
      ${r.otherCurrentAss ? trow("Other current assets", r.otherCurrentAss, false, true) : ''}
      ${blank()}
      ${trow("TOTAL", r.totalAssets, false, false, true)}
    </table>
  </div>
</div>

<div class="balance-check ${r.isBalanced ? 'balanced' : 'unbalanced'}">
  ${r.isBalanced
    ? '✓ Balance Sheet tallies — Assets = Liabilities'
    : `⚠ Difference of ₹${fmtBS(Math.abs(r.difference))} — please verify entries`}
</div>

<div class="sign-section">
  <div class="sign-box">
    <div style="height:40px"></div>
    <div class="sign-line">Signature of Proprietor / Partner</div>
    <div>${clientName || 'Client Name'}</div>
  </div>
  <div class="sign-box">
    <div style="height:40px"></div>
    <div class="sign-line">Signature with stamp</div>
    <div>${ca.name || 'CA Name'} · ${ca.firm || ''}</div>
    <div>M.No.: ${inp.membershipNo || '—'} · Date: ${today}</div>
  </div>
</div>

<div class="footer">
  <span>FY ${fy} · AY ${fy.split('-')[1] ? '20' + fy.split('-')[1] : '2026'}-${Number((fy.split('-')[1] || '26')) + 1}</span>
  <span>Generated via CAPortal · caportal.co</span>
</div>

<script>window.onload = () => window.print();</script>
</body></html>`);
  win.document.close();
};
