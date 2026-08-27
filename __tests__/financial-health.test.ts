import { expect, test, describe } from 'vitest';
import { 
  HealthSnapshotRequest, 
  calculateHealthSnapshot 
} from '../lib/pipelines/financial-health';

describe('Financial Health Snapshot Pipeline - Stress Test', () => {
  test('Confirming a genuinely unhealthy business scores accordingly', () => {
    const stressSnapshot: HealthSnapshotRequest = {
      meta: {
        clientName: "Distressed Example Pvt Ltd",
        caFirmName: "Example & Associates",
        sector: "Retail",
        reportDate: "2024-01-01"
      },
      liquidity: {
        currentAssets: 2.0,
        currentLiabilities: 3.0,           // ratio < 1.0 -> Weak
      },
      expenseGrowth: {
        revenuePriorYear: 10.0,
        revenueCurrentYear: 10.2,          // ~2% revenue growth
        operatingExpensesPriorYear: 8.0,
        operatingExpensesCurrentYear: 9.6,  // ~20% expense growth -> big positive spread
      },
      cashRunway: {
        cashAndEquivalents: 0.6,
        monthlyNetCashFlow: -0.30,        // burning fast -> 2 months runway
      },
      revenueVolatility: {
        historicalRevenue: [10.0, 4.0, 14.0, 3.5, 11.0],   // genuinely erratic, CV well above 0.30
      },
    };

    const stressResult = calculateHealthSnapshot(stressSnapshot);

    expect(stressResult.liquidity.label).toBe("Weak");
    expect(stressResult.liquidity.score).toBeLessThan(40);

    expect(stressResult.expenseGrowth.spreadPct.value).toBeLessThan(-5);
    expect(stressResult.expenseGrowth.label).toBe("Concerning");

    expect(stressResult.cashRunway.runwayMonths?.value).toBeLessThan(3);
    expect(stressResult.cashRunway.label).toBe("Critical");

    expect(stressResult.revenueVolatility.coefficientOfVariation?.value).toBeGreaterThan(0.15);

    expect(stressResult.flags.length).toBe(4);
  });

  test('VULN-003: Infinity prevention in edge cases (0 cash flow, 0 mean revenue)', () => {
    const edgeSnapshot: HealthSnapshotRequest = {
      meta: { clientName: "A", caFirmName: "B", sector: "C", reportDate: "2024-01-01" },
      liquidity: { currentAssets: 10, currentLiabilities: 0 }, // 0 denominator
      expenseGrowth: { revenuePriorYear: 0, revenueCurrentYear: 0, operatingExpensesPriorYear: 0, operatingExpensesCurrentYear: 0 }, // 0 denominators
      cashRunway: { cashAndEquivalents: 10, monthlyNetCashFlow: 0 }, // 0 burn
      revenueVolatility: { historicalRevenue: [0, 0, 0, 0] }, // 0 mean revenue
    };

    const edgeResult = calculateHealthSnapshot(edgeSnapshot);
    
    // Liquidity
    expect(edgeResult.liquidity.currentRatio).toBeNull();
    
    // Expense Growth
    expect(edgeResult.expenseGrowth.revenueGrowthPct.value).toBe(0);
    expect(edgeResult.expenseGrowth.expenseGrowthPct.value).toBe(0);
    
    // Runway
    expect(edgeResult.cashRunway.runwayMonths).toBeNull(); // handled by generative logic
    
    // Volatility
    expect(edgeResult.revenueVolatility.coefficientOfVariation).toBeNull();
  });
});
