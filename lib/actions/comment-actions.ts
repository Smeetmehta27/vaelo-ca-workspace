'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addReportComment(
  reportId: string, 
  figureReference: string | null, 
  commentText: string,
  figureFormula?: string | null,
  figureInputs?: Record<string, any> | null
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('report_comments')
    .insert({
      report_id: reportId,
      author_id: user.id,
      figure_reference: figureReference,
      comment_text: commentText,
      figure_formula: figureFormula || null,
      figure_inputs: figureInputs || null
    })

  if (error) throw new Error('Failed to add comment: ' + error.message)

  revalidatePath(`/reports/${reportId}`) // Assuming this is the report view path
}
