'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UploadItemFormProps {
  token: string;
  itemId: string;
}

export function UploadItemForm({ token, itemId }: UploadItemFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('token', token)
      formData.append('itemId', itemId)
      formData.append('file', file)

      const res = await fetch('/api/document-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setFile(null)
      // Refresh the page data so the item status updates to 'received'
      router.refresh()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleUpload} className="mt-3 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={loading}
          className="text-sm text-ink-soft file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-stone-line file:text-sm file:font-medium file:bg-paper-dim file:text-ink-soft hover:file:text-ink hover:file:border-stone transition-colors"
        />
        <button
          type="submit"
          disabled={!file || loading}
          className="px-4 py-2 text-sm font-medium text-paper bg-bronze rounded-xl hover:bg-bronze-deep disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {error && <p className="text-sm text-ink flex items-center gap-1.5 mt-1"><span className="font-mono font-medium">[!]</span> {error}</p>}
    </form>
  )
}
