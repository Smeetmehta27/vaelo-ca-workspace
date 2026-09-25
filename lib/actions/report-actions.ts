'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateReportStatus(reportId: string, newStatus: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check current report status and author via RLS
  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('status, clients(assigned_to)')
    .eq('id', reportId)
    .single()

  if (fetchError || !report) throw new Error('Failed to find report or unauthorized')

  if (newStatus === 'finalized') {
    // Enforcement: report must have been approved at least once
    const { data: history, error: historyError } = await supabase
      .from('report_status_history')
      .select('status')
      .eq('report_id', reportId)
      .eq('status', 'approved')
      .limit(1)

    if (historyError) throw new Error('Failed to check report status history')
    if (!history || history.length === 0) {
      throw new Error('Report cannot be finalized without being approved first.')
    }
  }

  // Update status (the trigger handles history insertion)
  const { error: updateError } = await supabase
    .from('reports')
    .update({ status: newStatus })
    .eq('id', reportId)

  if (updateError) throw new Error('Failed to update report status: ' + updateError.message)

  // Timeline Event (FR-COM-1)
  if (newStatus === 'finalized') {
    const { data: reportData } = await supabase.from('reports').select('client_id').eq('id', reportId).single()
    if (reportData?.client_id) {
      await supabase.from('client_timeline_events').insert({
        client_id: reportData.client_id,
        event_type: 'report_finalized',
        summary: 'Report finalized',
        ref_table: 'reports',
        ref_id: reportId,
        visible_to_client: true
      })
    }
  }

  // Automatic Notification
  if (newStatus === 'changes_requested') {
    // Notify the preparer (the assigned_to user of the client)
    // Wait, clients is a single object here? Let's cast it safely
    const client = Array.isArray(report.clients) ? report.clients[0] : report.clients
    if (client && client.assigned_to) {
      // Find the user_id for this team member so we can notify them
      const { data: preparer } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('id', client.assigned_to)
        .single()
        
      if (preparer && preparer.user_id) {
        await supabase.from('notifications').insert({
          user_id: preparer.user_id,
          title: 'Changes Requested',
          message: 'Changes have been requested on a report you prepared.',
          link: `/reports/${reportId}` // assuming there is a route for this
        })
      }
    }
  } else if (newStatus === 'submitted_for_review') {
    // Notify reviewer (we can notify all owner/partners, or the person who last requested changes)
    // Let's notify the last person who requested changes, if any.
    const { data: lastChangeRequester } = await supabase
      .from('report_status_history')
      .select('changed_by')
      .eq('report_id', reportId)
      .eq('status', 'changes_requested')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (lastChangeRequester && lastChangeRequester.changed_by) {
      await supabase.from('notifications').insert({
        user_id: lastChangeRequester.changed_by,
        title: 'Report Re-submitted',
        message: 'A report has been re-submitted for your review.',
        link: `/reports/${reportId}`
      })
    } else {
      // If no one requested changes before, it's the first time. We could notify owners, but we can't easily fetch owners here cleanly without another query.
      // We will skip broad notifications for now and just rely on the review queue.
    }
  }

  revalidatePath('/review')
  revalidatePath(`/reports/${reportId}`) // Assuming this path exists
  return { success: true, justFinalized: newStatus === 'finalized' }
}
