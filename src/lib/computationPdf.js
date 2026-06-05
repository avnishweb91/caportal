import { fmt, CURRENT_FY, CURRENT_AY } from './taxCalc';
import { getProfile } from './utils';

export const printComputation = (inputs, result, clientName) => {
  const ca   = getProfile();
  const rec  = result.recommended;
  const data = result[rec];
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const row = (label, val, bold = false, indent = false) =>
    `<tr class="${bold ? 'bold-row' : ''} ${indent ? 'indent' : ''}">
      <td>${label}</td><td class="num">₹&nbsp;${fmt(val)}</td>
    </tr>`;

  const secHead = (title) =>
    `<tr class="sec-head"><td colspan="2">${title}</td></tr>`;

  const blankRow = () => `<tr class="blank"><td colspan="2"></td></tr>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Allow pop-ups to download computation.'); return; }

  win.document.write(`<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<title>Tax Computation — ${clientName} — FY ${CURRENT_FY}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #111; padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #111; }
  .brand  { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
  .brand span { color: #5b8af5; }
  .ca-info { font-size: 10px; color: #555; margin-top: 4px; line-height: 1.6; }
  .title-block { text-align: right; }
  .doc-title { font-size: 16px; font-weight: 800; letter-spacing: -0.5px; }
  .doc-sub   { font-size: 10px; color: #555; margin-top: 3px; }

  .client-row { display: flex; gap: 40px; margin-bottom: 18px; background: #f8f8f8; padding: 10px 14px; border-radius: 6px; }
  .client-field { display: flex; flex-direction: column; gap: 2px; }
  .cf-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; font-weight: 600; }
  .cf-val   { font-size: 12px; font-weight: 600; color: #111; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  tr { border-bottom: 1px solid #eee; }
  td { padding: 4px 6px; vertical-align: middle; }
  td.num { text-align: right; font-family: 'Courier New', monospace; white-space: nowrap; }
  .sec-head td { background: #111; color: #fff; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; padding: 5px 6px; }
  .bold-row td { font-weight: 700; background: #f8f8f8; }
  .indent td:first-child { padding-left: 20px; color: #444; }
  .blank td { padding: 3px; }
  .total-row td { font-weight: 800; font-size: 13px; background: #111; color: #fff; padding: 6px; }
  .total-row td.num { font-family: 'Courier New', monospace; }

  .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .regime-box { border: 2px solid #eee; border-radius: 8px; padding: 12px; }
  .regime-box.recommended { border-color: #3dd68c; background: #f0fdf6; }
  .regime-title { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
  .regime-tax   { font-size: 24px; font-weight: 800; font-family: 'Courier New'; letter-spacing: -1px; }
  .regime-recommended { font-size: 10px; color: #3dd68c; font-weight: 700; margin-top: 4px; }
  .regime-saving { font-size: 10px; color: #555; margin-top: 2px; }

  .adv-table { width: 100%; }
  .adv-table td { padding: 4px 6px; font-size: 11px; }

  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #eee; font-size: 9px; color: #aaa; display: flex; justify-content: space-between; }
  .note   { background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; padding: 8px 12px; font-size: 10px; color: #92400e; margin-bottom: 12px; }

  @media print {
    body { padding: 16px; }
    @page { margin: 1cm; size: A4; }
  }
</style>
</head><body>

<div class="header">
  <div>
    <div class="brand">CA<span>Portal</span></div>
    <div class="ca-info">
      ${ca.name || 'Your CA Firm'}${ca.firm ? ' · ' + ca.firm : ''}<br>
      ${ca.city || ''}${ca.email ? ' · ' + ca.email : ''}
    </div>
  </div>
  <div class="title-block">
    <div class="doc-title">INCOME TAX COMPUTATION</div>
    <div class="doc-sub">FY ${CURRENT_FY} · AY ${CURRENT_AY}</div>
    <div class="doc-sub">Recommended: ${rec === 'old' ? 'Old Regime' : 'New Regime'} · Date: ${today}</div>
  </div>
</div>

<div class="client-row">
  ${[
    ['Client Name', clientName || inputs.clientName || '—'],
    ['PAN', inputs.pan || '—'],
    ['Category', inputs.category === 'very_senior' ? 'Very Senior Citizen (80+)' : inputs.category === 'senior' ? 'Senior Citizen (60–79)' : 'Individual'],
    ['Regime adopted', rec === 'old' ? 'Old Regime' : 'New Regime'],
    ['Assessment Year', CURRENT_AY],
  ].map(([l,v]) => `<div class="client-field"><span class="cf-label">${l}</span><span class="cf-val">${v}</span></div>`).join('')}
</div>

<!-- Regime comparison -->
<div class="comparison">
  <div class="regime-box ${rec === 'new' ? 'recommended' : ''}">
    <div class="regime-title">New Regime (Default)</div>
    <div class="regime-tax">₹ ${fmt(result.new.totalTax)}</div>
    <div class="regime-tax" style="font-size:11px;margin-top:4px;">Total Income: ₹ ${fmt(result.new.totalIncome)}</div>
    ${rec === 'new' ? '<div class="regime-recommended">✓ Recommended — saves ₹ ' + fmt(result.saving) + '</div>' : '<div class="regime-saving">Excess tax: ₹ ' + fmt(result.saving) + '</div>'}
  </div>
  <div class="regime-box ${rec === 'old' ? 'recommended' : ''}">
    <div class="regime-title">Old Regime</div>
    <div class="regime-tax">₹ ${fmt(result.old.totalTax)}</div>
    <div class="regime-tax" style="font-size:11px;margin-top:4px;">Total Income: ₹ ${fmt(result.old.totalIncome)}</div>
    ${rec === 'old' ? '<div class="regime-recommended">✓ Recommended — saves ₹ ' + fmt(result.saving) + '</div>' : '<div class="regime-saving">Excess tax: ₹ ' + fmt(result.saving) + '</div>'}
  </div>
</div>

<!-- Detailed computation for recommended regime -->
<table>
  ${secHead(`INCOME COMPUTATION — ${rec === 'old' ? 'OLD' : 'NEW'} REGIME`)}

  ${secHead('A. Salary Income')}
  ${row('Gross salary from employer', data.grossSalary, false, true)}
  ${data.hraExempt ? row('Less: HRA exemption u/s 10(13A)', -data.hraExempt, false, true) : ''}
  ${data.ltaExempt ? row('Less: LTA exemption u/s 10(5)', -data.ltaExempt, false, true) : ''}
  ${row('Less: Standard deduction u/s 16(ia)', -data.stdDed, false, true)}
  ${data.profTax  ? row('Less: Professional tax u/s 16(iii)', -data.profTax, false, true) : ''}
  ${data.nps80CCD2 ? row('Less: Employer NPS u/s 80CCD(2)', -data.nps80CCD2, false, true) : ''}
  ${row('Net salary income', data.netSalary, true)}

  ${secHead('B. Income from House Property')}
  ${data.hpIncome >= 0
    ? row('Net house property income', data.hpPositive, false, true)
    : row('Loss from house property (set-off u/s 71)', data.hpSetOff, false, true)}
  ${row('Income from house property', data.hpPositive + data.hpSetOff, true)}

  ${secHead('C. Capital Gains')}
  ${data.stcgOther ? row('STCG — other assets (at slab rate)', data.stcgOther, false, true) : ''}
  ${data.stcgEquity ? row('STCG u/s 111A — equity/MF @ 20%', data.stcgEquity, false, true) : ''}
  ${data.ltcgEquity ? row(`LTCG u/s 112A — equity/MF @ 12.5% (₹1.25L exempt, taxable: ₹${fmt(data.ltcgEquityTaxable)})`, data.ltcgEquity, false, true) : ''}
  ${data.ltcgOther  ? row('LTCG u/s 112 — other assets @ 12.5%', data.ltcgOther, false, true) : ''}
  ${(!data.stcgOther && !data.stcgEquity && !data.ltcgEquity && !data.ltcgOther) ? row('No capital gains', 0, false, true) : ''}

  ${secHead('D. Business / Profession Income')}
  ${row('Net profit from business/profession', data.businessIncome, false, true)}

  ${secHead('E. Other Sources')}
  ${data.savingsInt ? row('Savings bank interest', data.savingsInt, false, true) : ''}
  ${data.fdInt      ? row('FD / term deposit interest', data.fdInt, false, true) : ''}
  ${row('Other sources income', data.otherTotal, true)}

  ${blankRow()}
  ${row('GROSS TOTAL INCOME (GTI)', data.gti, true)}

  ${rec === 'old' && data.deductions > 0 ? `
    ${secHead('F. Deductions — Chapter VI-A')}
    ${data.dedDetail?.d80C     ? row('80C — PPF, LIC, ELSS, home loan principal', data.dedDetail.d80C, false, true) : ''}
    ${data.dedDetail?.d80CCD1B ? row('80CCD(1B) — NPS additional', data.dedDetail.d80CCD1B, false, true) : ''}
    ${data.dedDetail?.d80D     ? row('80D — Medical insurance premium', data.dedDetail.d80D, false, true) : ''}
    ${data.dedDetail?.d80E     ? row('80E — Education loan interest', data.dedDetail.d80E, false, true) : ''}
    ${data.dedDetail?.d80G     ? row('80G — Donations', data.dedDetail.d80G, false, true) : ''}
    ${data.dedDetail?.d80TTA   ? row('80TTA / 80TTB — Interest income', data.dedDetail.d80TTA, false, true) : ''}
    ${data.dedDetail?.d80U     ? row('80U — Disability deduction', data.dedDetail.d80U, false, true) : ''}
    ${data.dedDetail?.d80Other ? row('Other deductions', data.dedDetail.d80Other, false, true) : ''}
    ${row('Total deductions', data.deductions, true)}
  ` : ''}

  ${blankRow()}
  ${row('TOTAL INCOME (rounded to ₹10)', data.totalIncome, true)}
</table>

<table>
  ${secHead('TAX COMPUTATION')}
  ${row('Tax on total income (slab)', data.slabTax, false, true)}
  ${data.stcgEquityTax ? row('Tax on STCG u/s 111A @ 20%', data.stcgEquityTax, false, true) : ''}
  ${data.ltcgEquityTax ? row('Tax on LTCG u/s 112A @ 12.5%', data.ltcgEquityTax, false, true) : ''}
  ${data.ltcgOtherTax  ? row('Tax on LTCG u/s 112 @ 12.5%', data.ltcgOtherTax, false, true) : ''}
  ${row('Gross tax', data.slabTax + (data.stcgEquityTax||0) + (data.ltcgEquityTax||0) + (data.ltcgOtherTax||0), true)}
  ${data.rebate87A ? row('Less: Rebate u/s 87A', -data.rebate87A, false, true) : ''}
  ${row('Tax after rebate', data.slabTaxAfterRebate + (data.cgTax||0), true)}
  ${(data.slabSurcharge||0) + (data.cgSurcharge||0) > 0 ? row('Add: Surcharge', (data.slabSurcharge||0) + (data.cgSurcharge||0), false, true) : ''}
  ${row('Tax + Surcharge', data.totalBeforeCess, true)}
  ${row('Add: Health & Education Cess @ 4%', data.cess, false, true)}
  <tr class="total-row"><td>TOTAL TAX PAYABLE</td><td class="num">₹&nbsp;${fmt(data.totalTax)}</td></tr>
</table>

<!-- Advance Tax -->
${data.totalTax > 10000 ? `
<table class="adv-table">
  ${secHead('ADVANCE TAX SCHEDULE (if applicable)')}
  <tr style="background:#f8f8f8"><td><b>Instalment</b></td><td><b>Due Date</b></td><td><b>Cumulative %</b></td><td class="num"><b>Amount (₹)</b></td></tr>
  <tr><td>1st instalment</td><td>15 June ${CURRENT_FY.split('-')[0]}</td><td>15%</td><td class="num">${fmt(Math.round(data.totalTax*0.15))}</td></tr>
  <tr><td>2nd instalment</td><td>15 Sep ${CURRENT_FY.split('-')[0]}</td><td>45%</td><td class="num">${fmt(Math.round(data.totalTax*0.45))}</td></tr>
  <tr><td>3rd instalment</td><td>15 Dec ${CURRENT_FY.split('-')[0]}</td><td>75%</td><td class="num">${fmt(Math.round(data.totalTax*0.75))}</td></tr>
  <tr><td>4th instalment</td><td>15 Mar ${CURRENT_FY.split('-')[1] ? '20' + CURRENT_FY.split('-')[1] : ''}</td><td>100%</td><td class="num">${fmt(data.totalTax)}</td></tr>
</table>
` : ''}

<div class="note">
  ⚠ This computation is prepared based on information provided and is for reference only.
  Actual tax liability may vary. Verify all figures before filing. For LTCG on property purchased
  before 23 July 2024, indexation option may be available — consult for specific advice.
</div>

<div class="footer">
  <span>Prepared by: ${ca.name || 'CA'} ${ca.firm ? '· ' + ca.firm : ''} · ${today}</span>
  <span>Generated via CAPortal · caportal.co · For client use only</span>
</div>

<script>window.onload = () => window.print();</script>
</body></html>`);
  win.document.close();
};
