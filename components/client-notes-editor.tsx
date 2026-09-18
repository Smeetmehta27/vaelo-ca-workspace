'use client'

import { useState } from 'react'
import { upsertClientNotes } from '@/lib/actions/client-notes-actions'
import { formatDate } from '@/lib/utils'

interface ClientNotesEditorProps {
  clientId: string
  initialContent: string
  updatedAt: string | null
  updatedByName: string | null
}

export function ClientNotesEditor({ clientId, initialContent, updatedAt, updatedByName }: ClientNotesEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      await upsertClientNotes(clientId, content)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (e) {
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-paper-dim rounded-card border border-stone-line p-6 max-w-4xl mx-auto mt-8">
      <div className="mb-4 flex justify-between items-end">
        <div>
          <h3 className="text-xl font-serif font-medium text-ink">Key Facts & Standing Instructions</h3>
          <p className="text-sm text-ink-soft mt-1">
            {updatedAt ? (
              <>Last updated by {updatedByName || 'Unknown'} on {formatDate(updatedAt)}</>
            ) : (
              'No notes added yet. These notes are purely internal.'
            )}
          </p>
        </div>
      </div>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter internal client notes, important facts, or standing instructions here..."
        className="w-full h-64 p-4 mb-4 border border-stone-line rounded-card bg-paper focus:ring-1 focus:ring-ink focus:outline-none font-sans text-ink resize-y"
      />
      
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-ink text-paper rounded-full hover:bg-stone-800 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Notes'}
        </button>
        {saveStatus === 'success' && <span className="text-green-600 text-sm font-medium">Saved successfully!</span>}
        {saveStatus === 'error' && <span className="text-red-600 text-sm font-medium">Failed to save.</span>}
      </div>
    </div>
  )
}
