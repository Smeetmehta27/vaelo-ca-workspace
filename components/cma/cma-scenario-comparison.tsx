'use client'

import { CMAScenario, CMAProjectedYear } from '@/lib/pipelines/cma'

export interface CMAScenarioComparisonProps {
  baseProjections: CMAProjectedYear[];
  scenarios: CMAScenario[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reportData?: any;
}

export function CMAScenarioComparison({ baseProjections, scenarios, reportData }: CMAScenarioComparisonProps) {
  if (!scenarios || scenarios.length === 0) {
    return null;
  }

  const baseCaseRisk = reportData?.baseCase?.riskScore;
  const worstCase = reportData?.worstCaseSummary;

  // We want to compare the FINAL year of each scenario for simplicity in this dashboard
  const getFinalYear = (projections?: CMAProjectedYear[]) => {
    if (!projections || projections.length === 0) return null;
    return projections[projections.length - 1];
  };

  const baseFinal = getFinalYear(baseProjections);

  const formatValue = (val: { value: number } | undefined | null) => {
    if (val === undefined || val === null || val.value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val.value);
  };

  const formatRatio = (val: { value: number } | undefined | null) => {
    if (val === undefined || val === null || val.value === undefined) return '-';
    return val.value.toFixed(2);
  };

  return (
    <div className="bg-paper rounded-lg border border-stone-line overflow-hidden shadow-sm mb-12">
      <div className="px-6 py-5 border-b border-stone-line bg-paper-dim flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-ink">Scenario Comparison (Final Year)</h3>
          <p className="text-sm text-ink-soft mt-1">Key metrics across all generated stress scenarios.</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-paper-dim text-ink-soft font-semibold border-b border-stone-line">
            <tr>
              <th className="px-6 py-4 w-1/4">Metric</th>
              <th className="px-6 py-4 text-right font-mono">
                <div className="text-ink">Base Case</div>
                <div className="text-xs text-ink-soft font-normal mt-1">Original Projections</div>
              </th>
              {scenarios.map(s => (
                <th key={s.scenarioId} className="px-6 py-4 text-right font-mono">
                  <div className="text-slate-800 flex items-center justify-end space-x-2">
                    <span>{s.name}</span>
                    {s.status === 'FAILED' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-status-risk-bg text-status-risk">FAILED</span>}
                  </div>
                  <div className="text-xs text-ink-soft font-normal mt-1">{s.description}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-line">
            {/* Profitability */}
            <tr className="bg-paper-dim/50">
              <td colSpan={scenarios.length + 2} className="px-6 py-2 font-semibold text-ink-soft text-xs uppercase tracking-wider">Profitability</td>
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">Revenue</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">{formatValue(baseFinal?.revenue)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-ink-soft font-mono">{formatValue(getFinalYear(s.projections)?.revenue)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">EBITDA</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">{formatValue(baseFinal?.ebitda)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-ink-soft font-mono">{formatValue(getFinalYear(s.projections)?.ebitda)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">Net Profit (PAT)</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">{formatValue(baseFinal?.netProfit)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-ink-soft font-mono">{formatValue(getFinalYear(s.projections)?.netProfit)}</td>)}
            </tr>

            {/* Liquidity */}
            <tr className="bg-paper-dim/50">
              <td colSpan={scenarios.length + 2} className="px-6 py-2 font-semibold text-ink-soft text-xs uppercase tracking-wider mt-4">Liquidity & Working Capital</td>
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">Closing Cash</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">{formatValue(baseFinal?.cash)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-ink-soft font-mono">{formatValue(getFinalYear(s.projections)?.cash)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">Net Working Capital</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">{formatValue(baseFinal?.netWorkingCapital)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-ink-soft font-mono">{formatValue(getFinalYear(s.projections)?.netWorkingCapital)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">Current Ratio</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">{formatRatio(baseFinal?.currentRatio)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-ink-soft font-mono">{formatRatio(getFinalYear(s.projections)?.currentRatio)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">Total Debt / Equity Ratio</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">{formatRatio(baseFinal?.debtEquityRatio)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-ink-soft font-mono">{formatRatio(getFinalYear(s.projections)?.debtEquityRatio)}</td>)}
            </tr>

            {/* Facilities */}
            <tr className="bg-paper-dim/50">
              <td colSpan={scenarios.length + 2} className="px-6 py-2 font-semibold text-ink-soft text-xs uppercase tracking-wider mt-4">Borrowing Limits</td>
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">MPBF (Method 2)</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">{formatValue(baseFinal?.mpbfMethod2)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-ink-soft font-mono">{formatValue(getFinalYear(s.projections)?.mpbfMethod2)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">Drawing Power</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">{formatValue(baseFinal?.drawingPower)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-ink-soft font-mono">{formatValue(getFinalYear(s.projections)?.drawingPower)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">Sanctioned CC Limit</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">{formatValue({ value: baseFinal?.drawingPower?.inputs?.sanctionedLimit ?? 0 })}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-ink-soft font-mono">{formatValue({ value: getFinalYear(s.projections)?.drawingPower?.inputs?.sanctionedLimit ?? 0 })}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">CC Utilization</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">{formatValue(baseFinal?.shortTermBorrowings)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-ink-soft font-mono">{formatValue(getFinalYear(s.projections)?.shortTermBorrowings)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">Unfunded Cash Deficit</td>
              <td className="px-6 py-3 text-right font-medium text-status-risk font-mono">{formatValue(baseFinal?.unfundedCashDeficit)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-status-risk font-mono">{formatValue(getFinalYear(s.projections)?.unfundedCashDeficit)}</td>)}
            </tr>
            
            {/* Health & Warnings */}
            <tr className="bg-paper-dim/50">
              <td colSpan={scenarios.length + 2} className="px-6 py-2 font-semibold text-ink-soft text-xs uppercase tracking-wider mt-4">Scenario Health</td>
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">Status</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-status-good-bg text-status-good border border-status-good/30">VALID</span>
              </td>
              {scenarios.map(s => (
                <td key={s.scenarioId} className="px-6 py-3 text-right font-mono">
                  {s.status === 'FAILED' ? (
                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-status-risk-bg text-status-risk">FAILED</span>
                      <span className="text-xs text-status-risk mt-1 max-w-[150px] truncate" title={s.error}>{s.error}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-status-good-bg text-status-good border border-status-good/30">VALID</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">Risk Grade</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">
                {baseCaseRisk ? (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${baseCaseRisk.grade === 'A' ? 'bg-status-good-bg text-status-good border border-status-good/30' : baseCaseRisk.grade === 'B' ? 'bg-paper-dim text-ink-soft' : baseCaseRisk.grade === 'C' ? 'bg-bronze-tint text-bronze-deep' : 'bg-status-risk-bg text-status-risk'}`}>{baseCaseRisk.grade} (Score: {baseCaseRisk.totalScore})</span>
                ) : '-'}
              </td>
              {scenarios.map(s => (
                <td key={s.scenarioId} className="px-6 py-3 text-right font-mono">
                  {s.status === 'FAILED' ? <span className="text-stone">-</span> : (
                    s.riskScore ? (
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.riskScore.grade === 'A' ? 'bg-status-good-bg text-status-good border border-status-good/30' : s.riskScore.grade === 'B' ? 'bg-paper-dim text-ink-soft' : s.riskScore.grade === 'C' ? 'bg-bronze-tint text-bronze-deep' : 'bg-status-risk-bg text-status-risk'}`}>{s.riskScore.grade} (Score: {s.riskScore.totalScore})</span>
                        {s.deltas && <span className={`text-xs ${s.deltas.riskScore.absolute > 0 ? 'text-status-risk' : 'text-status-good'}`}>
                          {s.deltas.riskScore.absolute > 0 ? '+' : ''}{s.deltas.riskScore.absolute} pts
                        </span>}
                        {worstCase?.worstRiskScenarioId === s.scenarioId && <span className="text-[10px] font-bold text-status-risk bg-status-risk-bg px-1 border border-status-risk/30 rounded uppercase">Worst Case (Risk)</span>}
                      </div>
                    ) : '-'
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-3 text-ink-soft">Warnings & Covenants (Final Year)</td>
              <td className="px-6 py-3 text-right font-medium text-ink font-mono">
                <span className="text-stone">-</span>
              </td>
              {scenarios.map(s => (
                <td key={s.scenarioId} className="px-6 py-3 text-right font-mono">
                  {s.status === 'FAILED' ? (
                    <span className="text-stone">-</span>
                  ) : (
                    <div className="flex flex-col items-end space-y-1">
                      {(() => {
                        const finalYearCovenants = s.covenants && s.covenants.length > 0 ? s.covenants[s.covenants.length - 1] : [];
                        const breaches = finalYearCovenants.filter(c => c.status === 'BREACH').length;
                        const warnings = finalYearCovenants.filter(c => c.status === 'WARNING').length;
                        const validationWarnings = s.warnings?.length || 0;
                        const totalIssues = breaches + warnings + validationWarnings;

                        if (totalIssues === 0) {
                          return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-status-good-bg text-status-good border border-status-good/30">Healthy</span>;
                        }

                        return (
                          <>
                            {breaches > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-status-risk-bg text-status-risk">={breaches} Breach(es)</span>}
                            {(warnings > 0 || validationWarnings > 0) && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-bronze-tint text-bronze-deep">{warnings + validationWarnings} Warning(s)</span>}
                            {s.riskScore && s.riskScore.components.length > 0 && (
                               <span className="text-[10px] text-ink-soft mt-1 max-w-[120px] text-right truncate font-mono" title={s.riskScore.components.map(c => `${c.name}: ${c.reason}`).join(', ')}>
                                 {s.riskScore.components[0].name} Issue...
                               </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
