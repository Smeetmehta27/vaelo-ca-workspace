'use client'

import { useState } from 'react'
import { addTimelineNote } from '@/lib/actions/timeline-actions'

export function TimelineControls({ clientId, token }: { clientId: string, token: string }) {
  const [summary, setSummary] = useState('')
  const [visibleToClient, setVisibleToClient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : ''
    navigator.clipboard.writeText(`${origin}/timeline/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!summary.trim()) return
    
    setIsSubmitting(true)
    const result = await addTimelineNote(clientId, summary, visibleToClient)
    setIsSubmitting(false)

    if (result.success) {
      setSummary('')
      setVisibleToClient(false)
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="flex flex-col gap-6 mb-6">
      <div className="flex justify-between items-center bg-paper border border-stone-line rounded-lg p-4 shadow-sm">
        <div>
          <h4 className="text-sm font-medium text-ink">Client-Facing Timeline Link</h4>
          <p className="text-xs text-ink-soft mt-1">Share this link with the client to view their public timeline events.</p>
        </div>
        <button 
          onClick={handleCopyLink}
          className="px-4 py-2 text-sm font-medium bg-paper-dim border border-stone-line rounded-md hover:bg-stone-line/50 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-paper border border-stone-line rounded-lg p-4 shadow-sm flex flex-col gap-4">
        <h4 className="text-sm font-medium text-ink">Add a Timeline Note</h4>
        <textarea 
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Enter note details..."
          className="w-full text-sm rounded-md border-stone-line border p-3 focus:ring-1 focus:ring-bronze outline-none min-h-[80px]"
          required
        />
        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input 
              type="checkbox" 
              checked={visibleToClient}
              onChange={(e) => setVisibleToClient(e.target.checked)}
              className="rounded border-stone-line text-bronze focus:ring-bronze"
            />
            Visible to client
          </label>
          <button 
            type="submit" 
            disabled={isSubmitting || !summary.trim()}
            className="px-4 py-2 text-sm font-medium bg-bronze text-white rounded-md hover:bg-bronze-dark transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>
    </div>
  )
}
