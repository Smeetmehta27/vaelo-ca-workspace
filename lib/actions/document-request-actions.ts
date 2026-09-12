'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { DocumentRequestTemplate } from '@/lib/types'

export type ActionState = {
  success: boolean;
  errors?: string[];
  warnings?: string[];
};

export async function createDocumentRequestList(
  clientId: string,
  title: string,
  reportType: string | null,
  items: { name: string; required: boolean; dueDate: string | null }[],
  saveAsTemplateName?: string
): Promise<ActionState> {
  if (!clientId || !title) {
    return { success: false, errors: ['Client ID and Title are required.'] };
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Pre-flight authorization check
  const { data: client, error: authError } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .single()

  if (authError || !client) {
    return { success: false, errors: ['Unauthorized or client not found.'] };
  }

  // Insert list
  const { data: list, error: listError } = await supabase
    .from('document_request_lists')
    .insert({
      client_id: clientId,
      title: title,
      report_type: reportType || null,
    })
    .select('id')
    .single()

  if (listError || !list) {
    console.error('Failed to create document request list:', listError)
    return { success: false, errors: ['Failed to create document request list.'] };
  }

  // Insert items
  if (items && items.length > 0) {
    const itemsToInsert = items.map(item => ({
      list_id: list.id,
      name: item.name,
      required: item.required,
      due_date: item.dueDate || null,
      status: 'requested'
    }))

    const { error: itemsError } = await supabase
      .from('document_request_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Failed to create document request items:', itemsError)
      return { success: false, errors: ['Failed to create document request items.'] };
    }
  }

  // Insert timeline event
  const { error: timelineError } = await supabase
    .from('client_timeline_events')
    .insert({
      client_id: clientId,
      event_type: 'list_created',
      summary: `Document request list '${title}' created with ${items.length} item(s)`,
      ref_table: 'document_request_lists',
      ref_id: list.id
    })
  
  if (timelineError) {
    console.error('Failed to insert timeline event for list creation:', timelineError)
  }

  const warnings: string[] = [];

  if (saveAsTemplateName) {
    const templateItems = items.map(item => ({ name: item.name, required: item.required }));
    const templateResult = await createTemplateFromItems(saveAsTemplateName, reportType || 'custom', templateItems);
    if (!templateResult.success) {
      warnings.push('List created, but failed to save as template: ' + (templateResult.errors?.[0] || 'Unknown error'));
    }
  }

  revalidatePath(`/clients/${clientId}/documents`)
  return { success: true, warnings: warnings.length > 0 ? warnings : undefined };
}

export async function updateDocumentRequestItemStatus(
  itemId: string,
  newStatus: string
): Promise<ActionState> {
  if (!itemId || !newStatus) {
    return { success: false, errors: ['Item ID and new status are required.'] };
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the current item and check auth simultaneously using RLS
  const { data: currentItem, error: fetchError } = await supabase
    .from('document_request_items')
    .select('status, name, list_id, document_request_lists!inner(client_id)')
    .eq('id', itemId)
    .single()

  if (fetchError || !currentItem) {
    return { success: false, errors: ['Item not found or unauthorized.'] };
  }

  const oldStatus = currentItem.status;

  // Validate state transition
  // requested→received, received→approved, received→rejected, rejected→requested
  let isValidTransition = false;
  
  if (oldStatus === 'requested' && newStatus === 'received') isValidTransition = true;
  else if (oldStatus === 'received' && newStatus === 'approved') isValidTransition = true;
  else if (oldStatus === 'received' && newStatus === 'rejected') isValidTransition = true;
  else if (oldStatus === 'rejected' && newStatus === 'requested') isValidTransition = true;

  if (!isValidTransition) {
    return { success: false, errors: [`Invalid status transition from '${oldStatus}' to '${newStatus}'.`] };
  }

  const { error: updateError } = await supabase
    .from('document_request_items')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId)

  if (updateError) {
    console.error('Failed to update item status:', updateError)
    return { success: false, errors: ['Failed to update item status.'] };
  }

  const clientId = (currentItem.document_request_lists as unknown as { client_id: string }).client_id;

  if (newStatus === 'approved' || newStatus === 'rejected') {
    const { error: timelineError } = await supabase
      .from('client_timeline_events')
      .insert({
        client_id: clientId,
        event_type: `item_${newStatus}`,
        summary: `'${currentItem.name}' marked as ${newStatus}`,
        ref_table: 'document_request_items',
        ref_id: itemId
      })
    
    if (timelineError) {
      console.error('Failed to insert timeline event for item status update:', timelineError)
    }
  }

  if (clientId) {
    revalidatePath(`/clients/${clientId}/documents`)
  }

  return { success: true };
}

export async function getTemplatesForCA(): Promise<DocumentRequestTemplate[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // RLS will automatically restrict this to templates owned by this CA
  const { data: templates, error } = await supabase
    .from('document_request_templates')
    .select(`
      *,
      document_request_template_items(*)
    `)
    .order('created_at', { ascending: false })

  if (error || !templates) {
    console.error('Failed to fetch templates:', error)
    return []
  }

  // Sort items by sort_order
  const sortedTemplates = templates.map((t: DocumentRequestTemplate & { document_request_template_items?: { sort_order: number }[] }) => {
    if (t.document_request_template_items) {
      t.document_request_template_items.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    }
    return t as DocumentRequestTemplate;
  });

  return sortedTemplates;
}

export async function createTemplateFromItems(
  name: string,
  reportType: string,
  items: { name: string; required: boolean }[]
): Promise<ActionState> {
  if (!name || !reportType) {
    return { success: false, errors: ['Name and Report Type are required for a template.'] };
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, errors: ['Not authenticated.'] };
  }

  // The template is owned by the CA directly. 
  // We first fetch the CA profile id (which matches auth.uid()) to insert it explicitly.
  const caId = user.id;

  const { data: template, error: templateError } = await supabase
    .from('document_request_templates')
    .insert({
      ca_id: caId,
      name: name,
      report_type: reportType
    })
    .select('id')
    .single()

  if (templateError || !template) {
    console.error('Failed to create template:', templateError)
    return { success: false, errors: ['Failed to create document request template.'] };
  }

  if (items && items.length > 0) {
    const itemsToInsert = items.map((item, index) => ({
      template_id: template.id,
      name: item.name,
      required: item.required,
      sort_order: index
    }))

    const { error: itemsError } = await supabase
      .from('document_request_template_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Failed to create template items:', itemsError)
      return { success: false, errors: ['Failed to create template items.'] };
    }
  }

  return { success: true };
}

export async function toggleListTokenRevoked(
  listId: string,
  revoked: boolean
): Promise<ActionState> {
  if (!listId) {
    return { success: false, errors: ['List ID is required.'] };
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Pre-flight authorization check / getting client_id for revalidation
  const { data: list, error: authError } = await supabase
    .from('document_request_lists')
    .select('id, client_id')
    .eq('id', listId)
    .single()

  if (authError || !list) {
    return { success: false, errors: ['Unauthorized or list not found.'] };
  }

  const { error: updateError } = await supabase
    .from('document_request_lists')
    .update({ token_revoked: revoked })
    .eq('id', listId)

  if (updateError) {
    console.error('Failed to update token_revoked status:', updateError)
    return { success: false, errors: ['Failed to update link status.'] };
  }

  revalidatePath(`/clients/${list.client_id}/documents`)
  return { success: true };
}
