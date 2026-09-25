'use client'

import React from 'react'
import { Search } from 'lucide-react'

export function SearchButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
      className="flex items-center gap-2 h-8 px-3 bg-paper-dim border border-stone-line rounded-[6px] text-sm text-ink-soft hover:bg-stone-line transition-colors"
    >
      <Search size={14} />
      <span>Search or run a command</span>
      <kbd className="ml-4 font-mono text-[10px] bg-paper border border-stone-line rounded-[4px] px-1.5 py-0.5">
        ⌘K
      </kbd>
    </button>
  )
}
