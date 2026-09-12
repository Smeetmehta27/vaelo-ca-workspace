import { createClient } from '@/lib/supabase/server'
import { UploadItemForm } from './UploadItemForm'
import { DocumentRequestList, DocumentRequestItem } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { VaeloMark } from '@/components/ui/vaelo-mark'

// Force dynamic since this relies on a fresh token read
export const dynamic = 'force-dynamic'

export default async function ClientUploadPage({ params }: { params: { token: string } }) {
  const supabase = createClient()
  const token = params.token

  const { data, error } = await supabase.rpc('get_document_request_list_by_token', {
    p_token: token
  })

  // If the function returns null, the token is invalid or revoked.
  // We do not leak any errors from supabase.
  if (error || !data) {
    return (
      <div className="min-h-screen bg-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-paper-dim py-8 px-4 sm:px-10 text-center border border-stone-line rounded-card flex flex-col items-center">
            <div className="mb-6">
              <VaeloMark />
            </div>
            <h2 className="text-xl font-serif font-medium text-ink mb-2">Access Denied</h2>
            <p className="text-ink-soft">This link is invalid or has expired.</p>
          </div>
        </div>
      </div>
    )
  }

  const { list, items } = data as { list: DocumentRequestList, items: DocumentRequestItem[] }

  return (
    <div className="min-h-screen bg-paper py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-center">
          <VaeloMark />
        </div>
        <div className="bg-paper-dim rounded-card border border-stone-line overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-stone-line">
            <h1 className="text-3xl font-serif font-medium text-ink">{list.title}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-ink-soft">
              <p>Requested: {formatDate(list.created_at)}</p>
              {list.report_type && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-paper border border-stone-line text-ink uppercase tracking-wide">
                  {list.report_type}
                </span>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <p className="text-ink-soft mb-6">
              Please upload the requested documents below. Your files will be securely sent to your CA.
            </p>

            <div className="space-y-6">
              {items && items.length > 0 ? items.map((item: DocumentRequestItem) => (
                <div key={item.id} className="bg-paper border border-stone-line rounded-card p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-base font-medium text-ink flex items-center gap-2">
                        {item.name}
                        {item.required && <span className="text-[10px] font-mono font-medium text-ink bg-bronze-tint px-2 py-0.5 rounded uppercase tracking-wide border border-stone-line">Required</span>}
                      </h3>
                      {item.due_date && (
                        <p className="text-sm text-ink-soft mt-1">Due: {formatDate(item.due_date)}</p>
                      )}
                    </div>
                    <div>
                      {item.status === 'received' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-paper-dim border border-stone-line text-ink">
                          <span className="font-mono text-ink">…</span> Uploaded (Pending Review)
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-paper-dim border border-stone-line text-ink">
                          <span className="font-mono text-ink">✓</span> Approved
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-paper border border-stone-line text-ink-soft">
                          <span className="font-mono text-ink-soft">✕</span> Rejected (Please Re-upload)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Upload UI only for requested or rejected items */}
                  {(item.status === 'requested' || item.status === 'rejected') && (
                    <UploadItemForm token={token} itemId={item.id} />
                  )}
                </div>
              )) : (
                <p className="text-ink-soft italic">No items requested.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
