import { CMAScheduleProps, formatCurrency } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'

export function CMADrawingPowerSchedule({ historical, projections }: CMAScheduleProps) {
  // DP is a projected operational constraint based on margins.
  // Historical DP isn't rigorously tracked in this format unless explicitly provided,
  // so we show projected values where DP mechanics apply.
  
  return (
    <ScheduleLayout title="Schedule 7 — Drawing Power Calculation" historical={historical} projections={projections}>
      <ScheduleRow label="Eligible Stock (Net of Margin)" historicalValue="-" projectedValues={projections.map(p => p.eligibleStock)} />
      <ScheduleRow label="Eligible Debtors (Net of Margin)" historicalValue="-" projectedValues={projections.map(p => p.eligibleDebtors)} />
      <ScheduleRow label="Less: Unpaid Creditors" historicalValue={historical ? formatCurrency(historical.creditors) : '-'} projectedValues={projections.map(p => p.creditors)} />
      <ScheduleRow label="Net Drawing Power" isSubTotal={true} historicalValue="-" projectedValues={projections.map(p => p.drawingPower)} />
    </ScheduleLayout>
  )
}
