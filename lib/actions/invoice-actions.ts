'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInvoice(reportId: string, amount: number, dueDate: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get report to resolve client_id
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('client_id')
    .eq('id', reportId)
    .single()

  if (reportError || !report) {
    return { error: 'Failed to find report to link invoice' }
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      client_id: report.client_id,
      report_id: reportId,
      amount,
      due_date: dueDate,
      status: 'draft'
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating invoice:', error)
    return { error: error.message }
  }

  revalidatePath(`/clients/${report.client_id}`)
  revalidatePath('/invoices')
  return { success: true, invoiceId: invoice.id }
}

export async function updateInvoiceStatus(
  invoiceId: string, 
  status: string, 
  paidDate?: string, 
  paymentMethod?: string
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const updates: any = { status }
  
  if (status === 'paid') {
    if (!paidDate) return { error: 'Paid date is required when marking as paid' }
    updates.paid_date = paidDate
    if (paymentMethod) updates.payment_method = paymentMethod
  }

  const { error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId)

  if (error) {
    console.error('Error updating invoice:', error)
    return { error: error.message }
  }

  revalidatePath('/invoices')
  // We also want to revalidate the client page where the invoice prompt might be shown
  const { data: invoice } = await supabase.from('invoices').select('client_id').eq('id', invoiceId).single()
  if (invoice?.client_id) {
    revalidatePath(`/clients/${invoice.client_id}`)
  }

  return { success: true }
}
