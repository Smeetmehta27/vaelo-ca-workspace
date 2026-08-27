'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { 
  DealFeasibilityRequest, 
  calculateDealFeasibility 
} from '@/lib/pipelines/feasibility'
import { parseNumStrict } from '@/lib/pipelines/utils'

export async function createFeasibilityReportAction(clientId: string, formData: FormData) {
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
    throw new Error('Unauthorized or client not found.')
  }

  const parseVal = (val: FormDataEntryValue | null) => parseNumStrict(val);
  const parsePct = (val: FormDataEntryValue | null) => {
    const v = parseNumStrict(val);
    return Number.isNaN(v) ? NaN : v / 100;
  };

  // Parse Request
  const request: DealFeasibilityRequest = {
    meta: {
      acquirerName: formData.get('acquirerName') as string,
      targetName: formData.get('targetName') as string,
      caFirmName: formData.get('caFirmName') as string,
      dealRationale: formData.get('dealRationale') as string,
      sector: formData.get('sector') as string,
      reportDate: new Date().toISOString()
    },
    acquirer: {
      name: formData.get('acquirerName') as string,
      revenue: parseVal(formData.get('acq_revenue')),
      ebitda: parseVal(formData.get('acq_ebitda')),
      netIncome: parseVal(formData.get('acq_netIncome')),
      sharesOutstanding: parseVal(formData.get('acq_shares')),
      netDebt: parseVal(formData.get('acq_netDebt')),
    },
    target: {
      name: formData.get('targetName') as string,
      revenue: parseVal(formData.get('tgt_revenue')),
      ebitda: parseVal(formData.get('tgt_ebitda')),
      netIncome: parseVal(formData.get('tgt_netIncome')),
      sharesOutstanding: parseVal(formData.get('tgt_shares')),
      netDebt: parseVal(formData.get('tgt_netDebt')),
      standaloneValue: formData.get('tgt_standaloneValue') ? parseVal(formData.get('tgt_standaloneValue')) : undefined,
      fallbackEvEbitdaMultiple: parseVal(formData.get('tgt_fallbackMultiple')),
    },
    dealTerms: {
      dealType: formData.get('dealType') as string || 'acquisition',
      purchasePrice: parseVal(formData.get('purchasePrice')),
      cashComponentPct: parsePct(formData.get('cashComponentPct')),
      stockComponentPct: parsePct(formData.get('stockComponentPct')),
      acquirerSharePrice: parseVal(formData.get('acquirerSharePrice')),
    },
    financing: {
      newDebtRaised: parseVal(formData.get('newDebtRaised')),
      costOfNewDebt: parsePct(formData.get('costOfNewDebt')),
      acquirerCashUsed: parseVal(formData.get('acquirerCashUsed')),
      taxRate: parsePct(formData.get('taxRate')),
    },
    synergies: {
      annualCostSynergies: parseVal(formData.get('annualCostSynergies')),
      annualRevenueSynergies: parseVal(formData.get('annualRevenueSynergies')),
      synergyEbitdaMargin: parsePct(formData.get('synergyEbitdaMargin')),
      rampUpYears: parseVal(formData.get('rampUpYears')),
      synergyDiscountRate: parsePct(formData.get('synergyDiscountRate')),
    }
  }

  // Generate the deterministic feasibility report
  const { validateFeasibilityInputs } = await import('@/lib/pipelines/feasibility-validation');
  const validation = validateFeasibilityInputs(request);
  if (!validation.valid) {
    throw new Error('Validation failed: ' + validation.errors.join(' '));
  }
  
  const result = calculateDealFeasibility(request)

  // Save report to database
  const { error } = await supabase
    .from('reports')
    .insert({
      client_id: clientId,
      report_type: 'feasibility',
      status: 'draft',
      output_data: result
    })

  if (error) {
    console.error('Failed to save Feasibility report:', error)
    throw new Error('Failed to generate report.')
  }

  revalidatePath(`/clients/${clientId}`)
  redirect(`/clients/${clientId}?tab=feasibility`)
}
