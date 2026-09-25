'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { VaeloMark } from '@/components/ui/vaelo-mark'
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarClock,
  MailWarning,
  Receipt,
  BellRing,
  ListChecks,
  UsersRound,
} from 'lucide-react'

const routes = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users, isPrefix: true },
  { href: '/documents', label: 'Documents', icon: FileText, isPrefix: true },
  { href: '/compliance', label: 'Compliance', icon: CalendarClock, isPrefix: true },
  { href: '/notices', label: 'Notices', icon: MailWarning, isPrefix: true },
  { href: '/invoices', label: 'Invoices', icon: Receipt, isPrefix: true },
  { href: '/reminders', label: 'Reminders', icon: BellRing, isPrefix: true },
  { href: '/review', label: 'Review Queue', icon: ListChecks, isPrefix: true },
  { href: '/team', label: 'Team', icon: UsersRound, isPrefix: true },
]

export function IconRail() {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[60px] bg-paper-dim border-r border-stone-line flex flex-col items-center py-4 z-20">
      <Link href="/dashboard" className="mb-6">
        <VaeloMark size={24} frame={true} variant="mono" showWordmark={false} />
      </Link>
      <div className="flex flex-col gap-2 w-full">
        {routes.map((route) => {
          const isActive = route.isPrefix 
            ? pathname?.startsWith(route.href) 
            : pathname === route.href
          
          return (
            <Link 
              key={route.href} 
              href={route.href} 
              title={route.label}
              className="relative flex justify-center w-full py-2 group"
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-bronze rounded-none" />
              )}
              <route.icon 
                size={20} 
                className={`transition-colors ${isActive ? 'text-bronze' : 'text-ink-soft group-hover:text-ink'}`}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
