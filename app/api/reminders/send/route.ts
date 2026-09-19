import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isDomainVerified, resend } from '@/lib/resend-client'

export async function POST(request: Request) {
  const supabase = createClient()
  
  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { reminderId, toEmail, draftText } = body

  if (!reminderId || !toEmail || !draftText) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // FR-COM-3: Domain verification guard
  const verified = await isDomainVerified('mail.vaelo.co.in')
  if (!verified) {
    return NextResponse.json({ 
      error: 'Email sending disabled until domain is verified',
      details: 'Please verify mail.vaelo.co.in in the Resend dashboard.'
    }, { status: 403 })
  }

  // Verify the user is authorized to send this reminder (via RLS)
  const { data: reminder, error: reminderError } = await supabase
    .from('reminder_queue')
    .select('id, client_id, status')
    .eq('id', reminderId)
    .single()

  if (reminderError || !reminder) {
    return NextResponse.json({ error: 'Reminder not found or unauthorized' }, { status: 404 })
  }

  if (reminder.status === 'sent') {
    return NextResponse.json({ error: 'Reminder already sent' }, { status: 400 })
  }

  // Send the email via Resend
  try {
    const { data, error } = await resend.emails.send({
      from: 'Vaelo <reminders@mail.vaelo.co.in>',
      to: [toEmail],
      subject: 'Important Reminder',
      text: draftText,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 })
    }

    // Update the reminder status
    const { error: updateError } = await supabase
      .from('reminder_queue')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', reminderId)

    if (updateError) {
      console.error('Failed to update reminder status:', updateError)
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: err }, { status: 500 })
  }
}
