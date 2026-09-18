import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'

// Force dynamic since this relies on a fresh token read
export const dynamic = 'force-dynamic'

export default async function ClientTimelineTokenPage({ params }: { params: { token: string } }) {
  const supabase = createClient()
  const token = params.token

  // Call the SECURITY DEFINER RPC to get the timeline events
  const { data, error } = await supabase.rpc('get_client_timeline_by_token', {
    p_token: token
  })

  if (error) {
    console.error('Error fetching timeline by token:', error)
  }

  // If the function returns null or empty on the first row's client_id, the token is invalid or revoked.
  if (!data || data.length === 0 || !data[0].client_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">
            This timeline link is invalid, has expired, or has been revoked by your CA.
          </p>
        </div>
      </div>
    )
  }

  // Group metadata from the first row
  const { company_name, entity_type } = data[0]
  
  // Filter out any rows that don't actually have an event (if left join returned nulls for events)
  const events = data.filter((row: any) => row.event_id)

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'item_approved':
        return <span className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
      case 'item_rejected':
        return <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
      case 'item_received':
      case 'report_finalized':
        return <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
      case 'list_created':
        return <span className="w-2.5 h-2.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
      case 'notice_logged':
        return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
      case 'note':
        return <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
    }
  }

  return (
    <div className="min-h-screen bg-paper pb-20">
      <div className="bg-paper-dim border-b border-stone-line">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-serif font-medium text-ink mb-2">Timeline for {company_name}</h1>
          <p className="text-ink-soft">{entity_type}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-stone-line overflow-hidden">
          <div className="px-6 py-5 border-b border-stone-line bg-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-medium text-ink">Public Activity Timeline</h2>
            <span className="text-sm text-ink-soft">{events.length} events</span>
          </div>

          <div className="p-6">
            {events.length > 0 ? (
              <div className="flex flex-col gap-6">
                {events.map((event: any) => (
                  <div key={event.event_id} className="flex gap-4">
                    <div className="pt-0.5">
                      {getEventBadge(event.event_type)}
                    </div>
                    <div className="flex flex-col gap-1 pb-6 border-b border-gray-100 last:border-0 last:pb-0 w-full">
                      <p className="text-sm font-medium text-gray-900">{event.summary}</p>
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                        {formatDateTime(event.created_at)} &middot; {event.event_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Activity Yet</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  There are no public timeline events to display for {company_name}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
