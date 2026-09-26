import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { getDaysOverdue } from '@/lib/invoice-utils'
import Link from 'next/link'
import { InvoiceStatusSelect } from '@/components/invoice-status-select'

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const tab = searchParams?.tab === 'all' ? 'all' : 'overdue'
  const supabase = createClient()
  
  // Base query: get all firm invoices
  let query = supabase
    .from('invoices')
    .select(`
      id,
      amount,
      status,
      due_date,
      paid_date,
      payment_method,
      created_at,
      clients (
        id,
        company_name
      )
    `)

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  if (tab === 'overdue') {
    query = query
      .neq('status', 'paid')
      .lt('due_date', todayStr)
  }

  const { data: rawInvoices } = await query

  // Compute days overdue and sort
  const invoices = (rawInvoices || []).map(inv => ({
    ...inv,
    days_overdue: getDaysOverdue(inv.due_date, todayStr)
  }))

  if (tab === 'overdue') {
    invoices.sort((a, b) => b.days_overdue - a.days_overdue)
  } else {
    invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  // Invoices are already fetched and processed above
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-end mb-2 border-b border-stone-line pb-4">
        <div>
          <h2 className="text-3xl font-serif font-medium text-ink">Invoices</h2>
          <p className="text-ink-soft mt-1">Manage billing and payments across your clients.</p>
        </div>
        
        <div className="flex gap-2">
          <Link 
            href="/invoices?tab=overdue" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'overdue' 
                ? 'bg-paper-dim border border-stone-line text-ink' 
                : 'text-ink-soft hover:bg-stone-dim/30'
            }`}
          >
            Overdue
          </Link>
          <Link 
            href="/invoices?tab=all" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'all' 
                ? 'bg-paper-dim border border-stone-line text-ink' 
                : 'text-ink-soft hover:bg-stone-dim/30'
            }`}
          >
            All Invoices
          </Link>
        </div>
      </div>

      <div className="bg-paper-dim border border-stone-line rounded-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-line bg-stone-dim/30">
              <th className="py-3 px-4 font-serif font-medium text-ink-soft text-sm">Client</th>
              <th className="py-3 px-4 font-serif font-medium text-ink-soft text-sm">Amount</th>
              <th className="py-3 px-4 font-serif font-medium text-ink-soft text-sm">Due Date</th>
              {tab === 'overdue' && <th className="py-3 px-4 font-serif font-medium text-ink-soft text-sm">Days Overdue</th>}
              <th className="py-3 px-4 font-serif font-medium text-ink-soft text-sm">Status</th>
              <th className="py-3 px-4 font-serif font-medium text-ink-soft text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices && invoices.length > 0 ? invoices.map((invoice: any) => {
              const isOverdue = invoice.status !== 'paid' && new Date(invoice.due_date) < new Date()
              
              return (
                <tr key={invoice.id} className="border-b border-stone-line last:border-0 hover:bg-stone-dim/20 transition-colors">
                  <td className="py-4 px-4 align-top">
                    <Link href={`/clients/${invoice.clients?.id}`} className="font-medium text-ink hover:underline">
                      {invoice.clients?.company_name}
                    </Link>
                  </td>
                  <td className="py-4 px-4 align-top font-mono">
                    ${Number(invoice.amount).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 align-top">
                    <span className={isOverdue ? 'text-bronze font-bold' : 'text-ink'}>
                      {formatDate(invoice.due_date)}
                    </span>
                    {isOverdue && tab !== 'overdue' && <span className="block text-xs text-bronze mt-1">Overdue</span>}
                  </td>
                  {tab === 'overdue' && (
                    <td className="py-4 px-4 align-top font-mono font-medium text-bronze">
                      {invoice.days_overdue} days
                    </td>
                  )}
                  <td className="py-4 px-4 align-top">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full font-mono uppercase tracking-wider border
                      ${invoice.status === 'paid' ? 'bg-paper text-bronze border-stone-line' :
                        invoice.status === 'sent' ? 'bg-paper text-ink border-stone-line' :
                        invoice.status === 'overdue' ? 'bg-paper text-bronze font-bold border-stone-line' :
                        'bg-paper text-ink-soft border-stone-line'}
                    `}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 align-top text-right">
                    <InvoiceStatusSelect 
                      invoiceId={invoice.id} 
                      currentStatus={invoice.status} 
                      paidDate={invoice.paid_date}
                      paymentMethod={invoice.payment_method}
                    />
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={tab === 'overdue' ? 6 : 5} className="py-8 text-center text-ink-soft">
                  {tab === 'overdue' ? 'No overdue invoices found. Great job!' : 'No invoices found. Finalize a report to generate an invoice prompt.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
