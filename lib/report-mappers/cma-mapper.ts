import { CMAProjectedYear, CMAHistoricalInput, AuditedValue } from '../pipelines/cma';


export interface CMAScheduleRow {
  label: string;
  isHeader?: boolean;
  isSubTotal?: boolean;
  indent?: boolean;
  valueType?: import('@/components/cma/utils').ValueType;
  historicalValue?: string | number | null;
  projectedValues?: (AuditedValue | null | undefined)[];
  currencyDecimals?: number;
}

export interface CMASchedule {
  scheduleTitle: string;
  columns: string[];
  rows: CMAScheduleRow[];
}

export function mapCMAReportSchedules(historical: CMAHistoricalInput | null, projections: CMAProjectedYear[]): CMASchedule[] {
  const cmaColumns: string[] = ["Historical"];
  projections.forEach((_, i) => {
    cmaColumns.push(`Year ${i + 1}`);
  });

  // Balance Sheet derived values for Executive Summary
  const histCurrentAssets = historical ? historical.cash + historical.stock + historical.debtors + historical.otherCurrentAssets : 0;
  const histTotalAssets = historical ? histCurrentAssets + historical.fixedAssets + historical.otherNonCurrentAssets : 0;
  const histCurrentLiab = historical ? historical.creditors + historical.otherCurrentLiabilities + historical.shortTermBorrowings : 0;
  const histTotalOutsideLiab = historical ? histCurrentLiab + historical.termLoans + historical.otherNonCurrentLiabilities : 0;
  const histTotalLiabAndEq = historical ? histTotalOutsideLiab + historical.equity : 0;
  const histDiff = histTotalAssets - histTotalLiabAndEq;
  const histCurrentRatio = historical && histCurrentLiab > 0 ? (histCurrentAssets / histCurrentLiab) : '-';
  const histDebtEquityRatio = historical ? (historical.equity > 0 ? ((historical.termLoans + historical.shortTermBorrowings) / historical.equity) : 'N/A') : '-';
  const histTolTnwRatio = historical ? (historical.equity > 0 ? (histTotalOutsideLiab / historical.equity) : 'N/A') : '-';

  // Schedule 1 — CMA Executive Summary
  const execSummarySchedule: CMASchedule = {
    scheduleTitle: "Schedule 1 — CMA Executive Summary",
    columns: cmaColumns,
    rows: [
      { label: "Revenue", historicalValue: historical ? historical.revenue : "-", projectedValues: projections.map(p => p.revenue), valueType: 'currency', currencyDecimals: 0 },
      { label: "EBITDA", historicalValue: "-", projectedValues: projections.map(p => p.ebitda), valueType: 'currency', currencyDecimals: 0 },
      { label: "PAT", historicalValue: "-", projectedValues: projections.map(p => p.netProfit), valueType: 'currency', currencyDecimals: 0 },
      
      { label: "Ratios", isHeader: true, historicalValue: "", projectedValues: projections.map(() => undefined) },
      { label: "Current Ratio", historicalValue: histCurrentRatio, projectedValues: projections.map(p => p.currentRatio), valueType: 'ratio' },
      { label: "Total Debt / Equity", historicalValue: histDebtEquityRatio, projectedValues: projections.map(p => p.debtEquityRatio), valueType: 'ratio' },
      { label: "TOL / TNW", historicalValue: histTolTnwRatio, projectedValues: projections.map(p => p.tolTnwRatio), valueType: 'ratio' },
      { label: "DSCR", historicalValue: "-", projectedValues: projections.map(p => p.dscr), valueType: 'ratio' },

      { label: "Working Capital Finance", isHeader: true, historicalValue: "", projectedValues: projections.map(() => undefined) },
      { label: "MPBF Method 2", historicalValue: "-", projectedValues: projections.map(p => p.mpbfMethod2), valueType: 'currency', currencyDecimals: 0 },
      { label: "Drawing Power", historicalValue: "-", projectedValues: projections.map(p => p.drawingPower), valueType: 'currency', currencyDecimals: 0 },
      { label: "Sanctioned CC Limit", historicalValue: "-", projectedValues: projections.map(p => ({ value: p.drawingPower?.inputs?.sanctionedLimit ?? 0, formula: 'Sanctioned Limit', inputs: {} }) as AuditedValue), valueType: 'currency', currencyDecimals: 0 },
      { label: "Closing CC Utilization", historicalValue: historical ? historical.shortTermBorrowings : '-', projectedValues: projections.map(p => p.shortTermBorrowings), valueType: 'currency', currencyDecimals: 0 },
      { label: "Unfunded Cash Deficit", historicalValue: "-", projectedValues: projections.map(p => p.unfundedCashDeficit), valueType: 'currency', currencyDecimals: 0 },
      { label: "Closing Cash", historicalValue: historical ? historical.cash : '-', projectedValues: projections.map(p => p.cash), valueType: 'currency', currencyDecimals: 0 },
    ]
  };

  // P&L
  const plSchedule: CMASchedule = {
    scheduleTitle: "Schedule 2 — Operating Statement / P&L",
    columns: cmaColumns,
    rows: [
      { label: "Revenue", historicalValue: historical ? historical.revenue : "-", projectedValues: projections.map(p => p.revenue), valueType: 'currency' },
      { label: "Less: COGS", indent: true, historicalValue: historical ? historical.cogs : "-", projectedValues: projections.map(p => p.cogs), valueType: 'currency' },
      { label: "Gross Profit", isSubTotal: true, historicalValue: historical ? historical.revenue - historical.cogs : "-", projectedValues: projections.map(p => p.grossProfit), valueType: 'currency' },
      { label: "Less: Operating Expenses", indent: true, historicalValue: historical ? historical.operatingExpenses : "-", projectedValues: projections.map(p => p.operatingExpenses), valueType: 'currency' },
      { label: "EBITDA", isSubTotal: true, historicalValue: historical ? historical.revenue - historical.cogs - historical.operatingExpenses : "-", projectedValues: projections.map(p => p.ebitda), valueType: 'currency' },
      { label: "Less: Depreciation", indent: true, historicalValue: "-", projectedValues: projections.map(p => p.depreciation), valueType: 'currency' },
      { label: "EBIT", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.ebit), valueType: 'currency' },
      { label: "Less: Interest", indent: true, historicalValue: "-", projectedValues: projections.map(p => p.interest), valueType: 'currency' },
      { label: "Profit Before Tax (PBT)", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.pbt), valueType: 'currency' },
      { label: "Less: Tax", indent: true, historicalValue: "-", projectedValues: projections.map(p => p.tax), valueType: 'currency' },
      { label: "Profit After Tax (PAT)", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.netProfit), valueType: 'currency' },
    ]
  };

  // Balance Sheet (calcs moved up for Executive Summary)

  const balanceCheckVals = projections.map(p => {
    return {
      value: p.totalAssets.value - p.totalLiabilitiesAndEquity.value,
      formula: 'totalAssets - totalLiabilitiesAndEquity',
      inputs: {
        totalAssets: p.totalAssets.value,
        totalLiabilitiesAndEquity: p.totalLiabilitiesAndEquity.value
      }
    } as AuditedValue;
  });

  const bsSchedule: CMASchedule = {
    scheduleTitle: "Schedule 3 — Balance Sheet",
    columns: cmaColumns,
    rows: [
      { label: "ASSETS", isHeader: true },
      { label: "Cash & Equivalents", indent: true, historicalValue: historical ? historical.cash : "-", projectedValues: projections.map(p => p.cash), valueType: 'currency' },
      { label: "Stock / Inventory", indent: true, historicalValue: historical ? historical.stock : "-", projectedValues: projections.map(p => p.stock), valueType: 'currency' },
      { label: "Debtors / Receivables", indent: true, historicalValue: historical ? historical.debtors : "-", projectedValues: projections.map(p => p.debtors), valueType: 'currency' },
      { label: "Other Current Assets", indent: true, historicalValue: historical ? historical.otherCurrentAssets : "-", projectedValues: projections.map(p => p.otherCurrentAssets), valueType: 'currency' },
      { label: "Total Current Assets", isSubTotal: true, historicalValue: historical ? histCurrentAssets : "-", projectedValues: projections.map(p => p.totalCurrentAssets), valueType: 'currency' },
      { label: "Fixed Assets (Net)", indent: true, historicalValue: historical ? historical.fixedAssets : "-", projectedValues: projections.map(p => p.fixedAssets), valueType: 'currency' },
      { label: "Other Non-Current Assets", indent: true, historicalValue: historical ? historical.otherNonCurrentAssets : "-", projectedValues: projections.map(p => p.otherNonCurrentAssets), valueType: 'currency' },
      { label: "Total Assets", isHeader: true, historicalValue: historical ? histTotalAssets : "-", projectedValues: projections.map(p => p.totalAssets), valueType: 'currency' },
      { label: "LIABILITIES & EQUITY", isHeader: true },
      { label: "Creditors / Payables", indent: true, historicalValue: historical ? historical.creditors : "-", projectedValues: projections.map(p => p.creditors), valueType: 'currency' },
      { label: "Other Current Liabilities", indent: true, historicalValue: historical ? historical.otherCurrentLiabilities : "-", projectedValues: projections.map(p => p.otherCurrentLiabilities), valueType: 'currency' },
      { label: "Short-Term Borrowings (CC/OD)", indent: true, historicalValue: historical ? historical.shortTermBorrowings : "-", projectedValues: projections.map(p => p.shortTermBorrowings), valueType: 'currency' },
      { label: "Total Current Liabilities", isSubTotal: true, historicalValue: historical ? histCurrentLiab : "-", projectedValues: projections.map(p => p.totalCurrentLiabilities), valueType: 'currency' },
      { label: "Term Loans", indent: true, historicalValue: historical ? historical.termLoans : "-", projectedValues: projections.map(p => p.termLoans), valueType: 'currency' },
      { label: "Other Non-Current Liab.", indent: true, historicalValue: historical ? historical.otherNonCurrentLiabilities : "-", projectedValues: projections.map(p => p.otherNonCurrentLiabilities), valueType: 'currency' },
      { label: "Equity & Reserves", indent: true, historicalValue: historical ? historical.equity : "-", projectedValues: projections.map(p => p.equity), valueType: 'currency' },
      { label: "Total Liabilities & Equity", isHeader: true, historicalValue: historical ? histTotalLiabAndEq : "-", projectedValues: projections.map(p => p.totalLiabilitiesAndEquity), valueType: 'currency' },
      { label: "Balance Check (Assets - L&E)", isSubTotal: true, historicalValue: historical ? histDiff : "-", projectedValues: balanceCheckVals, valueType: 'currency' }
    ]
  };

  // WC
  const histNWC = histCurrentAssets - histCurrentLiab;
  const wcSchedule: CMASchedule = {
    scheduleTitle: "Schedule 4 — Working Capital Analysis",
    columns: cmaColumns,
    rows: [
      { label: "Total Current Assets (TCA)", historicalValue: historical ? histCurrentAssets : "-", projectedValues: projections.map(p => p.totalCurrentAssets), valueType: 'currency' },
      { label: "Less: Current Liab. Excl. Bank", indent: true, historicalValue: historical ? historical.creditors + historical.otherCurrentLiabilities : "-", projectedValues: projections.map(p => p.currentLiabilitiesExclBank), valueType: 'currency' },
      { label: "Working Capital Gap", isSubTotal: true, historicalValue: historical ? histCurrentAssets - (historical.creditors + historical.otherCurrentLiabilities) : '-', projectedValues: projections.map(p => p.workingCapitalGap), valueType: 'currency' },
      { label: "Less: Short Term Borrowings", indent: true, historicalValue: historical ? historical.shortTermBorrowings : "-", projectedValues: projections.map(p => p.shortTermBorrowings), valueType: 'currency' },
      { label: "Net Working Capital (NWC)", isSubTotal: true, historicalValue: historical ? histNWC : "-", projectedValues: projections.map(p => p.netWorkingCapital), valueType: 'currency' },
    ]
  };

  // MPBF
  const histMPBF = Math.max(0, (histCurrentAssets - (historical ? (historical.creditors + historical.otherCurrentLiabilities) : 0)) - (histCurrentAssets * 0.25));
  const mpbfSchedule: CMASchedule = {
    scheduleTitle: "Schedule 5 — Maximum Permissible Bank Finance (Tandon Method II)",
    columns: cmaColumns,
    rows: [
      { label: "Total Current Assets", historicalValue: historical ? histCurrentAssets : "-", projectedValues: projections.map(p => p.totalCurrentAssets), valueType: 'currency' },
      { label: "Less: Current Liab. Excl. Bank", indent: true, historicalValue: historical ? (historical.creditors + historical.otherCurrentLiabilities) : '-', projectedValues: projections.map(p => p.currentLiabilitiesExclBank), valueType: 'currency' },
      { label: "Working Capital Gap", isSubTotal: true, historicalValue: historical ? histCurrentAssets - (historical.creditors + historical.otherCurrentLiabilities) : '-', projectedValues: projections.map(p => p.workingCapitalGap), valueType: 'currency' },
      { label: "Less: Required Borrower Contribution (25% of TCA)", indent: true, historicalValue: historical ? histCurrentAssets * 0.25 : "-", projectedValues: projections.map(p => p.borrowersContribution), valueType: 'currency' },
      { label: "Maximum Permissible Bank Finance (MPBF)", isSubTotal: true, historicalValue: historical ? histMPBF : "-", projectedValues: projections.map(p => p.mpbfMethod2), valueType: 'currency' },
    ]
  };

  // Drawing Power
  const dpSchedule: CMASchedule = {
    scheduleTitle: "Schedule 6 — Drawing Power (DP) Calculation",
    columns: cmaColumns,
    rows: [
      { label: "Gross Stock / Inventory", historicalValue: historical ? historical.stock : "-", projectedValues: projections.map(p => p.stock), valueType: 'currency' },
      { label: "Less: Margin (25%)", indent: true, historicalValue: "-", projectedValues: projections.map(p => p.stock ? { ...p.stock, value: p.stock.value * 0.25 } as AuditedValue : null), valueType: 'currency' },
      { label: "Eligible Stock", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.eligibleStock), valueType: 'currency' },
      { label: "Gross Debtors", historicalValue: historical ? historical.debtors : "-", projectedValues: projections.map(p => p.debtors), valueType: 'currency' },
      { label: "Less: Margin (40%)", indent: true, historicalValue: "-", projectedValues: projections.map(p => p.debtors ? { ...p.debtors, value: p.debtors.value * 0.40 } as AuditedValue : null), valueType: 'currency' },
      { label: "Eligible Debtors", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.eligibleDebtors), valueType: 'currency' },
      { label: "Less: Unpaid Creditors", historicalValue: historical ? historical.creditors : "-", projectedValues: projections.map(p => p.creditors), valueType: 'currency' },
      { label: "Calculated Drawing Power", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.drawingPower), valueType: 'currency' },
    ]
  };

  // CC
  const ccSchedule: CMASchedule = {
    scheduleTitle: "Schedule 7 — Cash Credit (CC) / Overdraft Limit",
    columns: cmaColumns,
    rows: [
      { label: "Sanctioned Limit", historicalValue: "-", projectedValues: projections.map(p => p.drawingPower?.inputs?.sanctionedLimit ? { value: p.drawingPower.inputs.sanctionedLimit, formula: "Constant", inputs: {} } as AuditedValue : null), valueType: 'currency' },
      { label: "Calculated Drawing Power (DP)", historicalValue: "-", projectedValues: projections.map(p => p.drawingPower), valueType: 'currency' },
      { label: "MPBF Constraint", historicalValue: "-", projectedValues: projections.map(p => p.mpbfMethod2), valueType: 'currency' },
      { label: "Available Limit (Min of Sanctioned, DP, MPBF)", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => {
        const dp = p.drawingPower?.value || 0;
        const mpbf = p.mpbfMethod2?.value || 0;
        const sanctioned = (p.drawingPower?.inputs?.sanctionedLimit as number) || 3000000;
        return { value: Math.min(dp, mpbf, sanctioned), formula: "MIN(Sanctioned, DP, MPBF)", inputs: { dp, mpbf, sanctioned } } as AuditedValue;
      }), valueType: 'currency' },
      { label: "Projected Short-Term Borrowings", historicalValue: "-", projectedValues: projections.map(p => p.shortTermBorrowings), valueType: 'currency' },
    ]
  };

  // Changes in WC
  const changesInWcSchedule: CMASchedule = {
    scheduleTitle: "Schedule 8 — Changes in Working Capital",
    columns: cmaColumns,
    rows: [
      { label: "Increase (Decrease) in Stock", historicalValue: "-", projectedValues: projections.map(p => p.changeInStock), valueType: 'currency' },
      { label: "Increase (Decrease) in Debtors", historicalValue: "-", projectedValues: projections.map(p => p.changeInDebtors), valueType: 'currency' },
      { label: "Increase (Decrease) in Other Current Assets", historicalValue: "-", projectedValues: projections.map(p => p.changeInOCA), valueType: 'currency' },
      { label: "(Increase) Decrease in Creditors", historicalValue: "-", projectedValues: projections.map(p => p.changeInCreditors), valueType: 'currency' },
      { label: "(Increase) Decrease in Other Current Liab.", historicalValue: "-", projectedValues: projections.map(p => p.changeInOCL), valueType: 'currency' },
      { label: "Net Cash Impact from Working Capital", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.workingCapitalCashImpact), valueType: 'currency' },
    ]
  };

  // Cash flow
  const cfSchedule: CMASchedule = {
    scheduleTitle: "Schedule 9 — Cash Flow Statement",
    columns: cmaColumns,
    rows: [
      { label: "Profit After Tax (PAT)", historicalValue: "-", projectedValues: projections.map(p => p.netProfit), valueType: 'currency' },
      { label: "Add: Depreciation", historicalValue: "-", projectedValues: projections.map(p => p.depreciation), valueType: 'currency' },
      { label: "Add/Less: Net WC Changes", historicalValue: "-", projectedValues: projections.map(p => p.workingCapitalCashImpact), valueType: 'currency' },
      { label: "Cash Flow from Operations", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => {
        const pat = p.netProfit?.value || 0;
        const dep = p.depreciation?.value || 0;
        const wc = p.workingCapitalCashImpact?.value || 0;
        return { value: pat + dep + wc, formula: "PAT + Depreciation + WC Impact" } as AuditedValue;
      }), valueType: 'currency' },
      { label: "Less: Capital Expenditure", historicalValue: "-", projectedValues: projections.map(p => p.capEx), valueType: 'currency' },
      { label: "Less: Term Loan Principal Repayment", historicalValue: "-", projectedValues: projections.map(p => {
        return { value: (p.termLoans?.inputs?.principalRepayment as number) || 0, formula: "Assumed flat", inputs: {} } as AuditedValue;
      }), valueType: 'currency' },
      { label: "Cash Available Before Financing (CABF)", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.cabf), valueType: 'currency' },
      { label: "Net Change in Short-Term Borrowings (CC/OD)", historicalValue: "-", projectedValues: projections.map(p => p.cashSweep), valueType: 'currency' },
      { label: "Net Increase (Decrease) in Cash", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => {
        const cabf = p.cabf?.value || 0;
        const sweep = p.cashSweep?.value || 0;
        const prev = (p.cash?.inputs?.previousCash as number) || 0;
        return { value: cabf + sweep - prev, formula: "CABF + Sweep - PrevCash", inputs: {} } as AuditedValue;
      }), valueType: 'currency' },
      { label: "Closing Cash Balance", isHeader: true, historicalValue: "-", projectedValues: projections.map(p => p.cash), valueType: 'currency' },
    ]
  };

  // Fixed Assets
  const faSchedule: CMASchedule = {
    scheduleTitle: "Schedule 10 — Fixed Assets & Depreciation",
    columns: cmaColumns,
    rows: [
      { label: "Opening Gross Block", historicalValue: "-", projectedValues: projections.map(p => p.openingFixedAssets), valueType: 'currency' },
      { label: "Add: Additions (CapEx)", historicalValue: "-", projectedValues: projections.map(p => p.capEx), valueType: 'currency' },
      { label: "Less: Depreciation", historicalValue: "-", projectedValues: projections.map(p => p.depreciation), valueType: 'currency' },
      { label: "Closing Net Block", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.fixedAssets), valueType: 'currency' },
    ]
  };

  // Debt
  const debtSchedule: CMASchedule = {
    scheduleTitle: "Schedule 11 — Term Debt Movement",
    columns: cmaColumns,
    rows: [
      { label: "Opening Balance", historicalValue: "-", projectedValues: projections.map(p => p.openingTermLoans), valueType: 'currency' },
      { label: "Add: New Disbursements", historicalValue: "-", projectedValues: projections.map(() => ({ value: 0, formula: "Zero", inputs: {} } as AuditedValue)), valueType: 'currency' },
      { label: "Less: Repayments", historicalValue: "-", projectedValues: projections.map(p => {
        const diff = (p.openingTermLoans?.value || 0) - (p.termLoans?.value || 0);
        return { value: diff, formula: "Opening - Closing" } as AuditedValue;
      }), valueType: 'currency' },
      { label: "Closing Balance", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.termLoans), valueType: 'currency' },
    ]
  };

  // Equity
  const equitySchedule: CMASchedule = {
    scheduleTitle: "Schedule 12 — Equity / Net Worth",
    columns: cmaColumns,
    rows: [
      { label: "Opening Balance", historicalValue: "-", projectedValues: projections.map(p => p.openingEquity), valueType: 'currency' },
      { label: "Add: Profit After Tax (PAT)", historicalValue: "-", projectedValues: projections.map(p => p.netProfit), valueType: 'currency' },
      { label: "Closing Net Worth", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.equity), valueType: 'currency' },
    ]
  };

  // Ratios
  const ratioSchedule: CMASchedule = {
    scheduleTitle: "Schedule 13 — Key Financial Ratios",
    columns: cmaColumns,
    rows: [
      { label: "Current Ratio", historicalValue: histCurrentRatio, projectedValues: projections.map(p => p.currentRatio), valueType: 'ratio' },
      { label: "Total Debt / Equity (TDE)", historicalValue: histDebtEquityRatio, projectedValues: projections.map(p => p.debtEquityRatio), valueType: 'ratio' },
      { label: "TOL / TNW", historicalValue: histTolTnwRatio, projectedValues: projections.map(p => p.tolTnwRatio), valueType: 'ratio' },
      { label: "DSCR (Debt Service Coverage Ratio)", historicalValue: "-", projectedValues: projections.map(p => p.dscr), valueType: 'ratio' },
    ]
  };

  return [
    execSummarySchedule,
    plSchedule,
    bsSchedule,
    wcSchedule,
    mpbfSchedule,
    dpSchedule,
    ccSchedule,
    changesInWcSchedule,
    cfSchedule,
    faSchedule,
    debtSchedule,
    equitySchedule,
    ratioSchedule
  ];
}
