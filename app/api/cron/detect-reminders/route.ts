import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const today = new Date().toISOString().split('T')[0]
  
  const in3Days = new Date()
  in3Days.setDate(in3Days.getDate() + 3)
  const in3DaysStr = in3Days.toISOString().split('T')[0]

  const remindersToInsert: any[] = []

  // 1. Documents
  const { data: documents } = await supabase
    .from('document_request_items')
    .select('id, due_date, status, document_request_lists!inner(client_id)')
    .in('status', ['requested', 'rejected'])
    .lt('due_date', today)

  if (documents) {
    for (const doc of documents) {
      remindersToInsert.push({
        client_id: (doc.document_request_lists as any).client_id,
        item_type: 'document',
        reference_id: doc.id,
        status: 'pending'
      })
    }
  }

  // 2. Compliance Tasks
  const { data: tasks } = await supabase
    .from('compliance_tasks')
    .select('id, client_id')
    .neq('status', 'done')
    .lte('due_date', in3DaysStr)

  if (tasks) {
    for (const t of tasks) {
      remindersToInsert.push({
        client_id: t.client_id,
        item_type: 'compliance',
        reference_id: t.id,
        status: 'pending'
      })
    }
  }

  // 3. Notices
  const { data: notices } = await supabase
    .from('notices')
    .select('id, client_id')
    .neq('status', 'resolved')
    .lt('response_due_date', today)

  if (notices) {
    for (const n of notices) {
      remindersToInsert.push({
        client_id: n.client_id,
        item_type: 'notice',
        reference_id: n.id,
        status: 'pending'
      })
    }
  }

  let insertedCount = 0
  if (remindersToInsert.length > 0) {
    // Filter out items already in the queue
    const { data: existing } = await supabase
      .from('reminder_queue')
      .select('item_type, reference_id')
      .in('status', ['pending', 'sent'])
      
    const existingSet = new Set((existing || []).map(r => `${r.item_type}:${r.reference_id}`))
    const newReminders = remindersToInsert.filter(r => !existingSet.has(`${r.item_type}:${r.reference_id}`))

    if (newReminders.length > 0) {
      const { data, error } = await supabase
        .from('reminder_queue')
        .insert(newReminders)
        .select('id')

      if (error) {
          console.error('Error inserting reminders:', error)
          return NextResponse.json({ error: error })
      } else if (data) {
        insertedCount = data.length
      }
    }
  }

  return NextResponse.json({
    success: true,
    processed: remindersToInsert.length,
    inserted: insertedCount
  })
}
