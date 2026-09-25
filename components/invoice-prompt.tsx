'use client'

import { useState } from 'react'
import { createInvoice } from '@/lib/actions/invoice-actions'
import { useRouter } from 'next/navigation'

export function InvoicePrompt({ reportId, clientId, autoOpen = false }: { reportId: string, clientId: string, autoOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(autoOpen)
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await createInvoice(reportId, Number(amount), dueDate)
      if (res.error) {
        setError(res.error)
      } else {
        setIsOpen(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-paper-dim border border-stone-line rounded-lg p-4 flex justify-between items-center mb-6">
        <div>
          <h4 className="font-serif font-medium text-ink">Action Required: Raise Invoice</h4>
          <p className="text-sm text-ink-soft">This report has been finalized. Please raise an invoice for the client.</p>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-ink text-paper px-4 py-2 rounded-md text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          Raise Invoice
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-ink/20 flex items-center justify-center z-50 p-4">
          <div className="bg-paper rounded-lg shadow-xl max-w-md w-full border border-stone-line">
            <div className="px-6 py-4 border-b border-stone-line flex justify-between items-center">
              <h3 className="font-serif font-medium text-ink">Create Invoice</h3>
              <button onClick={() => setIsOpen(false)} className="text-ink-soft hover:text-ink">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Amount</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full border border-stone-line rounded-md px-3 py-2 bg-paper text-ink"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Due Date</label>
                <input 
                  type="date" 
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full border border-stone-line rounded-md px-3 py-2 bg-paper text-ink"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-ink hover:bg-stone-dim rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-2 text-sm text-paper bg-ink rounded-md disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
