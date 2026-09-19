import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const sql = fs.readFileSync('./supabase/migrations/20260917036000_add_notice_management.sql', 'utf8')
  
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql })
  if (error) {
    console.error('Migration failed:', error)
  } else {
    console.log('Migration successful!')
  }
}

run().catch(console.error)
