import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { TimelineControls } from './TimelineControls'
import { ClientDetailTabs } from '@/components/client-detail-tabs'

export default async function ClientTimelinePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = createClient()
  
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  // Fetch timeline events
  const { data: events } = await supabase
    .from('client_timeline_events')
    .select('*')
    .eq('client_id', params.id)
    .order('created_at', { ascending: false })



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
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/clients" className="text-sm font-medium text-ink-soft hover:text-ink mb-2 inline-block">&larr; Back to Clients</Link>
          <h2 className="text-3xl font-serif font-medium text-ink">{client.company_name}</h2>
          <p className="text-ink-soft mt-1">{client.entity_type || 'Entity type not specified'}</p>
        </div>
      </div>

      {/* Tabs */}
      <ClientDetailTabs clientId={client.id} currentTab="timeline" />

      {/* Timeline Content */}
      <div className="bg-paper-dim rounded-card border border-stone-line overflow-hidden mb-12">
        <div className="px-6 py-4 border-b border-stone-line">
          <h3 className="text-lg font-serif font-medium text-ink">Activity Timeline</h3>
          <p className="text-sm text-ink-soft mt-1">A chronological record of client-related events.</p>
        </div>
        
        <div className="p-6">
          <TimelineControls clientId={client.id} token={client.timeline_access_token} />

          {events && events.length > 0 ? (
            <div className="flex flex-col gap-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                  {getEventBadge(event.event_type)}
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-gray-900">{event.summary}</p>
                      {!event.visible_to_client && (
                        <span className="text-[10px] font-semibold tracking-wider uppercase bg-gray-200 text-gray-600 px-2 py-0.5 rounded ml-2 shrink-0">
                          Internal Only
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(event.created_at)} &middot; {event.event_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-500">
              No activity yet for this client.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
