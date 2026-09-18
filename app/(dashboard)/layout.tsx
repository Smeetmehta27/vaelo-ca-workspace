import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'
import { VaeloMark } from '@/components/ui/vaelo-mark'
import { MainNav } from '@/components/main-nav'
import { NotificationBell } from '@/components/notifications/bell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="bg-paper border-b border-stone-line px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <VaeloMark size={26} frame={true} variant="mono" />
          <MainNav />
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <span className="text-sm text-ink-soft">{user.email}</span>
          <form action={logout}>
            <button type="submit" className="text-sm font-medium text-ink-soft hover:text-ink transition-colors">Log out</button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
