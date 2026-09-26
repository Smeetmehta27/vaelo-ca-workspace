'use client'

import { useState } from 'react'
import { updateReportStatus } from '@/lib/actions/report-actions'
import { addReportComment } from '@/lib/actions/comment-actions'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { InvoicePrompt } from '@/components/invoice-prompt'

type Comment = {
  id: string
  author_id: string
  figure_reference: string | null
  comment_text: string
  created_at: string
  author_email?: string
}

export function ReportReviewActions({
  reportId,
  clientId,
  currentStatus,
  comments,
  isReviewer,
  availableFigures
}: {
  reportId: string
  clientId: string
  currentStatus: string
  comments: Comment[]
  isReviewer: boolean
  availableFigures: string[]
}) {
  const router = useRouter()
  const [commentText, setCommentText] = useState('')
  const [figureRef, setFigureRef] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showInvoicePrompt, setShowInvoicePrompt] = useState(false)

  const handleAction = async (action: 'comment' | 'approve' | 'request_changes' | 'finalize') => {
    setErrorMsg('')
    if (action === 'request_changes' && !commentText.trim()) {
      setErrorMsg('A comment is required to request changes.')
      return
    }

    setIsSubmitting(true)
    try {
      let justFinalized = false;
      
      if (action === 'request_changes') {
        await updateReportStatus(reportId, 'changes_requested', commentText)
        setCommentText('')
        setFigureRef('')
      } else {
        if (commentText.trim()) {
          await addReportComment(reportId, figureRef || null, commentText)
          setCommentText('')
          setFigureRef('')
        }
        
        if (action === 'approve') {
          await updateReportStatus(reportId, 'approved')
        } else if (action === 'finalize') {
          const res = await updateReportStatus(reportId, 'finalized')
          if (res && res.justFinalized) justFinalized = true;
        }
      }
      
      if (justFinalized) {
        setShowInvoicePrompt(true)
      }
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-paper-dim border border-stone-line rounded-card overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-line flex justify-between items-center">
        <h3 className="font-serif font-medium text-ink">Review & Comments</h3>
      </div>
      
      <div className="p-6">
        {comments.length > 0 ? (
          <div className="space-y-4 mb-8">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-paper border border-stone-line p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium text-ink">{comment.author_email || 'Unknown User'}</div>
                  <div className="text-xs font-mono text-ink-soft">{formatDate(comment.created_at)}</div>
                </div>
                {comment.figure_reference && (
                  <div className="mb-2 inline-block bg-stone-line/30 px-2 py-0.5 rounded text-xs font-mono text-ink-soft">
                    Ref: {comment.figure_reference}
                  </div>
                )}
                <p className="text-sm text-ink">{comment.comment_text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-ink-soft text-sm mb-8">No comments yet.</div>
        )}

        {isReviewer && (
          <div className="flex flex-col gap-4">
            {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}
            
            <div className="flex gap-4">
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment or explain requested changes..."
                  className="w-full bg-paper border border-stone-line rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-bronze resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <select
                value={figureRef}
                onChange={(e) => setFigureRef(e.target.value)}
                className="bg-paper border border-stone-line rounded px-3 py-1.5 text-sm text-ink-soft focus:outline-none focus:ring-1 focus:ring-bronze"
              >
                <option value="">No reference</option>
                {availableFigures.map(fig => (
                  <option key={fig} value={fig}>{fig}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAction('comment')}
                  disabled={isSubmitting || !commentText.trim()}
                  className="px-4 py-1.5 text-sm font-medium bg-stone-line/30 hover:bg-stone-line/50 text-ink rounded transition-colors disabled:opacity-50"
                >
                  Add Comment
                </button>
                
                {currentStatus !== 'approved' && currentStatus !== 'finalized' && (
                  <>
                    <button
                      onClick={() => handleAction('request_changes')}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 text-sm font-medium border border-bronze text-bronze hover:bg-bronze hover:text-white rounded transition-colors disabled:opacity-50"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleAction('approve')}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 text-sm font-medium bg-ink text-paper hover:bg-ink/80 rounded transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </>
                )}
                {currentStatus === 'approved' && (
                  <button
                    onClick={() => handleAction('finalize')}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-sm font-medium bg-bronze text-white hover:bg-bronze-dim rounded transition-colors disabled:opacity-50"
                  >
                    Finalize Report
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {showInvoicePrompt && (
        <div className="px-6 pb-6">
          <InvoicePrompt reportId={reportId} clientId={clientId} autoOpen={true} />
        </div>
      )}
    </div>
  )
}
