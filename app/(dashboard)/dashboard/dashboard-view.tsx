'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export type DashboardItem = {
  id: string
  name: string
  type: 'document_request' | 'compliance_task' | 'notice_task'
  dueDate: string | null
  status: string
  updatedAt: string
  clientId?: string
  companyName: string
  ownerId?: string
  ownerName?: string
}

export function DashboardView({ 
  items, 
  pendingReviewCount, 
  userEmail,
  isManager
}: { 
  items: DashboardItem[], 
  pendingReviewCount: number,
  userEmail: string,
  isManager: boolean
}) {
  const [clientFilter, setClientFilter] = useState('all')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all') // 'all' | 'overdue' | 'due_today' | 'due_this_week'

  // Extract unique clients
  const clients = useMemo(() => {
    const map = new Map<string, string>()
    items.forEach(i => {
      if (i.clientId && i.companyName) map.set(i.clientId, i.companyName)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [items])

  // Extract unique owners (only relevant if manager)
  const owners = useMemo(() => {
    if (!isManager) return []
    const map = new Map<string, string>()
    items.forEach(i => {
      if (i.ownerId && i.ownerName) map.set(i.ownerId, i.ownerName)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [items, isManager])

  // Safe timezone-independent today string for YYYY-MM-DD comparison
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  
  // Calculate "this week" boundary (today + 7 days)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`

  // Apply filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (clientFilter !== 'all' && item.clientId !== clientFilter) return false
      if (isManager && ownerFilter !== 'all' && item.ownerId !== ownerFilter) return false

      if (urgencyFilter === 'overdue' && (!item.dueDate || item.dueDate >= todayStr)) return false
      if (urgencyFilter === 'due_today' && item.dueDate !== todayStr) return false
      if (urgencyFilter === 'due_this_week' && (!item.dueDate || item.dueDate < todayStr || item.dueDate > nextWeekStr)) return false

      return true
    })
  }, [items, clientFilter, ownerFilter, urgencyFilter, todayStr, nextWeekStr, isManager])

  // Bucket filtered items
  const overdueItems = filteredItems.filter(i => i.dueDate && i.dueDate < todayStr)
  const dueTodayItems = filteredItems.filter(i => i.dueDate === todayStr)
  const otherItems = filteredItems.filter(i => i.dueDate && i.dueDate > todayStr)

  const getDaysOverdue = (dueDateStr: string | null) => {
    if (!dueDateStr) return 0
    const due = new Date(`${dueDateStr}T00:00:00Z`)
    const todayDate = new Date(`${todayStr}T00:00:00Z`)
    const diffTime = Math.abs(todayDate.getTime() - due.getTime())
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'document_request': return 'Document'
      case 'compliance_task': return 'Compliance'
      case 'notice_task': return 'Notice'
      default: return 'Task'
    }
  }

  const getLinkUrl = (item: DashboardItem) => {
    switch (item.type) {
      case 'document_request': return `/clients/${item.clientId}/documents`
      case 'compliance_task': return `/compliance`
      case 'notice_task': return `/notices`
      default: return `/clients/${item.clientId}`
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-3xl font-serif font-medium text-ink">Welcome, {userEmail}</h2>
          <p className="text-ink-soft mt-1">Here&apos;s what needs your attention today.</p>
        </div>
      </div>

      {/* Filters (FR-DASH-2) */}
      <div className="bg-paper-dim border border-stone-line p-4 rounded-card flex flex-wrap gap-4 items-center">
        <h3 className="text-sm font-medium text-ink mr-2">Filters</h3>
        
        <select 
          value={clientFilter} 
          onChange={e => setClientFilter(e.target.value)}
          className="text-sm border border-stone-line bg-paper text-ink rounded-md px-3 py-1.5 outline-none"
        >
          <option value="all">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {isManager && owners.length > 0 && (
          <select 
            value={ownerFilter} 
            onChange={e => setOwnerFilter(e.target.value)}
            className="text-sm border border-stone-line bg-paper text-ink rounded-md px-3 py-1.5 outline-none"
          >
            <option value="all">All Owners</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}

        <select 
          value={urgencyFilter} 
          onChange={e => setUrgencyFilter(e.target.value)}
          className="text-sm border border-stone-line bg-paper text-ink rounded-md px-3 py-1.5 outline-none"
        >
          <option value="all">All Urgencies</option>
          <option value="overdue">Overdue</option>
          <option value="due_today">Due Today</option>
          <option value="due_this_week">Due This Week</option>
        </select>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Awaiting Review Section (FR-DASH-3) */}
        {pendingReviewCount > 0 && (
          <div className="bg-paper-dim rounded-card border border-stone-line overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-line flex items-center justify-between">
              <h3 className="text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Awaiting Your Review</h3>
              <span className="bg-paper border border-stone-line text-ink px-2.5 py-0.5 rounded-full text-xs font-mono font-medium">{pendingReviewCount}</span>
            </div>
            <div className="px-6 py-4 flex justify-between items-center bg-paper">
              <p className="text-sm text-ink">You have {pendingReviewCount} report{pendingReviewCount !== 1 ? 's' : ''} awaiting review.</p>
              <Link href="/review" className="text-sm font-medium text-ink hover:underline">
                Go to Review Queue &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Overdue Section */}
        <div className="bg-paper-dim rounded-card border border-stone-line border-l-4 border-l-bronze overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-line flex items-center justify-between">
            <h3 className="text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Overdue</h3>
            <span className="bg-paper border border-stone-line text-bronze px-2.5 py-0.5 rounded-full text-xs font-mono font-medium">{overdueItems.length}</span>
          </div>
          {overdueItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-line">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Type</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Client</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Item</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Due Date</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Overdue By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-line">
                  {overdueItems.map(item => (
                    <tr key={item.id} className="hover:bg-paper transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">{getTypeLabel(item.type)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={getLinkUrl(item)} className="text-ink-soft hover:text-ink transition-colors">
                          {item.companyName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">{formatDate(item.dueDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-ink">{getDaysOverdue(item.dueDate)} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-ink-soft">
              Nothing overdue — nice work.
            </div>
          )}
        </div>

        {/* Due Today Section */}
        <div className="bg-paper-dim rounded-card border border-stone-line overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-line flex items-center justify-between">
            <h3 className="text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Due Today</h3>
            <span className="bg-paper border border-stone-line text-ink px-2.5 py-0.5 rounded-full text-xs font-mono font-medium">{dueTodayItems.length}</span>
          </div>
          {dueTodayItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-line">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Type</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Client</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-line">
                  {dueTodayItems.map(item => (
                    <tr key={item.id} className="hover:bg-paper transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">{getTypeLabel(item.type)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={getLinkUrl(item)} className="text-ink-soft hover:text-ink transition-colors">
                          {item.companyName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">{item.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-ink-soft">
              Nothing due today.
            </div>
          )}
        </div>

        {/* Upcoming Section */}
        {otherItems.length > 0 && (
          <div className="bg-paper-dim rounded-card border border-stone-line overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-line flex items-center justify-between">
              <h3 className="text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Upcoming</h3>
              <span className="bg-paper border border-stone-line text-ink px-2.5 py-0.5 rounded-full text-xs font-mono font-medium">{otherItems.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-line">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Type</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Client</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Item</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-line">
                  {otherItems.map(item => (
                    <tr key={item.id} className="hover:bg-paper transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">{getTypeLabel(item.type)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={getLinkUrl(item)} className="text-ink-soft hover:text-ink transition-colors">
                          {item.companyName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">{formatDate(item.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
