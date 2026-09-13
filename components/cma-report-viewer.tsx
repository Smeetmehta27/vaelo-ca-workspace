'use client'

import { VaeloMark } from '@/components/ui/vaelo-mark'

import { useState } from 'react'
import { CMAProjectedYear, CMAHistoricalInput, CMAScenario } from '@/lib/pipelines/cma'
import { CMAExecutiveSummary } from './cma/cma-executive-summary'
import { CMAScenarioComparison } from './cma/cma-scenario-comparison'
import { ScheduleLayout, ScheduleRow } from './cma/schedule-layout'
import { mapCMAReportSchedules } from '@/lib/report-mappers/cma-mapper'
import { ReportExportMenu } from '@/components/report-export-menu'

export interface CMAReportViewerProps {
  clientId: string;
  historical?: CMAHistoricalInput | null;
  projections: CMAProjectedYear[];
  reportData?: Record<string, unknown>;
}


export function CMAReportViewer({ clientId, historical = null, projections, reportData }: CMAReportViewerProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('baseCase');

  const scenarios: CMAScenario[] = (reportData?.scenarios as CMAScenario[]) || [];
  const hasScenarios = scenarios.length > 0;

  // Determine which projections to show
  let activeProjections = projections;
  let activeScenario: CMAScenario | undefined = undefined;

  if (activeScenarioId !== 'baseCase' && hasScenarios) {
    activeScenario = scenarios.find(s => s.scenarioId === activeScenarioId);
    if (activeScenario && activeScenario.projections) {
      activeProjections = activeScenario.projections;
    }
  }

  if (!activeProjections || activeProjections.length === 0) {
    return <div className="text-gray-500">No projections available.</div>;
  }

  const schedules = mapCMAReportSchedules(historical, activeProjections);

  // Runtime Data Validation Boundary (VULN-006)
  // Ensures malformed or legacy projections never reach the UI components and cause .value undefined crashes
  let malformedField: string | null = null;
  const isMalformed = activeProjections.some(p => {
    if (!p.totalAssets || typeof p.totalAssets.value !== 'number') {
      malformedField = 'totalAssets';
      return true;
    }
    if (!p.totalLiabilitiesAndEquity || typeof p.totalLiabilitiesAndEquity.value !== 'number') {
      malformedField = 'totalLiabilitiesAndEquity';
      return true;
    }
    return false;
  });

  if (isMalformed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-status-risk-bg p-8">
        <h3 className="text-status-risk font-semibold mb-3 text-xl">Malformed Projection Data</h3>
        <p className="text-status-risk/80 text-sm max-w-2xl mx-auto">
          The financial data cannot be rendered safely because it is missing a required structural property: <strong>{malformedField}</strong>. This usually occurs with corrupted database rows or legacy V1 reports that were improperly mapped. Please regenerate the CMA report.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full pb-32 space-y-12">
      
      {/* Report Header (Monochrome) */}
      <div className="flex justify-between items-start border-b-2 border-ink pb-4 mb-5">
        <VaeloMark size={26} frame={false} variant="mono" />
        <div className="flex flex-col items-end gap-2">
          <ReportExportMenu clientId={clientId} reportType="cma" hasReport={true} />
          <div className="text-right font-mono text-[10.5px] text-ink-soft leading-[1.7]">
            Credit Monitoring Arrangement<br/>FY 2025–26 · Confidential
          </div>
        </div>
      </div>

      <div className="bg-paper p-4 border border-stone-line rounded-md mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif text-ink mb-1">CMA Banking Schedule Pack</h2>
          <p className="text-sm text-ink-soft">Deterministic multi-year financial projections with AuditedValue traceability.</p>
        </div>
        
        {hasScenarios && (
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-ink">Active Scenario:</span>
            <select 
              value={activeScenarioId} 
              onChange={(e) => setActiveScenarioId(e.target.value)}
              className="bg-paper border border-stone-line text-sm rounded-md shadow-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink font-mono text-ink"
            >
              <option value="baseCase">Base Case</option>
              {scenarios.map(s => (
                <option key={s.scenarioId} value={s.scenarioId}>
                  {s.name} {s.status === 'FAILED' ? '(FAILED)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {hasScenarios && (
        <CMAScenarioComparison baseProjections={projections} scenarios={scenarios} reportData={reportData} />
      )}

      {activeScenario?.status === 'FAILED' ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-status-risk-bg p-8">
        <h3 className="text-status-risk font-semibold mb-3 text-xl">Scenario Generation Failed</h3>
        <p className="text-status-risk/80 text-sm max-w-2xl mx-auto">
            {activeScenario.error || "The scenario generated an invalid financial outcome."}
          </p>
        </div>
      ) : (
        <>
          <CMAExecutiveSummary historical={historical} projections={activeProjections} />
          
          {schedules.slice(0, 2).map((s, idx) => (
            <ScheduleLayout key={idx} title={s.scheduleTitle} historical={historical} projections={activeProjections}>
              {s.rows.map((row, rIdx) => (
                <ScheduleRow
                  key={rIdx}
                  label={row.label}
                  isHeader={row.isHeader}
                  isSubTotal={row.isSubTotal}
                  indent={row.indent}
                  valueType={row.valueType}
                  historicalValue={row.historicalValue}
                  projectedValues={row.projectedValues}
                />
              ))}
            </ScheduleLayout>
          ))}
          
          <div className="my-8 border-t border-stone-line pt-8">
            <h2 className="text-2xl font-serif text-ink mb-6">Working Capital & Financing</h2>
            {schedules.slice(2, 6).map((s, idx) => (
              <ScheduleLayout key={idx} title={s.scheduleTitle} historical={historical} projections={activeProjections}>
                {s.rows.map((row, rIdx) => (
                  <ScheduleRow
                    key={rIdx}
                    label={row.label}
                    isHeader={row.isHeader}
                    isSubTotal={row.isSubTotal}
                    indent={row.indent}
                    valueType={row.valueType}
                    historicalValue={row.historicalValue}
                    projectedValues={row.projectedValues}
                  />
                ))}
              </ScheduleLayout>
            ))}
          </div>

          <div className="my-8 border-t border-stone-line pt-8">
            <h2 className="text-2xl font-serif text-ink mb-6">Cash Flow & Fixed Assets</h2>
            {schedules.slice(6, 9).map((s, idx) => (
              <ScheduleLayout key={idx} title={s.scheduleTitle} historical={historical} projections={activeProjections}>
                {s.rows.map((row, rIdx) => (
                  <ScheduleRow
                    key={rIdx}
                    label={row.label}
                    isHeader={row.isHeader}
                    isSubTotal={row.isSubTotal}
                    indent={row.indent}
                    valueType={row.valueType}
                    historicalValue={row.historicalValue}
                    projectedValues={row.projectedValues}
                  />
                ))}
              </ScheduleLayout>
            ))}
          </div>

          <div className="my-8 border-t border-stone-line pt-8">
            <h2 className="text-2xl font-serif text-ink mb-6">Long-Term Debt, Equity & Ratios</h2>
            {schedules.slice(9, 12).map((s, idx) => (
              <ScheduleLayout key={idx} title={s.scheduleTitle} historical={historical} projections={activeProjections}>
                {s.rows.map((row, rIdx) => (
                  <ScheduleRow
                    key={rIdx}
                    label={row.label}
                    isHeader={row.isHeader}
                    isSubTotal={row.isSubTotal}
                    indent={row.indent}
                    valueType={row.valueType}
                    historicalValue={row.historicalValue}
                    projectedValues={row.projectedValues}
                  />
                ))}
              </ScheduleLayout>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
