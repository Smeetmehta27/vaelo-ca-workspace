import { createClient } from '@/lib/supabase/server'
import { getTeamRoster } from '@/lib/actions/team-actions'
import { NoticesDashboard } from './notices-dashboard'

export default async function NoticesPage() {
  const supabase = createClient()
  
  const [{ data: notices }, { roster }, { data: clientsData }] = await Promise.all([
    supabase
      .from('notices')
      .select(`
        id, portal_source, notice_type, date_received, response_due_date, status, created_at,
        clients!inner (
          id, company_name
        ),
        notice_tasks (
          id, status, owner_id
        )
      `)
      .order('response_due_date', { ascending: true }),
    getTeamRoster(),
    supabase.from('clients').select('id, company_name').order('company_name', { ascending: true })
  ])

  const rosterMap = new Map(roster.map(r => [r.id, r.name]))

  const formattedNotices = (notices || []).map(notice => {
    const client = Array.isArray(notice.clients) ? notice.clients[0] : notice.clients
    const task = Array.isArray(notice.notice_tasks) ? notice.notice_tasks[0] : notice.notice_tasks
    
    const assignedToName = task?.owner_id 
      ? (rosterMap.get(task.owner_id) || 'Unassigned') 
      : 'Unassigned'

    return {
      id: notice.id,
      clientId: client?.id || '',
      clientName: client?.company_name || 'Unknown Client',
      portalSource: notice.portal_source,
      noticeType: notice.notice_type,
      dateReceived: notice.date_received,
      responseDueDate: notice.response_due_date,
      noticeStatus: notice.status,
      taskId: task?.id || null,
      taskStatus: task?.status || 'pending',
      assignedTo: assignedToName,
      ownerId: task?.owner_id || null
    }
  })

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-3xl font-serif font-medium text-ink">Notices Dashboard</h2>
          <p className="text-ink-soft mt-1">Firm-wide view of government notices and pending responses.</p>
        </div>
      </div>
      
      <NoticesDashboard 
        initialNotices={formattedNotices} 
        roster={roster} 
        clients={clientsData || []} 
      />
    </div>
  )
}
