'use client'

import { useState, useEffect } from 'react'
import { createNotice, updateNoticeTaskStatus, getOrPinNoticeTemplate } from '@/lib/actions/notice-actions'

type Notice = {
  id: string
  clientId: string
  clientName: string
  portalSource: string
  noticeType: string
  dateReceived: string
  responseDueDate: string
  noticeStatus: string
  taskId: string | null
  taskStatus: string
  assignedTo: string
  ownerId: string | null
}

type RosterMember = { id: string, name: string }
type Client = { id: string, company_name: string }

export function NoticesDashboard({ 
  initialNotices, 
  roster,
  clients 
}: { 
  initialNotices: Notice[], 
  roster: RosterMember[],
  clients: Client[]
}) {
  const [notices, setNotices] = useState(initialNotices)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [templateModalOpenId, setTemplateModalOpenId] = useState<string | null>(null)
  
  // Filters
  const [clientFilter, setClientFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filteredNotices = notices.filter(n => {
    if (clientFilter && n.clientId !== clientFilter) return false
    if (sourceFilter && n.portalSource !== sourceFilter) return false
    if (statusFilter && n.taskStatus !== statusFilter) return false
    return true
  })

  async function handleStatusChange(taskId: string, newStatus: string) {
    const backup = [...notices]
    setNotices(current => current.map(n => 
      n.taskId === taskId ? { ...n, taskStatus: newStatus } : n
    ))
    
    const result = await updateNoticeTaskStatus(taskId, newStatus)
    if (result.error) {
      alert('Failed to update status')
      setNotices(backup)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4 items-center bg-paper-dim p-4 rounded-xl border border-stone-line shadow-sm">
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="border border-stone-line bg-paper text-ink px-3 py-2 rounded-lg text-sm outline-none focus:border-bronze focus:ring-1 focus:ring-bronze"
        >
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
        </select>
        
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="border border-stone-line bg-paper text-ink px-3 py-2 rounded-lg text-sm outline-none focus:border-bronze focus:ring-1 focus:ring-bronze"
        >
          <option value="">All Sources</option>
          <option value="GST">GST</option>
          <option value="Income-Tax">Income-Tax</option>
          <option value="TRACES">TRACES</option>
          <option value="MCA">MCA</option>
        </select>
        
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-stone-line bg-paper text-ink px-3 py-2 rounded-lg text-sm outline-none focus:border-bronze focus:ring-1 focus:ring-bronze"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="overdue">Overdue</option>
        </select>

        <div className="ml-auto">
          <button onClick={() => setIsModalOpen(true)} className="bg-bronze text-paper px-4 py-2 rounded-xl text-sm font-medium hover:bg-bronze-deep transition-colors">Log New Notice</button>
        </div>
      </div>

      <div className="bg-paper border border-stone-line rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-paper-dim border-b border-stone-line">
              <th className="py-3 px-4 font-medium text-sm text-ink-soft">Due Date</th>
              <th className="py-3 px-4 font-medium text-sm text-ink-soft">Client</th>
              <th className="py-3 px-4 font-medium text-sm text-ink-soft">Notice Details</th>
              <th className="py-3 px-4 font-medium text-sm text-ink-soft">Assigned To</th>
              <th className="py-3 px-4 font-medium text-sm text-ink-soft">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-line">
            {filteredNotices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-ink-soft">No notices found matching filters.</td>
              </tr>
            ) : filteredNotices.map(notice => {
              const isOverdue = new Date(notice.responseDueDate) < new Date() && notice.taskStatus !== 'done'
              return (
                <tr key={notice.id} className="hover:bg-paper-dim/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className={`font-mono text-sm ${isOverdue ? 'text-bronze font-bold' : 'text-ink'}`}>
                      {(() => {
                        // Deterministic date formatting from YYYY-MM-DD to DD MMM YYYY
                        const [year, month, day] = notice.responseDueDate.split('-');
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return `${day} ${monthNames[parseInt(month, 10) - 1]} ${year}`;
                      })()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-ink">{notice.clientName}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-ink font-medium">{notice.noticeType}</div>
                      <button
                        onClick={() => setTemplateModalOpenId(notice.id)}
                        className="px-2 py-0.5 text-[10px] font-medium text-ink bg-paper border border-stone-line rounded hover:border-ink transition-colors whitespace-nowrap shadow-sm"
                        title="View Response Template"
                      >
                        View Template
                      </button>
                    </div>
                    <div className="text-xs text-ink-soft mt-0.5">Source: {notice.portalSource}</div>
                    
                    {templateModalOpenId === notice.id && (
                      <NoticeTemplateModal
                        isOpen={true}
                        onClose={() => setTemplateModalOpenId(null)}
                        noticeId={notice.id}
                        noticeType={notice.noticeType}
                      />
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-soft">{notice.assignedTo}</td>
                  <td className="py-3 px-4">
                    <select
                      value={notice.taskStatus}
                      onChange={(e) => notice.taskId && handleStatusChange(notice.taskId, e.target.value)}
                      disabled={!notice.taskId}
                      className={`text-sm rounded-full px-3 py-1 outline-none border focus:ring-1 focus:ring-bronze cursor-pointer appearance-none ${
                        notice.taskStatus === 'done' ? 'bg-[#E3F2E1] text-[#2E6B2A] border-[#A8D3A3]' :
                        notice.taskStatus === 'in_progress' ? 'bg-[#E1EAF2] text-[#2A4D6B] border-[#A3C4D3]' :
                        notice.taskStatus === 'overdue' ? 'bg-[#F2E1E1] text-[#6B2A2A] border-[#D3A3A3]' :
                        'bg-paper-dim text-ink-soft border-stone-line'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-paper rounded-xl shadow-lg border border-stone-line p-6 w-full max-w-md">
            <h3 className="text-xl font-serif font-medium text-ink mb-4">Log New Notice</h3>
            <form action={async (formData) => {
              const res = await createNotice(formData)
              if (res.success) {
                setIsModalOpen(false)
              } else {
                alert(res.error)
              }
            }} className="flex flex-col gap-4">
              
              <div>
                <label className="block text-sm text-ink-soft mb-1">Client</label>
                <select name="client_id" required className="w-full border border-stone-line bg-paper text-ink px-3 py-2 rounded-lg text-sm outline-none focus:border-bronze">
                  <option value="">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-ink-soft mb-1">Portal Source</label>
                <select name="portal_source" required className="w-full border border-stone-line bg-paper text-ink px-3 py-2 rounded-lg text-sm outline-none focus:border-bronze">
                  <option value="GST">GST</option>
                  <option value="Income-Tax">Income-Tax</option>
                  <option value="TRACES">TRACES</option>
                  <option value="MCA">MCA</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-ink-soft mb-1">Notice Type</label>
                <input name="notice_type" type="text" placeholder="e.g. ASMT-10, 143(1), DRC-01" required className="w-full border border-stone-line bg-paper text-ink px-3 py-2 rounded-lg text-sm outline-none focus:border-bronze" />
              </div>
              
              <div>
                <label className="block text-sm text-ink-soft mb-1">Date Received</label>
                <input name="date_received" type="date" required className="w-full border border-stone-line bg-paper text-ink px-3 py-2 rounded-lg text-sm outline-none focus:border-bronze" />
              </div>
              
              <div>
                <label className="block text-sm text-ink-soft mb-1">Response Due Date</label>
                <input name="response_due_date" type="date" required className="w-full border border-stone-line bg-paper text-ink px-3 py-2 rounded-lg text-sm outline-none focus:border-bronze" />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-ink hover:bg-paper-dim rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-bronze text-paper px-4 py-2 rounded-lg text-sm font-medium hover:bg-bronze-deep transition-colors">Save Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function NoticeTemplateModal({
  isOpen,
  onClose,
  noticeId,
  noticeType,
}: {
  isOpen: boolean
  onClose: () => void
  noticeId: string
  noticeType: string
}) {
  const [templateText, setTemplateText] = useState<string | null | undefined>(undefined)
  
  useEffect(() => {
    if (isOpen) {
      setTemplateText(undefined)
      getOrPinNoticeTemplate(noticeId, noticeType).then(res => {
        if (res.error) setTemplateText(null)
        else setTemplateText(res.templateText)
      })
    }
  }, [isOpen, noticeId, noticeType])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Response Template</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors p-1"
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {templateText === undefined ? (
            <p className="text-sm text-gray-500">Loading template...</p>
          ) : templateText === null ? (
            <p className="text-sm text-gray-500">No template available for this notice type yet.</p>
          ) : (
            <div className="relative group">
              <textarea
                readOnly
                className="w-full h-64 p-4 text-sm font-mono bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent resize-none"
                value={templateText}
              />
              <button
                onClick={() => navigator.clipboard.writeText(templateText)}
                className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink transition-colors"
              >
                Copy Text
              </button>
            </div>
          )}
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
