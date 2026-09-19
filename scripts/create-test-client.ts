import { createServiceRoleClient } from '../lib/supabase/service-role'

async function run() {
  const supabase = createServiceRoleClient()

  // Find a team member to assign this to
  const { data: teamMembers, error: teamError } = await supabase
    .from('team_members')
    .select('id, firm_id')
    .limit(1)

  if (teamError) {
    console.error('Error fetching team members:', teamError)
    process.exit(1)
  }

  if (!teamMembers || teamMembers.length === 0) {
    console.error('No team members found in the database. Please create a user/firm first.')
    process.exit(1)
  }

  const tm = teamMembers[0]

  const { data: client, error: insertError } = await supabase
    .from('clients')
    .insert({
      ca_id: tm.firm_id,
      assigned_to: tm.id,
      company_name: 'Test Client Pvt Ltd',
      entity_type: 'Private Limited Company',
      gstin: '22AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      filing_frequency: 'QRMP',
      registration_date: '2024-01-01',
      primary_contact_name: 'Test Contact',
      primary_contact_phone: '+91 9999999999',
      primary_contact_email: 'test@example.com'
    })
    .select()
    .single()

  if (insertError) {
    console.error('Failed to create client:', insertError)
    process.exit(1)
  }

  console.log('Successfully created test client!')
  console.log('Client ID:', client.id)
  console.log(JSON.stringify(client, null, 2))
}

run()
