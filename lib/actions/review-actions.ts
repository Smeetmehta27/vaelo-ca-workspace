'use server'

import { createClient } from '@/lib/supabase/server'
import { getTeamRoster } from '@/lib/actions/team-actions'

export async function getPendingReviews() {
  const supabase = createClient()
  
  const { actingRole, roster } = await getTeamRoster()
  const isManager = actingRole === 'owner' || actingRole === 'partner'
  
  // Base query for submitted reports
  const { data: reports, error } = await supabase
    .from('reports')
    .select(`
      id,
      report_type,
      status,
      created_at,
      client_id,
      clients!inner(company_name, assigned_to)
    `)
    .eq('status', 'submitted_for_review')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load review queue', error)
    return []
  }

  // Get current user's team member ID
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('user_id', user?.id)
    .single()

  const myId = myMember?.id

  // Filter based on role scoping
  const visibleReports = (reports || []).filter(r => {
    if (isManager) return true
    const client = Array.isArray(r.clients) ? r.clients[0] : r.clients
    return client?.assigned_to === myId
  })

  // Format reports
  const formattedReports = visibleReports.map(r => {
    const client = Array.isArray(r.clients) ? r.clients[0] : r.clients
    const preparer = roster.find(m => m.id === client?.assigned_to)
    
    return {
      id: r.id,
      clientId: r.client_id,
      clientName: client?.company_name || 'Unknown Client',
      reportType: r.report_type,
      preparerName: preparer?.name || 'Unassigned',
      submittedAt: r.created_at
    }
  })

  return formattedReports
}
