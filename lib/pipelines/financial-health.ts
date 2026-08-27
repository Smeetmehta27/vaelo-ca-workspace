import { AuditedValue, createAudited } from './utils';

export type SnapshotMeta = {
  clientName: string;
  caFirmName: string;
  reportDate: string;
  sector: string;
};

export type LiquidityInputs = {
  currentAssets: number;
  currentLiabilities: number;
};

export type ExpenseGrowthInputs = {
  revenuePriorYear: number;
  revenueCurrentYear: number;
  operatingExpensesPriorYear: number;
  operatingExpensesCurrentYear: number;
};

export type CashRunwayInputs = {
  cashAndEquivalents: number;
  monthlyNetCashFlow: number; // negative if burning cash, positive if generating
};

export type RevenueVolatilityInputs = {
  historicalRevenue: number[]; // 3+ years of historical annual revenue, oldest to newest
};

export type HealthSnapshotRequest = {
  meta: SnapshotMeta;
  liquidity: LiquidityInputs;
  expenseGrowth: ExpenseGrowthInputs;
  cashRunway: CashRunwayInputs;
  revenueVolatility: RevenueVolatilityInputs;
};

// Result Types
export type LiquidityResult = {
  currentRatio: AuditedValue | null;
  score: number;
  label: string;
  note: string;
};

export type ExpenseGrowthResult = {
  revenueGrowthPct: AuditedValue;
  expenseGrowthPct: AuditedValue;
  spreadPct: AuditedValue;
  score: number;
  label: string;
  note: string;
};

export type CashRunwayResult = {
  runwayMonths: AuditedValue | null;
  score: number;
  label: string;
  note: string;
};

export type RevenueVolatilityResult = {
  coefficientOfVariation: AuditedValue | null;
  meanRevenue: AuditedValue;
  score: number;
  label: string;
  note: string;
};

export type HealthSnapshotResult = {
  liquidity: LiquidityResult;
  expenseGrowth: ExpenseGrowthResult;
  cashRunway: CashRunwayResult;
  revenueVolatility: RevenueVolatilityResult;
  flags: string[];
};

export function scoreLiquidity(inputs: LiquidityInputs): LiquidityResult {
  let score = 0;
  let label = "";
  let note = "";
  
  let currentRatioVal: number | null = null;
  if (inputs.currentLiabilities === 0) {
    score = 90;
    label = "Very High";
    note = "No current liabilities. Liquidity is essentially infinite.";
  } else {
    currentRatioVal = inputs.currentAssets / inputs.currentLiabilities;

    if (currentRatioVal < 1.0) {
      score = Math.max(0, currentRatioVal * 40);
      label = "Weak";
      note = "Current liabilities exceed current assets — a real short-term liquidity risk.";
    } else if (currentRatioVal < 1.5) {
      score = 40 + (currentRatioVal - 1.0) / 0.5 * 25;
      label = "Adequate";
      note = "Liquidity is workable but has limited cushion.";
    } else if (currentRatioVal <= 3.0) {
      score = 65 + (currentRatioVal - 1.5) / 1.5 * 25;
      label = "Strong";
      note = "Healthy short-term liquidity cushion.";
    } else {
      score = 90;
      label = "Very High";
      note = "Excellent liquidity, though extremely high ratios might indicate inefficient capital deployment.";
    }
  }

  const currentRatioAudited = currentRatioVal !== null ? createAudited(
    currentRatioVal,
    'currentAssets / currentLiabilities',
    { currentAssets: inputs.currentAssets, currentLiabilities: inputs.currentLiabilities }
  ) : null;

  return {
    currentRatio: currentRatioAudited,
    score: Number(Math.min(Math.max(score, 0), 100).toFixed(1)),
    label,
    note
  };
}

export function scoreExpenseGrowth(inputs: ExpenseGrowthInputs): ExpenseGrowthResult {
  const revenueGrowthVal = inputs.revenuePriorYear ? (inputs.revenueCurrentYear - inputs.revenuePriorYear) / inputs.revenuePriorYear : 0;
  const expenseGrowthVal = inputs.operatingExpensesPriorYear ? (inputs.operatingExpensesCurrentYear - inputs.operatingExpensesPriorYear) / inputs.operatingExpensesPriorYear : 0;
  const spreadVal = revenueGrowthVal - expenseGrowthVal; // positive = revenue growing faster than expenses (good)

  let score = 0;
  let label = "";
  let note = "";

  if (spreadVal >= 0.05) {
    score = 100;
    label = "Excellent";
    note = "Revenue is growing meaningfully faster than expenses — operating leverage is improving.";
  } else if (spreadVal >= 0) {
    score = spreadVal !== 0 ? 75 + (Math.abs(spreadVal) / 0.05) * 25 : 75;
    label = "Good";
    note = "Revenue is keeping pace with or growing slightly faster than expenses.";
  } else if (spreadVal >= -0.05) {
    score = 40 + (1 - Math.abs(spreadVal) / 0.05) * 35;
    label = "Caution";
    note = "Expenses are growing modestly faster than revenue — worth monitoring.";
  } else {
    score = Math.max(0, 40 - (Math.abs(spreadVal) - 0.05) * 200);
    label = "Concerning";
    note = "Expenses are significantly outgrowing revenue — margin compression risk.";
  }

  const revenueGrowthPct = createAudited(
    revenueGrowthVal * 100,
    '((revenueCurrentYear - revenuePriorYear) / revenuePriorYear) * 100',
    { revenueCurrentYear: inputs.revenueCurrentYear, revenuePriorYear: inputs.revenuePriorYear }
  );

  const expenseGrowthPct = createAudited(
    expenseGrowthVal * 100,
    '((operatingExpensesCurrentYear - operatingExpensesPriorYear) / operatingExpensesPriorYear) * 100',
    { operatingExpensesCurrentYear: inputs.operatingExpensesCurrentYear, operatingExpensesPriorYear: inputs.operatingExpensesPriorYear }
  );

  const spreadPct = createAudited(
    spreadVal * 100,
    'expenseGrowthPct - revenueGrowthPct',
    { expenseGrowthPct: expenseGrowthVal * 100, revenueGrowthPct: revenueGrowthVal * 100 }
  );

  return {
    revenueGrowthPct,
    expenseGrowthPct,
    spreadPct,
    score: Number(Math.min(Math.max(score, 0), 100).toFixed(1)),
    label,
    note
  };
}

export function scoreCashRunway(inputs: CashRunwayInputs): CashRunwayResult {
  if (inputs.monthlyNetCashFlow >= 0) {
    return {
      runwayMonths: null,
      score: 100.0,
      label: "Cash-generative",
      note: "Business is generating positive net cash flow — no burn runway to measure."
    };
  }

  const monthlyBurn = Math.abs(inputs.monthlyNetCashFlow);
  const runwayMonthsVal = monthlyBurn ? inputs.cashAndEquivalents / monthlyBurn : 0;

  let score = 0;
  let label = "";
  let note = "";

  if (runwayMonthsVal < 3) {
    score = (runwayMonthsVal / 3) * 20;
    label = "Critical";
    note = "Less than 3 months of runway at current burn rate — immediate attention required.";
  } else if (runwayMonthsVal < 6) {
    score = 20 + ((runwayMonthsVal - 3) / 3) * 30;
    label = "Weak";
    note = "Runway is short — limited room to absorb a slow quarter or delayed receivables.";
  } else if (runwayMonthsVal < 12) {
    score = 50 + ((runwayMonthsVal - 6) / 6) * 25;
    label = "Adequate";
    note = "Reasonable buffer, though worth monitoring if burn increases.";
  } else {
    score = Math.min(75 + ((runwayMonthsVal - 12) / 6) * 25, 100);
    label = "Strong";
    note = "Healthy cash buffer relative to current burn rate.";
  }

  const runwayMonths = createAudited(
    runwayMonthsVal,
    'cashAndEquivalents / abs(monthlyNetCashFlow)',
    { cashAndEquivalents: inputs.cashAndEquivalents, monthlyNetCashFlow: inputs.monthlyNetCashFlow }
  );

  return {
    runwayMonths,
    score: Number(Math.min(Math.max(score, 0), 100).toFixed(1)),
    label,
    note
  };
}

export function scoreRevenueVolatility(inputs: RevenueVolatilityInputs): RevenueVolatilityResult {
  const revenues = inputs.historicalRevenue;
  if (revenues.length < 3) {
    throw new Error(`Revenue volatility requires at least 3 years of historical revenue, got ${revenues.length} — this is a hard minimum for a meaningful read, not a suggestion.`);
  }

  const sum = revenues.reduce((a, b) => a + b, 0);
  const meanRev = sum / revenues.length;

  const variance = revenues.reduce((a, b) => a + Math.pow(b - meanRev, 2), 0) / (revenues.length - 1);
  const stdevRev = Math.sqrt(variance);
  
  const cvVal = meanRev !== 0 ? stdevRev / Math.abs(meanRev) : null;

  let score = 0;
  let label = "";
  let note = "";

  if (cvVal === null) {
    score = 0;
    label = "Undefined (Zero Mean)";
    note = "Revenue mean is zero, meaning volatility cannot be evaluated proportionally.";
  } else if (cvVal < 0.05) {
    score = 100 - (cvVal / 0.05) * 10;
    label = "Very stable";
    note = "Revenue has been highly predictable year over year.";
  } else if (cvVal < 0.15) {
    score = 90 - (cvVal - 0.05) / 0.10 * 20;
    label = "Stable";
    note = "Revenue shows normal, manageable year-to-year variation.";
  } else if (cvVal < 0.30) {
    score = 70 - (cvVal - 0.15) / 0.15 * 30;
    label = "Variable";
    note = "Revenue swings meaningfully year to year — worth understanding the cause (seasonality, customer concentration, etc.).";
  } else {
    score = Math.max(0, 40 - (cvVal - 0.30) * 100);
    label = "Highly volatile";
    note = "Revenue is highly unpredictable — this materially increases risk independent of the average growth rate.";
  }

  const inputsObj: Record<string, number> = {};
  revenues.forEach((r, i) => { inputsObj[`year${i+1}`] = r });

  const coefficientOfVariation = cvVal !== null ? createAudited(
    cvVal,
    'stdev(historicalRevenue) / mean(historicalRevenue)',
    { meanRevenue: meanRev, stdevRevenue: stdevRev, ...inputsObj }
  ) : null;

  const meanRevenueAudited = createAudited(
    meanRev,
    'sum(historicalRevenue) / count(historicalRevenue)',
    inputsObj
  );

  return {
    coefficientOfVariation,
    meanRevenue: meanRevenueAudited,
    score: Number(Math.min(Math.max(score, 0), 100).toFixed(1)),
    label,
    note
  };
}

export function calculateHealthSnapshot(req: HealthSnapshotRequest): HealthSnapshotResult {
  const liquidity = scoreLiquidity(req.liquidity);
  const expenseGrowth = scoreExpenseGrowth(req.expenseGrowth);
  const cashRunway = scoreCashRunway(req.cashRunway);
  const revenueVolatility = scoreRevenueVolatility(req.revenueVolatility);

  const flags: string[] = [];
  const results = [
    { name: "Liquidity", result: liquidity },
    { name: "Expense Growth", result: expenseGrowth },
    { name: "Cash Runway", result: cashRunway },
    { name: "Revenue Volatility", result: revenueVolatility },
  ];

  for (const { name, result } of results) {
    if (result.score < 40) {
      flags.push(`${name}: ${result.label} (${result.score}/100) — ${result.note}`);
    }
  }

  return { liquidity, expenseGrowth, cashRunway, revenueVolatility, flags };
}
