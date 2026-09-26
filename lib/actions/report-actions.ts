'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateReportStatus(reportId: string, newStatus: string, comment?: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check current report status and author via RLS
  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('status, clients(ca_id, assigned_to)')
    .eq('id', reportId)
    .single()

  if (fetchError || !report) throw new Error('Failed to find report or unauthorized')

  const client = Array.isArray(report.clients) ? report.clients[0] : report.clients

  if (['approved', 'changes_requested', 'finalized'].includes(newStatus)) {
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('firm_id', client?.ca_id)
      .single()

    if (!teamMember || (teamMember.role !== 'owner' && teamMember.role !== 'partner')) {
      throw new Error('Unauthorized: Only owners and partners can review reports.')
    }
  }

  if (newStatus === 'changes_requested') {
    if (!comment || !comment.trim()) {
      throw new Error('A comment is required to request changes.')
    }
    
    const { error: commentError } = await supabase.from('report_comments').insert({
      report_id: reportId,
      author_id: user.id,
      figure_reference: null,
      comment_text: comment.trim()
    })
    
    if (commentError) throw new Error('Failed to add comment: ' + commentError.message)
  }

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
    } else if (client && client.ca_id) {
      // First submission - notify owners/partners
      const { data: reviewers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('firm_id', client.ca_id)
        .in('role', ['owner', 'partner'])

      if (reviewers && reviewers.length > 0) {
        const notifications = reviewers
          .filter(r => r.user_id !== user.id) // skip if preparer is also an owner/partner submitting
          .map(r => ({
            user_id: r.user_id,
            title: 'Report Submitted for Review',
            message: 'A new report has been submitted for your review.',
            link: `/reports/${reportId}`
          }))

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications)
        }
      }
    }
  }

  revalidatePath('/review')
  revalidatePath(`/reports/${reportId}`) // Assuming this path exists
  return { success: true, justFinalized: newStatus === 'finalized' }
}
