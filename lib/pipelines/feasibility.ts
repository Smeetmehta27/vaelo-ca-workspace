import { AuditedValue, createAudited } from './utils';

export type DealMeta = {
  acquirerName: string;
  targetName: string;
  caFirmName: string;
  dealRationale: string;
  reportDate: string;
  sector: string;
};

export type CompanyProfile = {
  name: string;
  revenue: number;
  ebitda: number;
  netIncome: number;
  sharesOutstanding: number;
  netDebt: number;
  standaloneValue?: number; // Only for target
  fallbackEvEbitdaMultiple?: number; // Only for target
};

export type DealTerms = {
  dealType: string; // 'acquisition' or 'merger'
  purchasePrice: number;
  cashComponentPct: number;
  stockComponentPct: number;
  acquirerSharePrice: number;
};

export type FinancingAssumptions = {
  newDebtRaised: number;
  costOfNewDebt: number;
  acquirerCashUsed: number;
  taxRate: number;
};

export type SynergyAssumptions = {
  annualCostSynergies: number;
  annualRevenueSynergies: number;
  synergyEbitdaMargin: number;
  rampUpYears: number;
  synergyDiscountRate: number;
};

export type DealFeasibilityRequest = {
  meta: DealMeta;
  acquirer: CompanyProfile;
  target: CompanyProfile;
  dealTerms: DealTerms;
  financing: FinancingAssumptions;
  synergies: SynergyAssumptions;
};

// Results Types wrapped in AuditedValue where appropriate
export type PremiumAnalysisResult = {
  targetStandaloneValue: AuditedValue;
  purchasePrice: number;
  premiumPct: AuditedValue;
};

export type SourcesAndUsesResult = {
  cashNeeded: AuditedValue;
  stockNeeded: AuditedValue;
  cashSources: AuditedValue;
  cashFundingGap: AuditedValue;
  newSharesIssued: AuditedValue;
};

export type ProFormaCombinedResult = {
  combinedRevenue: AuditedValue;
  combinedEbitdaPreSynergy: AuditedValue;
  additionalInterestAfterTax: AuditedValue;
  combinedNetIncomePreSynergy: AuditedValue;
};

export type SynergyNPVResult = {
  fullRunRatePretax: AuditedValue;
  fullRunRateAfterTax: AuditedValue;
  pvRampPeriod: AuditedValue;
  pvTerminalPerpetuity: AuditedValue;
  totalSynergyNpv: AuditedValue;
};

export type AccretionDilutionResult = {
  acquirerStandaloneEps: AuditedValue;
  proFormaShares: AuditedValue;
  proFormaEpsPreSynergy: AuditedValue;
  changePreSynergyPct: AuditedValue;
  proFormaEpsPostSynergyFullRunRate: AuditedValue;
  changePostSynergyPct: AuditedValue;
};

export type LeverageFeasibilityResult = {
  proFormaNetDebt: AuditedValue;
  leverageRatio: AuditedValue | null;
  leverageThreshold: number;
  leverageFlagged: boolean;
};

export type BreakevenSynergyRequiredResult = {
  breakevenAfterTaxSynergyRequired: AuditedValue;
  breakevenPretaxSynergyRequired: AuditedValue;
  note: string;
};

export type OverallFeasibilityVerdictResult = {
  verdict: string;
  reasons: string[];
};

export type DealFeasibilityReportResult = {
  premium: PremiumAnalysisResult;
  sourcesAndUses: SourcesAndUsesResult;
  proForma: ProFormaCombinedResult;
  synergy: SynergyNPVResult;
  accretionDilution: AccretionDilutionResult;
  leverage: LeverageFeasibilityResult;
  breakeven: BreakevenSynergyRequiredResult;
  verdict: OverallFeasibilityVerdictResult;
};

export function premiumAnalysis(target: CompanyProfile, dealTerms: DealTerms): PremiumAnalysisResult {
  const fallbackMultiple = target.fallbackEvEbitdaMultiple ?? 6.0;
  
  const standaloneValueVal = target.standaloneValue !== undefined
    ? target.standaloneValue
    : target.ebitda * fallbackMultiple;
    
  const standaloneValue = createAudited(
    standaloneValueVal,
    target.standaloneValue !== undefined ? 'target.standaloneValue' : 'target.ebitda * fallbackEvEbitdaMultiple',
    target.standaloneValue !== undefined ? { standaloneValue: target.standaloneValue } : { ebitda: target.ebitda, fallbackMultiple }
  );

  const premiumPctVal = standaloneValueVal ? ((dealTerms.purchasePrice - standaloneValueVal) / standaloneValueVal) * 100 : 0;
  const premiumPct = createAudited(
    premiumPctVal,
    '((purchasePrice - standaloneValue) / standaloneValue) * 100',
    { purchasePrice: dealTerms.purchasePrice, standaloneValue: standaloneValueVal }
  );

  return { targetStandaloneValue: standaloneValue, purchasePrice: dealTerms.purchasePrice, premiumPct };
}

export function sourcesAndUses(dealTerms: DealTerms, financing: FinancingAssumptions, purchasePrice: number): SourcesAndUsesResult {
  const cashNeededVal = purchasePrice * dealTerms.cashComponentPct;
  const cashNeeded = createAudited(cashNeededVal, 'purchasePrice * cashComponentPct', { purchasePrice, cashComponentPct: dealTerms.cashComponentPct });

  const stockNeededVal = purchasePrice * dealTerms.stockComponentPct;
  const stockNeeded = createAudited(stockNeededVal, 'purchasePrice * stockComponentPct', { purchasePrice, stockComponentPct: dealTerms.stockComponentPct });

  const cashSourcesVal = financing.acquirerCashUsed + financing.newDebtRaised;
  const cashSources = createAudited(cashSourcesVal, 'acquirerCashUsed + newDebtRaised', { acquirerCashUsed: financing.acquirerCashUsed, newDebtRaised: financing.newDebtRaised });

  const cashFundingGapVal = cashNeededVal - cashSourcesVal;
  const cashFundingGap = createAudited(cashFundingGapVal, 'cashNeeded - cashSources', { cashNeeded: cashNeededVal, cashSources: cashSourcesVal });

  const newSharesIssuedVal = dealTerms.acquirerSharePrice ? (stockNeededVal * 10_000_000) / dealTerms.acquirerSharePrice : 0;
  const newSharesIssued = createAudited(newSharesIssuedVal, '(stockNeeded * 10_000_000) / acquirerSharePrice', { stockNeeded: stockNeededVal, acquirerSharePrice: dealTerms.acquirerSharePrice });

  return { cashNeeded, stockNeeded, cashSources, cashFundingGap, newSharesIssued };
}

export function proFormaCombined(acquirer: CompanyProfile, target: CompanyProfile, financing: FinancingAssumptions): ProFormaCombinedResult {
  const combinedRevenueVal = acquirer.revenue + target.revenue;
  const combinedRevenue = createAudited(combinedRevenueVal, 'acquirer.revenue + target.revenue', { acquirerRevenue: acquirer.revenue, targetRevenue: target.revenue });

  const combinedEbitdaPreSynergyVal = acquirer.ebitda + target.ebitda;
  const combinedEbitdaPreSynergy = createAudited(combinedEbitdaPreSynergyVal, 'acquirer.ebitda + target.ebitda', { acquirerEbitda: acquirer.ebitda, targetEbitda: target.ebitda });

  const additionalInterestPretax = financing.newDebtRaised * financing.costOfNewDebt;
  const additionalInterestAfterTaxVal = additionalInterestPretax * (1 - financing.taxRate);
  const additionalInterestAfterTax = createAudited(
    additionalInterestAfterTaxVal,
    '(newDebtRaised * costOfNewDebt) * (1 - taxRate)',
    { newDebtRaised: financing.newDebtRaised, costOfNewDebt: financing.costOfNewDebt, taxRate: financing.taxRate }
  );

  const combinedNetIncomePreSynergyVal = acquirer.netIncome + target.netIncome - additionalInterestAfterTaxVal;
  const combinedNetIncomePreSynergy = createAudited(
    combinedNetIncomePreSynergyVal,
    'acquirer.netIncome + target.netIncome - additionalInterestAfterTax',
    { acquirerNetIncome: acquirer.netIncome, targetNetIncome: target.netIncome, additionalInterestAfterTax: additionalInterestAfterTaxVal }
  );

  return { combinedRevenue, combinedEbitdaPreSynergy, additionalInterestAfterTax, combinedNetIncomePreSynergy };
}

export function synergyNPV(synergies: SynergyAssumptions, taxRate: number): SynergyNPVResult {
  const fullRunRatePretaxVal = synergies.annualCostSynergies + (synergies.annualRevenueSynergies * synergies.synergyEbitdaMargin);
  const fullRunRatePretax = createAudited(
    fullRunRatePretaxVal,
    'annualCostSynergies + (annualRevenueSynergies * synergyEbitdaMargin)',
    { annualCostSynergies: synergies.annualCostSynergies, annualRevenueSynergies: synergies.annualRevenueSynergies, synergyEbitdaMargin: synergies.synergyEbitdaMargin }
  );

  const fullRunRateAfterTaxVal = fullRunRatePretaxVal * (1 - taxRate);
  const fullRunRateAfterTax = createAudited(
    fullRunRateAfterTaxVal,
    'fullRunRatePretax * (1 - taxRate)',
    { fullRunRatePretax: fullRunRatePretaxVal, taxRate }
  );

  const rampCashflows = Array.from({ length: synergies.rampUpYears }, (_, i) => fullRunRateAfterTaxVal * ((i + 1) / synergies.rampUpYears));
  const pvRampVal = synergies.synergyDiscountRate > 0 
    ? rampCashflows.reduce((sum, cf, i) => sum + (cf / Math.pow(1 + synergies.synergyDiscountRate, i + 1)), 0)
    : rampCashflows.reduce((sum, cf) => sum + cf, 0); // No discount
  const pvRampPeriod = createAudited(pvRampVal, 'Sum(rampCashflow_t / (1 + discountRate)^t)', { fullRunRateAfterTax: fullRunRateAfterTaxVal, rampUpYears: synergies.rampUpYears, discountRate: synergies.synergyDiscountRate });

  const perpetuityValue = synergies.synergyDiscountRate > 0 ? fullRunRateAfterTaxVal / synergies.synergyDiscountRate : 0;
  const pvPerpetuityVal = synergies.synergyDiscountRate > 0 ? perpetuityValue / Math.pow(1 + synergies.synergyDiscountRate, synergies.rampUpYears) : 0;
  const pvTerminalPerpetuity = createAudited(
    pvPerpetuityVal,
    '(fullRunRateAfterTax / discountRate) / (1 + discountRate)^rampUpYears',
    { fullRunRateAfterTax: fullRunRateAfterTaxVal, discountRate: synergies.synergyDiscountRate, rampUpYears: synergies.rampUpYears }
  );

  const totalSynergyNpvVal = pvRampVal + pvPerpetuityVal;
  const totalSynergyNpv = createAudited(totalSynergyNpvVal, 'pvRampPeriod + pvTerminalPerpetuity', { pvRampPeriod: pvRampVal, pvTerminalPerpetuity: pvPerpetuityVal });

  return { fullRunRatePretax, fullRunRateAfterTax, pvRampPeriod, pvTerminalPerpetuity, totalSynergyNpv };
}

export function accretionDilution(acquirer: CompanyProfile, proForma: ProFormaCombinedResult, su: SourcesAndUsesResult, synergy: SynergyNPVResult): AccretionDilutionResult {
  const acquirerStandaloneEpsVal = acquirer.sharesOutstanding > 0 ? (acquirer.netIncome * 10_000_000) / acquirer.sharesOutstanding : 0;
  const acquirerStandaloneEps = createAudited(acquirerStandaloneEpsVal, '(acquirer.netIncome * 1e7) / acquirer.sharesOutstanding', { netIncome: acquirer.netIncome, sharesOutstanding: acquirer.sharesOutstanding });

  const proFormaSharesVal = acquirer.sharesOutstanding + su.newSharesIssued.value;
  const proFormaShares = createAudited(proFormaSharesVal, 'acquirer.sharesOutstanding + newSharesIssued', { sharesOutstanding: acquirer.sharesOutstanding, newSharesIssued: su.newSharesIssued.value });

  const proFormaEpsPreSynergyVal = proFormaSharesVal > 0 ? (proForma.combinedNetIncomePreSynergy.value * 10_000_000) / proFormaSharesVal : 0;
  const proFormaEpsPreSynergy = createAudited(
    proFormaEpsPreSynergyVal,
    '(combinedNetIncomePreSynergy * 1e7) / proFormaShares',
    { combinedNetIncomePreSynergy: proForma.combinedNetIncomePreSynergy.value, proFormaShares: proFormaSharesVal }
  );

  const changePreSynergyPctVal = acquirerStandaloneEpsVal !== 0 ? (proFormaEpsPreSynergyVal - acquirerStandaloneEpsVal) / Math.abs(acquirerStandaloneEpsVal) : 0;
  const changePreSynergyPct = createAudited(
    changePreSynergyPctVal * 100,
    '((proFormaEpsPreSynergy - acquirerStandaloneEps) / acquirerStandaloneEps) * 100',
    { proFormaEpsPreSynergy: proFormaEpsPreSynergyVal, acquirerStandaloneEps: acquirerStandaloneEpsVal }
  );

  const netIncomePostSynergy = proForma.combinedNetIncomePreSynergy.value + synergy.fullRunRateAfterTax.value;
  const proFormaEpsPostSynergyFullRunRateVal = proFormaSharesVal > 0 ? (netIncomePostSynergy * 10_000_000) / proFormaSharesVal : 0;
  const proFormaEpsPostSynergyFullRunRate = createAudited(
    proFormaEpsPostSynergyFullRunRateVal,
    '((combinedNetIncomePreSynergy + synergyFullRunRateAfterTax) * 1e7) / proFormaShares',
    { combinedNetIncomePreSynergy: proForma.combinedNetIncomePreSynergy.value, synergyFullRunRateAfterTax: synergy.fullRunRateAfterTax.value, proFormaShares: proFormaSharesVal }
  );

  const changePostSynergyPctVal = acquirerStandaloneEpsVal !== 0 ? (proFormaEpsPostSynergyFullRunRateVal - acquirerStandaloneEpsVal) / Math.abs(acquirerStandaloneEpsVal) : 0;
  const changePostSynergyPct = createAudited(
    changePostSynergyPctVal * 100,
    '((proFormaEpsPostSynergy - acquirerStandaloneEps) / acquirerStandaloneEps) * 100',
    { proFormaEpsPostSynergy: proFormaEpsPostSynergyFullRunRateVal, acquirerStandaloneEps: acquirerStandaloneEpsVal }
  );

  return { acquirerStandaloneEps, proFormaShares, proFormaEpsPreSynergy, changePreSynergyPct, proFormaEpsPostSynergyFullRunRate, changePostSynergyPct };
}

export function leverageFeasibility(acquirer: CompanyProfile, target: CompanyProfile, financing: FinancingAssumptions, proForma: ProFormaCombinedResult, threshold: number = 4.0): LeverageFeasibilityResult {
  const proFormaNetDebtVal = acquirer.netDebt + target.netDebt + financing.newDebtRaised + financing.acquirerCashUsed;
  const proFormaNetDebt = createAudited(
    proFormaNetDebtVal,
    'acquirer.netDebt + target.netDebt + newDebtRaised + acquirerCashUsed',
    { acquirerNetDebt: acquirer.netDebt, targetNetDebt: target.netDebt, newDebtRaised: financing.newDebtRaised, acquirerCashUsed: financing.acquirerCashUsed }
  );

  const combinedEbitda = proForma.combinedEbitdaPreSynergy.value;
  const leverageRatioVal = combinedEbitda ? proFormaNetDebtVal / combinedEbitda : null;
  const leverageRatio = leverageRatioVal !== null ? createAudited(leverageRatioVal, 'proFormaNetDebt / combinedEbitdaPreSynergy', { proFormaNetDebt: proFormaNetDebtVal, combinedEbitdaPreSynergy: combinedEbitda }) : null;

  return { proFormaNetDebt, leverageRatio, leverageThreshold: threshold, leverageFlagged: leverageRatioVal !== null && leverageRatioVal > threshold };
}

export function breakevenSynergyRequired(accretion: AccretionDilutionResult, proForma: ProFormaCombinedResult, financing: FinancingAssumptions): BreakevenSynergyRequiredResult {
  if (accretion.changePreSynergyPct.value >= 0) {
    return {
      breakevenAfterTaxSynergyRequired: createAudited(0, '0 (Deal is already EPS-neutral or accretive before synergies)', {}),
      breakevenPretaxSynergyRequired: createAudited(0, '0', {}),
      note: "Deal is already EPS-neutral or accretive before synergies."
    };
  }

  const requiredNetIncome = (accretion.acquirerStandaloneEps.value * accretion.proFormaShares.value) / 10_000_000;
  const currentNetIncome = proForma.combinedNetIncomePreSynergy.value;
  const requiredAfterTaxVal = requiredNetIncome - currentNetIncome;
  const requiredAfterTax = createAudited(
    requiredAfterTaxVal,
    '((acquirerStandaloneEps * proFormaShares) / 1e7) - combinedNetIncomePreSynergy',
    { acquirerStandaloneEps: accretion.acquirerStandaloneEps.value, proFormaShares: accretion.proFormaShares.value, combinedNetIncomePreSynergy: currentNetIncome }
  );

  const requiredPretaxVal = financing.taxRate < 1 ? requiredAfterTaxVal / (1 - financing.taxRate) : 0;
  const requiredPretax = createAudited(
    requiredPretaxVal,
    'requiredAfterTax / (1 - taxRate)',
    { requiredAfterTax: requiredAfterTaxVal, taxRate: financing.taxRate }
  );

  return { breakevenAfterTaxSynergyRequired: requiredAfterTax, breakevenPretaxSynergyRequired: requiredPretax, note: "" };
}

export function overallFeasibilityVerdict(premium: PremiumAnalysisResult, leverage: LeverageFeasibilityResult, accretion: AccretionDilutionResult, synergy: SynergyNPVResult, breakeven: BreakevenSynergyRequiredResult): OverallFeasibilityVerdictResult {
  const reasons: string[] = [];

  if (leverage.leverageFlagged) {
    reasons.push(`Pro-forma leverage of ${leverage.leverageRatio ? leverage.leverageRatio.value : 'N/A'}x exceeds the ${leverage.leverageThreshold}x threshold.`);
  }
  if (premium.premiumPct.value > 50) {
    reasons.push(`Purchase price implies a ${premium.premiumPct.value}% premium to standalone value — unusually high, re-examine assumptions.`);
  }
  if (accretion.changePreSynergyPct.value < -10 && synergy.totalSynergyNpv.value < breakeven.breakevenAfterTaxSynergyRequired.value * 3) {
    reasons.push("Deal is meaningfully dilutive pre-synergy and synergy NPV does not comfortably cover the breakeven requirement.");
  }

  let verdict = "";
  if (reasons.length === 0) {
    verdict = "FEASIBLE AS STRUCTURED";
  } else if (reasons.length === 1) {
    verdict = "FEASIBLE WITH CONDITIONS — review flagged item below";
  } else {
    verdict = "NOT RECOMMENDED AS STRUCTURED — multiple flags raised";
  }

  return { verdict, reasons };
}

export function calculateDealFeasibility(req: DealFeasibilityRequest): DealFeasibilityReportResult {
  const premium = premiumAnalysis(req.target, req.dealTerms);
  const su = sourcesAndUses(req.dealTerms, req.financing, premium.purchasePrice);
  const proForma = proFormaCombined(req.acquirer, req.target, req.financing);
  const synergy = synergyNPV(req.synergies, req.financing.taxRate);
  const accretion = accretionDilution(req.acquirer, proForma, su, synergy);
  const leverage = leverageFeasibility(req.acquirer, req.target, req.financing, proForma);
  const breakeven = breakevenSynergyRequired(accretion, proForma, req.financing);
  const verdict = overallFeasibilityVerdict(premium, leverage, accretion, synergy, breakeven);

  return { premium, sourcesAndUses: su, proForma, synergy, accretionDilution: accretion, leverage, breakeven, verdict };
}
