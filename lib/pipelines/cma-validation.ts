import { CMAHistoricalInput, CMAAssumptions } from './cma'

export type CMAValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export function validateCMAInputs(historical: CMAHistoricalInput, assumptions: CMAAssumptions): CMAValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Helper to check for NaN/Infinity
  const isInvalidNum = (val: unknown) => typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val);

  // 1. Basic Type Checks
  for (const [key, value] of Object.entries(historical)) {
    if (isInvalidNum(value)) {
      errors.push(`Historical field '${key}' is missing or malformed.`);
    }
  }
  for (const [key, value] of Object.entries(assumptions)) {
    if (isInvalidNum(value)) {
      errors.push(`Assumption field '${key}' is missing or malformed.`);
    }
  }

  if (errors.length > 0) return { valid: false, errors, warnings };

  // 1.5 Historical Balance Sheet Validation
  const historicalCurrentAssets = historical.cash + historical.stock + historical.debtors + historical.otherCurrentAssets;
  const historicalTotalAssets = historicalCurrentAssets + historical.fixedAssets + historical.otherNonCurrentAssets;

  const historicalCurrentLiabilities = historical.creditors + historical.otherCurrentLiabilities + historical.shortTermBorrowings;
  const historicalTotalLiabilitiesAndEquity = historicalCurrentLiabilities + historical.termLoans + historical.otherNonCurrentLiabilities + historical.equity;

  const historicalBalanceDifference = historicalTotalAssets - historicalTotalLiabilitiesAndEquity;

  if (Math.abs(historicalBalanceDifference) > 0.01) {
    errors.push(`Historical balance sheet does not balance. Total Assets = ${historicalTotalAssets.toFixed(2)}, Total Liabilities + Equity = ${historicalTotalLiabilitiesAndEquity.toFixed(2)}, Difference = ${historicalBalanceDifference.toFixed(2)}.`);
    return { valid: false, errors, warnings };
  }

  // 2. HARD ERRORS (Must Reject)
  
  // Historical >= 0
  const nonNegativeHistorical = [
    'revenue', 'cogs', 'operatingExpenses', 'stock', 'debtors', 'creditors',
    'cash', 'otherCurrentAssets', 'otherCurrentLiabilities', 'fixedAssets',
    'otherNonCurrentAssets', 'termLoans', 'shortTermBorrowings', 
    'otherNonCurrentLiabilities', 'interestPaid', 'principalRepayment'
  ];
  for (const field of nonNegativeHistorical) {
    if (historical[field as keyof CMAHistoricalInput] < 0) {
      errors.push(`Historical ${field} cannot be negative.`);
    }
  }

  // Assumptions >= 0
  const nonNegativeAssump = [
    'cogsMargin', 'operatingExpensesMargin', 'ocaMargin', 'oclMargin',
    'stockDays', 'debtorDays', 'creditorDays', 'interestRate', 
    'shortTermInterestRate', 'capExMargin', 'depreciationRate', 'taxRate',
    'principalRepayment', 'sanctionedLimit', 'minimumCashBalance',
    'drawingPowerStockMargin', 'drawingPowerDebtorMargin'
  ];
  for (const field of nonNegativeAssump) {
    if (assumptions[field as keyof CMAAssumptions] < 0) {
      errors.push(`Assumption ${field} cannot be negative.`);
    }
  }

  // Margins <= 100
  const percentMax100 = [
    'cogsMargin', 'operatingExpensesMargin', 'ocaMargin', 'oclMargin',
    'depreciationRate', 'taxRate', 'drawingPowerStockMargin', 'drawingPowerDebtorMargin'
  ];
  for (const field of percentMax100) {
    if (assumptions[field as keyof CMAAssumptions] > 100) {
      errors.push(`Assumption ${field} cannot exceed 100%.`);
    }
  }

  // 3. WARNINGS (Unusual but valid)

  if (historical.equity < 0) {
    warnings.push('Historical Equity is negative, indicating a distressed balance sheet.');
  }

  if (historical.cogs > historical.revenue) {
    warnings.push('Historical COGS exceeds Revenue.');
  }

  if ((historical.cogs + historical.operatingExpenses) > historical.revenue) {
    warnings.push('Historical operating model is loss-making (COGS + OpEx > Revenue).');
  }

  if (assumptions.revenueGrowthRate > 100 || assumptions.revenueGrowthRate < -50) {
    warnings.push(`Revenue growth assumption (${assumptions.revenueGrowthRate}%) is unusually extreme.`);
  }

  if ((assumptions.cogsMargin + assumptions.operatingExpensesMargin) >= 100) {
    warnings.push('Projected operating margins indicate a structurally loss-making business (COGS% + OpEx% >= 100%).');
  }

  if (assumptions.stockDays > 365 || assumptions.debtorDays > 365 || assumptions.creditorDays > 365) {
    warnings.push('Working capital days exceed 1 year, which is highly unusual.');
  }

  if (assumptions.interestRate > 50 || assumptions.shortTermInterestRate > 50) {
    warnings.push('Interest rate assumptions exceed 50%.');
  }

  if (assumptions.minimumCashBalance > assumptions.sanctionedLimit && assumptions.sanctionedLimit > 0) {
    warnings.push('Minimum Cash Balance requirement is higher than the Sanctioned CC Limit. This may force an unfunded deficit.');
  }

  if (historical.shortTermBorrowings > assumptions.sanctionedLimit) {
    warnings.push('Historical Short-Term Borrowings already exceed the projected Sanctioned Limit.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
