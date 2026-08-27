import { CMAProjectedYear } from './cma';
import { CMACovenantResult } from './cma-covenants';

export type CMARiskGrade = "A" | "B" | "C" | "D" | "UNKNOWN";

export type CMARiskScoreComponent = {
  name: string;
  points: number;
  reason: string;
};

export type CMARiskScore = {
  totalScore: number;
  grade: CMARiskGrade;
  components: CMARiskScoreComponent[];
};

export type CMADeltaValue = {
  absolute: number;
  percentage: number;
};

export type CMAScenarioDelta = {
  revenue: CMADeltaValue;
  ebitda: CMADeltaValue;
  pat: CMADeltaValue;
  nwc: CMADeltaValue;
  cash: CMADeltaValue;
  debt: CMADeltaValue;
  ccUtilization: CMADeltaValue;
  drawingPower: CMADeltaValue;
  mpbf: CMADeltaValue;
  covenantBreaches: CMADeltaValue;
  riskScore: CMADeltaValue;
};

export type CMAWorstCaseSummary = {
  worstRiskScenarioId: string;
  worstProfitabilityScenarioId: string;
  worstLiquidityScenarioId: string;
  worstFacilityScenarioId: string;
  worstProjectedYear: number;
};

export function calculateRiskScore(
  year: CMAProjectedYear, 
  covenants: CMACovenantResult[], 
  sanctionedLimit: number
): CMARiskScore {
  const components: CMARiskScoreComponent[] = [];
  let totalScore = 0;

  // 1. DSCR
  const dscrVal = year.dscr.value;
  // We can just rely on the covenant result!
  // We can just rely on the covenant result!
  const dscrCov = covenants.find(c => c.covenantId === 'dscr');
  if (dscrCov) {
    if (dscrCov.status === 'NOT_APPLICABLE') {
      components.push({ name: 'DSCR', points: 0, reason: 'No debt service.' });
    } else if (dscrVal < 1.0) {
      components.push({ name: 'DSCR', points: 40, reason: '< 1.0 (Breach)' });
      totalScore += 40;
    } else if (dscrVal < 1.25) {
      components.push({ name: 'DSCR', points: 20, reason: '< 1.25 (Warning)' });
      totalScore += 20;
    } else if (dscrVal < 1.5) {
      components.push({ name: 'DSCR', points: 10, reason: '< 1.5 (Tight)' });
      totalScore += 10;
    } else {
      components.push({ name: 'DSCR', points: 0, reason: '>= 1.5 (Healthy)' });
    }
  }

  // 2. Interest Coverage
  const icrCov = covenants.find(c => c.covenantId === 'icr');
  let icrVal = 0;
  if (year.interest.value > 0) {
    icrVal = year.ebit.value / year.interest.value;
  }
  
  if (icrCov) {
    if (icrCov.status === 'NOT_APPLICABLE' || year.interest.value === 0) {
      components.push({ name: 'Interest Coverage', points: 0, reason: 'No interest expense.' });
    } else if (icrVal < 1.5) {
      components.push({ name: 'Interest Coverage', points: 25, reason: '< 1.5 (Breach)' });
      totalScore += 25;
    } else if (icrVal < 2.0) {
      components.push({ name: 'Interest Coverage', points: 10, reason: '< 2.0 (Warning)' });
      totalScore += 10;
    } else {
      components.push({ name: 'Interest Coverage', points: 0, reason: '>= 2.0 (Healthy)' });
    }
  }

  // 3. Current Ratio
  const crVal = year.currentRatio ? year.currentRatio.value : null;
  if (crVal === null) {
    components.push({ name: 'Current Ratio', points: 0, reason: 'N/A' });
  } else if (crVal < 1.0) {
    components.push({ name: 'Current Ratio', points: 25, reason: '< 1.0 (Breach)' });
    totalScore += 25;
  } else if (crVal < 1.33) {
    components.push({ name: 'Current Ratio', points: 10, reason: '< 1.33 (Warning)' });
    totalScore += 10;
  } else {
    components.push({ name: 'Current Ratio', points: 0, reason: '>= 1.33 (Healthy)' });
  }

  // 4. Total Debt / Equity
  const deCov = covenants.find(c => c.covenantId === 'debt_equity');
  if (deCov && deCov.status === 'NOT_APPLICABLE') {
    components.push({ name: 'Total Debt / Equity', points: 0, reason: 'No debt.' });
  } else {
    const equityVal = year.equity.value;
    const deVal = year.debtEquityRatio.value;
    if (equityVal <= 0) {
      components.push({ name: 'Total Debt / Equity', points: 30, reason: 'Negative/Zero Equity' });
      totalScore += 30;
    } else if (deVal > 3.0) {
      components.push({ name: 'Total Debt / Equity', points: 20, reason: '> 3.0 (Breach)' });
      totalScore += 20;
    } else if (deVal > 2.0) {
      components.push({ name: 'Total Debt / Equity', points: 10, reason: '> 2.0 (Warning)' });
      totalScore += 10;
    } else {
      components.push({ name: 'Total Debt / Equity', points: 0, reason: '<= 2.0 (Healthy)' });
    }
  }

  // 5. Unfunded Deficit
  const defVal = year.unfundedCashDeficit.value;
  if (defVal > 0) {
    components.push({ name: 'Unfunded Deficit', points: 50, reason: '> 0 (Breach)' });
    totalScore += 50;
  } else {
    components.push({ name: 'Unfunded Deficit', points: 0, reason: 'Fully Funded' });
  }

  // 6. CC Utilization
  const ccVal = year.shortTermBorrowings.value;
  const dpVal = year.drawingPower.value;
  if (ccVal > dpVal) {
    components.push({ name: 'CC Utilization', points: 30, reason: '> Drawing Power (Breach)' });
    totalScore += 30;
  } else if (ccVal > sanctionedLimit * 0.9) {
    components.push({ name: 'CC Utilization', points: 15, reason: '> 90% Sanctioned Limit' });
    totalScore += 15;
  } else {
    components.push({ name: 'CC Utilization', points: 0, reason: 'Healthy limit headroom' });
  }

  let grade: CMARiskGrade = "A";
  if (totalScore > 80) grade = "D";
  else if (totalScore > 50) grade = "C";
  else if (totalScore > 20) grade = "B";

  return { totalScore, grade, components };
}

export function calculateScenarioDeltas(
  baseYear: CMAProjectedYear,
  scenarioYear: CMAProjectedYear,
  baseCovenants: CMACovenantResult[],
  scenarioCovenants: CMACovenantResult[],
  baseRisk: CMARiskScore,
  scenarioRisk: CMARiskScore
): CMAScenarioDelta {

  const calc = (base: number, scen: number): CMADeltaValue => {
    const absolute = scen - base;
    const percentage = base === 0 ? (scen === 0 ? 0 : (scen > 0 ? 100 : -100)) : (absolute / Math.abs(base)) * 100;
    return { absolute, percentage };
  };

  const baseBreaches = baseCovenants.filter(c => c.status === 'BREACH').length;
  const scenBreaches = scenarioCovenants.filter(c => c.status === 'BREACH').length;

  return {
    revenue: calc(baseYear.revenue.value, scenarioYear.revenue.value),
    ebitda: calc(baseYear.ebitda.value, scenarioYear.ebitda.value),
    pat: calc(baseYear.netProfit.value, scenarioYear.netProfit.value),
    nwc: calc(baseYear.netWorkingCapital.value, scenarioYear.netWorkingCapital.value),
    cash: calc(baseYear.cash.value, scenarioYear.cash.value),
    debt: calc(baseYear.termLoans.value + baseYear.shortTermBorrowings.value, scenarioYear.termLoans.value + scenarioYear.shortTermBorrowings.value),
    ccUtilization: calc(baseYear.shortTermBorrowings.value, scenarioYear.shortTermBorrowings.value),
    drawingPower: calc(baseYear.drawingPower.value, scenarioYear.drawingPower.value),
    mpbf: calc(baseYear.mpbfMethod2.value, scenarioYear.mpbfMethod2.value),
    covenantBreaches: calc(baseBreaches, scenBreaches),
    riskScore: calc(baseRisk.totalScore, scenarioRisk.totalScore)
  };
}

export function identifyWorstCase(
  scenarios: { id: string; risk: number; pat: number; cr: number; cc: number; years: { year: number; risk: number }[] }[]
): CMAWorstCaseSummary {
  
  if (scenarios.length === 0) {
    return {
      worstRiskScenarioId: '',
      worstProfitabilityScenarioId: '',
      worstLiquidityScenarioId: '',
      worstFacilityScenarioId: '',
      worstProjectedYear: 1
    };
  }

  let worstRisk = scenarios[0];
  let worstPat = scenarios[0];
  let worstCr = scenarios[0];
  let worstCc = scenarios[0];

  let absoluteWorstRiskScore = -1;
  let worstProjectedYear = 1;

  for (const s of scenarios) {
    if (s.risk > worstRisk.risk) worstRisk = s;
    if (s.pat < worstPat.pat) worstPat = s;
    if (s.cr < worstCr.cr) worstCr = s;
    if (s.cc > worstCc.cc) worstCc = s;

    // Find the single worst year across all valid years in all scenarios
    for (const yr of s.years) {
      if (yr.risk > absoluteWorstRiskScore) {
        absoluteWorstRiskScore = yr.risk;
        worstProjectedYear = yr.year;
      }
    }
  }

  return {
    worstRiskScenarioId: worstRisk.id,
    worstProfitabilityScenarioId: worstPat.id,
    worstLiquidityScenarioId: worstCr.id,
    worstFacilityScenarioId: worstCc.id,
    worstProjectedYear
  };
}
