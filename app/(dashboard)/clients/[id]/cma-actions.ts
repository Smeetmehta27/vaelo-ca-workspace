'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateCMAReport, CMAHistoricalInput, CMAAssumptions, CMAScenario, CMAStressOverride } from '@/lib/pipelines/cma'
import { validateCMAInputs } from '@/lib/pipelines/cma-validation'
import { evaluateCovenants } from '@/lib/pipelines/cma-covenants'
import { calculateRiskScore, calculateScenarioDeltas, identifyWorstCase } from '@/lib/pipelines/cma-analytics'
import { parseNumStrict } from '@/lib/pipelines/utils'

export type CMAFormState = {
  success: boolean;
  errors?: string[];
  warnings?: string[];
};

export async function createCMAReportAction(clientId: string, prevState: unknown, formData: FormData): Promise<CMAFormState> {
  if (!clientId) {
    return { success: false, errors: ['Client ID is missing.'] };
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Pre-flight authorization check
  const { data: client, error: authError } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .single()

  if (authError || !client) {
    return { success: false, errors: ['Unauthorized or client not found.'] };
  }

  // Parse Historical Inputs strictly (do not fall back to 0 if NaN)
  const parseNum = (val: FormDataEntryValue | null) => parseNumStrict(val);

  const historical: CMAHistoricalInput = {
    revenue: parseNum(formData.get('historical_revenue')),
    cogs: parseNum(formData.get('historical_cogs')),
    operatingExpenses: parseNum(formData.get('historical_opEx')),
    stock: parseNum(formData.get('historical_stock')),
    debtors: parseNum(formData.get('historical_debtors')),
    cash: parseNum(formData.get('historical_cash')),
    otherCurrentAssets: parseNum(formData.get('historical_oca')),
    fixedAssets: parseNum(formData.get('historical_fixedAssets')),
    otherNonCurrentAssets: parseNum(formData.get('historical_otherNonCurrentAssets')),
    creditors: parseNum(formData.get('historical_creditors')),
    otherCurrentLiabilities: parseNum(formData.get('historical_ocl')),
    termLoans: parseNum(formData.get('historical_termLoans')),
    otherNonCurrentLiabilities: parseNum(formData.get('historical_otherNonCurrentLiabilities')),
    equity: parseNum(formData.get('historical_equity')),
    interestPaid: parseNum(formData.get('historical_interestPaid')),
    principalRepayment: parseNum(formData.get('historical_principalRepayment')),
    shortTermBorrowings: parseNum(formData.get('historical_shortTermBorrowings')),
  }

  // Parse Projection Assumptions strictly
  const assumptions: CMAAssumptions = {
    revenueGrowthRate: parseNum(formData.get('assump_revenueGrowth')),
    cogsMargin: parseNum(formData.get('assump_cogsMargin')),
    operatingExpensesMargin: parseNum(formData.get('assump_opExMargin')),
    stockDays: parseNum(formData.get('assump_stockDays')),
    debtorDays: parseNum(formData.get('assump_debtorDays')),
    creditorDays: parseNum(formData.get('assump_creditorDays')),
    interestRate: parseNum(formData.get('assump_interestRate')),
    principalRepayment: parseNum(formData.get('assump_principalRepayment')),
    drawingPowerStockMargin: parseNum(formData.get('assump_dpStockMargin')),
    drawingPowerDebtorMargin: parseNum(formData.get('assump_dpDebtorMargin')),
    ocaMargin: parseNum(formData.get('assump_ocaMargin')),
    oclMargin: parseNum(formData.get('assump_oclMargin')),
    capExMargin: parseNum(formData.get('assump_capExMargin')),
    depreciationRate: parseNum(formData.get('assump_depreciationRate')),
    taxRate: parseNum(formData.get('assump_taxRate')),
    shortTermInterestRate: parseNum(formData.get('assump_shortTermInterestRate')),
    sanctionedLimit: parseNum(formData.get('assump_sanctionedLimit')),
    minimumCashBalance: parseNum(formData.get('assump_minimumCashBalance')),
  }

  const yearsToProject = parseNum(formData.get('yearsToProject'));

  if (Number.isNaN(yearsToProject) || yearsToProject < 1 || yearsToProject > 5) {
    return { success: false, errors: ['Years to project must be between 1 and 5.'] };
  }

  // VALIDATION PHASE
  const validation = validateCMAInputs(historical, assumptions);
  
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  // 1. Save historical data to client_financials
  await supabase
    .from('client_financials')
    .upsert({
      client_id: clientId,
      financial_year: 'Latest Historical',
      raw_data: historical
    }, { onConflict: 'client_id,financial_year' })

  // 2. Scenario Orchestrator
  // By default we generate Base, Downside, and Stress
  
  // Try to read overrides from formData if they exist, otherwise default to minimal stress
  const parseOverride = (key: string) => {
    const val = parseNum(formData.get(key));
    return Number.isNaN(val) ? undefined : val;
  };

  const downsideOverrides: CMAStressOverride = {
    revenueGrowthRate: parseOverride('scenario_downside_revenueGrowth') ?? (assumptions.revenueGrowthRate - 5),
    cogsMargin: parseOverride('scenario_downside_cogsMargin') ?? (assumptions.cogsMargin + 2),
    debtorDays: parseOverride('scenario_downside_debtorDays') ?? (assumptions.debtorDays + 15)
  };

  const stressOverrides: CMAStressOverride = {
    revenueGrowthRate: parseOverride('scenario_stress_revenueGrowth') ?? (assumptions.revenueGrowthRate - 10),
    cogsMargin: parseOverride('scenario_stress_cogsMargin') ?? (assumptions.cogsMargin + 5),
    debtorDays: parseOverride('scenario_stress_debtorDays') ?? (assumptions.debtorDays + 30)
  };

  const scenarios: CMAScenario[] = [
    {
      scenarioId: 'downside',
      name: 'Downside Case',
      description: 'Margin compression and slower revenue growth.',
      overrides: downsideOverrides
    },
    {
      scenarioId: 'severe',
      name: 'Severe Stress',
      description: 'Significant margin compression and severe revenue slowdown.',
      overrides: stressOverrides
    }
  ];

  const baseCaseProjections = generateCMAReport(historical, assumptions, yearsToProject);
  const baseCaseCovenants = evaluateCovenants(baseCaseProjections, assumptions.sanctionedLimit);
  const baseCaseFinalYear = baseCaseProjections[baseCaseProjections.length - 1];
  const baseCaseFinalCovenants = baseCaseCovenants[baseCaseCovenants.length - 1];
  const baseRiskScore = calculateRiskScore(baseCaseFinalYear, baseCaseFinalCovenants, assumptions.sanctionedLimit);

  // Generate projections for each scenario
  for (const scenario of scenarios) {
    const mergedAssumptions: CMAAssumptions = { ...assumptions, ...scenario.overrides };
    
    // 2a. Validate Scenario
    const scenarioValidation = validateCMAInputs(historical, mergedAssumptions);
    if (!scenarioValidation.valid) {
      scenario.status = "FAILED";
      scenario.error = scenarioValidation.errors.join(' ');
      continue;
    }
    
    // 2b. Generate Scenario
    try {
      scenario.projections = generateCMAReport(historical, mergedAssumptions, yearsToProject);
      scenario.warnings = scenarioValidation.warnings;
      scenario.status = "VALID";
      scenario.covenants = evaluateCovenants(scenario.projections, mergedAssumptions.sanctionedLimit);
      
      const scenarioFinalYear = scenario.projections[scenario.projections.length - 1];
      const scenarioFinalCovenants = scenario.covenants[scenario.covenants.length - 1];
      scenario.riskScore = calculateRiskScore(scenarioFinalYear, scenarioFinalCovenants, mergedAssumptions.sanctionedLimit);
      scenario.deltas = calculateScenarioDeltas(baseCaseFinalYear, scenarioFinalYear, baseCaseFinalCovenants, scenarioFinalCovenants, baseRiskScore, scenario.riskScore);

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      scenario.status = "FAILED";
      scenario.error = errorMessage;
      continue;
    }
  }

  // 2c. Worst Case Analysis
  const validScenarios = scenarios.filter(s => s.status === 'VALID' && s.projections && s.riskScore);
  const worstCaseScenariosData = validScenarios.map(s => {
    const finalYear = s.projections![s.projections!.length - 1];
    
    const years = s.projections!.map((yr, idx) => {
      const yearCovenants = s.covenants![idx];
      const scenarioAssumptions = { ...assumptions, ...s.overrides };
      const yearRisk = calculateRiskScore(yr, yearCovenants, scenarioAssumptions.sanctionedLimit);
      return { year: yr.year, risk: yearRisk.totalScore };
    });

    return {
      id: s.scenarioId,
      risk: s.riskScore!.totalScore,
      pat: finalYear.netProfit.value,
      cr: finalYear.currentRatio.value,
      cc: finalYear.shortTermBorrowings.value,
      years
    };
  });
  
  const worstCaseSummary = identifyWorstCase(worstCaseScenariosData);

  // 3. Save report to database (V2 Format)
  const { error } = await supabase
    .from('reports')
    .insert({
      client_id: clientId,
      report_type: 'cma',
      status: 'draft',
      output_data: { 
        historical, 
        baseCase: {
          assumptions,
          projections: baseCaseProjections,
          covenants: baseCaseCovenants,
          riskScore: baseRiskScore
        },
        scenarios,
        worstCaseSummary,
        warnings: validation.warnings 
      }
    })

  if (error) {
    console.error('Failed to save CMA report:', error)
    return { success: false, errors: ['Failed to generate report in the database.'] };
  }

  revalidatePath(`/clients/${clientId}`)
  redirect(`/clients/${clientId}`)
}
