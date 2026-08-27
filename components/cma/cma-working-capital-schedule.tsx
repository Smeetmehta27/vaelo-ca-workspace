import { CMAScheduleProps, formatCurrency } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'

export function CMAWorkingCapitalSchedule({ historical, projections }: CMAScheduleProps) {
  // Helpers
  const histCurrentAssets = historical ? historical.cash + historical.stock + historical.debtors + historical.otherCurrentAssets : 0;
  const histCurrentLiab = historical ? historical.creditors + historical.otherCurrentLiabilities + historical.shortTermBorrowings : 0;
  
  return (
    <ScheduleLayout title="Schedule 4 — Current Assets & Liabilities" historical={historical} projections={projections}>
      <ScheduleRow label="CURRENT ASSETS" isHeader={true} />
      <ScheduleRow label="Stock / Inventory" historicalValue={historical ? formatCurrency(historical.stock) : '-'} projectedValues={projections.map(p => p.stock)} />
      <ScheduleRow label="Debtors / Receivables" historicalValue={historical ? formatCurrency(historical.debtors) : '-'} projectedValues={projections.map(p => p.debtors)} />
      <ScheduleRow label="Other Current Assets" historicalValue={historical ? formatCurrency(historical.otherCurrentAssets) : '-'} projectedValues={projections.map(p => p.otherCurrentAssets)} />
      <ScheduleRow label="Cash & Equivalents" historicalValue={historical ? formatCurrency(historical.cash) : '-'} projectedValues={projections.map(p => p.cash)} />
      <ScheduleRow label="Total Current Assets" isSubTotal={true} historicalValue={historical ? formatCurrency(histCurrentAssets) : '-'} projectedValues={projections.map(p => p.totalCurrentAssets)} />

      <ScheduleRow label="CURRENT LIABILITIES" isHeader={true} />
      <ScheduleRow label="Creditors / Payables" historicalValue={historical ? formatCurrency(historical.creditors) : '-'} projectedValues={projections.map(p => p.creditors)} />
      <ScheduleRow label="Other Current Liabilities" historicalValue={historical ? formatCurrency(historical.otherCurrentLiabilities) : '-'} projectedValues={projections.map(p => p.otherCurrentLiabilities)} />
      <ScheduleRow label="Short-Term Borrowings (Bank)" historicalValue={historical ? formatCurrency(historical.shortTermBorrowings) : '-'} projectedValues={projections.map(p => p.shortTermBorrowings)} />
      <ScheduleRow label="Total Current Liabilities" isSubTotal={true} historicalValue={historical ? formatCurrency(histCurrentLiab) : '-'} projectedValues={projections.map(p => p.totalCurrentLiabilities)} />

      <ScheduleRow label="WORKING CAPITAL" isHeader={true} />
      <ScheduleRow 
        label="Net Working Capital (Including Bank Borrowings)" 
        historicalValue={historical ? formatCurrency(histCurrentAssets - histCurrentLiab) : '-'} 
        projectedValues={projections.map(p => p.netWorkingCapital)} 
        isSubTotal={true}
      />
      <ScheduleRow 
        label="Net Working Capital (Excluding Bank Borrowings)" 
        historicalValue={historical ? formatCurrency(histCurrentAssets - (historical.creditors + historical.otherCurrentLiabilities)) : '-'} 
        projectedValues={projections.map(p => p.netWorkingCapitalExclBank)} 
      />
    </ScheduleLayout>
  )
}
