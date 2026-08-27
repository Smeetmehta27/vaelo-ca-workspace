'use client'

import { useState } from 'react'
import { CMAProjectedYear, CMAHistoricalInput, CMAScenario } from '@/lib/pipelines/cma'
import { CMAExecutiveSummary } from './cma/cma-executive-summary'
import { CMAScenarioComparison } from './cma/cma-scenario-comparison'
import { CMAProfitLossSchedule } from './cma/cma-profit-loss-schedule'
import { CMABalanceSheetSchedule } from './cma/cma-balance-sheet-schedule'
import { CMAWorkingCapitalSchedule } from './cma/cma-working-capital-schedule'
import { CMAMPBFSchedule } from './cma/cma-mpbf-schedule'
import { CMADrawingPowerSchedule } from './cma/cma-drawing-power-schedule'
import { CMACCSchedule } from './cma/cma-cc-schedule'
import { CMAChangesInWCSchedule, CMACashFlowSchedule } from './cma/cma-cash-flow-schedule'
import { CMAFixedAssetsSchedule } from './cma/cma-fixed-assets-schedule'
import { CMADebtSchedule } from './cma/cma-debt-schedule'
import { CMAEquitySchedule } from './cma/cma-equity-schedule'
import { CMARatioSchedule } from './cma/cma-ratio-schedule'

export interface CMAReportViewerProps {
  historical?: CMAHistoricalInput | null;
  projections: CMAProjectedYear[];
  reportData?: Record<string, unknown>;
}


export function CMAReportViewer({ historical = null, projections, reportData }: CMAReportViewerProps) {
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
      <div className="bg-red-50 border border-red-200 p-8 rounded-md my-8 text-center">
        <h3 className="text-red-800 font-semibold mb-3 text-xl">Malformed Projection Data</h3>
        <p className="text-red-700 text-sm max-w-2xl mx-auto">
          The financial data cannot be rendered safely because it is missing a required structural property: <strong>{malformedField}</strong>. This usually occurs with corrupted database rows or legacy V1 reports that were improperly mapped. Please regenerate the CMA report.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full pb-32 space-y-12">
      <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-md mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-blue-900 mb-1">CMA Banking Schedule Pack</h2>
          <p className="text-sm text-blue-700">Deterministic multi-year financial projections with AuditedValue traceability.</p>
        </div>
        
        {hasScenarios && (
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-blue-900">Active Scenario:</span>
            <select 
              value={activeScenarioId} 
              onChange={(e) => setActiveScenarioId(e.target.value)}
              className="bg-white border border-blue-200 text-sm rounded-md shadow-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="bg-red-50 border border-red-200 p-8 rounded-md my-8 text-center">
          <h3 className="text-red-800 font-semibold mb-3 text-xl">Scenario Generation Failed</h3>
          <p className="text-red-700 text-sm max-w-2xl mx-auto">
            {activeScenario.error || "The scenario generated an invalid financial outcome."}
          </p>
        </div>
      ) : (
        <>
          <CMAExecutiveSummary historical={historical} projections={activeProjections} />
          <CMAProfitLossSchedule historical={historical} projections={activeProjections} />
          <CMABalanceSheetSchedule historical={historical} projections={activeProjections} />
          
          <div className="my-8 border-t-2 border-slate-200 pt-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">Working Capital & Financing</h2>
            <CMAWorkingCapitalSchedule historical={historical} projections={activeProjections} />
            <CMAMPBFSchedule historical={historical} projections={activeProjections} />
            <CMADrawingPowerSchedule historical={historical} projections={activeProjections} />
            <CMACCSchedule historical={historical} projections={activeProjections} />
          </div>

          <div className="my-8 border-t-2 border-slate-200 pt-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">Cash Flow & Fixed Assets</h2>
            <CMAChangesInWCSchedule historical={historical} projections={activeProjections} />
            <CMACashFlowSchedule historical={historical} projections={activeProjections} />
            <CMAFixedAssetsSchedule historical={historical} projections={activeProjections} />
          </div>

          <div className="my-8 border-t-2 border-slate-200 pt-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">Long-Term Debt, Equity & Ratios</h2>
            <CMADebtSchedule historical={historical} projections={activeProjections} />
            <CMAEquitySchedule historical={historical} projections={activeProjections} />
            <CMARatioSchedule historical={historical} projections={activeProjections} />
          </div>
        </>
      )}
    </div>
  )
}
