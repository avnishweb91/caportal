import { useState, useMemo } from 'react';
import { computeBS, fmtBS } from '../lib/balanceSheet';
import { printBalanceSheet } from '../lib/balanceSheetPdf';
import './BalanceSheetPage.css';

const EMPTY = {
  clientName: '', pan: '', businessName: '', businessType: 'Proprietorship',
  fy: '2025-26', membershipNo: '',
  // Trading
  openingStock: '', purchases: '', purchaseReturns: '',
  directWages: '', carriageInward: '', powerFuel: '', otherDirectExp: '',
  sales: '', salesReturns: '', closingStock: '',
  // P&L — expenses
  salaries: '', rent: '', electricity: '', telephone: '',
  advertising: '', depreciation: '', auditFees: '',
  bankCharges: '', interestPaid: '', badDebts: '', otherIndirectExp: '',
  // P&L — income
  commission: '', discountReceived: '', interestEarned: '', rentReceived: '', otherIncome: '',
  // BS — liabilities
  openingCapital: '', drawings: '',
  securedLoans: '', unsecuredLoans: '',
  sundryCreditors: '', outstandingExp: '', advanceReceived: '', otherCurrentLiab: '',
  // BS — assets fixed
  land: '',
  building: '', buildingDep: '',
  machinery: '', machineryDep: '',
  furniture: '', furnitureDep: '',
  vehicles: '', vehiclesDep: '',
  otherFixedAssets: '',
  // BS — assets other
  investments: '',
  sundryDebtors: '', advancePaid: '',
  cash: '', bankBalance: '', prepaidExp: '', otherCurrentAss: '',
};

export default function BalanceSheetPage({ clients, showToast }) {
  const [tab, setTab]   = useState('trading');
  const [inp, setInp]   = useState(EMPTY);
  const [selClient, setSC] = useState('');

  const set    = (k, v) => setInp(p => ({ ...p, [k]: v }));
  const setNum = (k, v) => set(k, v.replace(/[^0-9.]/g, ''));

  const result = useMemo(() => {
    try { return computeBS(inp); } catch { return null; }
  }, [inp]);

  const loadClient = (id) => {
    const c = clients.find(c => String(c.id) === id);
    if (!c) return;
    setSC(id);
    setInp(p => ({ ...p, clientName: c.name, pan: c.pan }));
  };

  const save = () => {
    if (!result) return;
    const key = `ca_bs_${inp.pan || inp.clientName || Date.now()}_${inp.fy}`;
    localStorage.setItem(key, JSON.stringify({ inputs: inp, result, savedAt: new Date().toISOString() }));
    showToast(`Balance sheet saved for ${inp.clientName || 'client'}`);
  };

  const r = result;

  // Field component
  const F = ({ label, k, hint, half }) => (
    <div className={`bs-field ${half ? 'half' : ''}`}>
      <label className="bs-label">{label}</label>
      <div className="bs-input-wrap">
        <span className="bs-rupee">₹</span>
        <input className="input bs-input" type="text" inputMode="numeric"
          placeholder="0" value={inp[k]} onChange={e => setNum(k, e.target.value)} />
      </div>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );

  const FRow = ({ children }) => <div className="bs-row">{children}</div>;

  // Summary value
  const S = ({ label, val, type = '' }) => (
    <div className={`bs-sum-row ${type}`}>
      <span>{label}</span>
      <span className="bs-sum-val">{val < 0 ? `(₹ ${fmtBS(Math.abs(val))})` : `₹ ${fmtBS(val)}`}</span>
    </div>
  );

  return (
    <div className="page">
      <div className="page-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="page-title">Balance Sheet Builder</span>
          <span className="page-breadcrumb">/ Trading · P&L · Balance Sheet</span>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" onClick={save} disabled={!result}>Save</button>
          <button className="btn btn-primary btn-sm" disabled={!result}
            onClick={() => printBalanceSheet(inp, result, inp.clientName)}>
            📄 Download PDF
          </button>
        </div>
      </div>

      {/* Top info bar */}
      <div className="bs-topbar">
        <div className="bs-field">
          <label className="bs-label">Client</label>
          <select className="select input" value={selClient}
            onChange={e => { loadClient(e.target.value); setSC(e.target.value); }}>
            <option value="">— Select client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="bs-field">
          <label className="bs-label">Business name</label>
          <input className="input" placeholder="Vikram Textiles" value={inp.businessName}
            onChange={e => set('businessName', e.target.value)} />
        </div>
        <div className="bs-field">
          <label className="bs-label">Type</label>
          <select className="select input" value={inp.businessType}
            onChange={e => set('businessType', e.target.value)}>
            <option>Proprietorship</option>
            <option>Partnership</option>
            <option>Private Ltd</option>
            <option>LLP</option>
            <option>HUF</option>
          </select>
        </div>
        <div className="bs-field">
          <label className="bs-label">Financial year</label>
          <select className="select input" value={inp.fy}
            onChange={e => set('fy', e.target.value)}>
            <option value="2025-26">FY 2025-26</option>
            <option value="2024-25">FY 2024-25</option>
            <option value="2023-24">FY 2023-24</option>
          </select>
        </div>
        <div className="bs-field">
          <label className="bs-label">CA Membership No.</label>
          <input className="input" style={{ maxWidth: 130 }} placeholder="000000" value={inp.membershipNo}
            onChange={e => set('membershipNo', e.target.value)} />
        </div>
      </div>

      <div className="bs-body">
        {/* Left: form */}
        <div className="bs-form">
          <div className="bs-tabs">
            {[['trading','Trading A/c'],['pl','P&L A/c'],['balance','Balance Sheet']].map(([id,lbl]) => (
              <button key={id} className={`bs-tab ${tab===id?'active':''}`} onClick={() => setTab(id)}>{lbl}</button>
            ))}
          </div>

          {/* ── TRADING ── */}
          {tab === 'trading' && (
            <div className="bs-sections">
              <div className="bs-section">
                <div className="bs-section-head">Dr. Side (Expenses / Debit)</div>
                <F label="Opening stock" k="openingStock" />
                <F label="Purchases" k="purchases" />
                <F label="Less: Purchase returns" k="purchaseReturns" hint="Outward returns" />
                <div className="bs-divider-label">Direct expenses</div>
                <FRow>
                  <F label="Direct wages / labour" k="directWages" half />
                  <F label="Carriage inward / freight" k="carriageInward" half />
                </FRow>
                <FRow>
                  <F label="Power, fuel & water" k="powerFuel" half />
                  <F label="Other direct expenses" k="otherDirectExp" half />
                </FRow>
              </div>
              <div className="bs-section">
                <div className="bs-section-head">Cr. Side (Income / Credit)</div>
                <F label="Sales" k="sales" />
                <F label="Less: Sales returns / inward returns" k="salesReturns" />
                <F label="Closing stock" k="closingStock" />
              </div>
              {r && (
                <div className={`bs-result-box ${r.grossProfit >= 0 ? 'profit' : 'loss'}`}>
                  <span>{r.grossProfit >= 0 ? 'Gross Profit' : 'Gross Loss'}</span>
                  <span className="bs-result-val">₹ {fmtBS(Math.abs(r.grossProfit))}</span>
                </div>
              )}
            </div>
          )}

          {/* ── P&L ── */}
          {tab === 'pl' && (
            <div className="bs-sections">
              <div className="bs-section">
                <div className="bs-section-head">Dr. Side — Indirect Expenses</div>
                <FRow>
                  <F label="Salaries & wages" k="salaries" half />
                  <F label="Rent & rates" k="rent" half />
                </FRow>
                <FRow>
                  <F label="Electricity & utilities" k="electricity" half />
                  <F label="Telephone & internet" k="telephone" half />
                </FRow>
                <FRow>
                  <F label="Advertising & marketing" k="advertising" half />
                  <F label="Depreciation" k="depreciation" half />
                </FRow>
                <FRow>
                  <F label="Audit & professional fees" k="auditFees" half />
                  <F label="Bank charges" k="bankCharges" half />
                </FRow>
                <FRow>
                  <F label="Interest paid on loans" k="interestPaid" half />
                  <F label="Bad debts written off" k="badDebts" half />
                </FRow>
                <F label="Other indirect expenses" k="otherIndirectExp" />
              </div>
              <div className="bs-section">
                <div className="bs-section-head">Cr. Side — Other Income</div>
                <FRow>
                  <F label="Commission received" k="commission" half />
                  <F label="Discount received" k="discountReceived" half />
                </FRow>
                <FRow>
                  <F label="Interest earned" k="interestEarned" half />
                  <F label="Rent received" k="rentReceived" half />
                </FRow>
                <F label="Other income" k="otherIncome" />
              </div>
              {r && (
                <div className={`bs-result-box ${r.netProfit >= 0 ? 'profit' : 'loss'}`}>
                  <span>{r.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</span>
                  <span className="bs-result-val">₹ {fmtBS(Math.abs(r.netProfit))}</span>
                </div>
              )}
            </div>
          )}

          {/* ── BALANCE SHEET ── */}
          {tab === 'balance' && (
            <div className="bs-sections">
              <div className="bs-section">
                <div className="bs-section-head">Liabilities</div>
                <div className="bs-divider-label">Capital Account</div>
                <FRow>
                  <F label="Opening capital" k="openingCapital" half />
                  <F label="Drawings during year" k="drawings" half />
                </FRow>
                <div className="bs-divider-label">Loans</div>
                <FRow>
                  <F label="Secured loans" k="securedLoans" half />
                  <F label="Unsecured loans" k="unsecuredLoans" half />
                </FRow>
                <div className="bs-divider-label">Current Liabilities</div>
                <FRow>
                  <F label="Sundry creditors" k="sundryCreditors" half />
                  <F label="Outstanding expenses" k="outstandingExp" half />
                </FRow>
                <FRow>
                  <F label="Advance received" k="advanceReceived" half />
                  <F label="Other current liabilities" k="otherCurrentLiab" half />
                </FRow>
              </div>

              <div className="bs-section">
                <div className="bs-section-head">Assets</div>
                <div className="bs-divider-label">Fixed Assets (enter gross value + depreciation separately)</div>
                <F label="Land & site (no depreciation)" k="land" />
                <FRow>
                  <F label="Building (gross)" k="building" half />
                  <F label="Less: Accumulated depreciation" k="buildingDep" half />
                </FRow>
                <FRow>
                  <F label="Machinery (gross)" k="machinery" half />
                  <F label="Less: Accumulated depreciation" k="machineryDep" half />
                </FRow>
                <FRow>
                  <F label="Furniture & fixtures (gross)" k="furniture" half />
                  <F label="Less: Accumulated depreciation" k="furnitureDep" half />
                </FRow>
                <FRow>
                  <F label="Vehicles (gross)" k="vehicles" half />
                  <F label="Less: Accumulated depreciation" k="vehiclesDep" half />
                </FRow>
                <F label="Other fixed assets (net)" k="otherFixedAssets" />
                <div className="bs-divider-label">Investments</div>
                <F label="Investments (at cost)" k="investments" />
                <div className="bs-divider-label">Current Assets</div>
                <FRow>
                  <F label="Sundry debtors" k="sundryDebtors" half />
                  <F label="Advance paid" k="advancePaid" half />
                </FRow>
                <FRow>
                  <F label="Cash in hand" k="cash" half />
                  <F label="Bank balance" k="bankBalance" half />
                </FRow>
                <FRow>
                  <F label="Prepaid expenses" k="prepaidExp" half />
                  <F label="Other current assets" k="otherCurrentAss" half />
                </FRow>
              </div>
            </div>
          )}
        </div>

        {/* Right: live summary */}
        {r && (
          <div className="bs-live">
            <div className="bs-live-title">Live Summary</div>

            <div className="bs-live-section">
              <div className="bs-live-section-head">Trading Account</div>
              <S label="Net Sales" val={r.netSales} />
              <S label="Less: Cost of goods" val={-(r.openingStock + r.netPurchases)} />
              <S label="Less: Direct expenses" val={-r.totalDirectExp} />
              <S label={r.grossProfit >= 0 ? 'Gross Profit' : 'Gross Loss'}
                 val={r.grossProfit} type={r.grossProfit >= 0 ? 'bs-bold-green' : 'bs-bold-red'} />
            </div>

            <div className="bs-live-section">
              <div className="bs-live-section-head">P&L Account</div>
              <S label={r.grossProfit >= 0 ? 'Gross Profit' : 'Gross Loss'} val={r.grossProfit} />
              <S label="Add: Other income" val={r.commission + r.discountReceived + r.interestEarned + r.rentReceived + r.otherIncome} />
              <S label="Less: Indirect expenses" val={-r.totalPLDebit + (r.grossProfit < 0 ? Math.abs(r.grossProfit) : 0)} />
              <S label={r.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                 val={r.netProfit} type={r.netProfit >= 0 ? 'bs-bold-green' : 'bs-bold-red'} />
            </div>

            <div className="bs-live-section">
              <div className="bs-live-section-head">Balance Sheet</div>
              <S label="Total Liabilities" val={r.totalLiabilities} type="bs-bold" />
              <S label="Total Assets"      val={r.totalAssets}      type="bs-bold" />
              <div className={`bs-tally ${r.isBalanced ? 'balanced' : 'unbalanced'}`}>
                {r.isBalanced
                  ? '✓ Balance sheet tallies'
                  : `⚠ Diff: ₹ ${fmtBS(Math.abs(r.difference))}`}
              </div>
            </div>

            <div className="bs-live-section">
              <div className="bs-live-section-head">Key Ratios</div>
              {r.netSales > 0 && (
                <S label="Gross Profit Ratio"
                   val={`${Math.round(r.grossProfit / r.netSales * 100)}%`.replace('₹ ','')} />
              )}
              {r.netSales > 0 && (
                <S label="Net Profit Ratio"
                   val={`${Math.round(r.netProfit / r.netSales * 100)}%`.replace('₹ ','')} />
              )}
              {r.totalCurrentAssets > 0 && (r.sundryCreditors + r.outstandingExp) > 0 && (
                <S label="Current Ratio"
                   val={`${(r.totalCurrentAssets / (r.sundryCreditors + r.outstandingExp)).toFixed(2)}x`.replace('₹ ','')} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
