import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { InvoiceStatusSelect } from '@/components/invoice-status-select'

export default async function InvoicesPage() {
  const supabase = createClient()

  // Get all invoices for the firm (RLS will automatically scope this)
  const { data: invoices } = await supabase
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
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-serif font-medium text-ink">Invoices</h2>
          <p className="text-ink-soft mt-1">Manage billing and payments across your clients.</p>
        </div>
      </div>

      <div className="bg-paper-dim border border-stone-line rounded-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-line bg-stone-dim/30">
              <th className="py-3 px-4 font-serif font-medium text-ink-soft text-sm">Client</th>
              <th className="py-3 px-4 font-serif font-medium text-ink-soft text-sm">Amount</th>
              <th className="py-3 px-4 font-serif font-medium text-ink-soft text-sm">Due Date</th>
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
                    <span className={isOverdue ? 'text-red-600 font-medium' : 'text-ink'}>
                      {formatDate(invoice.due_date)}
                    </span>
                    {isOverdue && <span className="block text-xs text-red-500 mt-1">Overdue</span>}
                  </td>
                  <td className="py-4 px-4 align-top">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full font-mono uppercase tracking-wider
                      ${invoice.status === 'paid' ? 'bg-green-100 text-green-800 border border-green-200' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800 border border-red-200' :
                        'bg-stone-dim text-ink-soft border border-stone-line'}
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
                <td colSpan={5} className="py-8 text-center text-ink-soft">
                  No invoices found. Finalize a report to generate an invoice prompt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
