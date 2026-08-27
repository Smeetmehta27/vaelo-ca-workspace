import { CMAScheduleProps, formatCurrency } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'
import { AuditedValue } from '@/lib/pipelines/cma'

export function CMAEquitySchedule({ historical, projections }: CMAScheduleProps) {
  return (
    <ScheduleLayout title="Schedule 13 — Equity / Retained Earnings" historical={historical} projections={projections}>
      <ScheduleRow label="Opening Equity / Retained Earnings" historicalValue="-" projectedValues={projections.map(p => p.openingEquity)} />
      <ScheduleRow label="Add: Profit After Tax (PAT)" historicalValue="-" projectedValues={projections.map(p => p.netProfit)} />
      <ScheduleRow label="Less: Dividends / Capital Changes" historicalValue="-" projectedValues={projections.map(() => ({ value: 0, formula: '0', inputs: {} } as AuditedValue))} />
      <ScheduleRow label="Closing Equity / Retained Earnings" isSubTotal={true} historicalValue={historical ? formatCurrency(historical.equity) : '-'} projectedValues={projections.map(p => p.equity)} />
    </ScheduleLayout>
  )
}
