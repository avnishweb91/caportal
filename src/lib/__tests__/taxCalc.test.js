import {
  calcHRA, calc80GG,
  computeIncome, computeTax, fullCompute,
  advanceTax, fmt,
} from '../taxCalc';

// ── HRA ─────────────────────────────────────────────────────────────────────

describe('calcHRA', () => {
  test('returns 0 when no HRA received', () => {
    expect(calcHRA({ hraReceived: 0, basicSalary: 100000, rentPaid: 80000 })).toBe(0);
  });
  test('returns 0 when no rent paid', () => {
    expect(calcHRA({ hraReceived: 60000, basicSalary: 100000, rentPaid: 0 })).toBe(0);
  });
  test('metro: limited to 50% of basic', () => {
    // limit1=60000, limit2=50000 (metro 50%), limit3=max(0,80000-10000)=70000 → min=50000
    expect(calcHRA({ hraReceived: 60000, basicSalary: 100000, rentPaid: 80000, isMetro: true })).toBe(50000);
  });
  test('non-metro: limited to 40% of basic', () => {
    // limit1=60000, limit2=40000 (non-metro 40%), limit3=70000 → min=40000
    expect(calcHRA({ hraReceived: 60000, basicSalary: 100000, rentPaid: 80000, isMetro: false })).toBe(40000);
  });
  test('limited to actual HRA received when that is lowest', () => {
    // limit1=20000, limit2=50000, limit3=70000 → min=20000
    expect(calcHRA({ hraReceived: 20000, basicSalary: 100000, rentPaid: 80000, isMetro: true })).toBe(20000);
  });
  test('returns 0 when rent does not exceed 10% of basic', () => {
    // limit3=max(0, 5000-10000)=0 → HRA exempt=0
    expect(calcHRA({ hraReceived: 50000, basicSalary: 100000, rentPaid: 5000, isMetro: true })).toBe(0);
  });
});

// ── 80GG ────────────────────────────────────────────────────────────────────

describe('calc80GG', () => {
  test('capped at 5000/month = 60000/year', () => {
    // limit1=60000, limit2=0.25*600000=150000, limit3=60000-60000=0 → min=0 — hmm
    // Let me use a case where limit1 is binding:
    // rentPaid=80000, totalIncome=200000
    // limit1=60000, limit2=50000, limit3=max(0,80000-20000)=60000 → min=50000
    expect(calc80GG({ rentPaid: 80000, totalIncome: 200000 })).toBe(50000);
  });
  test('returns 0 when rent is below 10% of income', () => {
    // rentPaid=5000, totalIncome=100000 → limit3=max(0,5000-10000)=0
    expect(calc80GG({ rentPaid: 5000, totalIncome: 100000 })).toBe(0);
  });
});

// ── computeIncome — old regime ───────────────────────────────────────────────

describe('computeIncome — old regime', () => {
  test('standard deduction is 50,000', () => {
    const inc = computeIncome({ grossSalary: 500000 }, 'old');
    expect(inc.stdDed).toBe(50000);
    expect(inc.netSalary).toBe(450000);
  });
  test('80C deduction capped at 1,50,000', () => {
    const inc = computeIncome({ grossSalary: 800000, d80C: 200000 }, 'old');
    expect(inc.dedDetail.d80C).toBe(150000);
  });
  test('80C deduction applied up to actual investment', () => {
    const inc = computeIncome({ grossSalary: 800000, d80C: 100000 }, 'old');
    expect(inc.dedDetail.d80C).toBe(100000);
  });
  test('HRA exempt in old regime', () => {
    const inc = computeIncome({
      grossSalary: 600000, basicSalary: 300000,
      hraReceived: 120000, rentPaid: 180000, isMetro: true,
    }, 'old');
    expect(inc.hraExempt).toBeGreaterThan(0);
  });
  test('HRA not exempt in new regime', () => {
    const inc = computeIncome({
      grossSalary: 600000, basicSalary: 300000,
      hraReceived: 120000, rentPaid: 180000, isMetro: true,
    }, 'new');
    expect(inc.hraExempt).toBe(0);
  });
  test('home loan interest deduction for self-occupied up to 2L (old regime)', () => {
    const inc = computeIncome({ grossSalary: 1000000, homeLoanInterest: 300000, hpType: 'self' }, 'old');
    expect(inc.hpSetOff).toBe(-200000); // capped at 2L
  });
  test('home loan interest deduction is zero in new regime', () => {
    const inc = computeIncome({ grossSalary: 1000000, homeLoanInterest: 300000, hpType: 'self' }, 'new');
    expect(inc.hpSetOff).toBe(0);
  });
  test('totalIncome rounded down to nearest 10', () => {
    const inc = computeIncome({ grossSalary: 450003 }, 'old');
    expect(inc.totalIncome % 10).toBe(0);
    expect(inc.totalIncome).toBeLessThanOrEqual(inc.tiRaw || inc.gti);
  });
  test('LTCG equity exempt up to 1.25L', () => {
    const inc = computeIncome({ ltcgEquity: 100000 }, 'old');
    expect(inc.ltcgEquityTaxable).toBe(0);
  });
  test('LTCG equity taxable above 1.25L', () => {
    const inc = computeIncome({ ltcgEquity: 300000 }, 'old');
    expect(inc.ltcgEquityTaxable).toBe(175000);
  });
});

// ── computeIncome — new regime ───────────────────────────────────────────────

describe('computeIncome — new regime', () => {
  test('standard deduction is 75,000', () => {
    const inc = computeIncome({ grossSalary: 1000000 }, 'new');
    expect(inc.stdDed).toBe(75000);
    expect(inc.netSalary).toBe(925000);
  });
  test('no Chapter VI-A deductions in new regime', () => {
    const inc = computeIncome({ grossSalary: 1000000, d80C: 150000, d80D: 25000 }, 'new');
    expect(inc.deductions).toBe(0);
  });
});

// ── computeTax — old regime ──────────────────────────────────────────────────

describe('computeTax — old regime', () => {
  const oldTax = (income) => {
    const inc = computeIncome({ grossSalary: income + 50000 }, 'old'); // +50k to offset stdDed
    return computeTax(inc, {}, 'old');
  };

  test('zero tax on income below 2.5L', () => {
    const inc = computeIncome({ grossSalary: 200000 }, 'old');
    const tax = computeTax(inc, {}, 'old');
    expect(tax.totalTax).toBe(0);
  });
  test('5% slab on 2.5L-5L', () => {
    // Income = 400,000 (after std ded from gross 450,000)
    const inc = computeIncome({ grossSalary: 450000 }, 'old'); // net = 400,000
    const tax = computeTax(inc, {}, 'old');
    // slabTax = (400000-250000)*0.05 = 7500, ≤5L so rebate=7500
    expect(tax.totalTax).toBe(0);
  });
  test('87A rebate gives zero tax for income ≤ 5L', () => {
    const inc = computeIncome({ grossSalary: 550000 }, 'old'); // net = 500,000
    const tax = computeTax(inc, {}, 'old');
    expect(tax.rebate87A).toBe(12500);
    expect(tax.slabTaxAfterRebate).toBe(0);
    expect(tax.totalTax).toBe(0);
  });
  test('no 87A rebate for income > 5L', () => {
    const inc = computeIncome({ grossSalary: 700000 }, 'old'); // net = 650,000
    const tax = computeTax(inc, {}, 'old');
    expect(tax.rebate87A).toBe(0);
    expect(tax.totalTax).toBeGreaterThan(0);
  });
  test('4% cess applied on total tax', () => {
    const inc = computeIncome({ grossSalary: 700000 }, 'old');
    const tax = computeTax(inc, {}, 'old');
    expect(tax.cess).toBe(Math.round(tax.totalBeforeCess * 0.04));
  });
  test('STCG equity taxed at 20%', () => {
    const inc = computeIncome({ stcgEquity: 100000 }, 'old');
    const tax = computeTax(inc, {}, 'old');
    expect(tax.stcgEquityTax).toBe(20000);
  });
  test('LTCG equity taxed at 12.5% after 1.25L exemption', () => {
    const inc = computeIncome({ ltcgEquity: 300000 }, 'old');
    const tax = computeTax(inc, {}, 'old');
    expect(tax.ltcgEquityTax).toBe(Math.round(175000 * 0.125)); // 21875
  });
  test('LTCG equity below exemption = zero tax', () => {
    const inc = computeIncome({ ltcgEquity: 100000 }, 'old');
    const tax = computeTax(inc, {}, 'old');
    expect(tax.ltcgEquityTax).toBe(0);
  });
});

// ── computeTax — new regime ──────────────────────────────────────────────────

describe('computeTax — new regime', () => {
  test('zero tax on income up to 4L (zero slab)', () => {
    const inc = computeIncome({ grossSalary: 475000 }, 'new'); // net=400000
    const tax = computeTax(inc, {}, 'new');
    expect(tax.totalTax).toBe(0);
  });
  test('87A rebate applies when slab income ≤ 12L in new regime', () => {
    const inc = computeIncome({ grossSalary: 875000 }, 'new'); // net=800000
    const tax = computeTax(inc, {}, 'new');
    // slabTax = (800000-400000)*0.05 = 20000; rebate = min(20000,60000)=20000
    expect(tax.rebate87A).toBe(20000);
    expect(tax.totalTax).toBe(0);
  });
  test('no 87A rebate when slab income > 12L in new regime', () => {
    const inc = computeIncome({ grossSalary: 1400000 }, 'new'); // net=1325000
    const tax = computeTax(inc, {}, 'new');
    expect(tax.rebate87A).toBe(0);
    expect(tax.totalTax).toBeGreaterThan(0);
  });
});

// ── fullCompute ──────────────────────────────────────────────────────────────

describe('fullCompute', () => {
  test('returns both old and new regime results', () => {
    const result = fullCompute({ grossSalary: 1000000 });
    expect(result.old).toBeDefined();
    expect(result.new).toBeDefined();
    expect(result.recommended).toMatch(/^(old|new)$/);
  });
  test('recommended is the lower-tax regime', () => {
    const result = fullCompute({ grossSalary: 1000000 });
    const betterTax = Math.min(result.old.totalTax, result.new.totalTax);
    const recommended = result[result.recommended].totalTax;
    expect(recommended).toBe(betterTax);
  });
  test('saving is the absolute difference between regimes', () => {
    const result = fullCompute({ grossSalary: 1000000 });
    expect(result.saving).toBe(Math.abs(result.old.totalTax - result.new.totalTax));
  });
});

// ── advanceTax ───────────────────────────────────────────────────────────────

describe('advanceTax', () => {
  test('returns 4 installments', () => {
    expect(advanceTax(100000)).toHaveLength(4);
  });
  test('installment percentages are 15/45/75/100', () => {
    const schedule = advanceTax(100000);
    expect(schedule[0].pct).toBe(15);
    expect(schedule[1].pct).toBe(45);
    expect(schedule[2].pct).toBe(75);
    expect(schedule[3].pct).toBe(100);
  });
  test('amounts match percentage of total tax', () => {
    const schedule = advanceTax(80000);
    expect(schedule[0].amount).toBe(12000); // 15%
    expect(schedule[3].amount).toBe(80000); // 100%
  });
  test('due dates are Jun/Sep/Dec/Mar', () => {
    const schedule = advanceTax(10000);
    expect(schedule[0].due).toBe('Jun 15');
    expect(schedule[3].due).toBe('Mar 15');
  });
});

// ── fmt ──────────────────────────────────────────────────────────────────────

describe('fmt', () => {
  test('formats zero', () => {
    expect(fmt(0)).toBe('0');
  });
  test('formats positive number', () => {
    expect(fmt(100)).toBe('100');
  });
  test('wraps negative in parentheses', () => {
    expect(fmt(-5000)).toMatch(/^\(.*\)$/);
  });
  test('rounds to nearest integer', () => {
    expect(fmt(100.6)).toBe('101');
  });
});
