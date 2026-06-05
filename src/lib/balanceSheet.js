// Balance Sheet calculation helpers — Indian accounting format
// Trading Account → P&L Account → Balance Sheet

export const computeBS = (inp) => {
  const n = (v) => Number(v) || 0;

  // ── Trading Account ──────────────────────────────────────────────────────
  const openingStock      = n(inp.openingStock);
  const purchases         = n(inp.purchases);
  const purchaseReturns   = n(inp.purchaseReturns);
  const netPurchases      = purchases - purchaseReturns;
  const directWages       = n(inp.directWages);
  const carriageInward    = n(inp.carriageInward);
  const powerFuel         = n(inp.powerFuel);
  const otherDirectExp    = n(inp.otherDirectExp);
  const totalDirectExp    = directWages + carriageInward + powerFuel + otherDirectExp;

  const sales             = n(inp.sales);
  const salesReturns      = n(inp.salesReturns);
  const netSales          = sales - salesReturns;
  const closingStock      = n(inp.closingStock);

  const tradingDebit      = openingStock + netPurchases + totalDirectExp;
  const tradingCredit     = netSales + closingStock;
  const grossProfit       = tradingCredit - tradingDebit;  // + = profit, - = loss

  // ── Profit & Loss Account ────────────────────────────────────────────────
  // Credit side (income)
  const commission        = n(inp.commission);
  const discountReceived  = n(inp.discountReceived);
  const interestEarned    = n(inp.interestEarned);
  const rentReceived      = n(inp.rentReceived);
  const otherIncome       = n(inp.otherIncome);
  const totalPLCredit     = (grossProfit > 0 ? grossProfit : 0)
                          + commission + discountReceived + interestEarned
                          + rentReceived + otherIncome;

  // Debit side (expenses)
  const salaries          = n(inp.salaries);
  const rent              = n(inp.rent);
  const electricity       = n(inp.electricity);
  const telephone         = n(inp.telephone);
  const advertising       = n(inp.advertising);
  const depreciation      = n(inp.depreciation);
  const auditFees         = n(inp.auditFees);
  const bankCharges       = n(inp.bankCharges);
  const interestPaid      = n(inp.interestPaid);
  const badDebts          = n(inp.badDebts);
  const otherIndirectExp  = n(inp.otherIndirectExp);
  const grossLossFromTrade = grossProfit < 0 ? Math.abs(grossProfit) : 0;
  const totalPLDebit      = salaries + rent + electricity + telephone
                          + advertising + depreciation + auditFees
                          + bankCharges + interestPaid + badDebts
                          + otherIndirectExp + grossLossFromTrade;

  const netProfit         = totalPLCredit - totalPLDebit; // + = profit, - = loss

  // ── Balance Sheet ─────────────────────────────────────────────────────────
  // Liabilities
  const openingCapital    = n(inp.openingCapital);
  const drawings          = n(inp.drawings);
  const adjustedCapital   = openingCapital + netProfit - drawings;
  const securedLoans      = n(inp.securedLoans);
  const unsecuredLoans    = n(inp.unsecuredLoans);
  const sundryCreditors   = n(inp.sundryCreditors);
  const outstandingExp    = n(inp.outstandingExp);
  const advanceReceived   = n(inp.advanceReceived);
  const otherCurrentLiab  = n(inp.otherCurrentLiab);
  const totalLiabilities  = adjustedCapital + securedLoans + unsecuredLoans
                          + sundryCreditors + outstandingExp
                          + advanceReceived + otherCurrentLiab;

  // Assets
  const land              = n(inp.land);
  const building          = n(inp.building);
  const buildingDep       = n(inp.buildingDep);
  const machinery         = n(inp.machinery);
  const machineryDep      = n(inp.machineryDep);
  const furniture         = n(inp.furniture);
  const furnitureDep      = n(inp.furnitureDep);
  const vehicles          = n(inp.vehicles);
  const vehiclesDep       = n(inp.vehiclesDep);
  const otherFixedAssets  = n(inp.otherFixedAssets);
  const netFixedAssets    = land
                          + (building - buildingDep)
                          + (machinery - machineryDep)
                          + (furniture - furnitureDep)
                          + (vehicles - vehiclesDep)
                          + otherFixedAssets;

  const investments       = n(inp.investments);
  const sundryDebtors     = n(inp.sundryDebtors);
  const advancePaid       = n(inp.advancePaid);
  const cash              = n(inp.cash);
  const bankBalance       = n(inp.bankBalance);
  const prepaidExp        = n(inp.prepaidExp);
  const otherCurrentAss   = n(inp.otherCurrentAss);
  const totalCurrentAssets = closingStock + sundryDebtors + advancePaid
                           + cash + bankBalance + prepaidExp + otherCurrentAss;
  const totalAssets       = netFixedAssets + investments + totalCurrentAssets;

  const difference        = totalAssets - totalLiabilities; // should be 0

  return {
    // Trading
    openingStock, netPurchases, totalDirectExp, netSales,
    grossProfit, tradingDebit, tradingCredit,
    // P&L
    totalPLCredit, totalPLDebit, netProfit,
    salaries, rent, electricity, telephone, advertising, depreciation,
    auditFees, bankCharges, interestPaid, badDebts, otherIndirectExp,
    commission, discountReceived, interestEarned, rentReceived, otherIncome,
    // Balance Sheet
    adjustedCapital, openingCapital, drawings, profit: netProfit,
    securedLoans, unsecuredLoans, sundryCreditors, outstandingExp,
    advanceReceived, otherCurrentLiab, totalLiabilities,
    land, buildingNet: building - buildingDep, machineryNet: machinery - machineryDep,
    furnitureNet: furniture - furnitureDep, vehiclesNet: vehicles - vehiclesDep,
    otherFixedAssets, netFixedAssets,
    investments, closingStock, sundryDebtors, advancePaid,
    cash, bankBalance, prepaidExp, otherCurrentAss,
    totalCurrentAssets, totalAssets, difference,
    isBalanced: Math.abs(difference) < 2,
  };
};

export const fmtBS = (n = 0) => {
  const abs = Math.abs(Math.round(n));
  return abs.toLocaleString('en-IN');
};
