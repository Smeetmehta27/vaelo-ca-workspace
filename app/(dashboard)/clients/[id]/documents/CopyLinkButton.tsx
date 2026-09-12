'use client'

import { useState } from 'react'
import { toggleListTokenRevoked } from '@/lib/actions/document-request-actions'

export function CopyLinkButton({ 
  url, 
  listId, 
  isRevoked 
}: { 
  url: string, 
  listId: string, 
  isRevoked: boolean 
}) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleToggle = async () => {
    setLoading(true)
    await toggleListTokenRevoked(listId, !isRevoked)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 mt-2 sm:mt-0">
      {isRevoked && (
        <span className="text-[10px] font-mono tracking-wider text-ink-soft bg-paper-dim border border-stone-line px-2 py-0.5 rounded-full uppercase">
          Link Disabled
        </span>
      )}
      <button
        onClick={handleCopy}
        disabled={isRevoked}
        className="px-3 py-1.5 text-sm font-medium text-ink bg-paper border border-stone-line rounded-lg hover:border-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {copied ? 'Copied!' : 'Copy client link'}
      </button>
      <button
        onClick={handleToggle}
        disabled={loading}
        className="px-3 py-1.5 text-sm font-medium border border-stone-line bg-paper-dim text-ink rounded-lg transition-colors hover:border-ink disabled:opacity-50 shadow-sm"
      >
        {loading ? '...' : isRevoked ? 'Enable link' : 'Revoke link'}
      </button>
    </div>
  )
}
