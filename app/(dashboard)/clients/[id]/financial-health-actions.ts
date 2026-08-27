'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { 
  HealthSnapshotRequest, 
  calculateHealthSnapshot 
} from '@/lib/pipelines/financial-health'
import { parseNumStrict } from '@/lib/pipelines/utils'

export async function createFinancialHealthReportAction(clientId: string, formData: FormData) {
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

  // Parse historical revenue array dynamically
  const historicalRevenueStr = formData.get('historicalRevenue') as string;
  const historicalRevenue = historicalRevenueStr 
    ? historicalRevenueStr.split(',').map(s => parseNumStrict(s.trim())).filter(n => !isNaN(n))
    : [];

  // Parse Request
  const request: HealthSnapshotRequest = {
    meta: {
      clientName: formData.get('clientName') as string,
      caFirmName: formData.get('caFirmName') as string,
      sector: formData.get('sector') as string,
      reportDate: new Date().toISOString()
    },
    liquidity: {
      currentAssets: parseVal(formData.get('currentAssets')),
      currentLiabilities: parseVal(formData.get('currentLiabilities')),
    },
    expenseGrowth: {
      revenuePriorYear: parseVal(formData.get('revenuePriorYear')),
      revenueCurrentYear: parseVal(formData.get('revenueCurrentYear')),
      operatingExpensesPriorYear: parseVal(formData.get('operatingExpensesPriorYear')),
      operatingExpensesCurrentYear: parseVal(formData.get('operatingExpensesCurrentYear')),
    },
    cashRunway: {
      cashAndEquivalents: parseVal(formData.get('cashAndEquivalents')),
      monthlyNetCashFlow: parseVal(formData.get('monthlyNetCashFlow')),
    },
    revenueVolatility: {
      historicalRevenue: historicalRevenue
    }
  }

  try {
    // Generate the deterministic health snapshot
    const { validateHealthInputs } = await import('@/lib/pipelines/financial-health-validation');
    const validation = validateHealthInputs(request);
    if (!validation.valid) {
      throw new Error('Validation failed: ' + validation.errors.join(' '));
    }

    const result = calculateHealthSnapshot(request)

    // Save report to database
    const { error } = await supabase
      .from('reports')
      .insert({
        client_id: clientId,
        report_type: 'financial_health',
        status: 'draft',
        output_data: result
      })

    if (error) {
      console.error('Failed to save Financial Health report:', error)
      throw new Error('Failed to generate report.')
    }
  } catch (e: unknown) {
    console.error('Error calculating health snapshot:', e);
    // You could theoretically return an error state here, but for simplicity we will throw or redirect.
  }

  revalidatePath(`/clients/${clientId}`)
  redirect(`/clients/${clientId}?tab=health`)
}
