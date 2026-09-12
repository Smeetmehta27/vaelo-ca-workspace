import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Client } from '@/lib/types'

export default async function ClientsPage() {
  const supabase = createClient()
  
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif text-ink">Clients</h2>
        <Link 
          href="/clients/new" 
          className="bg-bronze text-paper px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-bronze-deep transition-colors"
        >
          Add New Client
        </Link>
      </div>

      <div className="bg-paper-dim rounded-card border border-stone-line overflow-hidden">
        {clients && clients.length > 0 ? (
          <table className="min-w-full divide-y divide-stone-line">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Company Name</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Entity Type</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Added On</th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-line">
              {clients.map((client: Client) => (
                <tr key={client.id} className="hover:bg-stone-line/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ink">{client.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">{client.entity_type || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-ink-soft">{formatDate(client.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/clients/${client.id}`} className="text-bronze hover:text-bronze-deep transition-colors">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-ink-soft text-sm">
            No clients found. Add your first client to get started.
          </div>
        )}
      </div>
    </div>
  )
}
