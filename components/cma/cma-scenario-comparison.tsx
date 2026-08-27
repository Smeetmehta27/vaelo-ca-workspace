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

  const formatCurrency = (val: { value: number } | undefined | null) => {
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
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm mb-12">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Scenario Comparison (Final Year)</h3>
          <p className="text-sm text-slate-500 mt-1">Key metrics across all generated stress scenarios.</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-1/4">Metric</th>
              <th className="px-6 py-4 text-right">
                <div className="text-slate-800">Base Case</div>
                <div className="text-xs text-slate-500 font-normal mt-1">Original Projections</div>
              </th>
              {scenarios.map(s => (
                <th key={s.scenarioId} className="px-6 py-4 text-right">
                  <div className="text-slate-800 flex items-center justify-end space-x-2">
                    <span>{s.name}</span>
                    {s.status === 'FAILED' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">FAILED</span>}
                  </div>
                  <div className="text-xs text-slate-500 font-normal mt-1">{s.description}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {/* Profitability */}
            <tr className="bg-slate-50/50">
              <td colSpan={scenarios.length + 2} className="px-6 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider">Profitability</td>
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">Revenue</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">{formatCurrency(baseFinal?.revenue)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-slate-700">{formatCurrency(getFinalYear(s.projections)?.revenue)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">EBITDA</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">{formatCurrency(baseFinal?.ebitda)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-slate-700">{formatCurrency(getFinalYear(s.projections)?.ebitda)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">Net Profit (PAT)</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">{formatCurrency(baseFinal?.netProfit)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-slate-700">{formatCurrency(getFinalYear(s.projections)?.netProfit)}</td>)}
            </tr>

            {/* Liquidity */}
            <tr className="bg-slate-50/50">
              <td colSpan={scenarios.length + 2} className="px-6 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider mt-4">Liquidity & Working Capital</td>
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">Closing Cash</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">{formatCurrency(baseFinal?.cash)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-slate-700">{formatCurrency(getFinalYear(s.projections)?.cash)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">Net Working Capital</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">{formatCurrency(baseFinal?.netWorkingCapital)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-slate-700">{formatCurrency(getFinalYear(s.projections)?.netWorkingCapital)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">Current Ratio</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">{formatRatio(baseFinal?.currentRatio)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-slate-700">{formatRatio(getFinalYear(s.projections)?.currentRatio)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">Total Debt / Equity Ratio</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">{formatRatio(baseFinal?.debtEquityRatio)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-slate-700">{formatRatio(getFinalYear(s.projections)?.debtEquityRatio)}</td>)}
            </tr>

            {/* Facilities */}
            <tr className="bg-slate-50/50">
              <td colSpan={scenarios.length + 2} className="px-6 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider mt-4">Borrowing Limits</td>
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">MPBF (Method 2)</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">{formatCurrency(baseFinal?.mpbfMethod2)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-slate-700">{formatCurrency(getFinalYear(s.projections)?.mpbfMethod2)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">Drawing Power</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">{formatCurrency(baseFinal?.drawingPower)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-slate-700">{formatCurrency(getFinalYear(s.projections)?.drawingPower)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">Sanctioned CC Limit</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">{formatCurrency({ value: baseFinal?.drawingPower.inputs?.sanctionedLimit ?? 0 })}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-slate-700">{formatCurrency({ value: getFinalYear(s.projections)?.drawingPower.inputs?.sanctionedLimit ?? 0 })}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">CC Utilization</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">{formatCurrency(baseFinal?.shortTermBorrowings)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-slate-700">{formatCurrency(getFinalYear(s.projections)?.shortTermBorrowings)}</td>)}
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">Unfunded Cash Deficit</td>
              <td className="px-6 py-3 text-right font-medium text-red-600">{formatCurrency(baseFinal?.unfundedCashDeficit)}</td>
              {scenarios.map(s => <td key={s.scenarioId} className="px-6 py-3 text-right text-red-600">{formatCurrency(getFinalYear(s.projections)?.unfundedCashDeficit)}</td>)}
            </tr>
            
            {/* Health & Warnings */}
            <tr className="bg-slate-50/50">
              <td colSpan={scenarios.length + 2} className="px-6 py-2 font-semibold text-slate-700 text-xs uppercase tracking-wider mt-4">Scenario Health</td>
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">Status</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">VALID</span>
              </td>
              {scenarios.map(s => (
                <td key={s.scenarioId} className="px-6 py-3 text-right">
                  {s.status === 'FAILED' ? (
                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">FAILED</span>
                      <span className="text-xs text-red-600 mt-1 max-w-[150px] truncate" title={s.error}>{s.error}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">VALID</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">Risk Grade</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">
                {baseCaseRisk ? (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${baseCaseRisk.grade === 'A' ? 'bg-green-100 text-green-800' : baseCaseRisk.grade === 'B' ? 'bg-blue-100 text-blue-800' : baseCaseRisk.grade === 'C' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{baseCaseRisk.grade} (Score: {baseCaseRisk.totalScore})</span>
                ) : '-'}
              </td>
              {scenarios.map(s => (
                <td key={s.scenarioId} className="px-6 py-3 text-right">
                  {s.status === 'FAILED' ? <span className="text-slate-400">-</span> : (
                    s.riskScore ? (
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.riskScore.grade === 'A' ? 'bg-green-100 text-green-800' : s.riskScore.grade === 'B' ? 'bg-blue-100 text-blue-800' : s.riskScore.grade === 'C' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{s.riskScore.grade} (Score: {s.riskScore.totalScore})</span>
                        {s.deltas && <span className={`text-xs ${s.deltas.riskScore.absolute > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {s.deltas.riskScore.absolute > 0 ? '+' : ''}{s.deltas.riskScore.absolute} pts
                        </span>}
                        {worstCase?.worstRiskScenarioId === s.scenarioId && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 border border-red-200 rounded uppercase">Worst Case (Risk)</span>}
                      </div>
                    ) : '-'
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-600">Warnings & Covenants (Final Year)</td>
              <td className="px-6 py-3 text-right font-medium text-slate-900">
                <span className="text-slate-400">-</span>
              </td>
              {scenarios.map(s => (
                <td key={s.scenarioId} className="px-6 py-3 text-right">
                  {s.status === 'FAILED' ? (
                    <span className="text-slate-400">-</span>
                  ) : (
                    <div className="flex flex-col items-end space-y-1">
                      {(() => {
                        const finalYearCovenants = s.covenants && s.covenants.length > 0 ? s.covenants[s.covenants.length - 1] : [];
                        const breaches = finalYearCovenants.filter(c => c.status === 'BREACH').length;
                        const warnings = finalYearCovenants.filter(c => c.status === 'WARNING').length;
                        const validationWarnings = s.warnings?.length || 0;
                        const totalIssues = breaches + warnings + validationWarnings;

                        if (totalIssues === 0) {
                          return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Healthy</span>;
                        }

                        return (
                          <>
                            {breaches > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">{breaches} Breach(es)</span>}
                            {(warnings > 0 || validationWarnings > 0) && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">{warnings + validationWarnings} Warning(s)</span>}
                            {s.riskScore && s.riskScore.components.length > 0 && (
                               <span className="text-[10px] text-slate-500 mt-1 max-w-[120px] text-right truncate" title={s.riskScore.components.map(c => `${c.name}: ${c.reason}`).join(', ')}>
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
