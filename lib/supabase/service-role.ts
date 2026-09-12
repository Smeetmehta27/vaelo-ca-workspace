import { createClient } from '@supabase/supabase-js'

// IMPORTANT: This file MUST NEVER be imported into a Client Component.
// It uses the SUPABASE_SERVICE_ROLE_KEY which grants full bypass of Row Level Security (RLS).
// It should only be used in secure server contexts (e.g., Server Actions, Route Handlers).

export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables for service role are not set.')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
