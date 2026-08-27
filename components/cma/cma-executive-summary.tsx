import { CMAScheduleProps, formatCurrency, formatNumber } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'

export function CMAExecutiveSummary({ historical, projections }: CMAScheduleProps) {
  // We can calculate historical EBITDA and PAT if needed, but the historical input doesn't provide tax or depreciation.
  // We will display what we can.
  const histRevenue = historical ? formatCurrency(historical.revenue) : '-';
  const histCurrentRatio = historical ? formatNumber((historical.stock + historical.debtors + historical.cash + historical.otherCurrentAssets) / (historical.creditors + historical.otherCurrentLiabilities + historical.shortTermBorrowings)) : '-';

  return (
    <ScheduleLayout title="Schedule 1 — CMA Executive Summary" historical={historical} projections={projections}>
      <ScheduleRow 
        label="Revenue" 
        historicalValue={histRevenue} 
        projectedValues={projections.map(p => p.revenue)} 
      />
      <ScheduleRow 
        label="EBITDA" 
        historicalValue="-" // Missing historical OPEX/COGS details to calculate accurately without full P&L
        projectedValues={projections.map(p => p.ebitda)} 
      />
      <ScheduleRow 
        label="PAT" 
        historicalValue="-" 
        projectedValues={projections.map(p => p.netProfit)} 
      />
      
      <ScheduleRow label="Ratios" isHeader={true} historicalValue="" projectedValues={projections.map(() => undefined)} />
      <ScheduleRow 
        label="Current Ratio" 
        historicalValue={histCurrentRatio} 
        projectedValues={projections.map(p => p.currentRatio)} 
        isCurrency={false}
      />
      <ScheduleRow 
        label="Total Debt / Equity" 
        historicalValue={historical ? formatNumber((historical.termLoans + historical.shortTermBorrowings) / historical.equity) : '-'} 
        projectedValues={projections.map(p => p.debtEquityRatio)} 
        isCurrency={false}
      />
      <ScheduleRow 
        label="TOL / TNW" 
        historicalValue={historical ? formatNumber((historical.termLoans + historical.shortTermBorrowings + historical.creditors + historical.otherCurrentLiabilities + historical.otherNonCurrentLiabilities) / historical.equity) : '-'} 
        projectedValues={projections.map(p => p.tolTnwRatio)} 
        isCurrency={false}
      />
      <ScheduleRow 
        label="DSCR" 
        historicalValue="-" 
        projectedValues={projections.map(p => p.dscr)} 
        isCurrency={false}
      />

      <ScheduleRow label="Working Capital Finance" isHeader={true} historicalValue="" projectedValues={projections.map(() => undefined)} />
      <ScheduleRow 
        label="MPBF Method 2" 
        historicalValue="-" 
        projectedValues={projections.map(p => p.mpbfMethod2)} 
      />
      <ScheduleRow 
        label="Drawing Power" 
        historicalValue="-" 
        projectedValues={projections.map(p => p.drawingPower)} 
      />
      <ScheduleRow 
        label="Sanctioned CC Limit" 
        historicalValue="-" 
        projectedValues={projections.map(p => ({ value: p.drawingPower?.inputs?.sanctionedLimit ?? 0, formula: 'Sanctioned Limit', inputs: {} }))} 
      />
      <ScheduleRow 
        label="Closing CC Utilization" 
        historicalValue={historical ? formatCurrency(historical.shortTermBorrowings) : '-'} 
        projectedValues={projections.map(p => p.shortTermBorrowings)} 
      />
      <ScheduleRow 
        label="Unfunded Cash Deficit" 
        historicalValue="-" 
        projectedValues={projections.map(p => p.unfundedCashDeficit)} 
      />
      <ScheduleRow 
        label="Closing Cash" 
        historicalValue={historical ? formatCurrency(historical.cash) : '-'} 
        projectedValues={projections.map(p => p.cash)} 
      />
    </ScheduleLayout>
  )
}
