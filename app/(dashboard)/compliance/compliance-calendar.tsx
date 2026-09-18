'use client'

import { useState, useMemo } from 'react'
import { formatDate } from '@/lib/utils'
import { updateComplianceTaskStatus } from '@/lib/actions/compliance-actions'

type Task = {
  id: string
  clientId: string
  clientName: string
  entityType: string
  taskType: string
  periodLabel: string
  dueDate: string
  status: string
  assignedTo: string
  ownerId: string | null
}

type RosterMember = {
  id: string
  name: string
}

export function ComplianceCalendar({ initialTasks, roster }: { initialTasks: Task[], roster: RosterMember[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [clientFilter, setClientFilter] = useState('')
  const [taskTypeFilter, setTaskTypeFilter] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  
  // To handle loading state per task
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId)
    try {
      await updateComplianceTaskStatus(taskId, newStatus)
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    } catch (error) {
      console.error('Failed to update status', error)
      alert('Failed to update task status')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (clientFilter && !t.clientName.toLowerCase().includes(clientFilter.toLowerCase())) return false
      if (taskTypeFilter && t.taskType !== taskTypeFilter) return false
      if (ownerFilter && t.ownerId !== ownerFilter) return false
      if (dateFromFilter && t.dueDate < dateFromFilter) return false
      if (dateToFilter && t.dueDate > dateToFilter) return false
      return true
    })
  }, [tasks, clientFilter, taskTypeFilter, ownerFilter, dateFromFilter, dateToFilter])

  // Group by month
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    filteredTasks.forEach(t => {
      const date = new Date(t.dueDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey].push(t)
    })
    
    // Sort keys (months)
    return Object.keys(groups).sort().map(key => {
      const date = new Date(`${key}-01T00:00:00Z`)
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      return {
        key,
        title: monthName,
        tasks: groups[key].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      }
    })
  }, [filteredTasks])

  const todayStr = new Date().toISOString().split('T')[0]

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue && status !== 'done') {
      return 'bg-paper text-bronze border-bronze'
    }
    switch (status) {
      case 'pending': return 'bg-paper text-ink border-stone-line'
      case 'in_progress': return 'bg-paper text-ink border-ink'
      case 'done': return 'bg-paper text-ink-soft border-stone-line line-through'
      default: return 'bg-paper text-ink-soft border-stone-line'
    }
  }

  // Unique task types for filter
  const uniqueTaskTypes = Array.from(new Set(tasks.map(t => t.taskType))).sort()

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="bg-paper-dim rounded-card border border-stone-line p-4 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide mb-1">Client</label>
          <input 
            type="text" 
            placeholder="Search clients..." 
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-stone-line rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>
        <div className="w-48">
          <label className="block text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide mb-1">Task Type</label>
          <select 
            value={taskTypeFilter}
            onChange={e => setTaskTypeFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-stone-line rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-ink bg-white"
          >
            <option value="">All Types</option>
            {uniqueTaskTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="w-48">
          <label className="block text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide mb-1">Owner</label>
          <select 
            value={ownerFilter}
            onChange={e => setOwnerFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-stone-line rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-ink bg-white"
          >
            <option value="">All Owners</option>
            {roster.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="w-36">
          <label className="block text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide mb-1">Due From</label>
          <input 
            type="date" 
            value={dateFromFilter}
            onChange={e => setDateFromFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-stone-line rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-ink bg-white"
          />
        </div>
        <div className="w-36">
          <label className="block text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide mb-1">Due To</label>
          <input 
            type="date" 
            value={dateToFilter}
            onChange={e => setDateToFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-stone-line rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-ink bg-white"
          />
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex flex-col gap-8">
        {groupedTasks.length === 0 ? (
          <div className="bg-paper-dim rounded-card border border-stone-line px-6 py-12 text-center text-sm text-ink-soft">
            No compliance tasks found matching the filters.
          </div>
        ) : (
          groupedTasks.map(group => (
            <div key={group.key} className="flex flex-col gap-3">
              <h3 className="text-lg font-serif font-medium text-ink">{group.title}</h3>
              <div className="bg-paper-dim rounded-card border border-stone-line overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-line border-l-4 border-l-transparent">
                    <thead>
                      <tr>
                        <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide w-1/4">Client</th>
                        <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide w-1/4">Task</th>
                        <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide w-1/6">Due Date</th>
                        <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide w-1/6">Owner</th>
                        <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide w-1/6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-line">
                      {group.tasks.map(task => {
                        const isOverdue = task.dueDate < todayStr && task.status !== 'done'
                        return (
                          <tr key={task.id} className={`hover:bg-paper transition-colors ${isOverdue ? 'border-l-4 border-l-bronze' : 'border-l-4 border-l-transparent'}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ink">
                              {task.clientName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                              <div>{task.taskType}</div>
                              <div className="text-xs text-ink-soft font-mono mt-0.5">{task.periodLabel}</div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isOverdue ? 'text-bronze font-medium' : 'text-ink-soft'}`}>
                              {formatDate(task.dueDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">
                              {task.assignedTo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={task.status}
                                disabled={updatingTaskId === task.id || task.status === 'overdue'}
                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                className={`px-2 py-1 rounded text-xs font-mono font-medium border outline-none cursor-pointer disabled:opacity-50 ${getStatusColor(task.status, isOverdue)}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                                {task.status === 'overdue' && <option value="overdue">Overdue</option>}
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
