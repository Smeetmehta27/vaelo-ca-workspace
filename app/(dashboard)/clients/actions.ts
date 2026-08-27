'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createClientAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const company_name = formData.get('company_name') as string
  const entity_type = formData.get('entity_type') as string

  if (!company_name) {
    throw new Error('Company Name is required')
  }

  const { error } = await supabase
    .from('clients')
    .insert({
      ca_id: user.id,
      company_name,
      entity_type: entity_type || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating client:', error)
    throw new Error('Failed to create client')
  }

  revalidatePath('/clients')
  redirect('/clients')
}
