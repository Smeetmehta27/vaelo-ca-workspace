'use client'

import { DealFeasibilityReportResult } from '@/lib/pipelines/feasibility'
import { AuditedValueDisplay } from './ui/audited-value'

export function FeasibilityReportViewer({ result }: { result: DealFeasibilityReportResult }) {
  const { premium, sourcesAndUses, proForma, synergy, accretionDilution, leverage, breakeven, verdict } = result

  return (
    <div className="flex flex-col gap-6 text-sm">
      {/* Verdict Section */}
      <div className={`p-4 rounded-md border ${verdict.reasons.length === 0 ? 'bg-green-50 border-green-200' : verdict.reasons.length === 1 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
        <h4 className={`text-lg font-bold mb-2 ${verdict.reasons.length === 0 ? 'text-green-900' : verdict.reasons.length === 1 ? 'text-yellow-900' : 'text-red-900'}`}>
          {verdict.verdict}
        </h4>
        {verdict.reasons.length > 0 && (
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            {verdict.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Economics */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-slate-800">
            Premium & Economics
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600">Target Standalone Value</span>
              <AuditedValueDisplay data={premium.targetStandaloneValue} isCurrency={true} />
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600">Purchase Price</span>
              <span className="font-medium">₹{premium.purchasePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-2 bg-blue-50/50 -mx-4 px-4 py-2 rounded">
              <span className="font-semibold text-blue-900">Premium %</span>
              <AuditedValueDisplay data={premium.premiumPct} />
            </div>
          </div>
        </div>

        {/* Sources & Uses */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-slate-800">
            Sources & Uses (Cash)
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600">Cash Needed</span>
              <AuditedValueDisplay data={sourcesAndUses.cashNeeded} isCurrency={true} />
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600">Cash Sources (Debt + Acquirer Cash)</span>
              <AuditedValueDisplay data={sourcesAndUses.cashSources} isCurrency={true} />
            </div>
            <div className="flex justify-between items-center pb-2 bg-slate-50 -mx-4 px-4 py-2 rounded">
              <span className="font-semibold text-slate-800">Funding Gap</span>
              <AuditedValueDisplay data={sourcesAndUses.cashFundingGap} isCurrency={true} />
            </div>
          </div>
        </div>

        {/* Pro Forma Combined */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-slate-800">
            Pro-Forma Combined (Day 1)
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600">Combined Revenue</span>
              <AuditedValueDisplay data={proForma.combinedRevenue} isCurrency={true} />
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600">Combined EBITDA</span>
              <AuditedValueDisplay data={proForma.combinedEbitdaPreSynergy} isCurrency={true} />
            </div>
            <div className="flex justify-between items-center pb-2 bg-slate-50 -mx-4 px-4 py-2 rounded">
              <span className="font-semibold text-slate-800">Pro-Forma Net Income</span>
              <AuditedValueDisplay data={proForma.combinedNetIncomePreSynergy} isCurrency={true} />
            </div>
          </div>
        </div>

        {/* Accretion / Dilution */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-slate-800">
            Accretion / Dilution (EPS)
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600">Acquirer Standalone EPS</span>
              <AuditedValueDisplay data={accretionDilution.acquirerStandaloneEps} />
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600">Pro-forma EPS (Pre-Synergy)</span>
              <AuditedValueDisplay data={accretionDilution.proFormaEpsPreSynergy} />
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 bg-blue-50/30 -mx-4 px-4 py-2">
              <span className="font-semibold text-blue-900">Pre-Synergy Impact %</span>
              <AuditedValueDisplay data={accretionDilution.changePreSynergyPct} />
            </div>
            <div className="flex justify-between items-center pb-2 bg-blue-50/50 -mx-4 px-4 py-2">
              <span className="font-semibold text-blue-900">Post-Synergy Impact %</span>
              <AuditedValueDisplay data={accretionDilution.changePostSynergyPct} />
            </div>
          </div>
        </div>

        {/* Leverage & Synergies */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden lg:col-span-2">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-slate-800 flex justify-between">
            <span>Leverage & Synergies</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <h5 className="font-semibold text-slate-700 border-b pb-1">Leverage Check</h5>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Pro-Forma Net Debt</span>
                <AuditedValueDisplay data={leverage.proFormaNetDebt} isCurrency={true} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Leverage Ratio</span>
                <div className="flex items-center gap-2">
                  {leverage.leverageRatio ? <AuditedValueDisplay data={leverage.leverageRatio} /> : <span>N/A</span>}
                  <span className="text-xs text-slate-400">(Max {leverage.leverageThreshold}x)</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 border-t md:border-t-0 md:border-l md:pl-8 pt-4 md:pt-0">
              <h5 className="font-semibold text-slate-700 border-b pb-1">Synergy NPV & Breakeven</h5>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Synergy NPV</span>
                <AuditedValueDisplay data={synergy.totalSynergyNpv} isCurrency={true} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Breakeven Synergy Required (After-Tax)</span>
                <AuditedValueDisplay data={breakeven.breakevenAfterTaxSynergyRequired} isCurrency={true} />
              </div>
              {breakeven.note && (
                <p className="text-xs text-green-600 mt-1 italic">{breakeven.note}</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
