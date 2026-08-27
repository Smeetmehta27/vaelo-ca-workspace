import { CMAScheduleProps, formatNumber } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'

export function CMARatioSchedule({ historical, projections }: CMAScheduleProps) {
  // Helpers for historical ratios
  const histCurrentAssets = historical ? historical.stock + historical.debtors + historical.cash + historical.otherCurrentAssets : 0;
  const histCurrentLiab = historical ? historical.creditors + historical.otherCurrentLiabilities + historical.shortTermBorrowings : 0;
  
  const histCurrentRatio = historical && histCurrentLiab > 0 ? (histCurrentAssets / histCurrentLiab) : null;
  const histDebtEquity = historical && historical.equity > 0 ? ((historical.termLoans + historical.shortTermBorrowings) / historical.equity) : null;
  const histTolTnw = historical && historical.equity > 0 ? ((histCurrentLiab + historical.termLoans + historical.otherNonCurrentLiabilities) / historical.equity) : null;

  return (
    <ScheduleLayout title="Schedule 14 — Ratio Analysis" historical={historical} projections={projections}>
      <ScheduleRow label="Liquidity Ratios" isHeader={true} />
      <ScheduleRow 
        label="Current Ratio (CA / CL)" 
        historicalValue={formatNumber(histCurrentRatio)} 
        projectedValues={projections.map(p => p.currentRatio)} 
        isCurrency={false}
      />
      
      <ScheduleRow label="Leverage Ratios" isHeader={true} />
      <ScheduleRow 
        label="Total Debt / Equity Ratio" 
        historicalValue={formatNumber(histDebtEquity)} 
        projectedValues={projections.map(p => p.debtEquityRatio)} 
        isCurrency={false}
      />
      <ScheduleRow 
        label="TOL / TNW" 
        historicalValue={formatNumber(histTolTnw)} 
        projectedValues={projections.map(p => p.tolTnwRatio)} 
        isCurrency={false}
      />
      
      <ScheduleRow label="Coverage Ratios" isHeader={true} />
      <ScheduleRow 
        label="DSCR" 
        historicalValue="-" 
        projectedValues={projections.map(p => p.dscr)} 
        isCurrency={false}
      />

      <ScheduleRow label="Profitability Ratios" isHeader={true} />
      <ScheduleRow 
        label="ROE (%)" 
        historicalValue="-" 
        projectedValues={projections.map(p => p.roe)} 
        isCurrency={false}
      />
    </ScheduleLayout>
  )
}
