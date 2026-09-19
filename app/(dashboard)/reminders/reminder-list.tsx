'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import { DraftSendModal } from '@/components/draft-send-modal'

export function ReminderList({ groupedReminders }: { groupedReminders: Record<string, any[]> }) {
  const [activeReminder, setActiveReminder] = useState<any | null>(null)

  return (
    <div className="space-y-8">
      {Object.entries(groupedReminders).map(([clientName, reminders]) => (
        <div key={clientName} className="bg-paper-dim rounded-card border border-stone-line overflow-hidden">
          <div className="px-6 py-4 bg-paper border-b border-stone-line font-medium text-ink">
            {clientName}
          </div>
          <div className="divide-y divide-stone-line">
            {reminders.map(reminder => {
              let title = ''
              let dueDate = ''
              if (reminder.item_type === 'document') {
                title = `Document: ${reminder.details.name}`
                dueDate = reminder.details.due_date
              } else if (reminder.item_type === 'compliance') {
                title = `Task: ${reminder.details.task_type} (${reminder.details.period_label})`
                dueDate = reminder.details.due_date
              } else if (reminder.item_type === 'notice') {
                title = `Notice: ${reminder.details.notice_type}`
                dueDate = reminder.details.response_due_date
              }

              const now = new Date()
              const todayDate = new Date(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T00:00:00Z`);
              const due = new Date(`${dueDate}T00:00:00Z`);
              
              const diffTime = Math.abs(todayDate.getTime() - due.getTime());
              const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isFuture = todayDate <= due;

              return (
                <div key={reminder.id} className="px-6 py-4 flex items-center justify-between hover:bg-paper transition-colors">
                  <div>
                    <div className="text-sm font-medium text-ink mb-1">{title}</div>
                    <div className="text-xs text-ink-soft flex items-center gap-2">
                      Due: {dueDate ? formatDate(dueDate) : 'N/A'}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans uppercase tracking-wider font-bold ${isFuture ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {isFuture ? `Due in ${daysDiff} Days` : `${daysDiff} Days Overdue`}
                      </span>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => setActiveReminder({ ...reminder, title, dueDate, clientName })}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-bronze border border-transparent rounded hover:bg-bronze-dim transition-colors shadow-sm"
                    >
                      Send Reminder
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {activeReminder && (
        <DraftSendModal
          isOpen={true}
          onClose={() => setActiveReminder(null)}
          reminder={activeReminder}
        />
      )}
    </div>
  )
}
