import { DealFeasibilityReportResult } from '../pipelines/feasibility';

export interface ScheduleRow {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  isCurrency?: boolean;
  isSubtotal?: boolean;
  isCustom?: boolean;
  customValue?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  historical?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  year1?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  year2?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  year3?: any;
  indent?: boolean;
  isHeader?: boolean;
}

export interface Schedule {
  scheduleTitle: string;
  columns: string[];
  rows: ScheduleRow[];
  score?: number;
  scoreLabel?: string;
  note?: string;
}

export interface FeasibilityMappedResult {
  verdict: DealFeasibilityReportResult['verdict'];
  schedules: Schedule[];
  leverage: DealFeasibilityReportResult['leverage'];
  synergy: DealFeasibilityReportResult['synergy'];
  breakeven: DealFeasibilityReportResult['breakeven'];
}

export function mapFeasibilityReport(result: DealFeasibilityReportResult): FeasibilityMappedResult {
  const { premium, sourcesAndUses, proForma, accretionDilution, leverage, synergy, breakeven, verdict } = result;

  const schedules: Schedule[] = [
    {
      scheduleTitle: 'Premium & Economics',
      columns: ['Value'],
      rows: [
        { label: 'Target Standalone Value', value: premium.targetStandaloneValue, isCurrency: true },
        { label: 'Purchase Price', customValue: `₹${premium.purchasePrice.toLocaleString()}`, isCustom: true },
        { label: 'Premium %', value: premium.premiumPct, isSubtotal: true }
      ]
    },
    {
      scheduleTitle: 'Sources & Uses (Cash)',
      columns: ['Value'],
      rows: [
        { label: 'Cash Needed', value: sourcesAndUses.cashNeeded, isCurrency: true },
        { label: 'Cash Sources (Debt + Acquirer Cash)', value: sourcesAndUses.cashSources, isCurrency: true },
        { label: 'Funding Gap', value: sourcesAndUses.cashFundingGap, isCurrency: true, isSubtotal: true }
      ]
    },
    {
      scheduleTitle: 'Pro-Forma Combined (Day 1)',
      columns: ['Value'],
      rows: [
        { label: 'Combined Revenue', value: proForma.combinedRevenue, isCurrency: true },
        { label: 'Combined EBITDA', value: proForma.combinedEbitdaPreSynergy, isCurrency: true },
        { label: 'Pro-Forma Net Income', value: proForma.combinedNetIncomePreSynergy, isCurrency: true, isSubtotal: true }
      ]
    },
    {
      scheduleTitle: 'Accretion / Dilution (EPS)',
      columns: ['Value'],
      rows: [
        { label: 'Acquirer Standalone EPS', value: accretionDilution.acquirerStandaloneEps },
        { label: 'Pro-forma EPS (Pre-Synergy)', value: accretionDilution.proFormaEpsPreSynergy },
        { label: 'Pre-Synergy Impact %', value: accretionDilution.changePreSynergyPct, isSubtotal: true },
        { label: 'Post-Synergy Impact %', value: accretionDilution.changePostSynergyPct, isSubtotal: true }
      ]
    }
  ];

  return {
    verdict,
    schedules,
    leverage,
    synergy,
    breakeven
  };
}
