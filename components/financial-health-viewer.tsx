'use client'

import { HealthSnapshotResult } from '@/lib/pipelines/financial-health'
import { AuditedValueDisplay } from './ui/audited-value'
import { VaeloMark } from '@/components/ui/vaelo-mark'
import { mapFinancialHealthReport } from '@/lib/report-mappers/financial-health-mapper'
import { ReportExportMenu } from '@/components/report-export-menu'

export function FinancialHealthViewer({ clientId, result }: { clientId: string; result: HealthSnapshotResult }) {
  const { flags, schedules } = mapFinancialHealthReport(result)

  return (
    <div className="flex flex-col gap-6">
      {/* Report Header (Monochrome) */}
      <div className="flex justify-between items-start border-b-2 border-ink pb-4 mb-5">
        <VaeloMark size={26} frame={false} variant="mono" />
        <div className="flex flex-col items-end gap-2">
          <ReportExportMenu clientId={clientId} reportType="health" hasReport={true} />
          <div className="text-right font-mono text-[10.5px] text-ink-soft leading-[1.7]">
            Financial Health Snapshot<br/>Confidential
          </div>
        </div>
      </div>
      {flags.length > 0 ? (
        <div className="p-4 bg-status-risk-bg border border-status-risk/30 rounded-md">
          <h4 className="font-bold text-status-risk mb-2">Items to Watch</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-status-risk">
            {flags.map((flag, i) => <li key={i}>{flag}</li>)}
          </ul>
        </div>
      ) : (
        <div className="p-4 bg-status-good-bg border border-status-good/30 rounded-md">
          <h4 className="font-bold text-status-good">No immediate concerns</h4>
          <p className="text-sm text-status-good mt-1">No sub-score fell below the review threshold (40/100).</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schedules.map((schedule, sIdx) => (
          <div key={sIdx} className="bg-paper border border-stone-line rounded-lg p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-serif text-ink">{schedule.scheduleTitle}</h3>
                {schedule.score !== undefined && (
                  <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${schedule.score < 40 ? 'bg-status-risk-bg text-status-risk border border-status-risk/30' : schedule.score < 75 ? 'bg-bronze-tint text-bronze-deep border border-bronze' : 'bg-status-good-bg text-status-good border border-status-good/30'}`}>
                    {schedule.scoreLabel} ({schedule.score})
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-2 py-2 border-y border-stone-line mb-4">
                {schedule.rows.map((row, rIdx) => (
                  <div key={rIdx} className={`flex justify-between items-center text-sm ${row.isSubtotal ? 'font-semibold pt-1 border-t border-stone-line' : ''}`}>
                    <span className={row.isSubtotal ? 'text-ink' : 'text-ink-soft'}>{row.label}</span>
                    <div className="font-mono text-ink">
                      {row.value !== null && row.value !== undefined ? (
                        <AuditedValueDisplay data={row.value} valueType={row.valueType} />
                      ) : (
                        <span>N/A</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-ink-soft italic">{schedule.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
