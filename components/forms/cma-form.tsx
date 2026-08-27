'use client'

import { useFormState, useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="px-6 py-2 bg-slate-900 text-white rounded shadow-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
    >
      {pending ? 'Generating...' : 'Run Pipeline & Generate CMA'}
    </button>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CMAForm({ action }: { action: any }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, formAction] = useFormState(action, { success: false } as any)

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {state && state.errors && state.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded text-sm mb-4">
          <p className="font-bold mb-2">Validation Errors (Engine execution halted):</p>
          <ul className="list-disc pl-5">
            {state.errors.map((err: string, i: number) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Historical Data Section */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">1. Historical Base Year (INR)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Revenue</label>
            <input type="number" min="0" name="historical_revenue" defaultValue={10000000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">COGS</label>
            <input type="number" min="0" name="historical_cogs" defaultValue={6000000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Operating Expenses</label>
            <input type="number" min="0" name="historical_opEx" defaultValue={2000000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Closing Stock</label>
            <input type="number" min="0" name="historical_stock" defaultValue={1500000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sundry Debtors</label>
            <input type="number" min="0" name="historical_debtors" defaultValue={2500000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sundry Creditors</label>
            <input type="number" min="0" name="historical_creditors" defaultValue={1000000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Other Current Assets</label>
            <input type="number" min="0" name="historical_oca" defaultValue={0} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Other Current Liabilities</label>
            <input type="number" min="0" name="historical_ocl" defaultValue={0} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fixed Assets (Net Block)</label>
            <input type="number" min="0" name="historical_fixedAssets" defaultValue={4500000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Other Non-Current Assets</label>
            <input type="number" min="0" name="historical_otherNonCurrentAssets" defaultValue={0} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Term Loans (Outstanding)</label>
            <input type="number" min="0" name="historical_termLoans" defaultValue={5000000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Short-Term Borrowings (CC/OD)</label>
            <input type="number" min="0" name="historical_shortTermBorrowings" defaultValue={2000000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Other Non-Current Liab.</label>
            <input type="number" min="0" name="historical_otherNonCurrentLiabilities" defaultValue={0} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Total Net Worth (Equity)</label>
            <input type="number" name="historical_equity" defaultValue={1000000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cash & Bank</label>
            <input type="number" min="0" name="historical_cash" defaultValue={500000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
        </div>
      </div>

      {/* Assumptions Section */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">2. Projection Assumptions</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Years to Project</label>
            <input type="number" name="yearsToProject" defaultValue={3} max={5} min={1} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Revenue Growth (%)</label>
            <input type="number" name="assump_revenueGrowth" defaultValue={15} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">COGS Margin (%)</label>
            <input type="number" min="0" max="100" name="assump_cogsMargin" defaultValue={60} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">OpEx Margin (%)</label>
            <input type="number" min="0" max="100" name="assump_opExMargin" defaultValue={20} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">OCA Margin (%)</label>
            <input type="number" min="0" max="100" name="assump_ocaMargin" defaultValue={0} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">OCL Margin (%)</label>
            <input type="number" min="0" max="100" name="assump_oclMargin" defaultValue={0} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Stock Days</label>
            <input type="number" min="0" name="assump_stockDays" defaultValue={45} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Debtor Days</label>
            <input type="number" min="0" name="assump_debtorDays" defaultValue={60} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Creditor Days</label>
            <input type="number" min="0" name="assump_creditorDays" defaultValue={45} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Interest Rate (%)</label>
            <input type="number" min="0" name="assump_interestRate" defaultValue={11} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">CapEx Margin (%)</label>
            <input type="number" min="0" name="assump_capExMargin" defaultValue={0} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Depreciation Rate (%)</label>
            <input type="number" min="0" max="100" name="assump_depreciationRate" defaultValue={10} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tax Rate (%)</label>
            <input type="number" min="0" max="100" name="assump_taxRate" defaultValue={25} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Principal Repayment (INR/yr)</label>
            <input type="number" min="0" name="assump_principalRepayment" defaultValue={1000000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">DP Stock Margin (%)</label>
            <input type="number" min="0" max="100" name="assump_dpStockMargin" defaultValue={25} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">DP Debtor Margin (%)</label>
            <input type="number" min="0" max="100" name="assump_dpDebtorMargin" defaultValue={40} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Short-Term Interest Rate (%)</label>
            <input type="number" min="0" name="assump_shortTermInterestRate" defaultValue={10} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sanctioned CC Limit (INR)</label>
            <input type="number" min="0" name="assump_sanctionedLimit" defaultValue={3000000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Cash Balance (INR)</label>
            <input type="number" min="0" name="assump_minimumCashBalance" defaultValue={50000} className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
          </div>
        </div>
      </div>

      <div className="bg-orange-50/50 p-5 rounded-lg border border-orange-100">
        <h3 className="text-sm font-semibold text-orange-900 mb-4 border-b border-orange-200 pb-2">3. Stress Scenario Overrides</h3>
        <p className="text-xs text-orange-700 mb-4">Values left blank will automatically use default stress assumptions (e.g., Base Growth - 5% for Downside).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-3 border border-orange-200 rounded-md bg-white">
            <h4 className="text-xs font-semibold text-orange-800 mb-3">Downside Case Overrides</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Revenue Growth (%)</label>
                <input type="number" name="scenario_downside_revenueGrowth" placeholder="e.g. 5" className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">COGS Margin (%)</label>
                <input type="number" name="scenario_downside_cogsMargin" placeholder="e.g. 62" className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Debtor Days</label>
                <input type="number" name="scenario_downside_debtorDays" placeholder="e.g. 105" className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
              </div>
            </div>
          </div>
          
          <div className="p-3 border border-red-200 rounded-md bg-white">
            <h4 className="text-xs font-semibold text-red-800 mb-3">Severe Stress Overrides</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Revenue Growth (%)</label>
                <input type="number" name="scenario_stress_revenueGrowth" placeholder="e.g. -5" className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">COGS Margin (%)</label>
                <input type="number" name="scenario_stress_cogsMargin" placeholder="e.g. 65" className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Debtor Days</label>
                <input type="number" name="scenario_stress_debtorDays" placeholder="e.g. 120" className="w-full px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <SubmitButton />
      </div>
    </form>
  )
}
