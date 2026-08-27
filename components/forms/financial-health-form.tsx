'use client'
import { useState } from 'react'

export function FinancialHealthForm({ action, defaultClientName }: { action: (payload: FormData) => void, defaultClientName?: string }) {
  const [historicalRevenues, setHistoricalRevenues] = useState<number[]>([8.0, 9.2, 10.5, 10.1, 11.4])

  return (
    <form action={action} className="flex flex-col gap-8">
      {/* Meta Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Client Name</label>
          <input type="text" name="clientName" defaultValue={defaultClientName || "Example SME Pvt Ltd"} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Sector</label>
          <input type="text" name="sector" defaultValue="Manufacturing" className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">CA Firm Name</label>
          <input type="text" name="caFirmName" defaultValue="Vaelo CA Workspace" className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
        </div>
      </div>

      {/* Liquidity & Runway */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">1. Liquidity & Cash Runway</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Current Assets (Rs Cr)</label>
            <input type="number" step="any" name="currentAssets" defaultValue={6.2} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Current Liabilities (Rs Cr)</label>
            <input type="number" step="any" name="currentLiabilities" defaultValue={3.4} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cash & Equivalents (Rs Cr)</label>
            <input type="number" step="any" name="cashAndEquivalents" defaultValue={2.1} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Net Cash Flow (Rs Cr)</label>
            <input type="number" step="any" name="monthlyNetCashFlow" defaultValue={-0.12} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
            <p className="text-[10px] text-gray-500 mt-0.5">Negative = burning, Positive = generating</p>
          </div>
        </div>
      </div>

      {/* Expense Growth */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">2. Expense vs. Revenue Growth</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Revenue (Prior Year)</label>
            <input type="number" step="any" name="revenuePriorYear" defaultValue={9.2} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Revenue (Current Year)</label>
            <input type="number" step="any" name="revenueCurrentYear" defaultValue={10.5} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">OpEx (Prior Year)</label>
            <input type="number" step="any" name="operatingExpensesPriorYear" defaultValue={7.6} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">OpEx (Current Year)</label>
            <input type="number" step="any" name="operatingExpensesCurrentYear" defaultValue={8.3} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
        </div>
      </div>

      {/* Revenue Volatility */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">3. Historical Revenue Volatility (Minimum 3 Years)</h4>
        
        {/* We use a hidden input to pass the actual array string to the server action */}
        <input type="hidden" name="historicalRevenue" value={historicalRevenues.join(',')} />
        
        <div className="flex flex-col gap-3">
          {historicalRevenues.map((rev, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <label className="w-16 text-xs text-gray-600">Year {idx + 1}:</label>
              <input 
                type="number" 
                step="any" 
                value={rev}
                onChange={(e) => {
                  const newRevs = [...historicalRevenues];
                  newRevs[idx] = Number(e.target.value);
                  setHistoricalRevenues(newRevs);
                }}
                className="w-32 px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" 
              />
              {historicalRevenues.length > 3 && (
                <button 
                  type="button" 
                  onClick={() => setHistoricalRevenues(historicalRevenues.filter((_, i) => i !== idx))}
                  className="text-xs text-red-500 hover:text-red-700 underline px-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {historicalRevenues.length < 5 && (
            <button 
              type="button" 
              onClick={() => setHistoricalRevenues([...historicalRevenues, 0])}
              className="text-xs text-blue-600 hover:text-blue-800 underline self-start mt-2"
            >
              + Add Historical Year
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded shadow-sm font-medium hover:bg-slate-800 transition-colors">
          Run Health Snapshot
        </button>
      </div>
    </form>
  )
}
