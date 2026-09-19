'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function MainNav() {
  const pathname = usePathname()
  
  return (
    <nav className="flex gap-4">
      <Link 
        href="/dashboard" 
        className={`text-sm font-medium transition-colors ${
          pathname === '/dashboard' 
            ? 'text-bronze' 
            : 'text-ink-soft hover:text-ink'
        }`}
      >
        Overview
      </Link>
      <Link 
        href="/clients" 
        className={`text-sm font-medium transition-colors ${
          pathname?.startsWith('/clients') 
            ? 'text-bronze' 
            : 'text-ink-soft hover:text-ink'
        }`}
      >
        Clients
      </Link>
      <Link 
        href="/documents" 
        className={`text-sm font-medium transition-colors ${
          pathname?.startsWith('/documents') 
            ? 'text-bronze' 
            : 'text-ink-soft hover:text-ink'
        }`}
      >
        Documents
      </Link>
      <Link 
        href="/compliance" 
        className={`text-sm font-medium transition-colors ${
          pathname?.startsWith('/compliance') 
            ? 'text-bronze' 
            : 'text-ink-soft hover:text-ink'
        }`}
      >
        Compliance
      </Link>
      <Link 
        href="/notices" 
        className={`text-sm font-medium transition-colors ${
          pathname?.startsWith('/notices') 
            ? 'text-bronze' 
            : 'text-ink-soft hover:text-ink'
        }`}
      >
        Notices
      </Link>
      <Link 
        href="/invoices" 
        className={`text-sm font-medium transition-colors ${
          pathname?.startsWith('/invoices') 
            ? 'text-bronze' 
            : 'text-ink-soft hover:text-ink'
        }`}
      >
        Invoices
      </Link>
      <Link 
        href="/reminders" 
        className={`text-sm font-medium transition-colors ${
          pathname?.startsWith('/reminders') 
            ? 'text-bronze' 
            : 'text-ink-soft hover:text-ink'
        }`}
      >
        Reminders
      </Link>
      <Link 
        href="/review" 
        className={`text-sm font-medium transition-colors ${
          pathname?.startsWith('/review') 
            ? 'text-bronze' 
            : 'text-ink-soft hover:text-ink'
        }`}
      >
        Review Queue
      </Link>
      <Link 
        href="/team" 
        className={`text-sm font-medium transition-colors ${
          pathname?.startsWith('/team') 
            ? 'text-bronze' 
            : 'text-ink-soft hover:text-ink'
        }`}
      >
        Team
      </Link>
    </nav>
  )
}
