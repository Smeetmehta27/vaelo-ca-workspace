import { CMAScheduleProps, formatCurrency } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'

export function CMAFixedAssetsSchedule({ historical, projections }: CMAScheduleProps) {
  return (
    <ScheduleLayout title="Schedule 11 — Fixed Assets" historical={historical} projections={projections}>
      <ScheduleRow label="Opening Fixed Assets" historicalValue="-" projectedValues={projections.map(p => p.openingFixedAssets)} />
      <ScheduleRow label="Add: Capital Expenditure (CapEx)" historicalValue="-" projectedValues={projections.map(p => p.capEx)} />
      <ScheduleRow label="Less: Depreciation" historicalValue="-" projectedValues={projections.map(p => p.depreciation)} />
      <ScheduleRow label="Closing Fixed Assets (Net)" isSubTotal={true} historicalValue={historical ? formatCurrency(historical.fixedAssets) : '-'} projectedValues={projections.map(p => p.fixedAssets)} />
    </ScheduleLayout>
  )
}
