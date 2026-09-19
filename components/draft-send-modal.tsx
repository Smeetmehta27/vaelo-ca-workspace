'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'

export function DraftSendModal({ isOpen, onClose, reminder }: { isOpen: boolean, onClose: () => void, reminder: any }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [testEmail, setTestEmail] = useState('delivered@resend.dev')
  const [isVerified, setIsVerified] = useState<boolean | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetch('/api/domain/status')
        .then(res => res.json())
        .then(data => setIsVerified(data.verified))
        .catch(() => setIsVerified(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  const isFuture = new Date(reminder.dueDate) >= new Date();
  
  const draftText = `Hi ${reminder.clientName},

This is an automated reminder regarding the following item:
- ${reminder.title}

This is ${isFuture ? 'due on' : 'past due since'} ${formatDate(reminder.dueDate)}.
Please attend to this at your earliest convenience to ensure compliance.

Best regards,
Vaelo Platform`

  const handleSend = async () => {
    if (!isVerified) return;
    
    setSending(true)
    setError(null)
    setErrorDetails(null)
    
    try {
      const res = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderId: reminder.id,
          toEmail: testEmail,
          draftText
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Failed to send reminder')
        if (data.details) setErrorDetails(data.details)
        return
      }
      
      setSuccess(true)
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-paper rounded-card shadow-lg w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-line flex items-center justify-between">
          <h2 className="text-lg font-medium text-ink">Review & Send Reminder</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink">&times;</button>
        </div>
        
        <div className="p-6">
          {isVerified === false && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              <div className="font-semibold">Email sending disabled until domain is verified</div>
              <div className="mt-1 text-xs opacity-90">Please verify mail.vaelo.co.in in the Resend dashboard.</div>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              <div className="font-semibold">{error}</div>
              {errorDetails && <div className="mt-1 text-xs opacity-90">{errorDetails}</div>}
            </div>
          )}
          
          {success ? (
            <div className="p-8 text-center text-green-700">
              Reminder sent successfully!
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink mb-1">Sandbox Test Email</label>
                <input 
                  type="email" 
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  disabled={isVerified === false}
                  className="w-full px-3 py-2 border border-stone-line rounded text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-ink mb-1">Draft Message</label>
                <textarea
                  readOnly
                  className="w-full h-48 p-4 text-sm font-mono bg-gray-50 border border-stone-line rounded resize-none"
                  value={draftText}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || isVerified === false || isVerified === null}
                  className="px-4 py-2 text-sm font-medium text-white bg-bronze border border-transparent rounded hover:bg-bronze-dim transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Confirm Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
