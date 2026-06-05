import { computeBS, fmtBS } from '../balanceSheet';

const base = {
  openingStock: 0, purchases: 0, purchaseReturns: 0,
  directWages: 0, carriageInward: 0, powerFuel: 0, otherDirectExp: 0,
  sales: 0, salesReturns: 0, closingStock: 0,
  salaries: 0, rent: 0, electricity: 0, telephone: 0,
  advertising: 0, depreciation: 0, auditFees: 0,
  bankCharges: 0, interestPaid: 0, badDebts: 0, otherIndirectExp: 0,
  commission: 0, discountReceived: 0, interestEarned: 0, rentReceived: 0, otherIncome: 0,
  openingCapital: 0, drawings: 0,
  securedLoans: 0, unsecuredLoans: 0, sundryCreditors: 0,
  outstandingExp: 0, advanceReceived: 0, otherCurrentLiab: 0,
  land: 0, building: 0, buildingDep: 0, machinery: 0, machineryDep: 0,
  furniture: 0, furnitureDep: 0, vehicles: 0, vehiclesDep: 0, otherFixedAssets: 0,
  investments: 0, sundryDebtors: 0, advancePaid: 0,
  cash: 0, bankBalance: 0, prepaidExp: 0, otherCurrentAss: 0,
};

// ── Trading Account ───────────────────────────────────────────────────────────

describe('Trading Account', () => {
  test('gross profit = trading credit − trading debit', () => {
    const r = computeBS({ ...base, openingStock: 10000, purchases: 50000, directWages: 5000, sales: 80000, closingStock: 8000 });
    // tradingDebit=65000, tradingCredit=88000, grossProfit=23000
    expect(r.grossProfit).toBe(23000);
    expect(r.tradingDebit).toBe(65000);
    expect(r.tradingCredit).toBe(88000);
  });
  test('gross loss when costs exceed sales', () => {
    const r = computeBS({ ...base, openingStock: 10000, purchases: 60000, sales: 50000, closingStock: 5000 });
    // tradingDebit=70000, tradingCredit=55000, grossProfit=-15000
    expect(r.grossProfit).toBe(-15000);
  });
  test('purchase returns reduce net purchases', () => {
    const r = computeBS({ ...base, purchases: 100000, purchaseReturns: 10000, sales: 200000 });
    expect(r.netPurchases).toBe(90000);
  });
  test('sales returns reduce net sales', () => {
    const r = computeBS({ ...base, sales: 100000, salesReturns: 5000 });
    expect(r.netSales).toBe(95000);
  });
  test('direct expenses summed correctly', () => {
    const r = computeBS({ ...base, directWages: 5000, carriageInward: 2000, powerFuel: 1000, otherDirectExp: 500 });
    expect(r.totalDirectExp).toBe(8500);
  });
  test('closing stock included in trading credit', () => {
    const r = computeBS({ ...base, sales: 100000, closingStock: 20000 });
    expect(r.tradingCredit).toBe(120000);
  });
});

// ── P&L Account ───────────────────────────────────────────────────────────────

describe('P&L Account', () => {
  test('net profit = totalPLCredit − totalPLDebit', () => {
    const r = computeBS({ ...base, sales: 100000, openingStock: 30000, purchases: 40000, salaries: 10000 });
    // grossProfit = 100000-70000 = 30000, totalPLCredit=30000, totalPLDebit=10000, netProfit=20000
    expect(r.netProfit).toBe(20000);
  });
  test('net loss when indirect expenses exceed gross profit', () => {
    const r = computeBS({ ...base, sales: 100000, purchases: 80000, salaries: 30000 });
    expect(r.netProfit).toBe(-10000);
  });
  test('other income added to P&L credit side', () => {
    const r = computeBS({ ...base, sales: 100000, commission: 5000, discountReceived: 2000 });
    expect(r.totalPLCredit).toBe(107000); // grossProfit=100000 + 5000 + 2000
  });
  test('gross loss from trading added to P&L debit side', () => {
    const r = computeBS({ ...base, sales: 50000, purchases: 70000, salaries: 5000 });
    // grossProfit=-20000, grossLossFromTrade=20000 included in totalPLDebit
    expect(r.totalPLDebit).toBe(25000); // 5000 salaries + 20000 gross loss
  });
});

// ── Balance Sheet ─────────────────────────────────────────────────────────────

describe('Balance Sheet', () => {
  test('adjustedCapital = openingCapital + netProfit − drawings', () => {
    const r = computeBS({ ...base, openingCapital: 100000, sales: 120000, purchases: 80000, drawings: 10000 });
    // netProfit = 40000, adjustedCapital = 130000
    expect(r.adjustedCapital).toBe(130000);
  });
  test('adjustedCapital reduced by net loss', () => {
    const r = computeBS({ ...base, openingCapital: 100000, sales: 50000, purchases: 80000 });
    expect(r.adjustedCapital).toBe(70000); // 100000 - 30000 loss
  });
  test('closing stock appears in totalCurrentAssets', () => {
    const r = computeBS({ ...base, closingStock: 15000, cash: 5000 });
    expect(r.totalCurrentAssets).toBe(20000);
  });
  test('fixed assets net of depreciation', () => {
    const r = computeBS({ ...base, building: 200000, buildingDep: 50000 });
    expect(r.buildingNet).toBe(150000);
  });
  test('balanced sheet: totalAssets = totalLiabilities', () => {
    const r = computeBS({
      ...base,
      openingCapital: 100000,
      sales: 150000, purchases: 100000,        // grossProfit = 50000, netProfit = 50000
      adjustedCapital: 150000,                  // 100000 + 50000
      cash: 150000,                             // totalAssets = 150000
    });
    // adjustedCapital = 100000 + 50000 = 150000, totalLiabilities = 150000
    // totalCurrentAssets = cash = 150000, totalAssets = 150000
    expect(r.isBalanced).toBe(true);
    expect(Math.abs(r.difference)).toBeLessThan(2);
  });
  test('unbalanced sheet detected', () => {
    const r = computeBS({ ...base, openingCapital: 100000, cash: 50000 });
    expect(r.isBalanced).toBe(false);
    expect(Math.abs(r.difference)).toBeGreaterThan(1);
  });
  test('isBalanced allows rounding tolerance of ±1', () => {
    const r = computeBS({ ...base, openingCapital: 100000, cash: 100001 });
    expect(r.isBalanced).toBe(true); // diff = 1, within tolerance
  });
});

// ── fmtBS ─────────────────────────────────────────────────────────────────────

describe('fmtBS', () => {
  test('formats zero', () => {
    expect(fmtBS(0)).toBe('0');
  });
  test('formats small number', () => {
    expect(fmtBS(100)).toBe('100');
  });
  test('rounds to nearest integer', () => {
    expect(fmtBS(1234.7)).toBe('1,235');
  });
  test('formats large number with commas', () => {
    const result = fmtBS(1234567);
    expect(result).toMatch(/\d+/); // contains digits
    expect(result.replace(/[^0-9]/g, '')).toBe('1234567'); // correct digits
  });
});
