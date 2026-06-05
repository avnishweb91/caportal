// CAPortal Tax Calculation Engine
// FY 2025-26 / AY 2026-27
// Covers: Individual, Senior Citizen (60-79), Very Senior Citizen (80+)
// Old Regime + New Regime (Budget 2025 revised slabs)
// Capital Gains: Budget 2024 revised rates

export const CURRENT_FY = '2025-26';
export const CURRENT_AY = '2026-27';

// ── Slabs ──────────────────────────────────────────────────────────────────

const OLD_SLABS = {
  individual:  [[0,250000,0],[250000,500000,0.05],[500000,1000000,0.20],[1000000,Infinity,0.30]],
  senior:      [[0,300000,0],[300000,500000,0.05],[500000,1000000,0.20],[1000000,Infinity,0.30]],
  very_senior: [[0,500000,0],[500000,1000000,0.20],[1000000,Infinity,0.30]],
};

// New Regime — Budget 2025 revised
const NEW_SLABS = [
  [0,400000,0],[400000,800000,0.05],[800000,1200000,0.10],
  [1200000,1600000,0.15],[1600000,2000000,0.20],
  [2000000,2400000,0.25],[2400000,Infinity,0.30],
];

const applySlabs = (income, slabs) => {
  let tax = 0;
  for (const [min, max, rate] of slabs) {
    if (income <= min) break;
    tax += (Math.min(income, max) - min) * rate;
  }
  return Math.round(tax);
};

// Surcharge rate on regular income
const getSurchargeRate = (income, regime) => {
  if (income > 50000000) return regime === 'new' ? 0.25 : 0.37; // capped at 25% in new
  if (income > 20000000) return 0.25;
  if (income > 10000000) return 0.15;
  if (income >  5000000) return 0.10;
  return 0;
};

// ── HRA Exemption ──────────────────────────────────────────────────────────
export const calcHRA = ({ hraReceived = 0, basicSalary = 0, rentPaid = 0, isMetro = false }) => {
  if (!hraReceived || !rentPaid) return 0;
  const limit1 = hraReceived;
  const limit2 = isMetro ? basicSalary * 0.50 : basicSalary * 0.40;
  const limit3 = Math.max(0, rentPaid - basicSalary * 0.10);
  return Math.round(Math.min(limit1, limit2, limit3));
};

// ── Section 80GG (rent paid when no HRA) ──────────────────────────────────
export const calc80GG = ({ rentPaid = 0, totalIncome = 0 }) => {
  const limit1 = 5000 * 12;                           // ₹5,000/month
  const limit2 = totalIncome * 0.25;                  // 25% of total income
  const limit3 = Math.max(0, rentPaid - totalIncome * 0.10); // rent - 10%
  return Math.round(Math.min(limit1, limit2, limit3));
};

// ── Income Computation ─────────────────────────────────────────────────────
export const computeIncome = (inp, regime) => {
  const n = (v) => Number(v) || 0;

  // Salary
  const grossSalary   = n(inp.grossSalary);
  const hraReceived   = n(inp.hraReceived);
  const hraExempt     = regime === 'old'
    ? calcHRA({ hraReceived, basicSalary: n(inp.basicSalary), rentPaid: n(inp.rentPaid), isMetro: inp.isMetro })
    : 0;
  const ltaExempt     = regime === 'old' ? n(inp.ltaExempt) : 0;
  const profTax       = n(inp.profTax);
  const stdDed        = regime === 'new' ? 75000 : 50000;
  const nps80CCD2     = Math.min(n(inp.nps80CCD2), grossSalary * 0.10); // allowed in both regimes
  const netSalary     = Math.max(0, grossSalary - hraExempt - ltaExempt - stdDed - profTax - nps80CCD2);

  // House Property
  const hpType        = inp.hpType || 'self';
  let hpIncome        = 0;
  if (hpType === 'letout') {
    const gav         = n(inp.annualRent);
    const nav         = gav - n(inp.munTax);
    const repair      = Math.round(nav * 0.30);
    hpIncome          = nav - repair - n(inp.homeLoanInterest);
  } else {
    // Self-occupied: HL interest loss up to ₹2L (old regime only)
    const hlDeduction = regime === 'old' ? Math.min(n(inp.homeLoanInterest), 200000) : 0;
    hpIncome          = -hlDeduction;
  }
  // HP loss set-off capped at ₹2L
  const hpSetOff      = hpIncome < 0 ? Math.max(hpIncome, -200000) : 0;
  const hpPositive    = hpIncome > 0 ? hpIncome : 0;

  // Capital Gains (taxed separately at flat rates — not in slab computation)
  const stcgEquity    = n(inp.stcgEquity);   // 20% u/s 111A (Budget 2024)
  const ltcgEquity    = n(inp.ltcgEquity);   // 12.5% u/s 112A, exemption ₹1.25L
  const ltcgEquityTaxable = Math.max(0, ltcgEquity - 125000);
  const stcgOther     = n(inp.stcgOther);    // at slab rate
  const ltcgOther     = n(inp.ltcgOther);    // 12.5% without indexation (Budget 2024)

  // Business / Profession
  const businessIncome = n(inp.businessIncome);

  // Other Sources
  const savingsInt    = n(inp.savingsInterest);
  const fdInt         = n(inp.fdInterest);
  const dividend      = n(inp.dividend);
  const otherInc      = n(inp.otherIncome);
  const otherTotal    = savingsInt + fdInt + dividend + otherInc;

  // Gross Total Income (slab income only — flat-rate CG excluded)
  const gti = netSalary + hpPositive + hpSetOff + stcgOther + businessIncome + otherTotal;

  // Deductions — Chapter VI-A (old regime only, except 80CCD(2) already deducted above)
  let deductions = 0;
  const dedDetail = {};
  if (regime === 'old') {
    dedDetail.d80C     = Math.min(n(inp.d80C), 150000);
    dedDetail.d80CCD1B = Math.min(n(inp.d80CCD1B), 50000);
    dedDetail.d80D     = Math.min(n(inp.d80DSelf), inp.selfIsSenior ? 50000 : 25000)
                       + Math.min(n(inp.d80DParents), inp.parentsAreSenior ? 50000 : 25000);
    dedDetail.d80E     = n(inp.d80E);
    dedDetail.d80G     = n(inp.d80G); // simplified
    dedDetail.d80TTA   = inp.category === 'senior' || inp.category === 'very_senior'
      ? Math.min(savingsInt + fdInt, 50000)     // 80TTB for seniors
      : Math.min(n(inp.d80TTA), 10000);         // 80TTA for non-seniors
    dedDetail.d80U     = n(inp.d80U);           // disability: ₹75K / ₹1.25L
    dedDetail.d80Other = n(inp.d80Other);

    deductions = Object.values(dedDetail).reduce((a, b) => a + b, 0);
  }

  // Total Income (rounded down to nearest ₹10)
  const tiRaw       = Math.max(0, gti - deductions);
  const totalIncome = Math.floor(tiRaw / 10) * 10;

  return {
    grossSalary, hraExempt, ltaExempt, profTax, stdDed, nps80CCD2, netSalary,
    hpIncome, hpSetOff, hpPositive,
    stcgEquity, ltcgEquity, ltcgEquityTaxable, stcgOther, ltcgOther,
    businessIncome, otherTotal, savingsInt, fdInt,
    gti, deductions, dedDetail, totalIncome,
  };
};

// ── Tax Computation ────────────────────────────────────────────────────────
export const computeTax = (inc, inp, regime) => {
  const { totalIncome, stcgEquity, ltcgEquityTaxable, ltcgOther } = inc;
  const category = inp.category || 'individual';

  // Slab income = total income minus flat-rate CG
  const slabIncome = Math.max(0, totalIncome - stcgEquity - ltcgEquityTaxable - ltcgOther);

  // Slab tax
  let slabTax = 0;
  if (regime === 'old') {
    slabTax = applySlabs(slabIncome, OLD_SLABS[category] || OLD_SLABS.individual);
  } else {
    slabTax = applySlabs(slabIncome, NEW_SLABS);
  }

  // Flat-rate capital gains tax (Budget 2024)
  const stcgEquityTax    = Math.round(stcgEquity * 0.20);       // u/s 111A @ 20%
  const ltcgEquityTax    = Math.round(ltcgEquityTaxable * 0.125); // u/s 112A @ 12.5%
  const ltcgOtherTax     = Math.round(ltcgOther * 0.125);       // u/s 112 @ 12.5%

  // Surcharge on CG u/s 111A and 112A is capped at 15%
  const cgSurchargeRate  = totalIncome > 5000000 ? Math.min(getSurchargeRate(totalIncome, regime), 0.15) : 0;
  const cgTax            = stcgEquityTax + ltcgEquityTax + ltcgOtherTax;
  const cgSurcharge      = Math.round(cgTax * cgSurchargeRate);

  // Rebate u/s 87A (applies on slab tax only, not flat-rate CG)
  let rebate87A = 0;
  if (regime === 'old'  && totalIncome <= 500000)  rebate87A = Math.min(slabTax, 12500);
  if (regime === 'new'  && slabIncome  <= 1200000) rebate87A = Math.min(slabTax, 60000);

  const slabTaxAfterRebate = Math.max(0, slabTax - rebate87A);
  const slabSurcharge      = Math.round(slabTaxAfterRebate * getSurchargeRate(totalIncome, regime));

  const totalBeforeCess    = slabTaxAfterRebate + slabSurcharge + cgTax + cgSurcharge;
  const cess               = Math.round(totalBeforeCess * 0.04);
  const totalTax           = totalBeforeCess + cess;

  return {
    slabTax, slabTaxAfterRebate, rebate87A,
    stcgEquityTax, ltcgEquityTax, ltcgOtherTax,
    cgTax, cgSurcharge, slabSurcharge,
    totalBeforeCess, cess, totalTax,
  };
};

// ── Full Computation (both regimes) ───────────────────────────────────────
export const fullCompute = (inputs) => {
  const oldInc = computeIncome(inputs, 'old');
  const oldTax = computeTax(oldInc, inputs, 'old');
  const newInc = computeIncome(inputs, 'new');
  const newTax = computeTax(newInc, inputs, 'new');
  const recommended = oldTax.totalTax <= newTax.totalTax ? 'old' : 'new';
  const saving      = Math.abs(oldTax.totalTax - newTax.totalTax);
  return { old: { ...oldInc, ...oldTax }, new: { ...newInc, ...newTax }, recommended, saving };
};

// ── Advance Tax Schedule ───────────────────────────────────────────────────
export const advanceTax = (totalTax) => [
  { due: 'Jun 15', pct: 15, amount: Math.round(totalTax * 0.15) },
  { due: 'Sep 15', pct: 45, amount: Math.round(totalTax * 0.45) },
  { due: 'Dec 15', pct: 75, amount: Math.round(totalTax * 0.75) },
  { due: 'Mar 15', pct: 100, amount: totalTax },
];

// ── Formatter ──────────────────────────────────────────────────────────────
export const fmt = (n = 0) => {
  const abs = Math.abs(Math.round(n));
  const str = abs.toLocaleString('en-IN');
  return n < 0 ? `(${str})` : str;
};
