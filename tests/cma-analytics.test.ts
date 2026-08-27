import { describe, it, expect } from 'vitest';
import { generateCMAReport, CMAHistoricalInput, CMAAssumptions } from '../lib/pipelines/cma';
import { evaluateCovenants } from '../lib/pipelines/cma-covenants';
import { calculateRiskScore, calculateScenarioDeltas, identifyWorstCase } from '../lib/pipelines/cma-analytics';

describe('CMA Phase 12 - Analytics & Risk Scoring', () => {

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

  it('1. Healthy Base Case should yield Risk Grade A', () => {
    const baseProjections = generateCMAReport(baseHistorical, baseAssumptions, 1);
    const year = baseProjections[0];
    const covenants = evaluateCovenants(baseProjections, baseAssumptions.sanctionedLimit)[0];
    
    const risk = calculateRiskScore(year, covenants, baseAssumptions.sanctionedLimit);
    
    // Most metrics are healthy
    expect(risk.grade).toBe('A');
    expect(risk.totalScore).toBeLessThanOrEqual(20);
  });

  it('2. Negative Equity should severely impact Risk Score', () => {
    // We create a massive loss to wipe out equity
    const terribleAssumptions = { ...baseAssumptions, cogsMargin: 90, operatingExpensesMargin: 30 };
    const projections = generateCMAReport(baseHistorical, terribleAssumptions, 1);
    const year = projections[0];
    const covenants = evaluateCovenants(projections, terribleAssumptions.sanctionedLimit)[0];
    
    const risk = calculateRiskScore(year, covenants, terribleAssumptions.sanctionedLimit);
    
    const deComponent = risk.components.find(c => c.name === 'Total Debt / Equity');
    expect(deComponent?.points).toBe(30); // 30 points for negative equity
    expect(risk.totalScore).toBeGreaterThan(50); // Should push grade down
  });

  it('3. Scenario Deltas compute correctly', () => {
    const baseProjections = generateCMAReport(baseHistorical, baseAssumptions, 1);
    const baseYear = baseProjections[0];
    const baseCovenants = evaluateCovenants(baseProjections, baseAssumptions.sanctionedLimit)[0];
    const baseRisk = calculateRiskScore(baseYear, baseCovenants, baseAssumptions.sanctionedLimit);

    const downAssumptions = { ...baseAssumptions, revenueGrowthRate: 0 };
    const downProjections = generateCMAReport(baseHistorical, downAssumptions, 1);
    const downYear = downProjections[0];
    const downCovenants = evaluateCovenants(downProjections, downAssumptions.sanctionedLimit)[0];
    const downRisk = calculateRiskScore(downYear, downCovenants, downAssumptions.sanctionedLimit);

    const deltas = calculateScenarioDeltas(baseYear, downYear, baseCovenants, downCovenants, baseRisk, downRisk);
    
    // Revenue absolute delta should be negative
    expect(deltas.revenue.absolute).toBeLessThan(0);
    expect(deltas.revenue.percentage).toBeLessThan(0);
    
    // Exact delta check
    const expectedDelta = downYear.revenue.value - baseYear.revenue.value;
    expect(deltas.revenue.absolute).toBe(expectedDelta);
  });

  it('4. Worst Case Identification - Scenarios', () => {
    const scenarios = [
      { id: 's1', risk: 20, pat: 500000, cr: 1.5, cc: 1000000, years: [{ year: 1, risk: 20 }] }, // Healthy
      { id: 's2', risk: 80, pat: -200000, cr: 0.8, cc: 3500000, years: [{ year: 1, risk: 80 }] }, // Terrible
      { id: 's3', risk: 60, pat: 100000, cr: 1.1, cc: 2000000, years: [{ year: 1, risk: 60 }] }  // Med
    ];

    const summary = identifyWorstCase(scenarios);
    expect(summary.worstRiskScenarioId).toBe('s2');
    expect(summary.worstProfitabilityScenarioId).toBe('s2');
    expect(summary.worstLiquidityScenarioId).toBe('s2');
    expect(summary.worstFacilityScenarioId).toBe('s2');
  });

  it('4b. Worst Case Identification - Dynamic Year Selection', () => {
    const runTest = (worstYearExpected: number, risks: number[]) => {
      const scenarios = [{
        id: 's1', risk: Math.max(...risks), pat: 0, cr: 1, cc: 1, 
        years: risks.map((r, i) => ({ year: i + 1, risk: r }))
      }];
      const summary = identifyWorstCase(scenarios);
      expect(summary.worstProjectedYear).toBe(worstYearExpected);
    };

    // Year 1 is worst
    runTest(1, [95, 50, 40, 20, 10]);
    // Year 2 is worst
    runTest(2, [30, 85, 40, 20, 10]);
    // Year 3 is worst
    runTest(3, [30, 50, 92, 20, 10]);
    // Year 4 is worst
    runTest(4, [30, 50, 40, 88, 10]);
    // Year 5 is worst
    runTest(5, [30, 50, 40, 20, 77]);
  });


  it('5. Handles NOT_APPLICABLE covenants cleanly', () => {
    // 0 debt
    // termLoans was 5M, shortTermBorrowings was 2M. Total liab drops by 7M. Balance it by increasing equity by 7M.
    const zeroDebtHistorical = { ...baseHistorical, termLoans: 0, shortTermBorrowings: 0, interestPaid: 0, equity: baseHistorical.equity + 7000000 };
    const zeroDebtAssumptions = { ...baseAssumptions, interestRate: 0, shortTermInterestRate: 0, principalRepayment: 0 };
    
    const projections = generateCMAReport(zeroDebtHistorical, zeroDebtAssumptions, 1);
    const year = projections[0];
    const covenants = evaluateCovenants(projections, zeroDebtAssumptions.sanctionedLimit)[0];
    
    const dscrCov = covenants.find(c => c.covenantId === 'dscr');
    expect(dscrCov?.status).toBe('NOT_APPLICABLE');

    const risk = calculateRiskScore(year, covenants, zeroDebtAssumptions.sanctionedLimit);
    const dscrRisk = risk.components.find(c => c.name === 'DSCR');
    expect(dscrRisk?.points).toBe(0);
    expect(dscrRisk?.reason).toBe('No debt service.');
  });
});
