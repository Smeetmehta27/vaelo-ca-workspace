'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTimelineNote(clientId: string, summary: string, visibleToClient: boolean) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (!clientId || !summary.trim()) {
    return { error: 'Missing required fields' }
  }

  const { error } = await supabase
    .from('client_timeline_events')
    .insert({
      client_id: clientId,
      event_type: 'note',
      summary: summary.trim(),
      visible_to_client: visibleToClient,
      // ref_table and ref_id remain null because the note is entirely contained in the summary
    })

  if (error) {
    console.error('Error creating timeline note:', error)
    return { error: error.message }
  }

  revalidatePath(`/clients/${clientId}/timeline`)
  return { success: true }
}
