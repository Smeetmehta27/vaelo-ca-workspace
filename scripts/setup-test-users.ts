import { createServiceRoleClient } from '../lib/supabase/service-role'
import { generateCMAReport, CMAHistoricalInput, CMAAssumptions } from '../lib/pipelines/cma'

async function setupTestUsers() {
  const supabase = createServiceRoleClient()

  // 1. Create Staff User
  const { data: staffAuth, error: staffErr } = await supabase.auth.admin.createUser({
    email: 'staff@vaelo.local',
    password: 'Password123!',
    email_confirm: true
  })
  if (staffErr && !staffErr.message.includes('already exists')) {
    throw staffErr
  }

  // 2. Create Owner User
  const { data: ownerAuth, error: ownerErr } = await supabase.auth.admin.createUser({
    email: 'owner@vaelo.local',
    password: 'Password123!',
    email_confirm: true
  })
  if (ownerErr && !ownerErr.message.includes('already exists')) {
    throw ownerErr
  }

  // Fetch users to get IDs (in case they already existed)
  const staffUser = (await supabase.auth.admin.getUserById(staffAuth?.user?.id || '')).data.user || 
                    (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'staff@vaelo.local')
  const ownerUser = (await supabase.auth.admin.getUserById(ownerAuth?.user?.id || '')).data.user || 
                    (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'owner@vaelo.local')

  if (!staffUser || !ownerUser) throw new Error('Failed to fetch test users')

  // Get firm ID (just grab the first one from an existing client)
  const { data: existingClient } = await supabase.from('clients').select('ca_id').limit(1).single()
  const firmId = existingClient?.ca_id

  if (!firmId) throw new Error('No firm found')

  // 3. Upsert team_members
  const { data: staffMember } = await supabase.from('team_members').upsert({
    firm_id: firmId,
    user_id: staffUser.id,
    role: 'staff'
  }, { onConflict: 'firm_id,user_id' }).select().single()

  const { data: ownerMember } = await supabase.from('team_members').upsert({
    firm_id: firmId,
    user_id: ownerUser.id,
    role: 'owner'
  }, { onConflict: 'firm_id,user_id' }).select().single()

  if (!staffMember) throw new Error('Failed to create staff member')

  // 4. Assign client to Staff
  // We'll use the existing test client or create a new one
  const { data: client } = await supabase.from('clients').upsert({
    id: '0af50e20-0c6c-4630-b3e3-d18fbd2e6c78',
    ca_id: firmId,
    company_name: 'Test Client Pvt Ltd',
    entity_type: 'Private Limited Company',
    assigned_to: staffMember.id
  }).select().single()

  // Create a SECOND client assigned to the owner (to ensure staff can't see it)
  const { data: client2 } = await supabase.from('clients').upsert({
    id: '1bf50e20-0c6c-4630-b3e3-d18fbd2e6c79',
    ca_id: firmId,
    company_name: 'Other Client LLC',
    entity_type: 'Private Limited Company',
    assigned_to: ownerMember?.id
  }).select().single()

  // 5. Generate Reports for both
  const historical: CMAHistoricalInput = {
    revenue: 1000000, cogs: 600000, operatingExpenses: 200000, stock: 100000,
    debtors: 150000, cash: 50000, otherCurrentAssets: 20000, fixedAssets: 300000,
    otherNonCurrentAssets: 10000, creditors: 80000, otherCurrentLiabilities: 30000,
    termLoans: 100000, shortTermBorrowings: 50000, otherNonCurrentLiabilities: 10000,
    equity: 360000
  }
  const assumptions: CMAAssumptions = {
    revenueGrowthRate: 10, cogsMargin: 60, operatingExpensesMargin: 20, stockDays: 30,
    debtorDays: 45, creditorDays: 30, interestRate: 10, principalRepayment: 20000,
    drawingPowerStockMargin: 25, drawingPowerDebtorMargin: 40, ocaMargin: 2, oclMargin: 3,
    capExMargin: 5, depreciationRate: 10, taxRate: 25, shortTermInterestRate: 9,
    sanctionedLimit: 100000, minimumCashBalance: 20000
  }
  const projections = generateCMAReport(historical, assumptions, 2)

  // Report 1 (Staff's client)
  const { data: report1 } = await supabase.from('reports').insert({
    client_id: client?.id,
    report_type: 'cma',
    status: 'draft',
    output_data: { projections }
  }).select().single()

  // Report 2 (Owner's client)
  const { data: report2 } = await supabase.from('reports').insert({
    client_id: client2?.id,
    report_type: 'cma',
    status: 'submitted_for_review', // already submitted
    output_data: { projections }
  }).select().single()

  console.log('Setup complete!')
  console.log('Staff Report ID:', report1?.id)
  console.log('Owner Report ID:', report2?.id)
}

setupTestUsers().catch(console.error)
