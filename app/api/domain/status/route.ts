import { NextResponse } from 'next/server'
import { isDomainVerified } from '@/lib/resend-client'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  
  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const verified = await isDomainVerified('mail.vaelo.co.in')
  return NextResponse.json({ verified })
}
