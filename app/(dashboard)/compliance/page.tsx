import { createClient } from '@/lib/supabase/server'
import { getTeamRoster } from '@/lib/actions/team-actions'
import { ComplianceCalendar } from './compliance-calendar'

export default async function CompliancePage() {
  const supabase = createClient()
  
  const [{ data: tasks }, { roster }] = await Promise.all([
    supabase
      .from('compliance_tasks')
      .select(`
        id, task_type, period_label, due_date, status, updated_at, owner_id,
        clients!inner (
          id, company_name, entity_type
        )
      `)
      .order('due_date', { ascending: true }),
    getTeamRoster()
  ])

  const rosterMap = new Map(roster.map(r => [r.id, r.name]))

  const formattedTasks = (tasks || []).map(task => {
    const client = Array.isArray(task.clients) ? task.clients[0] : task.clients
    
    const assignedToName = task.owner_id 
      ? (rosterMap.get(task.owner_id) || 'Unassigned') 
      : 'Unassigned'

    return {
      id: task.id,
      clientId: client?.id || '',
      clientName: client?.company_name || 'Unknown Client',
      entityType: client?.entity_type || '',
      taskType: task.task_type,
      periodLabel: task.period_label,
      dueDate: task.due_date,
      status: task.status,
      assignedTo: assignedToName,
      ownerId: task.owner_id
    }
  })

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-3xl font-serif font-medium text-ink">Compliance Calendar</h2>
          <p className="text-ink-soft mt-1">Firm-wide view of compliance tasks and deadlines.</p>
        </div>
      </div>
      
      <ComplianceCalendar initialTasks={formattedTasks} roster={roster} />
    </div>
  )
}
