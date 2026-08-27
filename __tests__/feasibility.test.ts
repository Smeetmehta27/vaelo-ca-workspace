import { expect, test, describe } from 'vitest';
import { 
  DealFeasibilityRequest, 
  calculateDealFeasibility 
} from '../lib/pipelines/feasibility';

describe('Feasibility Pipeline - Stress Test', () => {
  test('Confirming the flags actually fire correctly under distressed inputs', () => {
    const stressDeal: DealFeasibilityRequest = {
      meta: {
        acquirerName: "Acquirer Pvt Ltd",
        targetName: "Overpriced Target Pvt Ltd",
        caFirmName: "Example & Associates",
        dealRationale: "stress test — high premium, high leverage, low synergy",
        sector: "Manufacturing",
        reportDate: "2024-01-01"
      },
      acquirer: {
        name: "Acquirer Pvt Ltd", 
        revenue: 45.0, 
        ebitda: 7.5, 
        netIncome: 4.2,
        sharesOutstanding: 5_000_000, 
        netDebt: 6.0,
      },
      target: {
        name: "Overpriced Target Pvt Ltd", 
        revenue: 15.0, 
        ebitda: 2.4, 
        netIncome: 1.3,
        sharesOutstanding: 1_000_000, 
        netDebt: 2.0,
        fallbackEvEbitdaMultiple: 6.5,
      },
      dealTerms: {
        dealType: "acquisition",
        purchasePrice: 30.0,   // well above standalone -> high premium
        cashComponentPct: 0.9,
        stockComponentPct: 0.1,
        acquirerSharePrice: 850,
      },
      financing: {
        newDebtRaised: 24.0,   // heavy new debt -> pushes leverage up, but should stay under 4.0x
        costOfNewDebt: 0.13,
        acquirerCashUsed: 3.0,
        taxRate: 0.25,
      },
      synergies: {
        annualCostSynergies: 0.2,
        annualRevenueSynergies: 0.3,
        synergyEbitdaMargin: 0.10,
        rampUpYears: 3,
        synergyDiscountRate: 0.14,
      }
    };

    const stressResult = calculateDealFeasibility(stressDeal);

    expect(stressResult.premium.premiumPct.value).toBeGreaterThan(50);
    expect(stressResult.leverage.leverageFlagged).toBe(false);
    expect(stressResult.accretionDilution.changePreSynergyPct.value).toBeLessThan(-10);
    expect(stressResult.verdict.reasons.length).toBeGreaterThanOrEqual(2);
    expect(stressResult.verdict.verdict).toBe("NOT RECOMMENDED AS STRUCTURED — multiple flags raised");
  });

  test('VULN-002: Infinity prevention in edge cases (0 EBITDA, 100% Tax, 0 Discount)', () => {
    const edgeDeal: DealFeasibilityRequest = {
      meta: { acquirerName: "A", targetName: "B", caFirmName: "C", dealRationale: "", sector: "", reportDate: "" },
      acquirer: { name: "A", revenue: 10, ebitda: 0, netIncome: 0, sharesOutstanding: 0, netDebt: 5 },
      target: { name: "B", revenue: 10, ebitda: 0, netIncome: 0, sharesOutstanding: 0, netDebt: 5, fallbackEvEbitdaMultiple: 6.5 },
      dealTerms: { dealType: "acquisition", purchasePrice: 30, cashComponentPct: 1, stockComponentPct: 0, acquirerSharePrice: 0 },
      financing: { newDebtRaised: 30, costOfNewDebt: 0.1, acquirerCashUsed: 0, taxRate: 1.0 }, // 100% tax
      synergies: { annualCostSynergies: 5, annualRevenueSynergies: 5, synergyEbitdaMargin: 0.1, rampUpYears: 3, synergyDiscountRate: 0 } // 0 discount rate
    };

    const edgeResult = calculateDealFeasibility(edgeDeal);
    
    // Leverage should be null instead of Infinity
    expect(edgeResult.leverage.leverageRatio).toBeNull();
    
    // Accretion/Dilution EPS should not be Infinity/NaN
    expect(edgeResult.accretionDilution.acquirerStandaloneEps.value).not.toBe(Infinity);
    expect(edgeResult.accretionDilution.acquirerStandaloneEps.value).toBe(0);

    // Synergy NPV should not be Infinity
    expect(edgeResult.synergy.pvTerminalPerpetuity.value).not.toBe(Infinity);
    
    // Breakeven should not divide by 0
    expect(edgeResult.breakeven.breakevenPretaxSynergyRequired.value).not.toBe(Infinity);
  });
});

