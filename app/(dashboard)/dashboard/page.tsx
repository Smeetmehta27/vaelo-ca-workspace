import { createClient } from '@/lib/supabase/server'
import { getPendingReviews } from '@/lib/actions/review-actions'
import { getTeamRoster } from '@/lib/actions/team-actions'
import { DashboardView, DashboardItem } from './dashboard-view'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { actingRole, roster } = await getTeamRoster()
  const isManager = actingRole === 'owner' || actingRole === 'partner'

  // Fetch pending reviews
  const pendingReviews = await getPendingReviews()

  // 1. Fetch Document Requests
  const { data: docItems } = await supabase
    .from('document_request_items')
    .select(`
      id, name, due_date, status, updated_at,
      document_request_lists!inner (
        client_id,
        clients!inner (
          id, company_name, assigned_to
        )
      )
    `)
    .in('status', ['requested', 'rejected'])

  // 2. Fetch Compliance Tasks
  const { data: compItems } = await supabase
    .from('compliance_tasks')
    .select(`
      id, task_type, period_label, due_date, status, updated_at, owner_id,
      clients!inner (
        id, company_name
      )
    `)
    .in('status', ['pending', 'in_progress']) // ignore 'done' and 'overdue' handled dynamically? Wait, compliance tasks actually use 'overdue' as a status. Let's include 'overdue' too.
  
  const compQuery = await supabase
    .from('compliance_tasks')
    .select(`
      id, task_type, period_label, due_date, status, updated_at, owner_id,
      clients!inner (
        id, company_name
      )
    `)
    .in('status', ['pending', 'in_progress', 'overdue'])

  // 3. Fetch Notice Tasks
  const { data: noticeItems } = await supabase
    .from('notice_tasks')
    .select(`
      id, task_type, due_date, status, updated_at, owner_id,
      notices!inner (
        client_id,
        clients!inner (
          id, company_name
        )
      )
    `)
    .in('status', ['pending', 'in_progress', 'overdue'])

  const items: DashboardItem[] = []

  // Map Documents
  if (docItems) {
    for (const item of docItems) {
      const list = Array.isArray(item.document_request_lists) ? item.document_request_lists[0] : item.document_request_lists
      const client = list?.clients ? (Array.isArray(list.clients) ? list.clients[0] : list.clients) : null
      const owner = roster.find(r => r.id === client?.assigned_to)

      items.push({
        id: item.id,
        name: item.name,
        type: 'document_request',
        dueDate: item.due_date,
        status: item.status,
        updatedAt: item.updated_at,
        clientId: client?.id,
        companyName: client?.company_name || 'Unknown Client',
        ownerId: client?.assigned_to,
        ownerName: owner?.name || 'Unassigned'
      })
    }
  }

  // Map Compliance Tasks
  if (compQuery.data) {
    for (const item of compQuery.data) {
      const client = Array.isArray(item.clients) ? item.clients[0] : item.clients
      const owner = roster.find(r => r.id === item.owner_id)

      items.push({
        id: item.id,
        name: `${item.task_type} (${item.period_label})`,
        type: 'compliance_task',
        dueDate: item.due_date,
        status: item.status,
        updatedAt: item.updated_at,
        clientId: client?.id,
        companyName: client?.company_name || 'Unknown Client',
        ownerId: item.owner_id,
        ownerName: owner?.name || 'Unassigned'
      })
    }
  }

  // Map Notice Tasks
  if (noticeItems) {
    for (const item of noticeItems) {
      const notice = Array.isArray(item.notices) ? item.notices[0] : item.notices
      const client = notice?.clients ? (Array.isArray(notice.clients) ? notice.clients[0] : notice.clients) : null
      const owner = roster.find(r => r.id === item.owner_id)

      items.push({
        id: item.id,
        name: item.task_type || 'Notice Task',
        type: 'notice_task',
        dueDate: item.due_date,
        status: item.status,
        updatedAt: item.updated_at,
        clientId: client?.id,
        companyName: client?.company_name || 'Unknown Client',
        ownerId: item.owner_id,
        ownerName: owner?.name || 'Unassigned'
      })
    }
  }

  return (
    <DashboardView 
      items={items}
      pendingReviewCount={pendingReviews.length}
      userEmail={user?.email || 'User'}
      isManager={isManager}
    />
  )
}
