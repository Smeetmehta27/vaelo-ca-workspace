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
        { label: 'Current Ratio', value: liquidity.currentRatio }
      ]
    },
    {
      scheduleTitle: 'Expense Growth',
      columns: ['Value'],
      score: expenseGrowth.score,
      scoreLabel: expenseGrowth.label,
      note: expenseGrowth.note,
      rows: [
        { label: 'Revenue Growth', value: expenseGrowth.revenueGrowthPct },
        { label: 'Expense Growth', value: expenseGrowth.expenseGrowthPct },
        { label: 'Spread', value: expenseGrowth.spreadPct, isSubtotal: true }
      ]
    },
    {
      scheduleTitle: 'Cash Runway',
      columns: ['Value'],
      score: cashRunway.score,
      scoreLabel: cashRunway.label,
      note: cashRunway.note,
      rows: [
        { label: 'Months of Runway', value: cashRunway.runwayMonths }
      ]
    },
    {
      scheduleTitle: 'Revenue Volatility',
      columns: ['Value'],
      score: revenueVolatility.score,
      scoreLabel: revenueVolatility.label,
      note: revenueVolatility.note,
      rows: [
        { label: 'Mean Revenue', value: revenueVolatility.meanRevenue, isCurrency: true },
        { label: 'Coefficient of Variation', value: revenueVolatility.coefficientOfVariation, isSubtotal: true }
      ]
    }
  ];

  return {
    flags,
    schedules
  };
}
