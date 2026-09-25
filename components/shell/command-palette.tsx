'use client'

import React, { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { getClientList } from '@/lib/actions/client-actions'
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
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/compliance', label: 'Compliance', icon: CalendarClock },
  { href: '/notices', label: 'Notices', icon: MailWarning },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/reminders', label: 'Reminders', icon: BellRing },
  { href: '/review', label: 'Review Queue', icon: ListChecks },
  { href: '/team', label: 'Team', icon: UsersRound },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([])
  const router = useRouter()

  useEffect(() => {
    // Fetch clients on mount
    getClientList().then(setClients)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    const handleCustomEvent = () => {
      setOpen(true)
    }

    document.addEventListener('keydown', down)
    window.addEventListener('open-command-palette', handleCustomEvent)
    
    return () => {
      document.removeEventListener('keydown', down)
      window.removeEventListener('open-command-palette', handleCustomEvent)
    }
  }, [])

  if (!open) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-[rgba(20,23,28,0.35)] backdrop-blur-sm"
      onClick={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          setOpen(false)
        }
      }}
    >
      <div 
        className="w-full max-w-[480px] bg-paper border border-stone-line rounded-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command Palette" className="flex flex-col w-full h-full">
          <Command.Input 
            autoFocus 
            placeholder="Search or run a command..." 
            className="w-full px-4 py-4 bg-transparent text-ink placeholder:text-ink-soft border-b border-stone-line outline-none text-[15px]"
          />
          
          <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-stone-line scrollbar-track-transparent">
            <Command.Empty className="py-6 text-center text-sm text-ink-soft">
              No results found.
            </Command.Empty>
            
            <Command.Group heading="Go to" className="text-ink-soft [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide">
              {routes.map((route) => (
                <Command.Item
                  key={route.href}
                  onSelect={() => {
                    router.push(route.href)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm text-ink aria-selected:bg-bronze-tint aria-selected:text-bronze"
                >
                  <route.icon size={16} className="text-current" />
                  {route.label}
                </Command.Item>
              ))}
            </Command.Group>

            {clients.length > 0 && (
              <Command.Group heading="Clients" className="mt-2 text-ink-soft [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide">
                {clients.map((client) => (
                  <Command.Item
                    key={client.id}
                    onSelect={() => {
                      router.push(`/clients/${client.id}`)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm text-ink aria-selected:bg-bronze-tint aria-selected:text-bronze"
                  >
                    {client.company_name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
