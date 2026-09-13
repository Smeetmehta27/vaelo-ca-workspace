import { HealthSnapshotResult } from '../pipelines/financial-health';
import { Schedule } from './feasibility-mapper';

export interface HealthMappedResult {
  flags: HealthSnapshotResult['flags'];
  schedules: Schedule[];
}

export function mapFinancialHealthReport(result: HealthSnapshotResult): HealthMappedResult {
  const { liquidity, expenseGrowth, cashRunway, revenueVolatility, flags } = result;

  const schedules: Schedule[] = [
    {
      scheduleTitle: 'Liquidity',
      columns: ['Value'],
      score: liquidity.score,
      scoreLabel: liquidity.label,
      note: liquidity.note,
      rows: [
        { label: 'Current Ratio', value: liquidity.currentRatio, valueType: 'ratio' }
      ]
    },
    {
      scheduleTitle: 'Expense Growth',
      columns: ['Value'],
      score: expenseGrowth.score,
      scoreLabel: expenseGrowth.label,
      note: expenseGrowth.note,
      rows: [
        { label: 'Revenue Growth', value: expenseGrowth.revenueGrowthPct, valueType: 'percentage' },
        { label: 'Expense Growth', value: expenseGrowth.expenseGrowthPct, valueType: 'percentage' },
        { label: 'Spread', value: expenseGrowth.spreadPct, isSubtotal: true, valueType: 'percentage' }
      ]
    },
    {
      scheduleTitle: 'Cash Runway',
      columns: ['Value'],
      score: cashRunway.score,
      scoreLabel: cashRunway.label,
      note: cashRunway.note,
      rows: [
        { label: 'Months of Runway', value: cashRunway.runwayMonths, valueType: 'number' }
      ]
    },
    {
      scheduleTitle: 'Revenue Volatility',
      columns: ['Value'],
      score: revenueVolatility.score,
      scoreLabel: revenueVolatility.label,
      note: revenueVolatility.note,
      rows: [
        { label: 'Mean Revenue', value: revenueVolatility.meanRevenue, valueType: 'currency' },
        { label: 'Coefficient of Variation', value: revenueVolatility.coefficientOfVariation, isSubtotal: true, valueType: 'ratio' }
      ]
    }
  ];

  return {
    flags,
    schedules
  };
}
