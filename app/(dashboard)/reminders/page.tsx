import { createClient } from '@/lib/supabase/server'
import { ReminderList } from './reminder-list'

export const dynamic = 'force-dynamic';

export default async function RemindersPage() {
  const supabase = createClient()
  
  const { data: reminders, error } = await supabase
    .from('reminder_queue')
    .select(`
      id,
      item_type,
      reference_id,
      status,
      created_at,
      clients (
        id,
        company_name
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    
  console.log('Reminders fetched:', reminders, 'Error:', error);

  if (!reminders || reminders.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-ink mb-6">Pending Reminders</h1>
        <div className="bg-paper-dim rounded-card border border-stone-line p-8 text-center text-ink-soft">
          No pending reminders to send.
        </div>
      </div>
    )
  }

  // Fetch contextual details for the items
  const documentIds = reminders.filter((r: any) => r.item_type === 'document').map((r: any) => r.reference_id)
  const taskIds = reminders.filter((r: any) => r.item_type === 'compliance').map((r: any) => r.reference_id)
  const noticeIds = reminders.filter((r: any) => r.item_type === 'notice').map((r: any) => r.reference_id)

  const [docsReq, tasksReq, noticesReq] = await Promise.all([
    documentIds.length > 0 ? supabase.from('document_request_items').select('id, name, due_date').in('id', documentIds) : Promise.resolve({ data: [] }),
    taskIds.length > 0 ? supabase.from('compliance_tasks').select('id, task_type, period_label, due_date').in('id', taskIds) : Promise.resolve({ data: [] }),
    noticeIds.length > 0 ? supabase.from('notices').select('id, notice_type, response_due_date').in('id', noticeIds) : Promise.resolve({ data: [] })
  ])

  const docsMap = new Map((docsReq.data || []).map((d: any) => [d.id, d]))
  const tasksMap = new Map((tasksReq.data || []).map((t: any) => [t.id, t]))
  const noticesMap = new Map((noticesReq.data || []).map((n: any) => [n.id, n]))

  // Enrich reminders
  const enrichedReminders = reminders.map((r: any) => {
    let details = {}
    if (r.item_type === 'document') details = docsMap.get(r.reference_id) || {}
    if (r.item_type === 'compliance') details = tasksMap.get(r.reference_id) || {}
    if (r.item_type === 'notice') details = noticesMap.get(r.reference_id) || {}
    
    return {
      ...r,
      clientName: r.clients?.company_name || 'Unknown Client',
      details
    }
  })

  // Group by clientName
  const grouped = enrichedReminders.reduce((acc: any, curr: any) => {
    if (!acc[curr.clientName]) acc[curr.clientName] = []
    acc[curr.clientName].push(curr)
    return acc
  }, {})

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-ink mb-6">Pending Reminders</h1>
      <p className="text-sm text-ink-soft mb-8">
        Review eligible items and dispatch reminders manually. No bulk actions are permitted.
      </p>
      <ReminderList groupedReminders={grouped} />
    </div>
  )
}
