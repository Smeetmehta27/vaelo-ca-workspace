import { createClient } from '@/lib/supabase/server'
import { getTeamRoster } from '@/lib/actions/team-actions'
import { DocumentsTable } from './documents-table'

export default async function DocumentsPage() {
  const supabase = createClient()
  
  const [{ data: items }, { roster }] = await Promise.all([
    supabase
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
      .in('status', ['requested', 'rejected', 'received']),
    getTeamRoster()
  ])

  const rosterMap = new Map(roster.map(r => [r.id, r.name]))

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const getStaleness = (updatedAtStr: string) => {
    if (!updatedAtStr) return 0
    const dateOnly = updatedAtStr.substring(0, 10)
    const updatedDate = new Date(`${dateOnly}T00:00:00Z`)
    const todayDate = new Date(`${todayStr}T00:00:00Z`)
    const diffTime = Math.abs(todayDate.getTime() - updatedDate.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const formattedItems = (items || []).map(item => {
    const list = Array.isArray(item.document_request_lists) 
      ? item.document_request_lists[0] 
      : item.document_request_lists
    
    const client = list?.clients ? (Array.isArray(list.clients) ? list.clients[0] : list.clients) : null
    
    const assignedToName = client?.assigned_to 
      ? (rosterMap.get(client.assigned_to) || 'Unassigned') 
      : 'Unassigned'

    return {
      id: item.id,
      clientName: client?.company_name || 'Unknown Client',
      itemName: item.name,
      status: item.status,
      dueDate: item.due_date,
      staleness: getStaleness(item.updated_at),
      assignedTo: assignedToName
    }
  })

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-3xl font-serif font-medium text-ink">Firm Documents</h2>
          <p className="text-ink-soft mt-1">Overview of all active document requests across the firm.</p>
        </div>
      </div>
      
      <DocumentsTable initialItems={formattedItems} />
    </div>
  )
}
