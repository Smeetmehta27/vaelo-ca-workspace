'use client'

import { HealthSnapshotResult } from '@/lib/pipelines/financial-health'
import { AuditedValueDisplay } from './ui/audited-value'

export function FinancialHealthViewer({ result }: { result: HealthSnapshotResult }) {
  const { liquidity, expenseGrowth, cashRunway, revenueVolatility, flags } = result

  return (
    <div className="flex flex-col gap-6">
      {flags.length > 0 ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="font-bold text-red-900 mb-2">Items to Watch</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-red-800">
            {flags.map((flag, i) => <li key={i}>{flag}</li>)}
          </ul>
        </div>
      ) : (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="font-bold text-green-900">No immediate concerns</h4>
          <p className="text-sm text-green-800 mt-1">No sub-score fell below the review threshold (40/100).</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Liquidity */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Liquidity</h3>
              <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${liquidity.score < 40 ? 'bg-red-100 text-red-800' : liquidity.score < 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {liquidity.label} ({liquidity.score})
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-y border-slate-100 mb-4">
              <span className="text-sm text-slate-500 font-medium">Current Ratio</span>
              {liquidity.currentRatio ? (
                <div className="text-lg font-semibold text-slate-900">
                  <AuditedValueDisplay data={liquidity.currentRatio} />
                </div>
              ) : (
                <span className="text-lg font-semibold text-slate-900">N/A</span>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-600 italic">{liquidity.note}</p>
        </div>

        {/* Expense Growth */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Expense Growth</h3>
              <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${expenseGrowth.score < 40 ? 'bg-red-100 text-red-800' : expenseGrowth.score < 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {expenseGrowth.label} ({expenseGrowth.score})
              </span>
            </div>
            
            <div className="flex flex-col gap-2 py-2 border-y border-slate-100 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Revenue Growth</span>
                <AuditedValueDisplay data={expenseGrowth.revenueGrowthPct} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Expense Growth</span>
                <AuditedValueDisplay data={expenseGrowth.expenseGrowthPct} />
              </div>
              <div className="flex justify-between items-center text-sm font-semibold pt-1 border-t border-slate-50">
                <span className="text-slate-700">Spread</span>
                <AuditedValueDisplay data={expenseGrowth.spreadPct} />
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 italic">{expenseGrowth.note}</p>
        </div>

        {/* Cash Runway */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Cash Runway</h3>
              <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${cashRunway.score < 40 ? 'bg-red-100 text-red-800' : cashRunway.score < 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {cashRunway.label} ({cashRunway.score})
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-y border-slate-100 mb-4">
              <span className="text-sm text-slate-500 font-medium">Months of Runway</span>
              {cashRunway.runwayMonths ? (
                <div className="text-lg font-semibold text-slate-900">
                  <AuditedValueDisplay data={cashRunway.runwayMonths} />
                </div>
              ) : (
                <span className="text-lg font-semibold text-green-700">N/A</span>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-600 italic">{cashRunway.note}</p>
        </div>

        {/* Revenue Volatility */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Revenue Volatility</h3>
              <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${revenueVolatility.score < 40 ? 'bg-red-100 text-red-800' : revenueVolatility.score < 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {revenueVolatility.label} ({revenueVolatility.score})
              </span>
            </div>
            
            <div className="flex flex-col gap-2 py-2 border-y border-slate-100 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Mean Revenue</span>
                <AuditedValueDisplay data={revenueVolatility.meanRevenue} isCurrency={true} />
              </div>
              <div className="flex justify-between items-center text-sm font-semibold pt-1 border-t border-slate-50">
                <span className="text-slate-700">Coefficient of Variation</span>
                {revenueVolatility.coefficientOfVariation ? <AuditedValueDisplay data={revenueVolatility.coefficientOfVariation} /> : <span>N/A</span>}
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 italic">{revenueVolatility.note}</p>
        </div>

      </div>
    </div>
  )
}
