'use client'

import { useState } from 'react'
import { updateDocumentRequestItemStatus } from '@/lib/actions/document-request-actions'

import { DocumentRequestItem } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { DraftReminderModal } from '@/components/draft-reminder-modal'

export function ItemRow({ item, clientName }: { item: DocumentRequestItem; clientName?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReminderOpen, setIsReminderOpen] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    setError(null)
    const result = await updateDocumentRequestItemStatus(item.id, newStatus)
    
    if (!result.success) {
      setError(result.errors?.[0] || 'Failed to update status')
    }
    setLoading(false)
  }

  const renderStatus = () => {
    switch (item.status) {
      case 'received':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStatusChange('approved')}
              disabled={loading}
              className="px-2.5 py-1 text-xs font-medium text-ink bg-paper border border-stone-line rounded hover:border-ink disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <span className="font-mono">✓</span> Approve
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={loading}
              className="px-2.5 py-1 text-xs font-medium text-ink-soft bg-paper border border-stone-line rounded hover:text-ink hover:border-stone disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <span className="font-mono">✕</span> Reject
            </button>
          </div>
        )
      case 'rejected':
        return <span className="text-xs text-ink-soft font-medium flex items-center gap-1.5"><span className="font-mono">✕</span> Awaiting client re-upload</span>
      case 'approved':
        return <span className="text-[10px] px-2.5 py-1 rounded-full font-mono uppercase tracking-wider bg-paper-dim border border-stone-line text-ink flex items-center gap-1.5 w-fit"><span className="font-mono text-ink">✓</span> Approved</span>
      case 'requested':
      default:
        return <span className="text-xs text-ink-soft font-medium">Awaiting upload</span>
    }
  }

  return (
    <tr className={loading ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ink">
        {item.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">
        {item.required ? 'Yes' : 'No'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-ink-soft">
        <div className="flex items-center gap-2">
          {item.due_date ? formatDate(item.due_date) : '-'}
          {(() => {
            if (!item.due_date) return null
            if (item.status === 'received' || item.status === 'approved') return null
            const today = new Date()
            const todayDate = new Date(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T00:00:00Z`)
            const dueDate = new Date(`${item.due_date}T00:00:00Z`)
            if (todayDate > dueDate) {
              const diffTime = Math.abs(todayDate.getTime() - dueDate.getTime())
              const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              return (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-sans uppercase tracking-wider bg-red-100 text-red-700 font-bold">
                  {daysOverdue} {daysOverdue === 1 ? 'Day' : 'Days'} Overdue
                </span>
              )
            }
            return null
          })()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">
        <div className="flex flex-col gap-1">
          {renderStatus()}
          {error && <span className="text-[10px] mt-1 font-mono uppercase tracking-wide text-ink border border-ink bg-paper-dim px-2 py-0.5 rounded w-fit">! {error}</span>}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-ink-soft">
        <div className="flex items-center justify-between gap-4">
          <span>{formatDate(item.updated_at)}</span>
          {(() => {
            if (!item.due_date || !clientName) return null
            if (item.status === 'received' || item.status === 'approved') return null
            const today = new Date()
            const todayDate = new Date(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T00:00:00Z`)
            const dueDate = new Date(`${item.due_date}T00:00:00Z`)
            if (todayDate > dueDate) {
              const diffTime = Math.abs(todayDate.getTime() - dueDate.getTime())
              const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              return (
                <>
                  <button
                    onClick={() => setIsReminderOpen(true)}
                    className="px-2.5 py-1 text-xs font-medium text-ink bg-paper border border-stone-line rounded hover:border-ink transition-colors whitespace-nowrap shadow-sm"
                  >
                    Draft Reminder
                  </button>
                  <DraftReminderModal
                    isOpen={isReminderOpen}
                    onClose={() => setIsReminderOpen(false)}
                    clientName={clientName}
                    itemName={item.name}
                    dueDate={item.due_date}
                    daysOverdue={daysOverdue}
                  />
                </>
              )
            }
            return null
          })()}
        </div>
      </td>
    </tr>
  )
}
