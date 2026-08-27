import { AuditedValue, createAudited } from './utils';
import { validateCMAInputs } from './cma-validation';

export type { AuditedValue } from './utils';

export type CMAHistoricalInput = {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  stock: number;
  debtors: number;
  cash: number;
  otherCurrentAssets: number;
  fixedAssets: number;
  otherNonCurrentAssets: number;
  creditors: number;
  otherCurrentLiabilities: number;
  termLoans: number;
  shortTermBorrowings: number;
  otherNonCurrentLiabilities: number;
  equity: number;
};

export type CMAAssumptions = {
  revenueGrowthRate: number; // percentage, e.g., 10 for 10%
  cogsMargin: number; // percentage of revenue
  operatingExpensesMargin: number; // percentage of revenue
  stockDays: number; 
  debtorDays: number;
  creditorDays: number;
  interestRate: number; // percentage
  principalRepayment: number; // fixed amount per year
  drawingPowerStockMargin: number; // percentage, e.g. 25
  drawingPowerDebtorMargin: number; // percentage, e.g. 40
  ocaMargin: number; // percentage of revenue
  oclMargin: number; // percentage of revenue
  capExMargin: number; // percentage of revenue
  depreciationRate: number; // percentage
  taxRate: number; // percentage
  shortTermInterestRate: number; // percentage
  sanctionedLimit: number; // absolute amount
  minimumCashBalance: number; // absolute amount
};

export type CMAProjectedYear = {
  year: number;
  revenue: AuditedValue;
  cogs: AuditedValue;
  grossProfit: AuditedValue;
  operatingExpenses: AuditedValue;
  ebitda: AuditedValue;
  depreciation: AuditedValue;
  ebit: AuditedValue;
  interest: AuditedValue;
  pbt: AuditedValue;
  tax: AuditedValue;
  netProfit: AuditedValue; // This is PAT

  stock: AuditedValue;
  debtors: AuditedValue;
  cash: AuditedValue;
  otherCurrentAssets: AuditedValue;
  totalCurrentAssets: AuditedValue;

  changeInStock: AuditedValue;
  changeInDebtors: AuditedValue;
  changeInCreditors: AuditedValue;
  changeInOCA: AuditedValue;
  changeInOCL: AuditedValue;
  workingCapitalCashImpact: AuditedValue;

  shortTermBorrowings: AuditedValue;
  creditors: AuditedValue;
  otherCurrentLiabilities: AuditedValue;
  totalCurrentLiabilities: AuditedValue;

  termLoans: AuditedValue;
  
  fixedAssets: AuditedValue;
  capEx: AuditedValue;
  otherNonCurrentAssets: AuditedValue;
  
  otherNonCurrentLiabilities: AuditedValue;
  equity: AuditedValue;

  mpbfMethod2: AuditedValue;
  cashSweep: AuditedValue;
  unfundedCashDeficit: AuditedValue;

  totalAssets: AuditedValue;
  totalLiabilitiesAndEquity: AuditedValue;

  currentRatio: AuditedValue;
  dscr: AuditedValue;
  drawingPower: AuditedValue;
  debtEquityRatio: AuditedValue;
  tolTnwRatio: AuditedValue;
  roe: AuditedValue;

  // Phase 8: UI Traceability Exports
  openingFixedAssets: AuditedValue;
  openingTermLoans: AuditedValue;
  openingShortTermBorrowings: AuditedValue;
  openingEquity: AuditedValue;
  
  termLoanInterest: AuditedValue;
  shortTermInterest: AuditedValue;
  
  ccDraw: AuditedValue;
  ccRepayment: AuditedValue;
  cabf: AuditedValue;
  
  eligibleStock: AuditedValue;
  eligibleDebtors: AuditedValue;
  
  workingCapitalGap: AuditedValue;
  borrowersContribution: AuditedValue;
  netWorkingCapital: AuditedValue;
  netWorkingCapitalExclBank: AuditedValue;
  currentLiabilitiesExclBank: AuditedValue;
};

export type CMAStressOverride = Partial<CMAAssumptions>;

export type CMAScenarioStatus = "VALID" | "FAILED";

export type CMAScenario = {
  scenarioId: string;
  name: string;
  description: string;
  overrides: CMAStressOverride;
  status?: CMAScenarioStatus; // Optional for backward compatibility with v1
  error?: string;
  projections?: CMAProjectedYear[];
  warnings?: string[];
  covenants?: import('./cma-covenants').CMACovenantResult[][];
  riskScore?: import('./cma-analytics').CMARiskScore;
  deltas?: import('./cma-analytics').CMAScenarioDelta;
};

export function generateCMAReport(historical: CMAHistoricalInput, assumptions: CMAAssumptions, yearsToProject: number = 2): CMAProjectedYear[] {
  // Defensive Guards: The pipeline must never execute with malformed math
  const allValues = [
    ...Object.values(historical),
    ...Object.values(assumptions),
    yearsToProject
  ];
  for (const val of allValues) {
    if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
      throw new Error(`CRITICAL: CMA Pipeline received invalid numeric input: ${val}. Engine execution halted.`);
    }
  }

  // Phase 9: Hard Validation Guard
  const validation = validateCMAInputs(historical, assumptions);
  if (!validation.valid) {
    throw new Error(`CRITICAL: CMA Pipeline received invalid financial data: ${validation.errors.join(' ')}`);
  }

  const projections: CMAProjectedYear[] = [];
  
  let previousRevenue = historical.revenue;
  let previousTermLoans = historical.termLoans;
  let previousShortTermBorrowings = historical.shortTermBorrowings;

  let previousStock = historical.stock;
  let previousDebtors = historical.debtors;
  let previousCreditors = historical.creditors;
  let previousCash = historical.cash;
  let previousOCA = historical.otherCurrentAssets;
  let previousOCL = historical.otherCurrentLiabilities;
  
  let previousFixedAssets = historical.fixedAssets;
  const previousOtherNonCurrentAssets = historical.otherNonCurrentAssets;
  const previousOtherNonCurrentLiabilities = historical.otherNonCurrentLiabilities;
  let previousEquity = historical.equity;

  for (let i = 1; i <= yearsToProject; i++) {
    // 1. P&L Projections
    const revenueValue = previousRevenue * (1 + assumptions.revenueGrowthRate / 100);
    const revenue = createAudited(
      revenueValue,
      'previousRevenue * (1 + (revenueGrowthRate / 100))',
      { previousRevenue, revenueGrowthRate: assumptions.revenueGrowthRate }
    );

    const cogsValue = revenueValue * (assumptions.cogsMargin / 100);
    const cogs = createAudited(
      cogsValue,
      'revenue * (cogsMargin / 100)',
      { revenue: revenueValue, cogsMargin: assumptions.cogsMargin }
    );

    const grossProfitValue = revenueValue - cogsValue;
    const grossProfit = createAudited(
      grossProfitValue,
      'revenue - cogs',
      { revenue: revenueValue, cogs: cogsValue }
    );

    const opExValue = revenueValue * (assumptions.operatingExpensesMargin / 100);
    const operatingExpenses = createAudited(
      opExValue,
      'revenue * (operatingExpensesMargin / 100)',
      { revenue: revenueValue, operatingExpensesMargin: assumptions.operatingExpensesMargin }
    );

    const ebitdaValue = grossProfitValue - opExValue;
    const ebitda = createAudited(
      ebitdaValue,
      'grossProfit - operatingExpenses',
      { grossProfit: grossProfitValue, operatingExpenses: opExValue }
    );

    const termLoanInterestValue = previousTermLoans * (assumptions.interestRate / 100);
    const termLoanInterest = createAudited(
      termLoanInterestValue,
      'previousTermLoans * (interestRate / 100)',
      { previousTermLoans, interestRate: assumptions.interestRate }
    );

    const ccInterestValue = previousShortTermBorrowings * (assumptions.shortTermInterestRate / 100);
    const shortTermInterest = createAudited(
      ccInterestValue,
      'previousShortTermBorrowings * (shortTermInterestRate / 100)',
      { previousShortTermBorrowings, shortTermInterestRate: assumptions.shortTermInterestRate }
    );

    const interestValue = termLoanInterestValue + ccInterestValue;
    const interest = createAudited(
      interestValue,
      'termLoanInterest + shortTermInterest',
      { termLoanInterest: termLoanInterestValue, shortTermInterest: ccInterestValue }
    );

    // Phase 8: Traceable Openings
    const openingFixedAssets = createAudited(previousFixedAssets, 'previousFixedAssets', { previousFixedAssets });
    const openingTermLoans = createAudited(previousTermLoans, 'previousTermLoans', { previousTermLoans });
    const openingShortTermBorrowings = createAudited(previousShortTermBorrowings, 'previousShortTermBorrowings', { previousShortTermBorrowings });
    const openingEquity = createAudited(previousEquity, 'previousEquity', { previousEquity });

    const capExValue = revenueValue * (assumptions.capExMargin / 100);
    const capEx = createAudited(
      capExValue,
      'revenue * (capExMargin / 100)',
      { revenue: revenueValue, capExMargin: assumptions.capExMargin }
    );

    const calculatedDepreciation = previousFixedAssets * (assumptions.depreciationRate / 100);
    const maxDepreciation = previousFixedAssets + capExValue;
    const depreciationValue = Math.min(calculatedDepreciation, maxDepreciation);
    const depreciation = createAudited(
      depreciationValue,
      'MIN(previousFixedAssets * (depreciationRate / 100), previousFixedAssets + capEx)',
      { previousFixedAssets, depreciationRate: assumptions.depreciationRate, capEx: capExValue }
    );

    const ebitValue = ebitdaValue - depreciationValue;
    const ebit = createAudited(
      ebitValue,
      'ebitda - depreciation',
      { ebitda: ebitdaValue, depreciation: depreciationValue }
    );

    const pbtValue = ebitValue - interestValue;
    const pbt = createAudited(
      pbtValue,
      'ebit - interest',
      { ebit: ebitValue, interest: interestValue }
    );

    const taxValue = pbtValue > 0 ? pbtValue * (assumptions.taxRate / 100) : 0;
    const tax = createAudited(
      taxValue,
      'pbt > 0 ? pbt * (taxRate / 100) : 0',
      { pbt: pbtValue, taxRate: assumptions.taxRate }
    );

    const patValue = pbtValue - taxValue;
    const netProfit = createAudited(
      patValue,
      'pbt - tax',
      { pbt: pbtValue, tax: taxValue }
    );

    // 2. Balance Sheet Projections (Currents)
    const stockValue = (cogsValue / 365) * assumptions.stockDays;
    const stock = createAudited(
      stockValue,
      '(cogs / 365) * stockDays',
      { cogs: cogsValue, stockDays: assumptions.stockDays }
    );

    const debtorsValue = (revenueValue / 365) * assumptions.debtorDays;
    const debtors = createAudited(
      debtorsValue,
      '(revenue / 365) * debtorDays',
      { revenue: revenueValue, debtorDays: assumptions.debtorDays }
    );

    const creditorsValue = (cogsValue / 365) * assumptions.creditorDays;
    const creditors = createAudited(
      creditorsValue,
      '(cogs / 365) * creditorDays',
      { cogs: cogsValue, creditorDays: assumptions.creditorDays }
    );

    // Working Capital Changes
    const changeInStockValue = stockValue - previousStock;
    const changeInStock = createAudited(
      changeInStockValue,
      'projectedStock - openingStock',
      { projectedStock: stockValue, openingStock: previousStock }
    );

    const changeInDebtorsValue = debtorsValue - previousDebtors;
    const changeInDebtors = createAudited(
      changeInDebtorsValue,
      'projectedDebtors - openingDebtors',
      { projectedDebtors: debtorsValue, openingDebtors: previousDebtors }
    );

    const changeInCreditorsValue = creditorsValue - previousCreditors;
    const changeInCreditors = createAudited(
      changeInCreditorsValue,
      'projectedCreditors - openingCreditors',
      { projectedCreditors: creditorsValue, openingCreditors: previousCreditors }
    );

    const ocaValue = revenueValue * (assumptions.ocaMargin / 100);
    const otherCurrentAssets = createAudited(
      ocaValue, 
      'revenue * (ocaMargin / 100)', 
      { revenue: revenueValue, ocaMargin: assumptions.ocaMargin }
    );

    const changeInOCAValue = ocaValue - previousOCA;
    const changeInOCA = createAudited(
      changeInOCAValue,
      'projectedOCA - openingOCA',
      { projectedOCA: ocaValue, openingOCA: previousOCA }
    );

    const oclValue = revenueValue * (assumptions.oclMargin / 100);
    const otherCurrentLiabilities = createAudited(
      oclValue, 
      'revenue * (oclMargin / 100)', 
      { revenue: revenueValue, oclMargin: assumptions.oclMargin }
    );

    const changeInOCLValue = oclValue - previousOCL;
    const changeInOCL = createAudited(
      changeInOCLValue,
      'projectedOCL - openingOCL',
      { projectedOCL: oclValue, openingOCL: previousOCL }
    );

    const wcCashImpactValue = -changeInStockValue - changeInDebtorsValue - changeInOCAValue + changeInCreditorsValue + changeInOCLValue;
    const workingCapitalCashImpact = createAudited(
      wcCashImpactValue,
      '-changeInStock - changeInDebtors - changeInOCA + changeInCreditors + changeInOCL',
      { 
        changeInStock: changeInStockValue, 
        changeInDebtors: changeInDebtorsValue, 
        changeInOCA: changeInOCAValue,
        changeInCreditors: changeInCreditorsValue,
        changeInOCL: changeInOCLValue
      }
    );

    // Drawing Power (calculated before sweep to constrain drawing)
    const dpStockEligibleValue = stockValue * (1 - (assumptions.drawingPowerStockMargin / 100));
    const eligibleStock = createAudited(
      dpStockEligibleValue,
      'stock * (1 - (drawingPowerStockMargin / 100))',
      { stock: stockValue, drawingPowerStockMargin: assumptions.drawingPowerStockMargin }
    );

    const dpDebtorEligibleValue = debtorsValue * (1 - (assumptions.drawingPowerDebtorMargin / 100));
    const eligibleDebtors = createAudited(
      dpDebtorEligibleValue,
      'debtors * (1 - (drawingPowerDebtorMargin / 100))',
      { debtors: debtorsValue, drawingPowerDebtorMargin: assumptions.drawingPowerDebtorMargin }
    );

    const drawingPowerValue = dpStockEligibleValue + dpDebtorEligibleValue - creditorsValue;
    const drawingPower = createAudited(
      drawingPowerValue,
      'eligibleStock + eligibleDebtors - creditors',
      { 
        eligibleStock: dpStockEligibleValue, 
        eligibleDebtors: dpDebtorEligibleValue, 
        creditors: creditorsValue
      }
    );

    // Cash Sweep Logic
    const cabfValue = previousCash + patValue + depreciationValue + wcCashImpactValue - capExValue - assumptions.principalRepayment;
    const cabf = createAudited(
      cabfValue,
      'previousCash + pat + depreciation + wcCashImpact - capEx - principalRepayment',
      { previousCash, pat: patValue, depreciation: depreciationValue, wcCashImpact: wcCashImpactValue, capEx: capExValue, principalRepayment: assumptions.principalRepayment }
    );
    
    let actualDrawValue = 0;
    let actualRepaymentValue = 0;
    let unfundedDeficitValue = 0;

    if (cabfValue < assumptions.minimumCashBalance) {
      const requiredDraw = assumptions.minimumCashBalance - cabfValue;
      const availableCapacity = Math.max(0, Math.min(drawingPowerValue, assumptions.sanctionedLimit) - previousShortTermBorrowings);
      actualDrawValue = Math.min(requiredDraw, availableCapacity);
      unfundedDeficitValue = requiredDraw - actualDrawValue;
    } else {
      const availableRepayment = cabfValue - assumptions.minimumCashBalance;
      actualRepaymentValue = Math.min(availableRepayment, previousShortTermBorrowings);
    }

    const ccDraw = createAudited(actualDrawValue, 'MIN(requiredDraw, availableCapacity)', { requiredDraw: assumptions.minimumCashBalance - cabfValue, availableCapacity: Math.max(0, Math.min(drawingPowerValue, assumptions.sanctionedLimit) - previousShortTermBorrowings) });
    const ccRepayment = createAudited(actualRepaymentValue, 'MIN(availableRepayment, previousShortTermBorrowings)', { availableRepayment: cabfValue - assumptions.minimumCashBalance, previousShortTermBorrowings });

    const cashSweepValue = actualDrawValue - actualRepaymentValue;
    const cashSweep = createAudited(
      cashSweepValue,
      'ccDraw - ccRepayment',
      { ccDraw: actualDrawValue, ccRepayment: actualRepaymentValue }
    );

    const unfundedCashDeficit = createAudited(
      unfundedDeficitValue,
      'MAX(0, Required Draw - Actual Draw)',
      { requiredDraw: assumptions.minimumCashBalance - cabfValue, actualDraw: actualDrawValue }
    );

    const shortTermBorrowingsValue = previousShortTermBorrowings + cashSweepValue;
    const shortTermBorrowings = createAudited(
      shortTermBorrowingsValue,
      'previousShortTermBorrowings + cashSweep',
      { previousShortTermBorrowings, cashSweep: cashSweepValue }
    );

    const cashValue = cabfValue + cashSweepValue;
    const cash = createAudited(
      cashValue,
      'cabf + cashSweep',
      { cabf: cabfValue, cashSweep: cashSweepValue }
    );

    const fixedAssetsValue = previousFixedAssets + capExValue - depreciationValue;
    const fixedAssets = createAudited(
      fixedAssetsValue,
      'openingFixedAssets + capEx - depreciation',
      { openingFixedAssets: previousFixedAssets, capEx: capExValue, depreciation: depreciationValue }
    );
    
    const otherNonCurrentAssets = createAudited(
      previousOtherNonCurrentAssets,
      'previousOtherNonCurrentAssets (constant)',
      { previousOtherNonCurrentAssets }
    );

    const totalCurrentAssetsValue = stockValue + debtorsValue + cashValue + ocaValue;
    const totalCurrentAssets = createAudited(
      totalCurrentAssetsValue,
      'stock + debtors + cash + otherCurrentAssets',
      { stock: stockValue, debtors: debtorsValue, cash: cashValue, otherCurrentAssets: ocaValue }
    );
    
    const totalAssetsValue = totalCurrentAssetsValue + fixedAssetsValue + previousOtherNonCurrentAssets;
    const totalAssets = createAudited(
      totalAssetsValue,
      'totalCurrentAssets + fixedAssets + otherNonCurrentAssets',
      { totalCurrentAssets: totalCurrentAssetsValue, fixedAssets: fixedAssetsValue, otherNonCurrentAssets: previousOtherNonCurrentAssets }
    );

    const clExclBankValue = creditorsValue + oclValue;
    const currentLiabilitiesExclBank = createAudited(
      clExclBankValue,
      'creditors + otherCurrentLiabilities',
      { creditors: creditorsValue, otherCurrentLiabilities: oclValue }
    );
    
    // Phase 8: Working Capital Breakouts
    const wcgValue = totalCurrentAssetsValue - clExclBankValue;
    const workingCapitalGap = createAudited(
      wcgValue,
      'totalCurrentAssets - (creditors + otherCurrentLiabilities)',
      { totalCurrentAssets: totalCurrentAssetsValue, creditors: creditorsValue, otherCurrentLiabilities: oclValue }
    );

    const borrowersContributionValue = totalCurrentAssetsValue * 0.25;
    const borrowersContribution = createAudited(
      borrowersContributionValue,
      'totalCurrentAssets * 0.25',
      { totalCurrentAssets: totalCurrentAssetsValue }
    );

    const mpbfMethod2Value = Math.max(0, wcgValue - borrowersContributionValue);
    const mpbfMethod2 = createAudited(
      mpbfMethod2Value,
      'MAX(0, workingCapitalGap - borrowersContribution)',
      { workingCapitalGap: wcgValue, borrowersContribution: borrowersContributionValue }
    );

    const totalCurrentLiabilitiesValue = creditorsValue + oclValue + shortTermBorrowingsValue;
    const totalCurrentLiabilities = createAudited(
      totalCurrentLiabilitiesValue,
      'creditors + otherCurrentLiabilities + shortTermBorrowings',
      { creditors: creditorsValue, otherCurrentLiabilities: oclValue, shortTermBorrowings: shortTermBorrowingsValue }
    );

    const nwcValue = totalCurrentAssetsValue - totalCurrentLiabilitiesValue;
    const netWorkingCapital = createAudited(
      nwcValue,
      'totalCurrentAssets - totalCurrentLiabilities',
      { totalCurrentAssets: totalCurrentAssetsValue, totalCurrentLiabilities: totalCurrentLiabilitiesValue }
    );

    const netWorkingCapitalExclBank = createAudited(
      wcgValue,
      'totalCurrentAssets - (creditors + otherCurrentLiabilities)',
      { totalCurrentAssets: totalCurrentAssetsValue, creditors: creditorsValue, otherCurrentLiabilities: oclValue }
    );

    const termLoansValue = previousTermLoans - assumptions.principalRepayment;
    const termLoans = createAudited(
      Math.max(0, termLoansValue),
      'MAX(0, previousTermLoans - principalRepayment)',
      { previousTermLoans, principalRepayment: assumptions.principalRepayment }
    );
    
    const otherNonCurrentLiabilities = createAudited(
      previousOtherNonCurrentLiabilities,
      'previousOtherNonCurrentLiabilities (constant)',
      { previousOtherNonCurrentLiabilities }
    );
    
    const equityValue = previousEquity + patValue;
    const equity = createAudited(
      equityValue,
      'openingEquity + pat',
      { openingEquity: previousEquity, pat: patValue }
    );

    const totalLiabilitiesAndEquityValue = totalCurrentLiabilitiesValue + Math.max(0, termLoansValue) + previousOtherNonCurrentLiabilities + equityValue;
    const totalLiabilitiesAndEquity = createAudited(
      totalLiabilitiesAndEquityValue,
      'totalCurrentLiabilities + termLoans + otherNonCurrentLiabilities + equity',
      { totalCurrentLiabilities: totalCurrentLiabilitiesValue, termLoans: Math.max(0, termLoansValue), otherNonCurrentLiabilities: previousOtherNonCurrentLiabilities, equity: equityValue }
    );

    // 3. Key Ratios
    const currentRatioValue = totalCurrentLiabilitiesValue === 0 ? 0 : totalCurrentAssetsValue / totalCurrentLiabilitiesValue;
    const currentRatio = createAudited(
      currentRatioValue,
      'totalCurrentAssets / totalCurrentLiabilities',
      { totalCurrentAssets: totalCurrentAssetsValue, totalCurrentLiabilities: totalCurrentLiabilitiesValue }
    );

    const totalDebtService = interestValue + assumptions.principalRepayment;
    const dscrValue = totalDebtService === 0 ? 0 : ebitdaValue / totalDebtService;
    const dscr = createAudited(
      dscrValue,
      'ebitda / (interest + principalRepayment)',
      { ebitda: ebitdaValue, interest: interestValue, principalRepayment: assumptions.principalRepayment }
    );

    const totalDebtValue = Math.max(0, termLoansValue) + shortTermBorrowingsValue;
    const debtEquityRatioValue = equityValue === 0 ? 0 : totalDebtValue / equityValue;
    const debtEquityRatio = createAudited(
      debtEquityRatioValue,
      '(termLoans + shortTermBorrowings) / equity',
      { termLoans: Math.max(0, termLoansValue), shortTermBorrowings: shortTermBorrowingsValue, equity: equityValue }
    );

    const totalOutsideLiabilities = totalCurrentLiabilitiesValue + Math.max(0, termLoansValue) + previousOtherNonCurrentLiabilities;
    const tolTnwRatioValue = equityValue === 0 ? 0 : totalOutsideLiabilities / equityValue;
    const tolTnwRatio = createAudited(
      tolTnwRatioValue,
      '(totalCurrentLiabilities + termLoans + otherNonCurrentLiabilities) / equity',
      { totalOutsideLiabilities, equity: equityValue }
    );

    const roeValue = equityValue === 0 ? 0 : patValue / equityValue;
    const roe = createAudited(
      roeValue,
      'pat / equity',
      { pat: patValue, equity: equityValue }
    );

    projections.push({
      year: i,
      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      ebitda,
      depreciation,
      ebit,
      interest,
      pbt,
      tax,
      netProfit,
      stock,
      debtors,
      cash,
      otherCurrentAssets,
      totalCurrentAssets,
      changeInStock,
      changeInDebtors,
      changeInCreditors,
      changeInOCA,
      changeInOCL,
      workingCapitalCashImpact,
      shortTermBorrowings,
      creditors,
      otherCurrentLiabilities,
      totalCurrentLiabilities,
      termLoans,
      fixedAssets,
      capEx,
      otherNonCurrentAssets,
      otherNonCurrentLiabilities,
      equity,
      mpbfMethod2,
      cashSweep,
      unfundedCashDeficit,
      totalAssets,
      totalLiabilitiesAndEquity,
      currentRatio,
      dscr,
      drawingPower,
      debtEquityRatio,
      tolTnwRatio,
      roe,
      openingFixedAssets,
      openingTermLoans,
      openingShortTermBorrowings,
      openingEquity,
      termLoanInterest,
      shortTermInterest,
      ccDraw,
      ccRepayment,
      cabf,
      eligibleStock,
      eligibleDebtors,
      workingCapitalGap,
      borrowersContribution,
      netWorkingCapital,
      netWorkingCapitalExclBank,
      currentLiabilitiesExclBank
    });

    previousRevenue = revenueValue;
    previousTermLoans = Math.max(0, termLoansValue);
    previousShortTermBorrowings = shortTermBorrowingsValue;
    previousStock = stockValue;
    previousDebtors = debtorsValue;
    previousCreditors = creditorsValue;
    previousCash = cashValue;
    previousOCA = ocaValue;
    previousOCL = oclValue;
    previousFixedAssets = fixedAssetsValue;
    previousEquity = equityValue;
  }

  return projections;
}
