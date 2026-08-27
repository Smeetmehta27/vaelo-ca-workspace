import { CMAProjectedYear, AuditedValue } from './cma';

// Helper to safely extract value or default to 0
function getVal(field: AuditedValue | undefined | null | number): number {
  if (field === undefined || field === null) return 0;
  if (typeof field === 'number') return field;
  if (typeof field === 'object' && 'value' in field) return field.value;
  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createAudited(value: number, formula: string, inputs: Record<string, any> = {}): AuditedValue {
  return { value, formula: `${formula} (Legacy Normalized)`, inputs };
}

/**
 * Maps a Phase 3-7 V1 payload into the complete Phase 8+ V2 CMAProjectedYear shape.
 * Ensures the UI components never crash from missing AuditedValue structural properties.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapV1ToV2Projections(legacyProjections: any[]): CMAProjectedYear[] {
  if (!legacyProjections || !Array.isArray(legacyProjections)) return [];
  
  let previousTermLoans = 0;
  let previousShortTermBorrowings = 0;

  let previousEquity = 0;
  let previousFixedAssets = 0;

  return legacyProjections.map((p) => {
    // If it already has Phase 8 fields AND is fully AuditedValue compliant, it's not a true V1 payload
    if (p.totalLiabilitiesAndEquity !== undefined && p.totalAssets !== undefined && typeof p.totalAssets === 'object' && 'value' in p.totalAssets) {
      return p as CMAProjectedYear;
    }

    // Extract core variables

    const totalCurrentAssets = getVal(p.totalCurrentAssets);
    const fixedAssets = getVal(p.fixedAssets);
    const otherNonCurrentAssets = getVal(p.otherNonCurrentAssets);
    
    const creditors = getVal(p.creditors);
    const otherCurrentLiabilities = getVal(p.otherCurrentLiabilities);
    const shortTermBorrowings = getVal(p.shortTermBorrowings);
    const totalCurrentLiabilities = getVal(p.totalCurrentLiabilities);
    
    const termLoans = getVal(p.termLoans);
    const otherNonCurrentLiabilities = getVal(p.otherNonCurrentLiabilities);
    const equity = getVal(p.equity);
    
    const stock = getVal(p.stock);
    const debtors = getVal(p.debtors);
    
    const wcg = totalCurrentAssets - (creditors + otherCurrentLiabilities);
    const bc = wcg * 0.25;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalized: Record<string, any> = { ...p };

    // Automatically wrap any unmapped primitive numbers into AuditedValues
    for (const [key, val] of Object.entries(normalized)) {
      if (typeof val === 'number' && key !== 'year') {
        normalized[key] = createAudited(val, 'Legacy V1 field');
      }
    }

    // 1. Balance Sheet Core
    normalized.totalAssets = createAudited(
      totalCurrentAssets + fixedAssets + otherNonCurrentAssets,
      'totalCurrentAssets + fixedAssets + otherNonCurrentAssets',
      { totalCurrentAssets, fixedAssets, otherNonCurrentAssets }
    );
    
    normalized.totalLiabilitiesAndEquity = createAudited(
      totalCurrentLiabilities + termLoans + otherNonCurrentLiabilities + equity,
      'totalCurrentLiabilities + termLoans + otherNonCurrentLiabilities + equity',
      { totalCurrentLiabilities, termLoans, otherNonCurrentLiabilities, equity }
    );

    // 2. Working Capital
    normalized.workingCapitalGap = createAudited(wcg, 'totalCurrentAssets - (creditors + otherCurrentLiabilities)', { totalCurrentAssets, creditors, otherCurrentLiabilities });
    normalized.borrowersContribution = createAudited(bc, 'workingCapitalGap * 0.25', { workingCapitalGap: wcg });
    
    normalized.netWorkingCapital = createAudited(
      totalCurrentAssets - totalCurrentLiabilities,
      'totalCurrentAssets - totalCurrentLiabilities',
      { totalCurrentAssets, totalCurrentLiabilities }
    );
    
    normalized.netWorkingCapitalExclBank = createAudited(
      wcg,
      'totalCurrentAssets - (creditors + otherCurrentLiabilities)',
      { totalCurrentAssets, creditors, otherCurrentLiabilities }
    );
    
    normalized.currentLiabilitiesExclBank = createAudited(
      creditors + otherCurrentLiabilities,
      'creditors + otherCurrentLiabilities',
      { creditors, otherCurrentLiabilities }
    );

    // 3. Traceability UI requirements (assumes historicals start at 0 if missing from first year, but these aren't used for math)
    normalized.openingFixedAssets = createAudited(previousFixedAssets, 'previousFixedAssets', { previousFixedAssets });
    normalized.openingTermLoans = createAudited(previousTermLoans, 'previousTermLoans', { previousTermLoans });
    normalized.openingShortTermBorrowings = createAudited(previousShortTermBorrowings, 'previousShortTermBorrowings', { previousShortTermBorrowings });
    normalized.openingEquity = createAudited(previousEquity, 'previousEquity', { previousEquity });
    
    // We don't have these in V1, default to 0
    normalized.termLoanInterest = createAudited(0, 'N/A in V1');
    normalized.shortTermInterest = createAudited(0, 'N/A in V1');
    normalized.ccDraw = createAudited(0, 'N/A in V1');
    normalized.ccRepayment = createAudited(0, 'N/A in V1');
    normalized.cabf = createAudited(0, 'N/A in V1');
    
    // Missing Phase 8+ variables
    if (normalized.drawingPower === undefined) normalized.drawingPower = createAudited(0, 'N/A in V1');
    if (normalized.mpbfMethod2 === undefined) normalized.mpbfMethod2 = createAudited(0, 'N/A in V1');
    if (normalized.unfundedCashDeficit === undefined) normalized.unfundedCashDeficit = createAudited(0, 'N/A in V1');
    if (normalized.cashSweep === undefined) normalized.cashSweep = createAudited(0, 'N/A in V1');
    
    // DP variables
    normalized.eligibleStock = createAudited(stock, 'Assumed equal to stock in V1 mapping', { stock });
    normalized.eligibleDebtors = createAudited(debtors, 'Assumed equal to debtors in V1 mapping', { debtors });
    
    // Track previous values for next iteration
    previousTermLoans = termLoans;
    previousShortTermBorrowings = shortTermBorrowings;
    previousEquity = equity;
    previousFixedAssets = fixedAssets;

    return normalized as CMAProjectedYear;
  });
}
