import { getPendingReviews } from '@/lib/actions/review-actions'
import { ReviewQueue } from './review-queue'

export default async function ReviewPage() {
  const formattedReports = await getPendingReviews()

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-medium text-ink">Review Queue</h1>
        <p className="text-ink-soft mt-1">
          Reports awaiting manager approval.
        </p>
      </div>
      <ReviewQueue reports={formattedReports} />
    </div>
  )
}
