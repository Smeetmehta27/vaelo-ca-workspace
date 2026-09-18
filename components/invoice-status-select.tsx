'use client'

import { useState } from 'react'
import { updateInvoiceStatus } from '@/lib/actions/invoice-actions'

export function InvoiceStatusSelect({ 
  invoiceId, 
  currentStatus,
  paidDate,
  paymentMethod
}: { 
  invoiceId: string, 
  currentStatus: string,
  paidDate?: string,
  paymentMethod?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [date, setDate] = useState(paidDate || new Date().toISOString().split('T')[0])
  const [method, setMethod] = useState(paymentMethod || 'bank_transfer')
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'paid') {
      setIsOpen(true)
      setStatus(newStatus)
      return
    }
    
    setLoading(true)
    await updateInvoiceStatus(invoiceId, newStatus)
    setLoading(false)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await updateInvoiceStatus(invoiceId, 'paid', date, method)
    setIsOpen(false)
    setLoading(false)
  }

  return (
    <>
      <select
        disabled={loading}
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="text-sm border border-stone-line bg-paper text-ink rounded-md px-2 py-1 outline-none"
      >
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
      </select>

      {isOpen && (
        <div className="fixed inset-0 bg-ink/20 flex items-center justify-center z-50 p-4 text-left">
          <div className="bg-paper rounded-lg shadow-xl max-w-sm w-full border border-stone-line">
            <div className="px-6 py-4 border-b border-stone-line flex justify-between items-center">
              <h3 className="font-serif font-medium text-ink">Record Payment</h3>
              <button onClick={() => setIsOpen(false)} className="text-ink-soft hover:text-ink">&times;</button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Paid Date</label>
                <input 
                  type="date" 
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-stone-line rounded-md px-3 py-2 bg-paper text-ink"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Payment Method</label>
                <select 
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  className="w-full border border-stone-line rounded-md px-3 py-2 bg-paper text-ink"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
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
                  {loading ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
