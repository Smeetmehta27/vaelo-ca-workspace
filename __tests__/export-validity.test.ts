import { expect, test, describe } from 'vitest';
import { mapFeasibilityReport } from '../lib/report-mappers/feasibility-mapper';
import { mapFinancialHealthReport } from '../lib/report-mappers/financial-health-mapper';
import { mapCMAReportSchedules } from '../lib/report-mappers/cma-mapper';
import { DealFeasibilityReportResult } from '../lib/pipelines/feasibility';
import { formatValue, formatCurrency } from '../components/cma/utils';

describe('Feasibility Export Safety Test', () => {
  const mockReport: DealFeasibilityReportResult = {
    verdict: { verdict: "FEASIBLE AS STRUCTURED", reasons: [] },
    premium: {
      targetStandaloneValue: { value: 15.6, inputs: {}, formula: '' },
      purchasePrice: 16.5,
      premiumPct: { value: 5.77, inputs: {}, formula: '' },
    },
    sourcesAndUses: {
      cashNeeded: { value: 9.9, inputs: {}, formula: '' },
      cashSources: { value: 9.9, inputs: {}, formula: '' },
      cashFundingGap: { value: 0, inputs: {}, formula: '' },
      stockNeeded: { value: 6.6, inputs: {}, formula: '' },
      newSharesIssued: { value: 77647, inputs: {}, formula: '' }
    },
    proForma: {
      combinedRevenue: { value: 60, inputs: {}, formula: '' },
      combinedEbitdaPreSynergy: { value: 9.9, inputs: {}, formula: '' },
      combinedNetIncomePreSynergy: { value: 4.98, inputs: {}, formula: '' },
      additionalInterestAfterTax: { value: 0, inputs: {}, formula: '' }
    },
    accretionDilution: {
      acquirerStandaloneEps: { value: 8.4, inputs: {}, formula: '' },
      proFormaEpsPreSynergy: { value: 9.81, inputs: {}, formula: '' },
      changePreSynergyPct: { value: 16.76, inputs: {}, formula: '' },
      changePostSynergyPct: { value: 36.22, inputs: {}, formula: '' },
      proFormaShares: { value: 5077647, inputs: {}, formula: '' },
      proFormaEpsPostSynergyFullRunRate: { value: 11.44, inputs: {}, formula: '' }
    },
    leverage: {
      leverageRatio: { value: 1.81, inputs: {}, formula: '' },
      proFormaNetDebt: { value: 17.9, inputs: {}, formula: '' },
      leverageThreshold: 4,
      leverageFlagged: false
    },
    synergy: {
      totalSynergyNpv: { value: 5.2, inputs: {}, formula: '' },
      pvRampPeriod: { value: 1.22, inputs: {}, formula: '' },
      pvTerminalPerpetuity: { value: 3.98, inputs: {}, formula: '' },
      fullRunRatePretax: { value: 1.1, inputs: {}, formula: '' },
      fullRunRateAfterTax: { value: 0.83, inputs: {}, formula: '' }
    },
    breakeven: {
      breakevenPretaxSynergyRequired: { value: 0, inputs: {}, formula: '' },
      breakevenAfterTaxSynergyRequired: { value: 0, inputs: {}, formula: '' },
      note: "Deal is already EPS-neutral"
    }
  };

  const healthReportMock = {
    flags: [],
    liquidity: { score: 100, label: "Good", note: "", currentRatio: { value: 1.82, inputs: {}, formula: '' } },
    expenseGrowth: { score: 50, label: "Ok", note: "", revenueGrowthPct: { value: 14.13, inputs: {}, formula: '' }, expenseGrowthPct: { value: 9.21, inputs: {}, formula: '' }, spreadPct: { value: 4.92, inputs: {}, formula: '' } },
    cashRunway: { score: 100, label: "Good", note: "", runwayMonths: { value: 17.50, inputs: {}, formula: '' } },
    revenueVolatility: { score: 100, label: "Good", note: "", meanRevenue: { value: 10, inputs: {}, formula: '' }, coefficientOfVariation: { value: 0.13, inputs: {}, formula: '' } }
  };

  test('Feasibility mapper should produce finite values, not NaN strings when exported', () => {
    const mapped = mapFeasibilityReport(mockReport);
    expect(mapped.schedules.length).toBeGreaterThan(0);

    for (const schedule of mapped.schedules) {
      for (const row of schedule.rows) {
        if (row.value !== undefined) {
          // Simulate the extraction logic that the exporters now do
          let rawVal = row.value;
          if (rawVal && typeof rawVal === 'object' && 'value' in rawVal) {
            rawVal = rawVal.value;
          }

          // rawVal MUST NOT be NaN
          expect(Number.isNaN(Number(rawVal))).toBe(false);

          // Simulated exporter formatValue formatting MUST NOT contain NaN
          const formatted = formatValue(Number(rawVal), row.valueType);
          expect(formatted).not.toContain('NaN');
        }
      }
    }
  });

  test('Percentage valueType should output a valid percentage string with formatValue', () => {
    const formattedPct = formatValue(15.50, 'percentage');
    expect(formattedPct).toBe('15.50%');
    expect(formattedPct).not.toContain('NaN');
  });

  test('CMA Mapper: Schedule 1 and Schedule 13 TOL/TNW historical calculations must perfectly match', () => {
    // Generate empty mock projections
        const projections = [1, 2, 3, 4, 5, 6].map(i => ({
      revenue: 0,
      ebitda: 0,
      netProfit: 0,
      currentRatio: 0,
      debtEquityRatio: 0,
      tolTnwRatio: 0,
      dscr: 0,
      wcGap: 0,
      mpbf: 0,
      totalAssets: { value: 0 },
      totalLiabilitiesAndEquity: { value: 0 }
    }));
    
    // Mock historical data mapping strictly to the user's scenario
    const historical = {
      revenue: 100,
      cash: 10,
      stock: 10,
      debtors: 10,
      otherCurrentAssets: 0,
      fixedAssets: 0,
      otherNonCurrentAssets: 0,
      creditors: 1000000,
      otherCurrentLiabilities: 0,
      shortTermBorrowings: 2000000,
      termLoans: 5000000,
      otherNonCurrentLiabilities: 0,
      equity: 1000000,
      currentLiabilitiesExclBank: 0
    };
    
    // Total Outside Liab = Creditors (10L) + ShortTerm (20L) + TermLoans (50L) = 80L
    // Equity (TNW) = 10L
    // TOL/TNW = 8.00
    
    const schedules = mapCMAReportSchedules(historical as any, projections as any);
    
    const sched1 = schedules.find(s => s.scheduleTitle.includes('Schedule 1'));
    const sched13 = schedules.find(s => s.scheduleTitle.includes('Schedule 13'));
    
    const sched1TolTnw = sched1!.rows.find(r => r.label === 'TOL / TNW')!.historicalValue;
    const sched13TolTnw = sched13!.rows.find(r => r.label === 'TOL / TNW')!.historicalValue;
    
    expect(sched1TolTnw).toBe(8);
    expect(sched13TolTnw).toBe(8);
    expect(sched1TolTnw).toEqual(sched13TolTnw);
  });
  test('formatValue should correctly respect currencyDecimals parameter', () => {
    expect(formatValue(15.6, 'currency')).toBe('₹16'); // Default 0
    expect(formatValue(15.6, 'currency', 0)).toBe('₹16');
    expect(formatValue(15.6, 'currency', 2)).toBe('₹15.60');
  });

  test('formatValue should maintain 2-decimal default for percentage and ratio regardless of third argument', () => {
    expect(formatValue(15.5, 'percentage', undefined)).toBe('15.50%');
    expect(formatValue(1.31, 'ratio', undefined)).toBe('1.31');
    // Ensure any arbitrary third argument is ignored
    expect(formatValue(15.5, 'percentage', 0)).toBe('15.50%'); 
    expect(formatValue(1.31, 'ratio', 0)).toBe('1.31');
  });

  test('formatCurrency should correctly respect decimals parameter (regression test)', () => {
    expect(formatCurrency(15.6)).toBe('₹16'); // Default 0
    expect(formatCurrency(15.6, 0)).toBe('₹16');
    expect(formatCurrency(15.6, 2)).toBe('₹15.60');
  });

  test('Mappers should assign correct currencyDecimals (0 for CMA, 2 for Feasibility)', () => {
    const feasibilityMapped = mapFeasibilityReport(mockReport);
    expect(feasibilityMapped.schedules[0].rows[0].currencyDecimals).toBe(2);

    const cmaMapped = mapCMAReportSchedules(null, []);
    // Schedule 1 is Executive Summary, Schedule 2 is Assumptions, Schedule 3 is Balance Sheet
    // Let's check a currency row on Schedule 3 (index 2)
    const currencyRow = cmaMapped[2].rows.find(r => r.valueType === 'currency');
    if (currencyRow) {
      expect(currencyRow.currencyDecimals ?? 0).toBe(0);
    }
  });

  test('mapCMAReportSchedules should always return "Schedule 1 — CMA Executive Summary" as the first element', () => {
    const cmaMapped = mapCMAReportSchedules(null, []);

    expect(cmaMapped.length).toBeGreaterThan(0);
    expect(cmaMapped[0].scheduleTitle).toBe('Schedule 1 — CMA Executive Summary');
    expect(cmaMapped[0].rows.length).toBeGreaterThan(0);
  });

  test('Health mapper should assign correct valueTypes and produce valid outputs', () => {
    const mapped = mapFinancialHealthReport(healthReportMock as any);

    // Liquidity
    expect(mapped.schedules[0].rows[0].valueType).toBe('ratio');
    // Expense Growth
    expect(mapped.schedules[1].rows[0].valueType).toBe('percentage');
    expect(mapped.schedules[1].rows[1].valueType).toBe('percentage');
    expect(mapped.schedules[1].rows[2].valueType).toBe('percentage');
    // Cash Runway
    expect(mapped.schedules[2].rows[0].valueType).toBe('number');
    // Revenue Volatility
    expect(mapped.schedules[3].rows[0].valueType).toBe('currency');
    expect(mapped.schedules[3].rows[1].valueType).toBe('ratio');

    for (const schedule of mapped.schedules) {
      for (const row of schedule.rows) {
        if (row.value !== undefined) {
          let rawVal = row.value;
          if (rawVal && typeof rawVal === 'object' && 'value' in rawVal) {
            rawVal = rawVal.value;
          }
          expect(Number.isNaN(Number(rawVal))).toBe(false);
          const formatted = formatValue(Number(rawVal), row.valueType);
          expect(formatted).not.toContain('NaN');
          
          if (row.valueType === 'percentage') {
             expect(formatted).toMatch(/%$/);
          }
        }
      }
    }
  });

});


