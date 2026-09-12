import { CMAProjectedYear, CMAHistoricalInput, AuditedValue } from '../pipelines/cma';
import { formatCurrency } from '@/components/cma/utils';

export interface CMAScheduleRow {
  label: string;
  isHeader?: boolean;
  isSubTotal?: boolean;
  indent?: boolean;
  isCurrency?: boolean;
  historicalValue?: string | number | null;
  projectedValues?: (AuditedValue | null | undefined)[];
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

  // P&L
  const plSchedule: CMASchedule = {
    scheduleTitle: "Schedule 2 — Operating Statement / P&L",
    columns: cmaColumns,
    rows: [
      { label: "Revenue", historicalValue: historical ? formatCurrency(historical.revenue) : '-', projectedValues: projections.map(p => p.revenue) },
      { label: "Less: COGS", indent: true, historicalValue: historical ? formatCurrency(historical.cogs) : '-', projectedValues: projections.map(p => p.cogs) },
      { label: "Gross Profit", isSubTotal: true, historicalValue: historical ? formatCurrency(historical.revenue - historical.cogs) : '-', projectedValues: projections.map(p => p.grossProfit) },
      { label: "Less: Operating Expenses", indent: true, historicalValue: historical ? formatCurrency(historical.operatingExpenses) : '-', projectedValues: projections.map(p => p.operatingExpenses) },
      { label: "EBITDA", isSubTotal: true, historicalValue: historical ? formatCurrency(historical.revenue - historical.cogs - historical.operatingExpenses) : '-', projectedValues: projections.map(p => p.ebitda) },
      { label: "Less: Depreciation", indent: true, historicalValue: "-", projectedValues: projections.map(p => p.depreciation) },
      { label: "EBIT", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.ebit) },
      { label: "Less: Interest", indent: true, historicalValue: "-", projectedValues: projections.map(p => p.interest) },
      { label: "Profit Before Tax (PBT)", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.pbt) },
      { label: "Less: Tax", indent: true, historicalValue: "-", projectedValues: projections.map(p => p.tax) },
      { label: "Profit After Tax (PAT)", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.netProfit) },
    ]
  };

  // Balance Sheet
  const histCurrentAssets = historical ? historical.cash + historical.stock + historical.debtors + historical.otherCurrentAssets : 0;
  const histTotalAssets = historical ? histCurrentAssets + historical.fixedAssets + historical.otherNonCurrentAssets : 0;
  
  const histCurrentLiab = historical ? historical.creditors + historical.otherCurrentLiabilities + historical.shortTermBorrowings : 0;
  const histTotalLiabAndEq = historical ? histCurrentLiab + historical.termLoans + historical.otherNonCurrentLiabilities + historical.equity : 0;
  const histDiff = histTotalAssets - histTotalLiabAndEq;

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
      { label: "Cash & Equivalents", indent: true, historicalValue: historical ? formatCurrency(historical.cash) : '-', projectedValues: projections.map(p => p.cash) },
      { label: "Stock / Inventory", indent: true, historicalValue: historical ? formatCurrency(historical.stock) : '-', projectedValues: projections.map(p => p.stock) },
      { label: "Debtors / Receivables", indent: true, historicalValue: historical ? formatCurrency(historical.debtors) : '-', projectedValues: projections.map(p => p.debtors) },
      { label: "Other Current Assets", indent: true, historicalValue: historical ? formatCurrency(historical.otherCurrentAssets) : '-', projectedValues: projections.map(p => p.otherCurrentAssets) },
      { label: "Total Current Assets", isSubTotal: true, historicalValue: historical ? formatCurrency(histCurrentAssets) : '-', projectedValues: projections.map(p => p.totalCurrentAssets) },
      { label: "Fixed Assets (Net)", indent: true, historicalValue: historical ? formatCurrency(historical.fixedAssets) : '-', projectedValues: projections.map(p => p.fixedAssets) },
      { label: "Other Non-Current Assets", indent: true, historicalValue: historical ? formatCurrency(historical.otherNonCurrentAssets) : '-', projectedValues: projections.map(p => p.otherNonCurrentAssets) },
      { label: "Total Assets", isHeader: true, historicalValue: historical ? formatCurrency(histTotalAssets) : '-', projectedValues: projections.map(p => p.totalAssets) },
      { label: "LIABILITIES & EQUITY", isHeader: true },
      { label: "Creditors / Payables", indent: true, historicalValue: historical ? formatCurrency(historical.creditors) : '-', projectedValues: projections.map(p => p.creditors) },
      { label: "Other Current Liabilities", indent: true, historicalValue: historical ? formatCurrency(historical.otherCurrentLiabilities) : '-', projectedValues: projections.map(p => p.otherCurrentLiabilities) },
      { label: "Short-Term Borrowings (CC/OD)", indent: true, historicalValue: historical ? formatCurrency(historical.shortTermBorrowings) : '-', projectedValues: projections.map(p => p.shortTermBorrowings) },
      { label: "Total Current Liabilities", isSubTotal: true, historicalValue: historical ? formatCurrency(histCurrentLiab) : '-', projectedValues: projections.map(p => p.totalCurrentLiabilities) },
      { label: "Term Loans", indent: true, historicalValue: historical ? formatCurrency(historical.termLoans) : '-', projectedValues: projections.map(p => p.termLoans) },
      { label: "Other Non-Current Liab.", indent: true, historicalValue: historical ? formatCurrency(historical.otherNonCurrentLiabilities) : '-', projectedValues: projections.map(p => p.otherNonCurrentLiabilities) },
      { label: "Equity & Reserves", indent: true, historicalValue: historical ? formatCurrency(historical.equity) : '-', projectedValues: projections.map(p => p.equity) },
      { label: "Total Liabilities & Equity", isHeader: true, historicalValue: historical ? formatCurrency(histTotalLiabAndEq) : '-', projectedValues: projections.map(p => p.totalLiabilitiesAndEquity) },
      { label: "Balance Check (Assets - L&E)", isSubTotal: true, historicalValue: historical ? formatCurrency(histDiff) : '-', projectedValues: balanceCheckVals }
    ]
  };

  // WC
  const histNWC = histCurrentAssets - histCurrentLiab;
  const wcSchedule: CMASchedule = {
    scheduleTitle: "Schedule 4 — Working Capital Analysis",
    columns: cmaColumns,
    rows: [
      { label: "Total Current Assets (TCA)", historicalValue: historical ? formatCurrency(histCurrentAssets) : '-', projectedValues: projections.map(p => p.totalCurrentAssets) },
      { label: "Less: Current Liab. Excl. Bank", indent: true, historicalValue: historical ? formatCurrency(historical.creditors + historical.otherCurrentLiabilities) : '-', projectedValues: projections.map(p => p.currentLiabilitiesExclBank) },
      { label: "Working Capital Gap", isSubTotal: true, historicalValue: historical ? formatCurrency(histCurrentAssets - (historical.creditors + historical.otherCurrentLiabilities)) : '-', projectedValues: projections.map(p => p.workingCapitalGap) },
      { label: "Less: Short Term Borrowings", indent: true, historicalValue: historical ? formatCurrency(historical.shortTermBorrowings) : '-', projectedValues: projections.map(p => p.shortTermBorrowings) },
      { label: "Net Working Capital (NWC)", isSubTotal: true, historicalValue: historical ? formatCurrency(histNWC) : '-', projectedValues: projections.map(p => p.netWorkingCapital) },
    ]
  };

  // MPBF
  const histMPBF = Math.max(0, (histCurrentAssets - (historical ? (historical.creditors + historical.otherCurrentLiabilities) : 0)) - (histCurrentAssets * 0.25));
  const mpbfSchedule: CMASchedule = {
    scheduleTitle: "Schedule 5 — Maximum Permissible Bank Finance (Tandon Method II)",
    columns: cmaColumns,
    rows: [
      { label: "Total Current Assets", historicalValue: historical ? formatCurrency(histCurrentAssets) : '-', projectedValues: projections.map(p => p.totalCurrentAssets) },
      { label: "Less: Current Liab. Excl. Bank", indent: true, historicalValue: historical ? formatCurrency(historical ? (historical.creditors + historical.otherCurrentLiabilities) : 0) : '-', projectedValues: projections.map(p => p.currentLiabilitiesExclBank) },
      { label: "Working Capital Gap", isSubTotal: true, historicalValue: historical ? formatCurrency(histCurrentAssets - (historical ? (historical.creditors + historical.otherCurrentLiabilities) : 0)) : '-', projectedValues: projections.map(p => p.workingCapitalGap) },
      { label: "Less: Required Borrower Contribution (25% of TCA)", indent: true, historicalValue: historical ? formatCurrency(histCurrentAssets * 0.25) : '-', projectedValues: projections.map(p => p.borrowersContribution) },
      { label: "Maximum Permissible Bank Finance (MPBF)", isSubTotal: true, historicalValue: historical ? formatCurrency(histMPBF) : '-', projectedValues: projections.map(p => p.mpbfMethod2) },
    ]
  };

  // Drawing Power
  const dpSchedule: CMASchedule = {
    scheduleTitle: "Schedule 6 — Drawing Power (DP) Calculation",
    columns: cmaColumns,
    rows: [
      { label: "Gross Stock / Inventory", historicalValue: historical ? formatCurrency(historical.stock) : '-', projectedValues: projections.map(p => p.stock) },
      { label: "Less: Margin (25%)", indent: true, historicalValue: "-", projectedValues: projections.map(p => p.stock ? { ...p.stock, value: p.stock.value * 0.25 } as AuditedValue : null) },
      { label: "Eligible Stock", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.eligibleStock) },
      { label: "Gross Debtors", historicalValue: historical ? formatCurrency(historical.debtors) : '-', projectedValues: projections.map(p => p.debtors) },
      { label: "Less: Margin (40%)", indent: true, historicalValue: "-", projectedValues: projections.map(p => p.debtors ? { ...p.debtors, value: p.debtors.value * 0.40 } as AuditedValue : null) },
      { label: "Eligible Debtors", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.eligibleDebtors) },
      { label: "Less: Unpaid Creditors", historicalValue: historical ? formatCurrency(historical.creditors) : '-', projectedValues: projections.map(p => p.creditors) },
      { label: "Calculated Drawing Power", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.drawingPower) },
    ]
  };

  // CC
  const ccSchedule: CMASchedule = {
    scheduleTitle: "Schedule 7 — Cash Credit (CC) / Overdraft Limit",
    columns: cmaColumns,
    rows: [
      { label: "Sanctioned Limit", historicalValue: "-", projectedValues: projections.map(p => p.drawingPower?.inputs?.sanctionedLimit ? { value: p.drawingPower.inputs.sanctionedLimit, formula: "Constant", inputs: {} } as AuditedValue : null) },
      { label: "Calculated Drawing Power (DP)", historicalValue: "-", projectedValues: projections.map(p => p.drawingPower) },
      { label: "MPBF Constraint", historicalValue: "-", projectedValues: projections.map(p => p.mpbfMethod2) },
      { label: "Available Limit (Min of Sanctioned, DP, MPBF)", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => {
        const dp = p.drawingPower?.value || 0;
        const mpbf = p.mpbfMethod2?.value || 0;
        const sanctioned = (p.drawingPower?.inputs?.sanctionedLimit as number) || 3000000;
        return { value: Math.min(dp, mpbf, sanctioned), formula: "MIN(Sanctioned, DP, MPBF)", inputs: { dp, mpbf, sanctioned } } as AuditedValue;
      })},
      { label: "Projected Short-Term Borrowings", historicalValue: "-", projectedValues: projections.map(p => p.shortTermBorrowings) },
    ]
  };

  // Changes in WC
  const changesInWcSchedule: CMASchedule = {
    scheduleTitle: "Schedule 8 — Changes in Working Capital",
    columns: cmaColumns,
    rows: [
      { label: "Increase (Decrease) in Stock", historicalValue: "-", projectedValues: projections.map(p => p.changeInStock) },
      { label: "Increase (Decrease) in Debtors", historicalValue: "-", projectedValues: projections.map(p => p.changeInDebtors) },
      { label: "Increase (Decrease) in Other Current Assets", historicalValue: "-", projectedValues: projections.map(p => p.changeInOCA) },
      { label: "(Increase) Decrease in Creditors", historicalValue: "-", projectedValues: projections.map(p => p.changeInCreditors) },
      { label: "(Increase) Decrease in Other Current Liab.", historicalValue: "-", projectedValues: projections.map(p => p.changeInOCL) },
      { label: "Net Cash Impact from Working Capital", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.workingCapitalCashImpact) },
    ]
  };

  // Cash flow
  const cfSchedule: CMASchedule = {
    scheduleTitle: "Schedule 9 — Cash Flow Statement",
    columns: cmaColumns,
    rows: [
      { label: "Profit After Tax (PAT)", historicalValue: "-", projectedValues: projections.map(p => p.netProfit) },
      { label: "Add: Depreciation", historicalValue: "-", projectedValues: projections.map(p => p.depreciation) },
      { label: "Add/Less: Net WC Changes", historicalValue: "-", projectedValues: projections.map(p => p.workingCapitalCashImpact) },
      { label: "Cash Flow from Operations", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => {
        const pat = p.netProfit?.value || 0;
        const dep = p.depreciation?.value || 0;
        const wc = p.workingCapitalCashImpact?.value || 0;
        return { value: pat + dep + wc, formula: "PAT + Depreciation + WC Impact" } as AuditedValue;
      })},
      { label: "Less: Capital Expenditure", historicalValue: "-", projectedValues: projections.map(p => p.capEx) },
      { label: "Less: Term Loan Principal Repayment", historicalValue: "-", projectedValues: projections.map(p => {
        return { value: (p.termLoans?.inputs?.principalRepayment as number) || 0, formula: "Assumed flat", inputs: {} } as AuditedValue;
      })},
      { label: "Cash Available Before Financing (CABF)", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.cabf) },
      { label: "Net Change in Short-Term Borrowings (CC/OD)", historicalValue: "-", projectedValues: projections.map(p => p.cashSweep) },
      { label: "Net Increase (Decrease) in Cash", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => {
        const cabf = p.cabf?.value || 0;
        const sweep = p.cashSweep?.value || 0;
        const prev = (p.cash?.inputs?.previousCash as number) || 0;
        return { value: cabf + sweep - prev, formula: "CABF + Sweep - PrevCash", inputs: {} } as AuditedValue;
      })},
      { label: "Closing Cash Balance", isHeader: true, historicalValue: "-", projectedValues: projections.map(p => p.cash) },
    ]
  };

  // Fixed Assets
  const faSchedule: CMASchedule = {
    scheduleTitle: "Schedule 10 — Fixed Assets & Depreciation",
    columns: cmaColumns,
    rows: [
      { label: "Opening Gross Block", historicalValue: "-", projectedValues: projections.map(p => p.openingFixedAssets) },
      { label: "Add: Additions (CapEx)", historicalValue: "-", projectedValues: projections.map(p => p.capEx) },
      { label: "Less: Depreciation", historicalValue: "-", projectedValues: projections.map(p => p.depreciation) },
      { label: "Closing Net Block", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.fixedAssets) },
    ]
  };

  // Debt
  const debtSchedule: CMASchedule = {
    scheduleTitle: "Schedule 11 — Term Debt Movement",
    columns: cmaColumns,
    rows: [
      { label: "Opening Balance", historicalValue: "-", projectedValues: projections.map(p => p.openingTermLoans) },
      { label: "Add: New Disbursements", historicalValue: "-", projectedValues: projections.map(() => ({ value: 0, formula: "Zero", inputs: {} } as AuditedValue)) },
      { label: "Less: Repayments", historicalValue: "-", projectedValues: projections.map(p => {
        const diff = (p.openingTermLoans?.value || 0) - (p.termLoans?.value || 0);
        return { value: diff, formula: "Opening - Closing" } as AuditedValue;
      })},
      { label: "Closing Balance", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.termLoans) },
    ]
  };

  // Equity
  const equitySchedule: CMASchedule = {
    scheduleTitle: "Schedule 12 — Equity / Net Worth",
    columns: cmaColumns,
    rows: [
      { label: "Opening Balance", historicalValue: "-", projectedValues: projections.map(p => p.openingEquity) },
      { label: "Add: Profit After Tax (PAT)", historicalValue: "-", projectedValues: projections.map(p => p.netProfit) },
      { label: "Closing Net Worth", isSubTotal: true, historicalValue: "-", projectedValues: projections.map(p => p.equity) },
    ]
  };

  // Ratios
  const ratioSchedule: CMASchedule = {
    scheduleTitle: "Schedule 13 — Key Financial Ratios",
    columns: cmaColumns,
    rows: [
      { label: "Current Ratio", historicalValue: historical ? (histCurrentLiab > 0 ? (histCurrentAssets / histCurrentLiab).toFixed(2) : 'N/A') : '-', projectedValues: projections.map(p => p.currentRatio), isCurrency: false },
      { label: "Total Debt / Equity (TDE)", historicalValue: historical ? (historical.equity > 0 ? ((historical.termLoans + historical.shortTermBorrowings) / historical.equity).toFixed(2) : 'N/A') : '-', projectedValues: projections.map(p => p.debtEquityRatio), isCurrency: false },
      { label: "TOL / TNW", historicalValue: historical ? (historical.equity > 0 ? (histTotalLiabAndEq / historical.equity).toFixed(2) : 'N/A') : '-', projectedValues: projections.map(p => p.tolTnwRatio), isCurrency: false },
      { label: "DSCR (Debt Service Coverage Ratio)", historicalValue: "-", projectedValues: projections.map(p => p.dscr), isCurrency: false },
    ]
  };

  return [
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
