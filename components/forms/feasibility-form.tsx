export function FeasibilityForm({ action, defaultClientName }: { action: (payload: FormData) => void, defaultClientName?: string }) {
  return (
    <form action={action} className="flex flex-col gap-8">
      {/* Meta Section */}
      <div>
        <h4 className="text-md font-semibold text-ink border-b border-gray-100 pb-2 mb-4">1. Deal Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Acquirer Name</label>
            <input type="text" name="acquirerName" defaultValue="Acquirer Pvt Ltd" className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Target Name</label>
            <input type="text" name="targetName" defaultValue={defaultClientName || "Target Pvt Ltd"} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Sector</label>
            <input type="text" name="sector" defaultValue="Manufacturing" className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">CA Firm Name</label>
            <input type="text" name="caFirmName" defaultValue="Vaelo CA Workspace" className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1">Deal Rationale</label>
            <input type="text" name="dealRationale" defaultValue="horizontal acquisition — market expansion" className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
        </div>
      </div>

      {/* Financials Section */}
      <div>
        <h4 className="text-md font-semibold text-ink border-b border-gray-100 pb-2 mb-4">2. Standalone Financials (Rs Cr)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Acquirer */}
          <div className="flex flex-col gap-3">
            <h5 className="text-sm font-medium text-ink">Acquirer Profile</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-ink-soft">Revenue</label>
                <input type="number" step="any" name="acq_revenue" defaultValue={45.0} className="w-full px-3 py-1.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze text-xs" />
              </div>
              <div>
                <label className="block text-[10px] text-ink-soft">EBITDA</label>
                <input type="number" step="any" name="acq_ebitda" defaultValue={7.5} className="w-full px-3 py-1.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze text-xs" />
              </div>
              <div>
                <label className="block text-[10px] text-ink-soft">Net Income</label>
                <input type="number" step="any" name="acq_netIncome" defaultValue={4.2} className="w-full px-3 py-1.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze text-xs" />
              </div>
              <div>
                <label className="block text-[10px] text-ink-soft">Net Debt</label>
                <input type="number" step="any" name="acq_netDebt" defaultValue={6.0} className="w-full px-3 py-1.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze text-xs" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-ink-soft">Shares Outstanding (Count)</label>
                <input type="number" step="any" name="acq_shares" defaultValue={5000000} className="w-full px-3 py-1.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze text-xs" />
              </div>
            </div>
          </div>
          {/* Target */}
          <div className="flex flex-col gap-3">
            <h5 className="text-sm font-medium text-ink">Target Profile</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-ink-soft">Revenue</label>
                <input type="number" step="any" name="tgt_revenue" defaultValue={15.0} className="w-full px-3 py-1.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze text-xs" />
              </div>
              <div>
                <label className="block text-[10px] text-ink-soft">EBITDA</label>
                <input type="number" step="any" name="tgt_ebitda" defaultValue={2.4} className="w-full px-3 py-1.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze text-xs" />
              </div>
              <div>
                <label className="block text-[10px] text-ink-soft">Net Income</label>
                <input type="number" step="any" name="tgt_netIncome" defaultValue={1.3} className="w-full px-3 py-1.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze text-xs" />
              </div>
              <div>
                <label className="block text-[10px] text-ink-soft">Net Debt</label>
                <input type="number" step="any" name="tgt_netDebt" defaultValue={2.0} className="w-full px-3 py-1.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze text-xs" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-ink-soft">Shares Outstanding (Count)</label>
                <input type="number" step="any" name="tgt_shares" defaultValue={1000000} className="w-full px-3 py-1.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze text-xs" />
              </div>
              <div className="col-span-2 border-t pt-2 border-dashed">
                <label className="block text-[10px] text-ink-soft">Standalone Value (Optional from DCF)</label>
                <input type="number" step="any" name="tgt_standaloneValue" placeholder="Leave blank to use multiple" className="w-full px-3 py-1.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze text-xs" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-ink-soft">Fallback EV/EBITDA Multiple</label>
                <input type="number" step="any" name="tgt_fallbackMultiple" defaultValue={6.5} className="w-full px-3 py-1.5 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze text-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Terms Section */}
      <div>
        <h4 className="text-md font-semibold text-ink border-b border-gray-100 pb-2 mb-4">3. Deal Terms & Financing</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1">Purchase Price (Equity Value, Rs Cr)</label>
            <input type="number" step="any" name="purchasePrice" defaultValue={16.5} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Cash Component (%)</label>
            <input type="number" step="any" name="cashComponentPct" defaultValue={60} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Stock Component (%)</label>
            <input type="number" step="any" name="stockComponentPct" defaultValue={40} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Acquirer Share Price (Rs)</label>
            <input type="number" step="any" name="acquirerSharePrice" defaultValue={850} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">New Debt Raised (Rs Cr)</label>
            <input type="number" step="any" name="newDebtRaised" defaultValue={6.0} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Cost of New Debt (%)</label>
            <input type="number" step="any" name="costOfNewDebt" defaultValue={11.5} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Acquirer Cash Used (Rs Cr)</label>
            <input type="number" step="any" name="acquirerCashUsed" defaultValue={3.9} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Corporate Tax Rate (%)</label>
            <input type="number" step="any" name="taxRate" defaultValue={25} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
        </div>
      </div>

      {/* Synergies Section */}
      <div>
        <h4 className="text-md font-semibold text-ink border-b border-gray-100 pb-2 mb-4">4. Synergies (Run-Rate)</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Annual Cost Syn. (Rs Cr)</label>
            <input type="number" step="any" name="annualCostSynergies" defaultValue={0.8} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Annual Rev Syn. (Rs Cr)</label>
            <input type="number" step="any" name="annualRevenueSynergies" defaultValue={2.0} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Synergy EBITDA Margin (%)</label>
            <input type="number" step="any" name="synergyEbitdaMargin" defaultValue={15} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Ramp-Up (Years)</label>
            <input type="number" step="1" name="rampUpYears" defaultValue={3} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Discount Rate (%)</label>
            <input type="number" step="any" name="synergyDiscountRate" defaultValue={14} className="w-full px-4 py-2 border border-stone-line bg-paper rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-bronze focus:border-bronze sm:text-sm" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-stone-line">
        <button type="submit" className="px-6 py-2.5 bg-bronze text-paper rounded-xl shadow-sm font-medium hover:bg-bronze-deep transition-colors">
          Run Feasibility Pipeline
        </button>
      </div>
    </form>
  )
}
