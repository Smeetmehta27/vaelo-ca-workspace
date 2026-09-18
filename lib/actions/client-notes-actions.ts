'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertClientNotes(clientId: string, content: string) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Unauthorized')
    }

    // Get team member ID
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !member) {
      console.error('Team member error:', memberError)
      throw new Error('Team member not found')
    }

    const { error } = await supabase
      .from('client_notes')
      .upsert({
        client_id: clientId,
        content,
        updated_by: member.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'client_id' })

    if (error) {
      console.error('Failed to upsert client notes:', error)
      throw new Error('Failed to save notes')
    }

    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  } catch (e) {
    console.error('upsertClientNotes caught error:', e)
    throw e
  }
}
