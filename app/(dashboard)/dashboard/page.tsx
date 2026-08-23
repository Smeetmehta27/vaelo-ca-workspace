import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-medium text-gray-900 mb-4">Welcome, {user?.email}</h2>
      <p className="text-gray-600">
        This is your CA workspace overview. Select <strong>Clients</strong> from the navigation to manage your clients.
      </p>
    </div>
  )
}
