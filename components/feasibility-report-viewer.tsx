'use client'

import { DealFeasibilityReportResult } from '@/lib/pipelines/feasibility'
import { AuditedValueDisplay } from './ui/audited-value'
import { VaeloMark } from '@/components/ui/vaelo-mark'
import { mapFeasibilityReport } from '@/lib/report-mappers/feasibility-mapper'
import { ReportExportMenu } from '@/components/report-export-menu'

export function FeasibilityReportViewer({ clientId, result }: { clientId: string; result: DealFeasibilityReportResult }) {
  const { verdict, schedules, leverage, synergy, breakeven } = mapFeasibilityReport(result)

  return (
    <div className="flex flex-col gap-6 text-sm">
      {/* Report Header (Monochrome) */}
      <div className="flex justify-between items-start border-b-2 border-ink pb-4 mb-5">
        <VaeloMark size={26} frame={false} variant="mono" />
        <div className="flex flex-col items-end gap-2">
          <ReportExportMenu clientId={clientId} reportType="feasibility" hasReport={true} />
          <div className="text-right font-mono text-[10.5px] text-ink-soft leading-[1.7]">
            Deal Feasibility Report<br/>Confidential
          </div>
        </div>
      </div>
      {/* Verdict Section */}
      <div className={`p-4 rounded-md border ${verdict.reasons.length === 0 ? 'bg-status-good-bg border-status-good/30' : verdict.reasons.length === 1 ? 'bg-bronze-tint border-bronze' : 'bg-status-risk-bg border-status-risk/30'}`}>
        <h4 className={`text-lg font-bold mb-2 ${verdict.reasons.length === 0 ? 'text-status-good' : verdict.reasons.length === 1 ? 'text-bronze-deep' : 'text-status-risk'}`}>
          {verdict.verdict}
        </h4>
        {verdict.reasons.length > 0 && (
          <ul className={`list-disc pl-5 space-y-1 ${verdict.reasons.length === 1 ? 'text-bronze-deep' : 'text-status-risk'}`}>
            {verdict.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {schedules.map((schedule, sIdx) => (
          <div key={sIdx} className="bg-paper border border-stone-line rounded-md shadow-sm overflow-hidden">
            <div className="bg-paper-dim px-4 py-2 border-b border-stone-line font-serif text-ink">
              {schedule.scheduleTitle}
            </div>
            <div className="p-4 flex flex-col gap-3">
              {schedule.rows.map((row, rIdx) => (
                <div key={rIdx} className={row.isSubtotal ? 'flex justify-between items-center pb-2 bg-paper-dim -mx-4 px-4 py-2 rounded' : 'flex justify-between items-center border-b border-stone-line pb-2'}>
                  <span className={row.isSubtotal ? 'font-serif text-ink' : 'text-ink-soft'}>{row.label}</span>
                  {row.isCustom ? (
                    <span className="font-mono text-ink">{row.customValue}</span>
                  ) : (
                    <AuditedValueDisplay data={row.value} valueType={row.valueType} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Leverage & Synergies */}
        <div className="bg-paper border border-stone-line rounded-md shadow-sm overflow-hidden lg:col-span-2">
          <div className="bg-paper-dim px-4 py-2 border-b border-stone-line font-serif text-ink flex justify-between">
            <span>Leverage & Synergies</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <h5 className="font-serif text-ink-soft border-b border-stone-line pb-1">Leverage Check</h5>
              <div className="flex justify-between items-center">
                <span className="text-ink-soft">Pro-Forma Net Debt</span>
                <AuditedValueDisplay data={leverage.proFormaNetDebt} valueType='currency' />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-soft">Leverage Ratio</span>
                <div className="flex items-center gap-2">
                  {leverage.leverageRatio ? <AuditedValueDisplay data={leverage.leverageRatio} /> : <span>N/A</span>}
                  <span className="text-xs text-ink-soft">(Max {leverage.leverageThreshold}x)</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 border-t border-stone-line md:border-t-0 md:border-l md:pl-8 pt-4 md:pt-0">
              <h5 className="font-serif text-ink-soft border-b border-stone-line pb-1">Synergy NPV & Breakeven</h5>
              <div className="flex justify-between items-center">
                <span className="text-ink-soft">Total Synergy NPV</span>
                <AuditedValueDisplay data={synergy.totalSynergyNpv} valueType='currency' />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-soft">Breakeven Synergy Required (After-Tax)</span>
                <AuditedValueDisplay data={breakeven.breakevenAfterTaxSynergyRequired} valueType='currency' />
              </div>
              {breakeven.note && (
                <p className="text-xs text-ink-soft mt-1 italic">{breakeven.note}</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
