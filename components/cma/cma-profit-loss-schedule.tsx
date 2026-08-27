import { CMAScheduleProps, formatCurrency } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'

export function CMAProfitLossSchedule({ historical, projections }: CMAScheduleProps) {
  return (
    <ScheduleLayout title="Schedule 2 — Operating Statement / P&L" historical={historical} projections={projections}>
      <ScheduleRow 
        label="Revenue" 
        historicalValue={historical ? formatCurrency(historical.revenue) : '-'} 
        projectedValues={projections.map(p => p.revenue)} 
      />
      <ScheduleRow 
        label="Less: COGS" 
        indent={true}
        historicalValue={historical ? formatCurrency(historical.cogs) : '-'} 
        projectedValues={projections.map(p => p.cogs)} 
      />
      <ScheduleRow 
        label="Gross Profit" 
        isSubTotal={true}
        historicalValue={historical ? formatCurrency(historical.revenue - historical.cogs) : '-'} 
        projectedValues={projections.map(p => p.grossProfit)} 
      />
      <ScheduleRow 
        label="Less: Operating Expenses" 
        indent={true}
        historicalValue={historical ? formatCurrency(historical.operatingExpenses) : '-'} 
        projectedValues={projections.map(p => p.operatingExpenses)} 
      />
      <ScheduleRow 
        label="EBITDA" 
        isSubTotal={true}
        historicalValue={historical ? formatCurrency(historical.revenue - historical.cogs - historical.operatingExpenses) : '-'} 
        projectedValues={projections.map(p => p.ebitda)} 
      />
      <ScheduleRow 
        label="Less: Depreciation" 
        indent={true}
        historicalValue="-" 
        projectedValues={projections.map(p => p.depreciation)} 
      />
      <ScheduleRow 
        label="EBIT" 
        isSubTotal={true}
        historicalValue="-" 
        projectedValues={projections.map(p => p.ebit)} 
      />
      <ScheduleRow 
        label="Less: Interest" 
        indent={true}
        historicalValue="-" 
        projectedValues={projections.map(p => p.interest)} 
      />
      <ScheduleRow 
        label="Profit Before Tax (PBT)" 
        isSubTotal={true}
        historicalValue="-" 
        projectedValues={projections.map(p => p.pbt)} 
      />
      <ScheduleRow 
        label="Less: Tax" 
        indent={true}
        historicalValue="-" 
        projectedValues={projections.map(p => p.tax)} 
      />
      <ScheduleRow 
        label="Profit After Tax (PAT)" 
        isSubTotal={true}
        historicalValue="-" 
        projectedValues={projections.map(p => p.netProfit)} 
      />
    </ScheduleLayout>
  )
}
