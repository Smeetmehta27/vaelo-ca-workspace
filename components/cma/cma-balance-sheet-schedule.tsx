import { CMAScheduleProps, formatValue } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'
import { AuditedValue } from '@/lib/pipelines/cma'

export function CMABalanceSheetSchedule({ historical, projections }: CMAScheduleProps) {
  // Helpers to calculate historical totals
  const histCurrentAssets = historical ? historical.cash + historical.stock + historical.debtors + historical.otherCurrentAssets : 0;
  const histTotalAssets = historical ? histCurrentAssets + historical.fixedAssets + historical.otherNonCurrentAssets : 0;
  
  const histCurrentLiab = historical ? historical.creditors + historical.otherCurrentLiabilities + historical.shortTermBorrowings : 0;
  const histTotalLiabAndEq = historical ? histCurrentLiab + historical.termLoans + historical.otherNonCurrentLiabilities + historical.equity : 0;
  const histDiff = histTotalAssets - histTotalLiabAndEq;

  // Function to calculate projected differences for the balance check
  const balanceCheckVals = projections.map(p => {
    return {
      value: p.totalAssets.value - p.totalLiabilitiesAndEquity.value,
      formula: 'totalAssets - totalLiabilitiesAndEquity',
      inputs: {
        totalAssets: p.totalAssets.value,
        totalLiabilitiesAndEquity: p.totalLiabilitiesAndEquity.value
      }
    } as AuditedValue;
  });

  return (
    <ScheduleLayout title="Schedule 3 — Balance Sheet" historical={historical} projections={projections}>
      <ScheduleRow label="ASSETS" isHeader={true} />
      <ScheduleRow label="Cash & Equivalents" indent={true} historicalValue={historical ? formatValue(historical.cash) : '-'} projectedValues={projections.map(p => p.cash)} />
      <ScheduleRow label="Stock / Inventory" indent={true} historicalValue={historical ? formatValue(historical.stock) : '-'} projectedValues={projections.map(p => p.stock)} />
      <ScheduleRow label="Debtors / Receivables" indent={true} historicalValue={historical ? formatValue(historical.debtors) : '-'} projectedValues={projections.map(p => p.debtors)} />
      <ScheduleRow label="Other Current Assets" indent={true} historicalValue={historical ? formatValue(historical.otherCurrentAssets) : '-'} projectedValues={projections.map(p => p.otherCurrentAssets)} />
      <ScheduleRow label="Total Current Assets" isSubTotal={true} historicalValue={historical ? formatValue(histCurrentAssets) : '-'} projectedValues={projections.map(p => p.totalCurrentAssets)} />
      
      <ScheduleRow label="Fixed Assets (Net)" indent={true} historicalValue={historical ? formatValue(historical.fixedAssets) : '-'} projectedValues={projections.map(p => p.fixedAssets)} />
      <ScheduleRow label="Other Non-Current Assets" indent={true} historicalValue={historical ? formatValue(historical.otherNonCurrentAssets) : '-'} projectedValues={projections.map(p => p.otherNonCurrentAssets)} />
      <ScheduleRow label="Total Assets" isHeader={true} historicalValue={historical ? formatValue(histTotalAssets) : '-'} projectedValues={projections.map(p => p.totalAssets)} />

      <ScheduleRow label="LIABILITIES & EQUITY" isHeader={true} />
      <ScheduleRow label="Creditors / Payables" indent={true} historicalValue={historical ? formatValue(historical.creditors) : '-'} projectedValues={projections.map(p => p.creditors)} />
      <ScheduleRow label="Other Current Liabilities" indent={true} historicalValue={historical ? formatValue(historical.otherCurrentLiabilities) : '-'} projectedValues={projections.map(p => p.otherCurrentLiabilities)} />
      <ScheduleRow label="Short-Term Borrowings (CC/OD)" indent={true} historicalValue={historical ? formatValue(historical.shortTermBorrowings) : '-'} projectedValues={projections.map(p => p.shortTermBorrowings)} />
      <ScheduleRow label="Total Current Liabilities" isSubTotal={true} historicalValue={historical ? formatValue(histCurrentLiab) : '-'} projectedValues={projections.map(p => p.totalCurrentLiabilities)} />
      
      <ScheduleRow label="Term Loans" indent={true} historicalValue={historical ? formatValue(historical.termLoans) : '-'} projectedValues={projections.map(p => p.termLoans)} />
      <ScheduleRow label="Other Non-Current Liab." indent={true} historicalValue={historical ? formatValue(historical.otherNonCurrentLiabilities) : '-'} projectedValues={projections.map(p => p.otherNonCurrentLiabilities)} />
      <ScheduleRow label="Equity & Reserves" indent={true} historicalValue={historical ? formatValue(historical.equity) : '-'} projectedValues={projections.map(p => p.equity)} />
      <ScheduleRow label="Total Liabilities & Equity" isHeader={true} historicalValue={historical ? formatValue(histTotalLiabAndEq) : '-'} projectedValues={projections.map(p => p.totalLiabilitiesAndEquity)} />

      <ScheduleRow label="Balance Check (Assets - L&E)" isSubTotal={true} historicalValue={historical ? formatValue(histDiff) : '-'} projectedValues={balanceCheckVals} />
    </ScheduleLayout>
  )
}
