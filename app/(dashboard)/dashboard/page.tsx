import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all relevant items. Using !inner to enforce the join and filter automatically
  // if the list or client doesn't exist (RLS handles CA scope on lists/clients)
  const { data: items } = await supabase
    .from('document_request_items')
    .select(`
      id, name, due_date, status, updated_at,
      document_request_lists!inner (
        client_id,
        clients!inner (
          id, company_name
        )
      )
    `)
    .in('status', ['requested', 'rejected', 'received'])

  // Helper arrays
  type DashboardItem = {
    id: string
    name: string
    dueDate: string | null
    status: string
    updatedAt: string
    clientId?: string
    companyName: string
  }

  const overdueItems: DashboardItem[] = []
  const dueTodayItems: DashboardItem[] = []
  const reviewItems: DashboardItem[] = []

  // Safe timezone-independent today string for YYYY-MM-DD comparison
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  if (items) {
    for (const item of items) {
      // Handle potential array wrapping from supabase-js joins
      const list = Array.isArray(item.document_request_lists) 
        ? item.document_request_lists[0] 
        : item.document_request_lists
      
      const client = list?.clients ? (Array.isArray(list.clients) ? list.clients[0] : list.clients) : null
      
      const formattedItem = {
        id: item.id,
        name: item.name,
        dueDate: item.due_date,
        status: item.status,
        updatedAt: item.updated_at,
        clientId: client?.id,
        companyName: client?.company_name || 'Unknown Client'
      }

      if (item.status === 'received') {
        reviewItems.push(formattedItem)
      } else if ((item.status === 'requested' || item.status === 'rejected') && item.due_date) {
        // item.due_date is natively 'YYYY-MM-DD' from Postgres date type
        if (item.due_date < todayStr) {
          overdueItems.push(formattedItem)
        } else if (item.due_date === todayStr) {
          dueTodayItems.push(formattedItem)
        }
      }
    }
  }

  const getDaysOverdue = (dueDateStr: string | null) => {
    if (!dueDateStr) return 0
    // Parse both as explicit UTC midnight to avoid local timezone skew
    const due = new Date(`${dueDateStr}T00:00:00Z`)
    const todayDate = new Date(`${todayStr}T00:00:00Z`)
    const diffTime = Math.abs(todayDate.getTime() - due.getTime())
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }
  
  const getDaysWaiting = (updatedAtStr: string) => {
    const updated = new Date(updatedAtStr)
    const diffTime = Math.abs(Date.now() - updated.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-3xl font-serif font-medium text-ink">Welcome, {user?.email}</h2>
          <p className="text-ink-soft mt-1">Here&apos;s what needs your attention today.</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        
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
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Client</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Item</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Due Date</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Overdue By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-line">
                  {overdueItems.map(item => (
                    <tr key={item.id} className="hover:bg-paper transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/clients/${item.clientId}/documents`} className="text-ink-soft hover:text-ink transition-colors">
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
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Client</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-line">
                  {dueTodayItems.map(item => (
                    <tr key={item.id} className="hover:bg-paper transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/clients/${item.clientId}/documents`} className="text-ink-soft hover:text-ink transition-colors">
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

        {/* Awaiting Review Section */}
        <div className="bg-paper-dim rounded-card border border-stone-line overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-line flex items-center justify-between">
            <h3 className="text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Awaiting Your Review</h3>
            <span className="bg-paper border border-stone-line text-ink px-2.5 py-0.5 rounded-full text-xs font-mono font-medium">{reviewItems.length}</span>
          </div>
          {reviewItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-line">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Client</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Item</th>
                    <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Waiting For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-line">
                  {reviewItems.map(item => {
                    const days = getDaysWaiting(item.updatedAt);
                    return (
                      <tr key={item.id} className="hover:bg-paper transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/clients/${item.clientId}/documents`} className="text-ink-soft hover:text-ink transition-colors">
                            {item.companyName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">{days === 0 ? 'Today' : `${days} days`}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-ink-soft">
              All caught up on reviews.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
