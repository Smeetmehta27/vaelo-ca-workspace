'use client'

import { useState } from 'react'
import { createInvite } from '@/lib/actions/team-actions'

export function TeamInviteForm({ origin }: { origin: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInviteLink('')
    setCopied(false)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const role = formData.get('role') as 'partner' | 'staff'

    try {
      const token = await createInvite(email, role)
      setInviteLink(`${origin}/signup?invite=${token}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  return (
    <div className="bg-paper border border-stone-line rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-medium text-ink mb-4">Invite Team Member</h3>
      
      <form onSubmit={handleSubmit} className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-ink-soft mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-3 py-2 bg-paper-dim border border-stone-line rounded-lg text-ink focus:outline-none focus:border-bronze focus:ring-1 focus:ring-bronze"
            placeholder="colleague@firm.com"
          />
        </div>
        
        <div className="w-48">
          <label className="block text-xs font-mono uppercase tracking-wider text-ink-soft mb-1.5">
            Role
          </label>
          <select
            name="role"
            required
            className="w-full px-3 py-2 bg-paper-dim border border-stone-line rounded-lg text-ink focus:outline-none focus:border-bronze focus:ring-1 focus:ring-bronze"
          >
            <option value="staff">Staff</option>
            <option value="partner">Partner</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-ink text-paper rounded-lg font-medium hover:bg-ink-soft transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Create Invite'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 flex items-start gap-2 bg-paper-dim border border-ink text-ink rounded-xl text-sm">
          <span className="font-mono mt-0.5" aria-hidden="true">!</span>
          <p>{error}</p>
        </div>
      )}

      {inviteLink && (
        <div className="mt-6 pt-6 border-t border-stone-line">
          <p className="text-sm text-ink-soft mb-2">Share this unique signup link with the user:</p>
          <div className="flex gap-2 items-center">
            <input 
              type="text" 
              readOnly 
              value={inviteLink}
              className="flex-1 px-3 py-2 bg-paper-dim border border-stone-line rounded-lg text-ink font-mono text-sm"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-sm font-medium text-ink bg-paper border border-stone-line rounded-lg hover:border-ink transition-colors shadow-sm"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
