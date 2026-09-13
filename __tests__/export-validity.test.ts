import { expect, test, describe } from 'vitest';
import { mapFeasibilityReport } from '../lib/report-mappers/feasibility-mapper';
import { mapFinancialHealthReport } from '../lib/report-mappers/financial-health-mapper';
import { DealFeasibilityReportResult } from '../lib/pipelines/feasibility';
import { formatValue } from '../components/cma/utils';

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
