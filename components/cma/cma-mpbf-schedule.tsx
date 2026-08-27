import { CMAScheduleProps, formatCurrency } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'
import { AuditedValue } from '@/lib/pipelines/cma'

export function CMAMPBFSchedule({ historical, projections }: CMAScheduleProps) {
  // Helpers for Working Capital Gap
  const histWCG = historical ? (historical.cash + historical.stock + historical.debtors + historical.otherCurrentAssets) - (historical.creditors + historical.otherCurrentLiabilities) : 0;
  
  return (
    <>
      <ScheduleLayout title="Schedule 5 — Working Capital Assessment" historical={historical} projections={projections}>
        <ScheduleRow label="Total Current Assets" historicalValue={historical ? formatCurrency(historical.cash + historical.stock + historical.debtors + historical.otherCurrentAssets) : '-'} projectedValues={projections.map(p => p.totalCurrentAssets)} />
        <ScheduleRow label="Less: Current Liab. (Excl. Bank)" historicalValue={historical ? formatCurrency(historical.creditors + historical.otherCurrentLiabilities) : '-'} projectedValues={projections.map(p => p.currentLiabilitiesExclBank)} />
        <ScheduleRow label="Working Capital Gap (WCG)" isSubTotal={true} historicalValue={historical ? formatCurrency(histWCG) : '-'} projectedValues={projections.map(p => p.workingCapitalGap)} />
        <ScheduleRow label="Borrower's Contribution (25% of TCA)" historicalValue={historical ? formatCurrency((historical.cash + historical.stock + historical.debtors + historical.otherCurrentAssets) * 0.25) : '-'} projectedValues={projections.map(p => p.borrowersContribution)} />
        <ScheduleRow label="MPBF (Method 2)" isSubTotal={true} historicalValue="-" projectedValues={projections.map(p => p.mpbfMethod2)} />
      </ScheduleLayout>

      <ScheduleLayout title="Schedule 6 — MPBF / Bank Finance Limits" historical={historical} projections={projections}>
        <ScheduleRow label="Working Capital Gap" historicalValue={historical ? formatCurrency(histWCG) : '-'} projectedValues={projections.map(p => p.workingCapitalGap)} />
        <ScheduleRow label="MPBF (Analytical Permissible Finance)" historicalValue="-" projectedValues={projections.map(p => p.mpbfMethod2)} />
        
        <ScheduleRow label="Limits & Utilization" isHeader={true} />
        <ScheduleRow label="Sanctioned Limit (Bank Ceiling)" historicalValue="-" projectedValues={projections.map(p => p.shortTermBorrowings?.inputs?.sanctionedLimit ? { value: p.shortTermBorrowings.inputs.sanctionedLimit, formula: 'sanctionedLimit', inputs: {} } as AuditedValue : null)} />
        <ScheduleRow label="Drawing Power (Operational Constraint)" historicalValue="-" projectedValues={projections.map(p => p.drawingPower)} />
        <ScheduleRow label="Projected CC Utilization" isSubTotal={true} historicalValue={historical ? formatCurrency(historical.shortTermBorrowings) : '-'} projectedValues={projections.map(p => p.shortTermBorrowings)} />
        <ScheduleRow label="Unfunded Deficit" historicalValue="-" projectedValues={projections.map(p => p.unfundedCashDeficit)} />
      </ScheduleLayout>
    </>
  )
}
