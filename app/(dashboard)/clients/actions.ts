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

  const { data: teamMember, error: tmError } = await supabase
    .from('team_members')
    .select('id, firm_id, role')
    .eq('user_id', user.id)
    .single()

  if (tmError || !teamMember) {
    throw new Error('User is not associated with a firm')
  }

  if (teamMember.role === 'staff') {
    throw new Error('Staff members cannot create new clients')
  }

  const gstin = formData.get('gstin') as string
  const pan = formData.get('pan') as string
  const filing_frequency = formData.get('filing_frequency') as string
  const registration_date = formData.get('registration_date') as string
  const primary_contact_name = formData.get('primary_contact_name') as string
  const primary_contact_phone = formData.get('primary_contact_phone') as string
  const primary_contact_email = formData.get('primary_contact_email') as string

  const assigned_to_input = formData.get('assigned_to') as string
  const assigned_to = assigned_to_input || teamMember.id

  const { error } = await supabase
    .from('clients')
    .insert({
      ca_id: teamMember.firm_id,
      assigned_to: assigned_to,
      company_name,
      entity_type: entity_type || null,
      gstin: gstin || null,
      pan: pan || null,
      filing_frequency: filing_frequency || null,
      registration_date: registration_date || null,
      primary_contact_name: primary_contact_name || null,
      primary_contact_phone: primary_contact_phone || null,
      primary_contact_email: primary_contact_email || null
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

export async function reassignClientAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const client_id = formData.get('client_id') as string
  const assigned_to = formData.get('assigned_to') as string

  if (!client_id || !assigned_to) throw new Error('Missing fields')

  const { error } = await supabase
    .from('clients')
    .update({ assigned_to })
    .eq('id', client_id)

  if (error) {
    console.error('Error reassigning client:', error)
    throw new Error('Failed to reassign client')
  }

  revalidatePath(`/clients/${client_id}`)
  revalidatePath(`/clients/${client_id}/documents`)
  revalidatePath(`/clients/${client_id}/timeline`)
}
