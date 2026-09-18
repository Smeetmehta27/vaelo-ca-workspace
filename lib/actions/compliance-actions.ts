'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateComplianceTaskStatus(taskId: string, newStatus: string) {
  const allowedStatuses = ['pending', 'in_progress', 'done', 'overdue']
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error('Invalid status')
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('compliance_tasks')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)

  if (error) {
    console.error('Failed to update task status:', error)
    throw new Error('Failed to update task status')
  }

  revalidatePath('/compliance')
}
