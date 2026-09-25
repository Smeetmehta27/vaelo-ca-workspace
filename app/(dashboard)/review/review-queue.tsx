'use client'

import { formatDate } from '@/lib/utils'
import Link from 'next/link'

type ReportQueueItem = {
  id: string
  clientName: string
  reportType: string
  preparerName: string
  submittedAt: string
}

export function ReviewQueue({ reports }: { reports: ReportQueueItem[] }) {
  if (reports.length === 0) {
    return (
      <div className="bg-paper-dim rounded-card border border-stone-line px-6 py-12 text-center text-sm text-ink-soft">
        No reports currently require review.
      </div>
    )
  }

  return (
    <div className="bg-paper border border-stone-line rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-line">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Client</th>
              <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Type</th>
              <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Preparer</th>
              <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Submitted</th>
              <th className="px-6 py-4 text-left text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-line">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-paper-dim transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ink">
                  {report.clientName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-ink uppercase">
                  {report.reportType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">
                  {report.preparerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-soft">
                  {formatDate(report.submittedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link href={`/reports/${report.id}`} className="text-bronze hover:text-ink transition-colors font-medium text-sm">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
