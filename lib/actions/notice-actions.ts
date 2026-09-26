'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNotice(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const client_id = formData.get('client_id') as string
  const portal_source = formData.get('portal_source') as string
  const notice_type = formData.get('notice_type') as string
  const date_received = formData.get('date_received') as string
  const response_due_date = formData.get('response_due_date') as string

  if (!client_id || !portal_source || !notice_type || !date_received || !response_due_date) {
    return { error: 'Missing required fields' }
  }

  // Get the client's assigned_to to use as the default task owner
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('assigned_to')
    .eq('id', client_id)
    .single()

  if (clientError || !client) {
    return { error: 'Failed to fetch client assignment' }
  }

  // We use the RPC create_notice_with_task to ensure transactionality
  const { data, error } = await supabase.rpc('create_notice_with_task', {
    p_client_id: client_id,
    p_portal_source: portal_source,
    p_notice_type: notice_type,
    p_date_received: date_received,
    p_response_due_date: response_due_date,
    p_created_by: user.id,
    p_owner_id: client.assigned_to
  })

  if (error) {
    console.error('Error creating notice:', error)
    return { error: error.message }
  }

  // Timeline Event (FR-COM-1)
  // Visible to client is false by default because notices are sensitive
  await supabase.from('client_timeline_events').insert({
    client_id: client_id,
    event_type: 'notice_logged',
    summary: `Logged ${notice_type} notice from ${portal_source}`,
    ref_table: 'notices',
    ref_id: typeof data === 'string' ? data : undefined,
    visible_to_client: false
  })

  revalidatePath('/notices')
  return { success: true }
}

export async function updateNoticeTaskStatus(taskId: string, newStatus: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('notice_tasks')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Update failed — you may not have permission to modify this task' }
  }

  revalidatePath('/notices')
  return { success: true }
}

export async function getOrPinNoticeTemplate(noticeId: string, noticeType: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: notice, error: noticeError } = await supabase
    .from('notices')
    .select('response_template_version_id')
    .eq('id', noticeId)
    .single()

  if (noticeError || !notice) return { error: 'Notice not found or unauthorized' }

  if (notice.response_template_version_id) {
    const { data: template } = await supabase
      .from('notice_response_templates')
      .select('template_text')
      .eq('id', notice.response_template_version_id)
      .single()
    return { templateText: template?.template_text || null }
  }

  const { data: latestTemplate, error: latestError } = await supabase
    .from('notice_response_templates')
    .select('id, template_text')
    .eq('notice_type', noticeType)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (latestError || !latestTemplate) {
    return { templateText: null }
  }

  const { error: updateError } = await supabase
    .from('notices')
    .update({ response_template_version_id: latestTemplate.id })
    .eq('id', noticeId)

  if (updateError) {
    return { error: 'Failed to pin template version' }
  }

  return { templateText: latestTemplate.template_text }
}
