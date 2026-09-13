import { CMAScheduleProps, formatValue } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'

export function CMAWorkingCapitalSchedule({ historical, projections }: CMAScheduleProps) {
  // Helpers
  const histCurrentAssets = historical ? historical.cash + historical.stock + historical.debtors + historical.otherCurrentAssets : 0;
  const histCurrentLiab = historical ? historical.creditors + historical.otherCurrentLiabilities + historical.shortTermBorrowings : 0;
  
  return (
    <ScheduleLayout title="Schedule 4 — Current Assets & Liabilities" historical={historical} projections={projections}>
      <ScheduleRow label="CURRENT ASSETS" isHeader={true} />
      <ScheduleRow label="Stock / Inventory" historicalValue={historical ? formatValue(historical.stock) : '-'} projectedValues={projections.map(p => p.stock)} />
      <ScheduleRow label="Debtors / Receivables" historicalValue={historical ? formatValue(historical.debtors) : '-'} projectedValues={projections.map(p => p.debtors)} />
      <ScheduleRow label="Other Current Assets" historicalValue={historical ? formatValue(historical.otherCurrentAssets) : '-'} projectedValues={projections.map(p => p.otherCurrentAssets)} />
      <ScheduleRow label="Cash & Equivalents" historicalValue={historical ? formatValue(historical.cash) : '-'} projectedValues={projections.map(p => p.cash)} />
      <ScheduleRow label="Total Current Assets" isSubTotal={true} historicalValue={historical ? formatValue(histCurrentAssets) : '-'} projectedValues={projections.map(p => p.totalCurrentAssets)} />

      <ScheduleRow label="CURRENT LIABILITIES" isHeader={true} />
      <ScheduleRow label="Creditors / Payables" historicalValue={historical ? formatValue(historical.creditors) : '-'} projectedValues={projections.map(p => p.creditors)} />
      <ScheduleRow label="Other Current Liabilities" historicalValue={historical ? formatValue(historical.otherCurrentLiabilities) : '-'} projectedValues={projections.map(p => p.otherCurrentLiabilities)} />
      <ScheduleRow label="Short-Term Borrowings (Bank)" historicalValue={historical ? formatValue(historical.shortTermBorrowings) : '-'} projectedValues={projections.map(p => p.shortTermBorrowings)} />
      <ScheduleRow label="Total Current Liabilities" isSubTotal={true} historicalValue={historical ? formatValue(histCurrentLiab) : '-'} projectedValues={projections.map(p => p.totalCurrentLiabilities)} />

      <ScheduleRow label="WORKING CAPITAL" isHeader={true} />
      <ScheduleRow 
        label="Net Working Capital (Including Bank Borrowings)" 
        historicalValue={historical ? formatValue(histCurrentAssets - histCurrentLiab) : '-'} 
        projectedValues={projections.map(p => p.netWorkingCapital)} 
        isSubTotal={true}
      />
      <ScheduleRow 
        label="Net Working Capital (Excluding Bank Borrowings)" 
        historicalValue={historical ? formatValue(histCurrentAssets - (historical.creditors + historical.otherCurrentLiabilities)) : '-'} 
        projectedValues={projections.map(p => p.netWorkingCapitalExclBank)} 
      />
    </ScheduleLayout>
  )
}
