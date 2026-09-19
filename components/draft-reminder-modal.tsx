import { useState } from 'react'
import { formatDate } from '@/lib/utils'

interface DraftReminderModalProps {
  isOpen: boolean
  onClose: () => void
  clientName: string
  itemName: string
  dueDate: string
  daysOverdue: number
}

export function DraftReminderModal({
  isOpen,
  onClose,
  clientName,
  itemName,
  dueDate,
  daysOverdue
}: DraftReminderModalProps) {
  if (!isOpen) return null

  const draftText = `Hi ${clientName},

Just a quick reminder that we are still waiting on the following document:
- ${itemName}

This was due on ${formatDate(dueDate)} (${daysOverdue} days ago).
Please upload this at your earliest convenience so we can proceed.

Best regards,
[Your Name]`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Draft Reminder</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors p-1"
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-4">
            Copy the text below to send to your client via your preferred communication channel. 
            <strong> This system does not automatically send messages.</strong>
          </p>
          <div className="relative group">
            <textarea
              readOnly
              className="w-full h-48 p-4 text-sm font-mono bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent resize-none"
              value={draftText}
            />
            <button
              onClick={() => navigator.clipboard.writeText(draftText)}
              className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink transition-colors"
            >
              Copy Text
            </button>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
