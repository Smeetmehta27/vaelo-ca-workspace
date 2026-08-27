import { CMAScheduleProps, formatCurrency } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'
import { AuditedValue } from '@/lib/pipelines/cma'

export function CMADebtSchedule({ historical, projections }: CMAScheduleProps) {
  return (
    <ScheduleLayout title="Schedule 12 — Term Loan / Debt Schedule" historical={historical} projections={projections}>
      <ScheduleRow label="Opening Term Loan Balance" historicalValue="-" projectedValues={projections.map(p => p.openingTermLoans)} />
      <ScheduleRow label="Less: Principal Repayment" historicalValue={historical ? formatCurrency(historical.principalRepayment) : '-'} projectedValues={projections.map(p => ({
        value: p.termLoans.inputs.principalRepayment,
        formula: 'assump.principalRepayment',
        inputs: {}
      } as AuditedValue))} />
      <ScheduleRow label="Closing Term Loan Balance" isSubTotal={true} historicalValue={historical ? formatCurrency(historical.termLoans) : '-'} projectedValues={projections.map(p => p.termLoans)} />
      
      <ScheduleRow label="Term Loan Interest Expense" historicalValue="-" projectedValues={projections.map(p => p.termLoanInterest)} />
    </ScheduleLayout>
  )
}
