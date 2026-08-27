import { describe, it, expect } from 'vitest';
import { generateCMAReport, CMAHistoricalInput, CMAAssumptions, CMAScenario } from '../lib/pipelines/cma';
import { evaluateCovenants } from '../lib/pipelines/cma-covenants';
import { validateCMAInputs } from '../lib/pipelines/cma-validation';

describe('CMA Phase 11 - Scenario Degradation & Covenants', () => {

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
    interestPaid: 500000,
    principalRepayment: 500000,
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

  it('1. Valid Base + valid Downside → both succeed, Base untouched', () => {
    const baseProjections = generateCMAReport(baseHistorical, baseAssumptions, 1);
    const downsideAssumptions = { ...baseAssumptions, cogsMargin: 65 };
    const valid = validateCMAInputs(baseHistorical, downsideAssumptions).valid;
    expect(valid).toBe(true);

    const downsideProjections = generateCMAReport(baseHistorical, downsideAssumptions, 1);
    
    // Base is untouched and mathematically distinct
    expect(baseProjections[0].netProfit.value).toBeGreaterThan(downsideProjections[0].netProfit.value);
  });

  it('2. Invalid Downside must not contaminate Base Case (Validation Failure)', () => {
    // A scenario with 150% COGS is an invalid input in Phase 9
    const downsideAssumptions = { ...baseAssumptions, cogsMargin: 150 };
    const valResult = validateCMAInputs(baseHistorical, downsideAssumptions);
    
    expect(valResult.valid).toBe(false);
    
    // Base Case is completely independent
    const baseProjections = generateCMAReport(baseHistorical, baseAssumptions, 1);
    expect(baseProjections.length).toBe(1);
    expect(baseProjections[0].revenue.value).toBe(11500000);
  });

  it('3. Explicit zero overrides must remain valid overrides', () => {
    const zeroAssumptions = { ...baseAssumptions, revenueGrowthRate: 0, sanctionedLimit: 0 };
    const valResult = validateCMAInputs(baseHistorical, zeroAssumptions);
    expect(valResult.valid).toBe(true);
    
    const projections = generateCMAReport(baseHistorical, zeroAssumptions, 1);
    expect(projections[0].revenue.value).toBe(10000000); // 0% growth
    
    const covenants = evaluateCovenants(projections, zeroAssumptions.sanctionedLimit);
    // Limit is 0, but CC Utilization might be > 0.
    // We expect a breach in cc_limit if actual > limit
    const ccLimitCov = covenants[0].find(c => c.covenantId === 'cc_limit');
    if (projections[0].shortTermBorrowings.value > 0) {
      expect(ccLimitCov?.status).toBe('BREACH');
    }
  });

  it('4. Covenant PASS condition', () => {
    const baseProjections = generateCMAReport(baseHistorical, baseAssumptions, 1);
    const covenants = evaluateCovenants(baseProjections, baseAssumptions.sanctionedLimit);
    
    // With Healthy assumptions, most should PASS
    const currentRatioCov = covenants[0].find(c => c.covenantId === 'current_ratio');
    expect(currentRatioCov?.status).toBe('PASS');
  });

  it('5. Covenant WARNING condition (Current Ratio < 1.33)', () => {
    const tightAssumptions = { ...baseAssumptions, creditorDays: 365, stockDays: 30, debtorDays: 30 }; // Increases Current Liabilities, reduces Current Assets
    const projections = generateCMAReport(baseHistorical, tightAssumptions, 1);
    
    // Ensure CR is between 1.0 and 1.33
    expect(projections[0].currentRatio.value).toBeGreaterThanOrEqual(1.0);
    expect(projections[0].currentRatio.value).toBeLessThan(1.33);

    const covenants = evaluateCovenants(projections, tightAssumptions.sanctionedLimit);
    const currentRatioCov = covenants[0].find(c => c.covenantId === 'current_ratio');
    expect(currentRatioCov?.status).toBe('WARNING');
  });

  it('6. Covenant BREACH condition (DSCR < 1.0)', () => {
    // Massive debt repayment and low margin
    const breachAssumptions = { ...baseAssumptions, principalRepayment: 5000000, cogsMargin: 90 }; 
    const projections = generateCMAReport(baseHistorical, breachAssumptions, 1);
    
    expect(projections[0].dscr.value).toBeLessThan(1.0);

    const covenants = evaluateCovenants(projections, breachAssumptions.sanctionedLimit);
    const dscrCov = covenants[0].find(c => c.covenantId === 'dscr');
    expect(dscrCov?.status).toBe('BREACH');
  });

  it('7. Unfunded Deficit Breach', () => {
    // Massive CapEx with Zero Sanctioned Limit forces an unfunded deficit
    const deficitAssumptions = { ...baseAssumptions, capExMargin: 50, sanctionedLimit: 0 };
    const projections = generateCMAReport(baseHistorical, deficitAssumptions, 1);
    
    expect(projections[0].unfundedCashDeficit.value).toBeGreaterThan(0);

    const covenants = evaluateCovenants(projections, deficitAssumptions.sanctionedLimit);
    const defCov = covenants[0].find(c => c.covenantId === 'unfunded_deficit');
    expect(defCov?.status).toBe('BREACH');
  });
});
