import { describe, it, expect } from 'vitest';
import { generateCMAReport, CMAHistoricalInput, CMAAssumptions } from '../lib/pipelines/cma';

describe('CMA Pipeline Tests', () => {

  const baseHistorical: CMAHistoricalInput = {
    revenue: 10000000,
    cogs: 6000000,
    operatingExpenses: 2000000,
    stock: 1500000,
    debtors: 2500000,
    creditors: 1000000,
    termLoans: 5000000,
    cash: 500000,
    otherCurrentAssets: 0,
    otherCurrentLiabilities: 0,
    fixedAssets: 4500000,
    otherNonCurrentAssets: 0,
    otherNonCurrentLiabilities: 0,
    equity: 1000000,
    shortTermBorrowings: 2000000
  };

  const baseAssumptions: CMAAssumptions = {
    revenueGrowthRate: 15,
    cogsMargin: 60,
    operatingExpensesMargin: 20,
    stockDays: 90,
    debtorDays: 90,
    creditorDays: 60,
    interestRate: 10,
    principalRepayment: 500000,
    drawingPowerStockMargin: 25,
    drawingPowerDebtorMargin: 40,
    ocaMargin: 0,
    oclMargin: 0,
    capExMargin: 5,
    depreciationRate: 10,
    taxRate: 25,
    shortTermInterestRate: 10,
    sanctionedLimit: 3000000,
    minimumCashBalance: 50000
  };

  const balanceHistorical = (hist: CMAHistoricalInput): CMAHistoricalInput => {
    const currentAssets = hist.cash + hist.stock + hist.debtors + hist.otherCurrentAssets;
    const totalAssets = currentAssets + hist.fixedAssets + hist.otherNonCurrentAssets;

    const currentLiabilities = hist.creditors + hist.otherCurrentLiabilities + hist.shortTermBorrowings;
    const totalLiabilitiesAndEquity = currentLiabilities + hist.termLoans + hist.otherNonCurrentLiabilities + hist.equity;

    const diff = totalAssets - totalLiabilitiesAndEquity;
    
    // Plug the difference into equity to balance the historical balance sheet
    return {
      ...hist,
      equity: hist.equity + diff
    };
  };

  it('CMA-01: Healthy baseline', () => {
    const res = generateCMAReport(baseHistorical, baseAssumptions, 3);
    expect(res).toHaveLength(3);
    expect(res[0].revenue.value).toBeGreaterThan(0);
    expect(res[0].cash.value).toBeDefined();
  });

  it('CMA-02: Changing historical Stock changes Year-1 working-capital movement/cash impact', () => {
    const histLow = balanceHistorical({ ...baseHistorical, stock: 500000 });
    const resLow = generateCMAReport(histLow, baseAssumptions, 1);
    const histHigh = balanceHistorical({ ...baseHistorical, stock: 4000000 });
    const resHigh = generateCMAReport(histHigh, baseAssumptions, 1);
    
    // Invariant 1: Historical stock affects Year-1 change in stock
    expect(resLow[0].changeInStock.value).not.toEqual(resHigh[0].changeInStock.value);
    
    // Invariant 12: Increasing Stock consumes cash through working-capital bridge
    // If opening stock is lower, changeInStock is higher (projected - opening)
    // Higher changeInStock means more negative wcCashImpact
    expect(resLow[0].workingCapitalCashImpact.value).toBeLessThan(resHigh[0].workingCapitalCashImpact.value);
    
    // Projected stock itself should depend purely on days assumptions
    expect(resLow[0].stock.value).toEqual(resHigh[0].stock.value);
  });

  it('CMA-03: Changing historical Debtors changes Year-1 working-capital movement/cash impact', () => {
    const histLow = balanceHistorical({ ...baseHistorical, debtors: 1000000 });
    const resLow = generateCMAReport(histLow, baseAssumptions, 1);
    const histHigh = balanceHistorical({ ...baseHistorical, debtors: 5000000 });
    const resHigh = generateCMAReport(histHigh, baseAssumptions, 1);

    // Invariant 2: Historical debtors affect Year-1 change in debtors
    expect(resLow[0].changeInDebtors.value).not.toEqual(resHigh[0].changeInDebtors.value);

    // Invariant 12: Increasing Debtors consumes cash
    expect(resLow[0].workingCapitalCashImpact.value).toBeLessThan(resHigh[0].workingCapitalCashImpact.value);
    
    expect(resLow[0].debtors.value).toEqual(resHigh[0].debtors.value);
  });

  it('CMA-04: Changing historical Creditors changes Year-1 working-capital movement/cash impact', () => {
    const histLow = balanceHistorical({ ...baseHistorical, creditors: 500000 });
    const resLow = generateCMAReport(histLow, baseAssumptions, 1);
    const histHigh = balanceHistorical({ ...baseHistorical, creditors: 2000000 });
    const resHigh = generateCMAReport(histHigh, baseAssumptions, 1);

    // Invariant 3: Historical creditors affect Year-1 change in creditors
    expect(resLow[0].changeInCreditors.value).not.toEqual(resHigh[0].changeInCreditors.value);

    // Invariant 13: Increasing Creditors provides cash
    // Lower opening creditors means changeInCreditors is larger positive (projected - opening)
    // BUT higher creditors means we have MORE cash? Wait, if opening is 20L, projected is 10L, change = -10L, wc cash impact = -10L.
    // So if opening is lower, we had to accumulate creditors, cash inflow.
    // wcCashImpact = -changeStock - changeDebtors + changeCreditors
    // changeCreditors = projected - opening
    // If opening is smaller, changeCreditors is larger, wcCashImpact is larger
    expect(resLow[0].workingCapitalCashImpact.value).toBeGreaterThan(resHigh[0].workingCapitalCashImpact.value);
  });

  it('CMA-05: Changing historical Cash changes Year-1 CABF and propagates to Cash Sweep', () => {
    const histLow = balanceHistorical({ ...baseHistorical, cash: 100000 });
    const resLow = generateCMAReport(histLow, baseAssumptions, 1);
    const histHigh = balanceHistorical({ ...baseHistorical, cash: 1000000 });
    const resHigh = generateCMAReport(histHigh, baseAssumptions, 2);

    // In Phase 5, extra cash pays down CC, it does not just sit in Cash.
    // The difference in CABF will directly reflect in the Cash Sweep (repaying CC),
    // provided it does not hit the maximum CC repayment cap.
    expect(resHigh[0].cashSweep.value).not.toEqual(resLow[0].cashSweep.value);
  });

  it('CMA-06: Stock Days sensitivity', () => {
    const assLow = { ...baseAssumptions, stockDays: 30 };
    const resLow = generateCMAReport(baseHistorical, assLow, 1);
    const assHigh = { ...baseAssumptions, stockDays: 120 };
    const resHigh = generateCMAReport(baseHistorical, assHigh, 1);

    // Invariant 9: Increasing Stock Days increases projected Stock
    expect(resLow[0].stock.value).toBeLessThan(resHigh[0].stock.value);
  });

  it('CMA-07: Debtor Days sensitivity', () => {
    const assLow = { ...baseAssumptions, debtorDays: 30 };
    const resLow = generateCMAReport(baseHistorical, assLow, 1);
    const assHigh = { ...baseAssumptions, debtorDays: 120 };
    const resHigh = generateCMAReport(baseHistorical, assHigh, 1);

    // Invariant 10: Increasing Debtor Days increases projected Debtors
    expect(resLow[0].debtors.value).toBeLessThan(resHigh[0].debtors.value);
  });

  it('CMA-08: Creditor Days sensitivity', () => {
    const assLow = { ...baseAssumptions, creditorDays: 15 };
    const resLow = generateCMAReport(baseHistorical, assLow, 1);
    const assHigh = { ...baseAssumptions, creditorDays: 120 };
    const resHigh = generateCMAReport(baseHistorical, assHigh, 1);

    // Invariant 11: Increasing Creditor Days decreases net working-capital requirement
    // Note: 'Net Working Capital requirement' here means Operating WC (Stock + Debtors - Creditors).
    const operatingWcLow = resLow[0].stock.value + resLow[0].debtors.value - resLow[0].creditors.value;
    const operatingWcHigh = resHigh[0].stock.value + resHigh[0].debtors.value - resHigh[0].creditors.value;
    expect(operatingWcHigh).toBeLessThan(operatingWcLow);
  });

  it('CMA-09: Revenue growth sensitivity', () => {
    const assLow = { ...baseAssumptions, revenueGrowthRate: 0 };
    const resLow = generateCMAReport(baseHistorical, assLow, 1);
    const assHigh = { ...baseAssumptions, revenueGrowthRate: 20 };
    const resHigh = generateCMAReport(baseHistorical, assHigh, 1);

    expect(resLow[0].revenue.value).toBeLessThan(resHigh[0].revenue.value);
  });

  it('CMA-10: Multi-year roll-forward invariants', () => {
    const res = generateCMAReport(baseHistorical, baseAssumptions, 3);
    
    // Year N projected becomes Year N+1 opening
    // We can infer this by looking at change in Year 2
    const projectedStockYear1 = res[0].stock.value;
    const projectedStockYear2 = res[1].stock.value;
    const expectedChangeInStockYear2 = projectedStockYear2 - projectedStockYear1;
    
    expect(res[1].changeInStock.value).toBeCloseTo(expectedChangeInStockYear2, 1);

    const projectedDebtorsYear1 = res[0].debtors.value;
    const projectedDebtorsYear2 = res[1].debtors.value;
    const expectedChangeInDebtorsYear2 = projectedDebtorsYear2 - projectedDebtorsYear1;
    
    expect(res[1].changeInDebtors.value).toBeCloseTo(expectedChangeInDebtorsYear2, 1);
  });

  it('CMA-11: Zero historical balances', () => {
    const histZero = balanceHistorical({
      ...baseHistorical,
      revenue: 0,
      stock: 0,
      debtors: 0,
      creditors: 0,
      cash: 0
    });
    const res = generateCMAReport(histZero, baseAssumptions, 3);
    expect(res.length).toBe(3);
    expect(res[0].cash.value).not.toBeNaN();
  });

  it('CMA-12: High working-capital stress', () => {
    const assHigh = { ...baseAssumptions, stockDays: 180, debtorDays: 180, creditorDays: 15 };
    const res = generateCMAReport(baseHistorical, assHigh, 3);
    const wcCashImpact = res[0].workingCapitalCashImpact.value;
    // With very high stock and debtors days, it should consume massive cash
    expect(wcCashImpact).toBeLessThan(0);
    // Cash might even go negative, which is mathematically sound for this test
    expect(res[0].cash.value).toBeDefined();
  });

  it('CMA-13: Low working-capital stress', () => {
    const assLow = { ...baseAssumptions, stockDays: 15, debtorDays: 15, creditorDays: 180 };
    const res = generateCMAReport(baseHistorical, assLow, 3);
    const wcCashImpact = res[0].workingCapitalCashImpact.value;
    // Fast turnover, delayed payment -> generates cash
    expect(wcCashImpact).toBeGreaterThan(0);
  });

  it('CMA-14: Distressed business', () => {
    const histDistressed = balanceHistorical({ ...baseHistorical, revenue: 1000000, cogs: 900000, operatingExpenses: 500000 });
    const res = generateCMAReport(histDistressed, baseAssumptions, 3);
    expect(res).toHaveLength(3);
    expect(res[0].netProfit.value).toBeLessThan(0);
  });

  it('CMA-15: Historical-vs-days diagnostic & Invariant 14', () => {
    // Invariant 14: Historical working-capital values are no longer ignored
    const histA = balanceHistorical({ ...baseHistorical, stock: 100, debtors: 100, creditors: 100 });
    const resA = generateCMAReport(histA, baseAssumptions, 1);
    
    const histB = balanceHistorical({ ...baseHistorical, stock: 9999999, debtors: 9999999, creditors: 9999999 });
    const resB = generateCMAReport(histB, baseAssumptions, 1);
    
    // The projections themselves (cash, wc changes) should differ widely
    expect(resA[0].cash.value).not.toEqual(resB[0].cash.value);
    expect(resA[0].workingCapitalCashImpact.value).not.toEqual(resB[0].workingCapitalCashImpact.value);
  });

  it('CMA-16: Cash Sweep is dynamic across years when supported cash-flow components change', () => {
    // In Phase 5, cash itself might be floored at minimumCashBalance, 
    // but the Cash Sweep (CC delta) will definitely change year over year.
    const res = generateCMAReport(baseHistorical, baseAssumptions, 3);
    expect(res[1].cashSweep.value).not.toEqual(res[0].cashSweep.value);
  });

  it('CMA-17: Drawing Power sensitivity', () => {
    const resBase = generateCMAReport(baseHistorical, baseAssumptions, 1);
    const assDaysLow = { ...baseAssumptions, stockDays: 10, debtorDays: 10 };
    const resDaysLow = generateCMAReport(baseHistorical, assDaysLow, 1);
    
    // DP should depend on projected closing values, meaning days assumptions directly affect it
    expect(resBase[0].drawingPower.value).not.toEqual(resDaysLow[0].drawingPower.value);
  });

  it('CMA-18: AuditedValue verification', () => {
    const res = generateCMAReport(baseHistorical, baseAssumptions, 1);
    const auditedStock = res[0].stock;
    const auditedCash = res[0].cash;
    const auditedChangeInStock = res[0].changeInStock;
    const auditedWcImpact = res[0].workingCapitalCashImpact;

    expect(auditedStock.value).toBeDefined();
    expect(auditedStock.formula).toBeDefined();
    expect(auditedStock.inputs).toBeDefined();

    expect(auditedCash.value).toBeDefined();
    expect(auditedCash.formula).toBeDefined();
    expect(auditedCash.inputs).toBeDefined();

    expect(auditedChangeInStock.value).toBeDefined();
    expect(auditedChangeInStock.formula).toBeDefined();
    expect(auditedChangeInStock.inputs).toBeDefined();

    expect(auditedWcImpact.value).toBeDefined();
    expect(auditedWcImpact.formula).toBeDefined();
    expect(auditedWcImpact.inputs).toBeDefined();
  });
  it('CMA-19: OCA projection (Test 1)', () => {
    const assump = { ...baseAssumptions, ocaMargin: 5 };
    const res = generateCMAReport(baseHistorical, assump, 1);
    const expectedOCA = res[0].revenue.value * (5 / 100);
    expect(res[0].otherCurrentAssets.value).toBeCloseTo(expectedOCA, 1);
  });

  it('CMA-20: OCL projection (Test 2)', () => {
    const assump = { ...baseAssumptions, oclMargin: 8 };
    const res = generateCMAReport(baseHistorical, assump, 1);
    const expectedOCL = res[0].revenue.value * (8 / 100);
    expect(res[0].otherCurrentLiabilities.value).toBeCloseTo(expectedOCL, 1);
  });

  it('CMA-21: Historical OCA sensitivity (Test 3)', () => {
    const assump = { ...baseAssumptions, ocaMargin: 10 };
    const histLow = balanceHistorical({ ...baseHistorical, otherCurrentAssets: 500000 });
    const histHigh = balanceHistorical({ ...baseHistorical, otherCurrentAssets: 2000000 });
    const resLow = generateCMAReport(histLow, assump, 1)[0];
    const resHigh = generateCMAReport(histHigh, assump, 1)[0];

    // Projected OCA should remain identical
    expect(resLow.otherCurrentAssets.value).toEqual(resHigh.otherCurrentAssets.value);
    
    // Year-1 ΔOCA should differ
    expect(resLow.changeInOCA.value).not.toEqual(resHigh.changeInOCA.value);

    // Cash should differ accordingly (Higher opening OCA means smaller changeInOCA, so cash is different)
    expect(resLow.cash.value).not.toEqual(resHigh.cash.value);
  });

  it('CMA-22: Historical OCL sensitivity (Test 4)', () => {
    const histLow = balanceHistorical({ ...baseHistorical, otherCurrentLiabilities: 500000 });
    const histHigh = balanceHistorical({ ...baseHistorical, otherCurrentLiabilities: 2000000 });
    const assump = { ...baseAssumptions, oclMargin: 10 };
    const resLow = generateCMAReport(histLow, assump, 1)[0];
    const resHigh = generateCMAReport(histHigh, assump, 1)[0];

    // Projected OCL should remain identical
    expect(resLow.otherCurrentLiabilities.value).toEqual(resHigh.otherCurrentLiabilities.value);
    
    // Year-1 ΔOCL should differ
    expect(resLow.changeInOCL.value).not.toEqual(resHigh.changeInOCL.value);

    // Cash should differ accordingly
    expect(resLow.cash.value).not.toEqual(resHigh.cash.value);
  });

  it('CMA-23: OCA increase (Test 5)', () => {
    // If projected OCA > opening OCA => ΔOCA > 0 and WC cash impact decreases
    const hist = balanceHistorical({ ...baseHistorical, otherCurrentAssets: 100000 });
    const assump = { ...baseAssumptions, ocaMargin: 10 }; // Will result in large OCA ~1.15M
    const resZero = generateCMAReport(hist, { ...baseAssumptions, ocaMargin: 0 }, 1)[0];
    const res = generateCMAReport(hist, assump, 1)[0];

    expect(res.changeInOCA.value).toBeGreaterThan(0);
    expect(res.workingCapitalCashImpact.value).toBeLessThan(resZero.workingCapitalCashImpact.value);
  });

  it('CMA-24: OCA decrease (Test 6)', () => {
    // If projected OCA < opening OCA => ΔOCA < 0 and WC cash impact increases
    const hist = balanceHistorical({ ...baseHistorical, otherCurrentAssets: 5000000 });
    const assump = { ...baseAssumptions, ocaMargin: 2 }; 
    const resZero = generateCMAReport(hist, { ...baseAssumptions, ocaMargin: 0 }, 1)[0];
    const res = generateCMAReport(hist, assump, 1)[0];

    expect(res.changeInOCA.value).toBeLessThan(0);
    // Even smaller ocaMargin compared to 0 means... wait, ocaMargin=2 is > 0.
    // Let's compare with baseline where OCA change is 0.
    const resStatic = generateCMAReport(balanceHistorical({ ...hist, otherCurrentAssets: res.otherCurrentAssets.value }), assump, 1)[0];
    // If OCA decreases, cash impact is better (higher) than if it stayed flat.
    expect(res.workingCapitalCashImpact.value).toBeGreaterThan(resStatic.workingCapitalCashImpact.value);
  });

  it('CMA-25: OCL increase (Test 7)', () => {
    const hist = balanceHistorical({ ...baseHistorical, otherCurrentLiabilities: 100000 });
    const assump = { ...baseAssumptions, oclMargin: 10 }; 
    const resZero = generateCMAReport(hist, { ...baseAssumptions, oclMargin: 0 }, 1)[0];
    const res = generateCMAReport(hist, assump, 1)[0];

    expect(res.changeInOCL.value).toBeGreaterThan(0);
    expect(res.workingCapitalCashImpact.value).toBeGreaterThan(resZero.workingCapitalCashImpact.value);
  });

  it('CMA-26: OCL decrease (Test 8)', () => {
    const hist = balanceHistorical({ ...baseHistorical, otherCurrentLiabilities: 5000000 });
    const assump = { ...baseAssumptions, oclMargin: 2 }; 
    const res = generateCMAReport(hist, assump, 1)[0]; // projected > 0, so change is > -5M
    
    expect(res.changeInOCL.value).toBeLessThan(0);
    
    // Instead of resStatic, we should compare to a scenario where OCL stayed flat
    const flatHist = balanceHistorical({ ...baseHistorical, otherCurrentLiabilities: res.otherCurrentLiabilities.value });
    const resFlat = generateCMAReport(flatHist, assump, 1)[0];
    
    expect(res.workingCapitalCashImpact.value).toBeLessThan(resFlat.workingCapitalCashImpact.value);
  });

  it('CMA-27: Multi-year continuity (Test 9)', () => {
    const res = generateCMAReport(baseHistorical, { ...baseAssumptions, ocaMargin: 5, oclMargin: 5 }, 3);
    
    // Year 1 closing OCA = Year 2 opening OCA
    const y1CloseOCA = res[0].otherCurrentAssets.value;
    const y2CloseOCA = res[1].otherCurrentAssets.value;
    const expectedChangeOCA = y2CloseOCA - y1CloseOCA;
    expect(res[1].changeInOCA.value).toBeCloseTo(expectedChangeOCA, 1);

    // Year 1 closing OCL = Year 2 opening OCL
    const y1CloseOCL = res[0].otherCurrentLiabilities.value;
    const y2CloseOCL = res[1].otherCurrentLiabilities.value;
    const expectedChangeOCL = y2CloseOCL - y1CloseOCL;
    expect(res[1].changeInOCL.value).toBeCloseTo(expectedChangeOCL, 1);
  });

  it('CMA-28: Cash reconciliation (Test 10)', () => {
    const assump = { ...baseAssumptions, ocaMargin: 5, oclMargin: 5 };
    const res = generateCMAReport(baseHistorical, assump, 1)[0];

    const expectedOCA = res.revenue.value * (assump.ocaMargin / 100);
    const expectedChangeOCA = expectedOCA - baseHistorical.otherCurrentAssets;
    
    const expectedOCL = res.revenue.value * (assump.oclMargin / 100);
    const expectedChangeOCL = expectedOCL - baseHistorical.otherCurrentLiabilities;

    const expectedWCImpact = -res.changeInStock.value - res.changeInDebtors.value - expectedChangeOCA + res.changeInCreditors.value + expectedChangeOCL;
    const expectedCash = baseHistorical.cash + res.netProfit.value + res.depreciation.value + expectedWCImpact - res.capEx.value - assump.principalRepayment + res.cashSweep.value;

    expect(res.workingCapitalCashImpact.value).toBeCloseTo(expectedWCImpact, 1);
    expect(res.cash.value).toBeCloseTo(expectedCash, 1);
  });

  it('CMA-29: Current Ratio (Test 11)', () => {
    const assump = { ...baseAssumptions, ocaMargin: 10, oclMargin: 5 };
    const res = generateCMAReport(baseHistorical, assump, 1)[0];

    const expCurrentAssets = res.stock.value + res.debtors.value + res.cash.value + res.otherCurrentAssets.value;
    const expCurrentLiabilities = res.creditors.value + res.otherCurrentLiabilities.value + res.shortTermBorrowings.value;
    const expRatio = expCurrentAssets / expCurrentLiabilities;

    expect(res.totalCurrentAssets.value).toBeCloseTo(expCurrentAssets, 1);
    expect(res.totalCurrentLiabilities.value).toBeCloseTo(expCurrentLiabilities, 1);
    expect(res.currentRatio.value).toBeCloseTo(expRatio, 2);
  });

  it('CMA-30: Drawing Power invariance (Test 12)', () => {
    const resBase = generateCMAReport(baseHistorical, baseAssumptions, 1)[0];
    const resMod = generateCMAReport(baseHistorical, { ...baseAssumptions, ocaMargin: 20, oclMargin: 20 }, 1)[0];

    // DP should remain absolutely identical because stock, debtors, and creditors didn't change (only their margins did, but days are the same)
    expect(resBase.drawingPower.value).toEqual(resMod.drawingPower.value);
  });

  it('CMA-31: AuditedValue completeness (Test 13)', () => {
    const res = generateCMAReport(baseHistorical, { ...baseAssumptions, ocaMargin: 5, oclMargin: 5 }, 1)[0];
    
    expect(res.otherCurrentAssets.formula).toContain('revenue * (ocaMargin / 100)');
    expect(res.otherCurrentAssets.inputs.revenue).toBeDefined();
    
    expect(res.changeInOCA.formula).toContain('projectedOCA - openingOCA');
    expect(res.changeInOCA.inputs.projectedOCA).toBeDefined();
    
    expect(res.otherCurrentLiabilities.formula).toContain('revenue * (oclMargin / 100)');
    expect(res.changeInOCL.formula).toContain('projectedOCL - openingOCL');
    
    expect(res.workingCapitalCashImpact.formula).toContain('changeInOCA');
    expect(res.workingCapitalCashImpact.formula).toContain('changeInOCL');
  });

  it('CMA-32: Zero historical balances (Test 14)', () => {
    const histZero = balanceHistorical({ ...baseHistorical, otherCurrentAssets: 0, otherCurrentLiabilities: 0 });
    const res = generateCMAReport(histZero, { ...baseAssumptions, ocaMargin: 5, oclMargin: 5 }, 1)[0];
    
    expect(res.cash.value).not.toBeNaN();
    expect(res.currentRatio.value).not.toBeNaN();
  });

  it('CMA-33: Zero margins (Test 15)', () => {
    const assumpZero = { ...baseAssumptions, ocaMargin: 0, oclMargin: 0 };
    const res = generateCMAReport(baseHistorical, assumpZero, 1)[0];
    
    expect(res.otherCurrentAssets.value).toEqual(0);
    expect(res.otherCurrentLiabilities.value).toEqual(0);
    
    const expectedChangeOCA = 0 - baseHistorical.otherCurrentAssets;
    const expectedChangeOCL = 0 - baseHistorical.otherCurrentLiabilities;
    
    expect(res.changeInOCA.value).toEqual(expectedChangeOCA);
    expect(res.changeInOCL.value).toEqual(expectedChangeOCL);
  });

  describe('CMA-Phase14B: Balance Sheet Invariants', () => {
    it('CMA-34: Normal Case Balance Sheet Invariant', () => {
      const res = generateCMAReport(baseHistorical, baseAssumptions, 1)[0];
      const assets = res.totalCurrentAssets.value + res.fixedAssets.value + res.otherNonCurrentAssets.value;
      const liabEquity = res.totalCurrentLiabilities.value + res.termLoans.value + res.otherNonCurrentLiabilities.value + res.equity.value;
      expect(Math.abs(assets - liabEquity)).toBeLessThan(0.01);
    });

    it('CMA-35: CC Draw Balance Sheet Invariant', () => {
      // Force a large draw by reducing starting cash and increasing CapEx
      const drawAssumptions = { ...baseAssumptions, capExMargin: 20, minimumCashBalance: 1000000 };
      const res = generateCMAReport(baseHistorical, drawAssumptions, 1)[0];
      const assets = res.totalCurrentAssets.value + res.fixedAssets.value + res.otherNonCurrentAssets.value;
      const liabEquity = res.totalCurrentLiabilities.value + res.termLoans.value + res.otherNonCurrentLiabilities.value + res.equity.value;
      expect(Math.abs(assets - liabEquity)).toBeLessThan(0.01);
    });

    it('CMA-36: CC Repayment Balance Sheet Invariant', () => {
      // Force repayment by reducing CapEx and increasing Revenue
      const repayAssumptions = { ...baseAssumptions, capExMargin: 0, revenueGrowthRate: 50 };
      const res = generateCMAReport(baseHistorical, repayAssumptions, 1)[0];
      const assets = res.totalCurrentAssets.value + res.fixedAssets.value + res.otherNonCurrentAssets.value;
      const liabEquity = res.totalCurrentLiabilities.value + res.termLoans.value + res.otherNonCurrentLiabilities.value + res.equity.value;
      expect(Math.abs(assets - liabEquity)).toBeLessThan(0.01);
    });

    it('CMA-37: Zero Sanctioned Limit Balance Sheet Invariant', () => {
      const zeroLimitAssumptions = { ...baseAssumptions, sanctionedLimit: 0 };
      const res = generateCMAReport(baseHistorical, zeroLimitAssumptions, 1)[0];
      const assets = res.totalCurrentAssets.value + res.fixedAssets.value + res.otherNonCurrentAssets.value;
      const liabEquity = res.totalCurrentLiabilities.value + res.termLoans.value + res.otherNonCurrentLiabilities.value + res.equity.value;
      expect(Math.abs(assets - liabEquity)).toBeLessThan(0.01);
    });

    it('CMA-38: Unfunded Deficit Balance Sheet Invariant', () => {
      // Force massive deficit
      const deficitAssumptions = { ...baseAssumptions, capExMargin: 50, sanctionedLimit: 0 };
      const res = generateCMAReport(baseHistorical, deficitAssumptions, 1)[0];
      expect(res.unfundedCashDeficit.value).toBeGreaterThan(0);
      const assets = res.totalCurrentAssets.value + res.fixedAssets.value + res.otherNonCurrentAssets.value;
      const liabEquity = res.totalCurrentLiabilities.value + res.termLoans.value + res.otherNonCurrentLiabilities.value + res.equity.value;
      expect(Math.abs(assets - liabEquity)).toBeLessThan(0.01);
    });

    it('CMA-39: Multi-Year Balance Sheet Invariant', () => {
      const res = generateCMAReport(baseHistorical, baseAssumptions, 5);
      for (const year of res) {
        const assets = year.totalCurrentAssets.value + year.fixedAssets.value + year.otherNonCurrentAssets.value;
        const liabEquity = year.totalCurrentLiabilities.value + year.termLoans.value + year.otherNonCurrentLiabilities.value + year.equity.value;
        expect(Math.abs(assets - liabEquity)).toBeLessThan(0.01);
      }
    });
  });
});
