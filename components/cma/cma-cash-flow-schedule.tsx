import { CMAScheduleProps, formatCurrency } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'
import { AuditedValue } from '@/lib/pipelines/cma'

export function CMAChangesInWCSchedule({ historical, projections }: CMAScheduleProps) {
  return (
    <ScheduleLayout title="Schedule 9 — Changes in Working Capital" historical={historical} projections={projections}>
      <ScheduleRow label="(Increase) / Decrease in Stock" historicalValue="-" projectedValues={projections.map(p => p.changeInStock)} />
      <ScheduleRow label="(Increase) / Decrease in Debtors" historicalValue="-" projectedValues={projections.map(p => p.changeInDebtors)} />
      <ScheduleRow label="(Increase) / Decrease in Other Current Assets" historicalValue="-" projectedValues={projections.map(p => p.changeInOCA)} />
      <ScheduleRow label="Increase / (Decrease) in Creditors" historicalValue="-" projectedValues={projections.map(p => p.changeInCreditors)} />
      <ScheduleRow label="Increase / (Decrease) in Other Current Liab." historicalValue="-" projectedValues={projections.map(p => p.changeInOCL)} />
      <ScheduleRow label="Working Capital Cash Impact" isSubTotal={true} historicalValue="-" projectedValues={projections.map(p => p.workingCapitalCashImpact)} />
    </ScheduleLayout>
  )
}

export function CMACashFlowSchedule({ historical, projections }: CMAScheduleProps) {
  return (
    <ScheduleLayout title="Schedule 10 — Cash Flow Statement" historical={historical} projections={projections}>
      <ScheduleRow label="Profit After Tax (PAT)" historicalValue="-" projectedValues={projections.map(p => p.netProfit)} />
      <ScheduleRow label="Add: Depreciation" historicalValue="-" projectedValues={projections.map(p => p.depreciation)} />
      <ScheduleRow label="Add/Less: Working Capital Cash Impact" historicalValue="-" projectedValues={projections.map(p => p.workingCapitalCashImpact)} />
      <ScheduleRow label="Less: Capital Expenditure (CapEx)" historicalValue="-" projectedValues={projections.map(p => p.capEx)} />
      <ScheduleRow label="Less: Term Loan Principal Repayment" historicalValue="-" projectedValues={projections.map(p => ({
        value: p.termLoans.inputs.principalRepayment,
        formula: 'assump.principalRepayment',
        inputs: {}
      } as AuditedValue))} />
      
      <ScheduleRow label="Cash Available Before Financing (CABF)" isSubTotal={true} historicalValue="-" projectedValues={projections.map(p => p.cabf)} />

      <ScheduleRow label="Financing" isHeader={true} />
      <ScheduleRow label="CC Draw / (Repayment)" historicalValue="-" projectedValues={projections.map(p => p.cashSweep)} />
      <ScheduleRow label="Unfunded Deficit (If Any)" historicalValue="-" projectedValues={projections.map(p => p.unfundedCashDeficit)} />
      
      <ScheduleRow label="Closing Cash Balance" isSubTotal={true} historicalValue={historical ? formatCurrency(historical.cash) : '-'} projectedValues={projections.map(p => p.cash)} />
    </ScheduleLayout>
  )
}
