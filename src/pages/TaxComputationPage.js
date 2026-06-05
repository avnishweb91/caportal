import { useState, useMemo } from 'react';
import { fullCompute, fmt, CURRENT_FY, CURRENT_AY } from '../lib/taxCalc';
import { printComputation } from '../lib/computationPdf';
import './TaxComputationPage.css';

const EMPTY = {
  clientName: '', pan: '', category: 'individual',
  // Salary
  grossSalary: '', basicSalary: '', hraReceived: '', rentPaid: '', isMetro: false,
  ltaExempt: '', profTax: '', nps80CCD2: '',
  // House Property
  hpType: 'self', annualRent: '', munTax: '', homeLoanInterest: '',
  // Capital Gains
  stcgEquity: '', ltcgEquity: '', stcgOther: '', ltcgOther: '',
  // Business
  businessIncome: '',
  // Other Sources
  savingsInterest: '', fdInterest: '', dividend: '', otherIncome: '',
  // Deductions (old regime)
  d80C: '', d80CCD1B: '', d80DSelf: '', selfIsSenior: false,
  d80DParents: '', parentsAreSenior: false, d80E: '', d80G: '',
  d80TTA: '', d80U: '', d80Other: '',
};

const NUM = (v) => Number(v) || 0;

export default function TaxComputationPage({ clients, showToast }) {
  const [tab, setTab]         = useState('income');
  const [inp, setInp]         = useState(EMPTY);
  const [selectedClient, setSC] = useState('');

  const set = (k, v) => setInp(p => ({ ...p, [k]: v }));
  const setNum = (k, v) => set(k, v.replace(/[^0-9.]/g, ''));

  const result = useMemo(() => {
    try { return fullCompute(inp); }
    catch { return null; }
  }, [inp]);

  const loadClient = (id) => {
    const c = clients.find(c => String(c.id) === String(id));
    if (!c) return;
    setSC(id);
    setInp(p => ({ ...p, clientName: c.name, pan: c.pan }));
  };

  const saveComputation = () => {
    if (!result) return;
    const key = `ca_computation_${inp.pan || inp.clientName || Date.now()}`;
    localStorage.setItem(key, JSON.stringify({ inputs: inp, result, savedAt: new Date().toISOString() }));
    showToast(`Computation saved for ${inp.clientName || 'client'}`);
  };

  const rec  = result?.recommended;
  const data = result?.[rec];

  const field = (label, key, hint) => (
    <div className="tc-field">
      <label className="tc-label">{label}</label>
      <div className="tc-input-wrap">
        <span className="tc-rupee">₹</span>
        <input className="input tc-input" type="text" inputMode="numeric"
          placeholder="0" value={inp[key]}
          onChange={e => setNum(key, e.target.value)} />
      </div>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );

  const summaryRow = (label, val, type = 'normal', indent = false) => (
    <div key={label} className={`sr ${type} ${indent ? 'indent' : ''}`}>
      <span>{label}</span>
      <span className="sr-val">{val < 0 ? `(${fmt(Math.abs(val))})` : `₹ ${fmt(val)}`}</span>
    </div>
  );

  return (
    <div className="page">
      <div className="page-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="page-title">Tax Computation</span>
          <span className="page-breadcrumb">/ FY {CURRENT_FY} · AY {CURRENT_AY}</span>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" onClick={saveComputation} disabled={!result}>
            Save
          </button>
          <button className="btn btn-primary btn-sm"
            disabled={!result}
            onClick={() => printComputation(inp, result, inp.clientName)}>
            📄 Download PDF
          </button>
        </div>
      </div>

      {/* Client + Category bar */}
      <div className="tc-topbar">
        <div className="tc-field" style={{ minWidth: 200 }}>
          <label className="tc-label">Client</label>
          <select className="select input" value={selectedClient}
            onChange={e => { loadClient(e.target.value); setSC(e.target.value); }}>
            <option value="">— Select or type below —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name} · {c.pan}</option>)}
          </select>
        </div>
        {!selectedClient && (
          <div className="tc-field">
            <label className="tc-label">Client name</label>
            <input className="input" placeholder="Priya Sharma" value={inp.clientName}
              onChange={e => set('clientName', e.target.value)} />
          </div>
        )}
        <div className="tc-field">
          <label className="tc-label">PAN</label>
          <input className="input" style={{ fontFamily: 'var(--mono)', letterSpacing: '0.05em', maxWidth: 140 }}
            placeholder="ABCDE1234F" value={inp.pan}
            onChange={e => set('pan', e.target.value.toUpperCase())} maxLength={10} />
        </div>
        <div className="tc-field">
          <label className="tc-label">Category</label>
          <select className="select input" value={inp.category}
            onChange={e => set('category', e.target.value)}>
            <option value="individual">Individual (below 60)</option>
            <option value="senior">Senior Citizen (60–79)</option>
            <option value="very_senior">Very Senior Citizen (80+)</option>
          </select>
        </div>
      </div>

      <div className="tc-body">
        {/* Left: Form */}
        <div className="tc-form">
          <div className="tc-tabs">
            {[['income','Income'],['deductions','Deductions'],['summary','Summary']].map(([id,label]) => (
              <button key={id} className={`tc-tab ${tab===id?'active':''}`} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>

          {/* ── INCOME TAB ── */}
          {tab === 'income' && (
            <div className="tc-section-list">

              <div className="tc-section">
                <div className="tc-section-title">A. Salary Income</div>
                {field('Gross salary (from Form 16)', 'grossSalary')}
                {field('Basic salary (for HRA calc)', 'basicSalary')}
                {field('HRA received from employer', 'hraReceived')}
                {field('Rent paid (for HRA exemption)', 'rentPaid')}
                <div className="tc-field">
                  <label className="tc-label">Metro city?</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={inp.isMetro}
                      onChange={e => set('isMetro', e.target.checked)} />
                    Yes — 50% HRA limit (No = 40%)
                  </label>
                </div>
                {field('LTA exemption u/s 10(5)', 'ltaExempt')}
                {field('Professional tax paid', 'profTax')}
                {field('Employer NPS contribution u/s 80CCD(2)', 'nps80CCD2', 'Max 10% of salary — allowed in both regimes')}
              </div>

              <div className="tc-section">
                <div className="tc-section-title">B. House Property</div>
                <div className="tc-field">
                  <label className="tc-label">Property type</label>
                  <select className="select input" value={inp.hpType}
                    onChange={e => set('hpType', e.target.value)}>
                    <option value="self">Self-occupied</option>
                    <option value="letout">Let-out</option>
                    <option value="none">None / No property</option>
                  </select>
                </div>
                {inp.hpType === 'letout' && <>
                  {field('Annual rent received', 'annualRent')}
                  {field('Municipal taxes paid', 'munTax')}
                </>}
                {inp.hpType !== 'none' && field('Home loan interest paid', 'homeLoanInterest',
                  inp.hpType === 'self' ? 'Max ₹2L deductible (old regime only)' : 'Full amount deductible for let-out')}
              </div>

              <div className="tc-section">
                <div className="tc-section-title">C. Capital Gains</div>
                <div className="tc-note">Budget 2024: STCG equity @ 20%, LTCG equity @ 12.5% (₹1.25L exempt)</div>
                {field('STCG — equity / equity MF (u/s 111A)', 'stcgEquity', '@ 20% flat')}
                {field('LTCG — equity / equity MF (u/s 112A)', 'ltcgEquity', '@ 12.5% above ₹1.25L')}
                {field('STCG — other assets (debt, property)', 'stcgOther', 'Added to slab income')}
                {field('LTCG — other assets (u/s 112)', 'ltcgOther', '@ 12.5% without indexation (Budget 2024)')}
              </div>

              <div className="tc-section">
                <div className="tc-section-title">D. Business / Profession</div>
                {field('Net profit from business / profession', 'businessIncome', 'As per P&L account')}
              </div>

              <div className="tc-section">
                <div className="tc-section-title">E. Other Sources</div>
                {field('Savings bank interest', 'savingsInterest')}
                {field('FD / term deposit interest', 'fdInterest')}
                {field('Dividends received', 'dividend')}
                {field('Any other income', 'otherIncome')}
              </div>
            </div>
          )}

          {/* ── DEDUCTIONS TAB ── */}
          {tab === 'deductions' && (
            <div className="tc-section-list">
              <div className="tc-note-box">
                Deductions under Chapter VI-A are available under <strong>Old Regime only</strong>.
                New Regime does not allow these deductions (except 80CCD(2) already entered above).
              </div>

              <div className="tc-section">
                <div className="tc-section-title">80C — Max ₹1,50,000</div>
                {field('PPF, LIC, ELSS, EPF, home loan principal, school fees, NSC, etc.', 'd80C', 'Combined limit ₹1,50,000')}
              </div>

              <div className="tc-section">
                <div className="tc-section-title">80CCD(1B) — NPS Additional</div>
                {field('Own NPS contribution (over & above 80C)', 'd80CCD1B', 'Max ₹50,000 additional')}
              </div>

              <div className="tc-section">
                <div className="tc-section-title">80D — Medical Insurance</div>
                {field('Premium for self / spouse / children', 'd80DSelf',
                  inp.selfIsSenior ? 'Max ₹50,000 (self is senior)' : 'Max ₹25,000')}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', marginBottom: 8 }}>
                  <input type="checkbox" checked={inp.selfIsSenior}
                    onChange={e => set('selfIsSenior', e.target.checked)} />
                  Self / spouse is senior citizen
                </label>
                {field('Premium for parents', 'd80DParents',
                  inp.parentsAreSenior ? 'Max ₹50,000 (parents are senior)' : 'Max ₹25,000')}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={inp.parentsAreSenior}
                    onChange={e => set('parentsAreSenior', e.target.checked)} />
                  Parents are senior citizens
                </label>
              </div>

              <div className="tc-section">
                <div className="tc-section-title">80E — Education Loan Interest</div>
                {field('Interest on education loan', 'd80E', 'No upper limit, for 8 years')}
              </div>

              <div className="tc-section">
                <div className="tc-section-title">80G — Donations</div>
                {field('Eligible donations (50% / 100%)', 'd80G', 'Enter eligible amount after applying 50%/100% rule')}
              </div>

              <div className="tc-section">
                <div className="tc-section-title">80TTA / 80TTB — Interest Income</div>
                {inp.category === 'senior' || inp.category === 'very_senior'
                  ? field('Savings + FD interest (80TTB)', 'd80TTA', 'Max ₹50,000 for senior citizens')
                  : field('Savings bank interest (80TTA)', 'd80TTA', 'Max ₹10,000 for individuals')
                }
              </div>

              <div className="tc-section">
                <div className="tc-section-title">80U — Disability</div>
                {field('Disability deduction', 'd80U', 'Self: ₹75,000 (normal), ₹1,25,000 (severe)')}
              </div>

              <div className="tc-section">
                <div className="tc-section-title">Other Deductions</div>
                {field('Any other Chapter VI-A deduction', 'd80Other')}
              </div>
            </div>
          )}

          {/* ── SUMMARY TAB ── */}
          {tab === 'summary' && result && (
            <div className="tc-section-list">
              {/* Regime recommendation */}
              <div className={`tc-recommendation ${rec}`}>
                <div className="tc-rec-title">
                  {rec === 'new' ? '🟢 New Regime recommended' : '🟢 Old Regime recommended'}
                </div>
                <div className="tc-rec-saving">
                  Saves ₹ {fmt(result.saving)} compared to {rec === 'new' ? 'old' : 'new'} regime
                </div>
              </div>

              {/* Side by side */}
              <div className="tc-regime-compare">
                {['old','new'].map(r => {
                  const d = result[r];
                  return (
                    <div key={r} className={`tc-regime-box ${rec === r ? 'tc-regime-recommended' : ''}`}>
                      <div className="tc-regime-name">{r === 'old' ? 'Old Regime' : 'New Regime'}</div>
                      {rec === r && <span className="tc-regime-badge">Recommended</span>}
                      <div className="tc-regime-tax">₹ {fmt(d.totalTax)}</div>
                      <div className="tc-regime-breakdown">
                        <div><span>GTI</span><span>₹ {fmt(d.gti)}</span></div>
                        {r === 'old' && d.deductions > 0 && <div><span>Deductions</span><span>(₹ {fmt(d.deductions)})</span></div>}
                        <div><span>Total Income</span><span>₹ {fmt(d.totalIncome)}</span></div>
                        <div><span>Slab Tax</span><span>₹ {fmt(d.slabTax)}</span></div>
                        {d.rebate87A > 0 && <div><span>Rebate 87A</span><span>(₹ {fmt(d.rebate87A)})</span></div>}
                        {(d.stcgEquityTax||0)+(d.ltcgEquityTax||0)+(d.ltcgOtherTax||0) > 0 &&
                          <div><span>CG Tax</span><span>₹ {fmt((d.stcgEquityTax||0)+(d.ltcgEquityTax||0)+(d.ltcgOtherTax||0))}</span></div>}
                        <div><span>Cess (4%)</span><span>₹ {fmt(d.cess)}</span></div>
                        <div className="tc-regime-total"><span>Total Tax</span><span>₹ {fmt(d.totalTax)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Advance Tax */}
              {data.totalTax > 10000 && (
                <div className="tc-section">
                  <div className="tc-section-title">Advance Tax Schedule</div>
                  <div className="tc-adv-table">
                    {[
                      ['15 Jun', '15%', Math.round(data.totalTax * 0.15)],
                      ['15 Sep', '45%', Math.round(data.totalTax * 0.45)],
                      ['15 Dec', '75%', Math.round(data.totalTax * 0.75)],
                      ['15 Mar', '100%', data.totalTax],
                    ].map(([date, pct, amt]) => (
                      <div key={date} className="tc-adv-row">
                        <span>{date} {CURRENT_FY.split('-')[0]}</span>
                        <span>{pct}</span>
                        <span>₹ {fmt(amt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'summary' && !result && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
              Enter income details to see the computation
            </div>
          )}
        </div>

        {/* Right: Live summary */}
        <div className="tc-live">
          <div className="tc-live-title">Live Summary</div>
          {result ? <>
            <div className="tc-live-regime">
              <div className="tlr-label">Recommended</div>
              <div className="tlr-regime">{rec === 'new' ? 'New Regime' : 'Old Regime'}</div>
              <div className="tlr-saving">Saves ₹ {fmt(result.saving)}</div>
            </div>
            <div className="tc-live-tax">
              <div className="tlt-label">Total Tax Payable</div>
              <div className="tlt-amount">₹ {fmt(data?.totalTax)}</div>
            </div>
            <div className="tc-live-breakdown">
              {summaryRow('Gross Salary', NUM(inp.grossSalary))}
              {summaryRow('Less: Exemptions', -(NUM(inp.hraReceived) + NUM(inp.ltaExempt) + (rec === 'new' ? 75000 : 50000) + NUM(inp.profTax)))}
              {summaryRow('Net Salary', data?.netSalary)}
              {data?.hpIncome ? summaryRow('House Property', data.hpIncome < 0 ? data.hpSetOff : data.hpPositive) : null}
              {data?.cgInSlab > 0 ? summaryRow('Capital Gains (slab)', data.cgInSlab) : null}
              {NUM(inp.businessIncome) > 0 ? summaryRow('Business Income', NUM(inp.businessIncome)) : null}
              {data?.otherTotal > 0 ? summaryRow('Other Sources', data.otherTotal) : null}
              <div className="sr bold">
                <span>Gross Total Income</span>
                <span className="sr-val">₹ {fmt(data?.gti)}</span>
              </div>
              {rec === 'old' && data?.deductions > 0
                ? summaryRow('Less: Deductions', -data.deductions)
                : null}
              <div className="sr bold">
                <span>Total Income</span>
                <span className="sr-val">₹ {fmt(data?.totalIncome)}</span>
              </div>
              <div className="sr divider" />
              {summaryRow('Slab Tax', data?.slabTax)}
              {data?.rebate87A > 0 ? summaryRow('Rebate u/s 87A', -data.rebate87A) : null}
              {(data?.stcgEquityTax || 0) > 0 ? summaryRow('STCG Tax @ 20%', data.stcgEquityTax) : null}
              {(data?.ltcgEquityTax || 0) > 0 ? summaryRow('LTCG Tax @ 12.5%', data.ltcgEquityTax) : null}
              {summaryRow('Cess @ 4%', data?.cess)}
              <div className="sr total">
                <span>Total Tax</span>
                <span className="sr-val">₹ {fmt(data?.totalTax)}</span>
              </div>
            </div>
          </> : (
            <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7, marginTop: 16 }}>
              Start entering income details on the left — tax computes automatically under both regimes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
