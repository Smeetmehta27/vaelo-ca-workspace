import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { generateTasksForClient } from '@/lib/compliance/generate-tasks'

export async function GET(request: Request) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  // 1. Fetch rules
  const { data: rules, error: rulesError } = await supabase
    .from('compliance_rules')
    .select('*')

  if (rulesError || !rules) {
    return NextResponse.json({ error: 'Failed to fetch rules', details: rulesError }, { status: 500 })
  }

  // 2. Fetch clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, entity_type, gstin, filing_frequency, assigned_to')

  if (clientsError || !clients) {
    return NextResponse.json({ error: 'Failed to fetch clients', details: clientsError }, { status: 500 })
  }

  // 3. Generate tasks per client
  const referenceDate = new Date()
  let tasksCreated = 0
  
  for (const client of clients) {
    const tasks = generateTasksForClient(client, rules, referenceDate)
    
    if (tasks.length > 0) {
        // Upsert tasks
        const { data: insertedTasks, error: upsertError } = await supabase
          .from('compliance_tasks')
          .upsert(
            tasks.map(t => ({
              ...t,
              updated_at: new Date().toISOString()
            })), 
            { 
              onConflict: 'client_id, task_type, period_label',
              ignoreDuplicates: true // DO NOTHING on conflict to preserve existing status
            }
          )
          .select('id')

        if (upsertError) {
          console.error(`Failed to upsert tasks for client ${client.id}:`, upsertError)
        } else if (insertedTasks) {
          tasksCreated += insertedTasks.length
        }
    }
  }

  return NextResponse.json({
    success: true,
    clientsProcessed: clients.length,
    tasksCreated
  })
}
