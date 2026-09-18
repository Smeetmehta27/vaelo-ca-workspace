'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'

type DocumentItem = {
  id: string
  clientName: string
  itemName: string
  status: string
  dueDate: string | null
  staleness: number
  assignedTo: string
}

type SortField = 'dueDate' | 'staleness'
type SortOrder = 'asc' | 'desc'

export function DocumentsTable({ initialItems }: { initialItems: DocumentItem[] }) {
  const [sortField, setSortField] = useState<SortField>('staleness')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedItems = [...initialItems].sort((a, b) => {
    let comparison = 0
    if (sortField === 'staleness') {
      comparison = a.staleness - b.staleness
    } else if (sortField === 'dueDate') {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0
      comparison = dateA - dateB
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-paper text-ink border-stone-line'
      case 'rejected':
        return 'bg-paper text-bronze border-stone-line'
      case 'received':
        return 'bg-paper text-ink-soft border-stone-line'
      default:
        return 'bg-paper text-ink-soft border-stone-line'
    }
  }

  return (
    <div className="bg-paper-dim rounded-card border border-stone-line overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-line">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Client</th>
              <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Item</th>
              <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Status</th>
              <th 
                className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide cursor-pointer hover:text-ink transition-colors group"
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center gap-1">
                  Due Date
                  <span className={`text-stone-line group-hover:text-ink-soft transition-colors ${sortField === 'dueDate' ? 'text-ink' : ''}`}>
                    {sortField === 'dueDate' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide cursor-pointer hover:text-ink transition-colors group"
                onClick={() => handleSort('staleness')}
              >
                <div className="flex items-center gap-1">
                  Staleness (Days)
                  <span className={`text-stone-line group-hover:text-ink-soft transition-colors ${sortField === 'staleness' ? 'text-ink' : ''}`}>
                    {sortField === 'staleness' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Assigned To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-line">
            {sortedItems.map(item => (
              <tr key={item.id} className="hover:bg-paper transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ink">{item.clientName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">{item.itemName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border capitalize ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">{formatDate(item.dueDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-ink">{item.staleness} days</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">{item.assignedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedItems.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-ink-soft">
            No document requests found.
          </div>
        )}
      </div>
    </div>
  )
}
