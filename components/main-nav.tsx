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
    </nav>
  )
}
