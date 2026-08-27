import { CMAProjectedYear } from './cma';

export type CMACovenantStatus = "PASS" | "WARNING" | "BREACH" | "NOT_APPLICABLE";

export type CMACovenantResult = {
  covenantId: string;
  name: string;
  status: CMACovenantStatus;
  year: number;
  actual: number;
  threshold?: number;
  message: string;
};

export function evaluateCovenants(projections: CMAProjectedYear[], sanctionedLimit: number): CMACovenantResult[][] {
  return projections.map(year => {
    const covenants: CMACovenantResult[] = [];

    // 1. DSCR
    const dscrValue = year.dscr.value;
    let dscrStatus: CMACovenantStatus = "PASS";
    let dscrMsg = "Healthy DSCR.";
    
    // Check if debt service is essentially 0 (cma.ts sets DSCR to 0 if totalDebtService is 0)
    // Actually, if debt service is 0, DSCR is 0. But if EBITDA is 0, DSCR is also 0.
    // If interest is 0 and termLoans is 0, they have no debt.
    const hasDebt = year.interest.value > 0 || year.termLoans.value > 0 || year.shortTermBorrowings.value > 0;
    
    if (!hasDebt) {
      dscrStatus = "NOT_APPLICABLE";
      dscrMsg = "No significant debt service obligations.";
    } else if (dscrValue < 1.0) {
      dscrStatus = "BREACH";
      dscrMsg = "DSCR is below 1.0, indicating inability to service debt from operating cash flow.";
    } else if (dscrValue < 1.25) {
      dscrStatus = "WARNING";
      dscrMsg = "DSCR is tight (between 1.0 and 1.25). Cash flow margin for debt service is thin.";
    }
    
    covenants.push({
      covenantId: "dscr",
      name: "DSCR",
      status: dscrStatus,
      year: year.year,
      actual: dscrValue,
      threshold: 1.0,
      message: dscrMsg
    });

    // 2. Interest Coverage Ratio
    const ebitValue = year.ebit.value;
    const interestValue = year.interest.value;
    const icrValue = interestValue === 0 ? 0 : ebitValue / interestValue;
    
    let icrStatus: CMACovenantStatus = "PASS";
    let icrMsg = "Healthy interest coverage.";
    if (interestValue === 0) {
      icrStatus = "NOT_APPLICABLE";
      icrMsg = "No interest expense.";
    } else if (icrValue < 1.5) {
      icrStatus = "BREACH";
      icrMsg = `EBIT is less than 1.5x interest expense. Coverage is ${icrValue.toFixed(2)}x.`;
    } else if (icrValue < 2.0) {
      icrStatus = "WARNING";
      icrMsg = `Interest coverage is tight at ${icrValue.toFixed(2)}x.`;
    }

    covenants.push({
      covenantId: "icr",
      name: "Interest Coverage",
      status: icrStatus,
      year: year.year,
      actual: icrValue,
      threshold: 1.5,
      message: icrMsg
    });

    // 3. Current Ratio
    const crValue = year.currentRatio.value;
    const tclValue = year.totalCurrentLiabilities.value;
    
    let crStatus: CMACovenantStatus = "PASS";
    let crMsg = "Healthy liquidity.";
    if (tclValue === 0) {
      crStatus = "NOT_APPLICABLE";
      crMsg = "No current liabilities. Liquidity is theoretically infinite.";
    } else if (tclValue < 0) {
      crStatus = "BREACH";
      crMsg = "Negative current liabilities. Mathematically invalid state.";
    } else if (crValue < 1.0) {
      crStatus = "BREACH";
      crMsg = "Current Liabilities exceed Current Assets, indicating severe short-term liquidity risk.";
    } else if (crValue < 1.33) {
      crStatus = "WARNING";
      crMsg = "Current Ratio is below standard 1.33 banking threshold.";
    }

    covenants.push({
      covenantId: "current_ratio",
      name: "Current Ratio",
      status: crStatus,
      year: year.year,
      actual: crValue,
      threshold: 1.33,
      message: crMsg
    });

    // 4. Total Debt / Equity
    const deValue = year.debtEquityRatio.value;
    const equityValue = year.equity.value;
    let deStatus: CMACovenantStatus = "PASS";
    let deMsg = "Acceptable leverage.";
    
    if (year.termLoans.value === 0 && year.shortTermBorrowings.value === 0) {
      deStatus = "NOT_APPLICABLE";
      deMsg = "No debt (long-term or short-term).";
    } else if (equityValue <= 0) {
      deStatus = "BREACH";
      deMsg = "Negative or zero equity. Technical insolvency.";
    } else if (deValue > 3.0) {
      deStatus = "BREACH";
      deMsg = `Highly leveraged capital structure (Total D/E > 3.0). Actual: ${deValue.toFixed(2)}.`;
    } else if (deValue > 2.0) {
      deStatus = "WARNING";
      deMsg = `Elevated leverage (Total D/E between 2.0 and 3.0). Actual: ${deValue.toFixed(2)}.`;
    }

    covenants.push({
      covenantId: "debt_equity",
      name: "Total Debt / Equity",
      status: deStatus,
      year: year.year,
      actual: deValue,
      threshold: 3.0,
      message: deMsg
    });

    // 5. TOL / TNW
    const tolTnwValue = year.tolTnwRatio.value;
    let tolTnwStatus: CMACovenantStatus = "PASS";
    let tolMsg = "Acceptable overall leverage.";
    
    if (equityValue <= 0) {
      tolTnwStatus = "BREACH";
      tolMsg = "Negative or zero Tangible Net Worth.";
    } else if (tolTnwValue > 4.0) {
      tolTnwStatus = "BREACH";
      tolMsg = `Total Outside Liabilities exceed 4x Tangible Net Worth. Actual: ${tolTnwValue.toFixed(2)}.`;
    } else if (tolTnwValue > 3.0) {
      tolTnwStatus = "WARNING";
      tolMsg = `Elevated overall leverage (TOL/TNW > 3.0). Actual: ${tolTnwValue.toFixed(2)}.`;
    }

    covenants.push({
      covenantId: "tol_tnw",
      name: "TOL / TNW",
      status: tolTnwStatus,
      year: year.year,
      actual: tolTnwValue,
      threshold: 4.0,
      message: tolMsg
    });

    // 6. Drawing Power Shortfall
    const ccUtilValue = year.shortTermBorrowings.value;
    const dpValue = year.drawingPower.value;
    let dpStatus: CMACovenantStatus = "PASS";
    let dpMsg = "Within Drawing Power limits.";
    if (ccUtilValue > dpValue) {
      dpStatus = "BREACH";
      dpMsg = "CC utilization exceeds computed Drawing Power. Requires immediate regularization.";
    } else if (ccUtilValue > dpValue * 0.95 && ccUtilValue > 0) {
      dpStatus = "WARNING";
      dpMsg = "CC utilization is >95% of Drawing Power. High risk of overdrawing.";
    }

    covenants.push({
      covenantId: "dp_shortfall",
      name: "Drawing Power Limit",
      status: dpStatus,
      year: year.year,
      actual: ccUtilValue,
      threshold: dpValue,
      message: dpMsg
    });

    // 7. CC Utilization Pressure
    let limitStatus: CMACovenantStatus = "PASS";
    let limitMsg = "Comfortable limit headroom.";
    if (sanctionedLimit <= 0) {
      if (ccUtilValue > 0) {
        limitStatus = "BREACH";
        limitMsg = "CC Utilization exists but Sanctioned Limit is zero.";
      } else {
        limitStatus = "NOT_APPLICABLE";
        limitMsg = "No Sanctioned Limit.";
      }
    } else if (ccUtilValue > sanctionedLimit) {
      limitStatus = "BREACH";
      limitMsg = "CC utilization exceeds Sanctioned Limit.";
    } else if (ccUtilValue > sanctionedLimit * 0.90) {
      limitStatus = "WARNING";
      limitMsg = "CC utilization is >90% of Sanctioned Limit.";
    }

    covenants.push({
      covenantId: "cc_limit",
      name: "Sanctioned Limit Utilization",
      status: limitStatus,
      year: year.year,
      actual: ccUtilValue,
      threshold: sanctionedLimit,
      message: limitMsg
    });

    // 8. MPBF Constraint
    const mpbfValue = year.mpbfMethod2.value;
    let mpbfStatus: CMACovenantStatus = "PASS";
    let mpbfMsg = "Within Maximum Permissible Bank Finance.";
    if (ccUtilValue > mpbfValue) {
      mpbfStatus = "BREACH";
      mpbfMsg = "CC utilization exceeds Maximum Permissible Bank Finance (Method 2).";
    } else if (ccUtilValue > mpbfValue * 0.95 && ccUtilValue > 0) {
      mpbfStatus = "WARNING";
      mpbfMsg = "CC utilization is very close to MPBF.";
    }

    covenants.push({
      covenantId: "mpbf_constraint",
      name: "MPBF Compliance",
      status: mpbfStatus,
      year: year.year,
      actual: ccUtilValue,
      threshold: mpbfValue,
      message: mpbfMsg
    });

    // 9. Minimum Cash / Unfunded Deficit
    const deficitValue = year.unfundedCashDeficit.value;
    let deficitStatus: CMACovenantStatus = "PASS";
    let deficitMsg = "Fully funded.";
    if (deficitValue > 0) {
      deficitStatus = "BREACH";
      deficitMsg = "Business requires cash but has exhausted all funding lines. Severe liquidity crisis.";
    }

    covenants.push({
      covenantId: "unfunded_deficit",
      name: "Unfunded Cash Deficit",
      status: deficitStatus,
      year: year.year,
      actual: deficitValue,
      threshold: 0,
      message: deficitMsg
    });

    return covenants;
  });
}
