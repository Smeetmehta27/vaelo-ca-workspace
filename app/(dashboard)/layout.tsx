import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'
import { NotificationBell } from '@/components/notifications/bell'
import { IconRail } from '@/components/shell/icon-rail'
import { SearchButton } from '@/components/shell/search-button'
import { StatusBar } from '@/components/shell/status-bar'
import { CommandPalette } from '@/components/shell/command-palette'

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
    <div className="flex min-h-screen bg-paper">
      <IconRail />
      
      <div className="flex-1 flex flex-col pl-[60px]">
        <header className="flex items-center justify-between h-[52px] px-6 bg-paper border-b border-stone-line sticky top-0 z-10">
          <SearchButton />
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm text-ink-soft">{user.email}</span>
            <form action={logout}>
              <button type="submit" className="text-sm font-medium text-ink-soft hover:text-ink transition-colors">
                Log out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>

        <StatusBar email={user.email} />
        <CommandPalette />
      </div>
    </div>
  )
}
