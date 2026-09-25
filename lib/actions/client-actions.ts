'use server'

import { createClient } from '@/lib/supabase/server'

export async function getClientList() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .select('id, company_name')
    .order('company_name')

  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }

  return data || []
}
