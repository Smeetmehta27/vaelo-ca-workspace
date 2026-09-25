'use client'

import React from 'react'

export function StatusBar({ email }: { email: string | undefined }) {
  return (
    <div className="sticky bottom-0 z-10 flex h-[26px] items-center justify-between border-t border-stone-line bg-paper-dim px-4 font-mono text-[11px] text-ink-soft">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-ink" />
        <span>All caught up</span>
      </div>
      <div>
        {email}
      </div>
    </div>
  )
}
