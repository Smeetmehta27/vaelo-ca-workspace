import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { NewDocumentRequestForm } from './NewDocumentRequestForm'
import { ItemRow } from './ItemRow'
import { DocumentRequestItem } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { getBaseUrl } from '@/lib/server-utils'
import { CopyLinkButton } from './CopyLinkButton'

export default async function ClientDocumentsPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = createClient()
  const origin = getBaseUrl()
  
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !client) {
    notFound()
  }

  // Fetch document request lists and their items
  const { data: lists } = await supabase
    .from('document_request_lists')
    .select(`
      *,
      document_request_items(*)
    `)
    .eq('client_id', params.id)
    .order('created_at', { ascending: false })

  const tabs = [
    { id: 'cma', label: 'CMA Report', href: `/clients/${client.id}?tab=cma` },
    { id: 'feasibility', label: 'Deal Feasibility', href: `/clients/${client.id}?tab=feasibility` },
    { id: 'health', label: 'Financial Health', href: `/clients/${client.id}?tab=health` },
    { id: 'documents', label: 'Documents', href: `/clients/${client.id}/documents` },
    { id: 'timeline', label: 'Timeline', href: `/clients/${client.id}/timeline` },
  ]

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
      <div className="border-b border-stone-line">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${tab.id === 'documents'
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink-soft hover:text-ink hover:border-stone'
                }
              `}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Document Requests Content */}
      <div className="flex flex-col gap-6 mb-12">
        <details id="new-doc-req-details" className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group">
          <summary className="px-6 py-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 select-none list-none flex justify-between items-center">
            <span>+ New Document Request List</span>
            <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="p-6 border-t border-gray-200">
            <NewDocumentRequestForm clientId={client.id} />
          </div>
        </details>

        {lists?.map((list) => (
          <div key={list.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start bg-gray-50">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{list.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-gray-500">Created: {formatDate(list.created_at)}</p>
                  {list.report_type && (
                    <span className="text-xs px-2 py-0.5 rounded-full uppercase font-bold tracking-wider bg-slate-200 text-slate-800">
                      {list.report_type}
                    </span>
                  )}
                </div>
              </div>
              <CopyLinkButton 
                url={`${origin}/upload/${list.access_token}`} 
                listId={list.id} 
                isRevoked={list.token_revoked} 
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {list.document_request_items?.sort((a: DocumentRequestItem, b: DocumentRequestItem) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()).map((item: DocumentRequestItem) => (
                    <ItemRow key={item.id} item={item} clientName={client.company_name} />
                  ))}
                  {(!list.document_request_items || list.document_request_items.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No items in this request list.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        
        {(!lists || lists.length === 0) && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
            No document requests generated yet. Expand the &quot;New Document Request List&quot; section above to create one.
          </div>
        )}
      </div>
    </div>
  )
}
