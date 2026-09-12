import { CMAScheduleProps, formatCurrency } from './utils'
import { ScheduleLayout, ScheduleRow } from './schedule-layout'
import { AuditedValue } from '@/lib/pipelines/cma'

export function CMACCSchedule({ historical, projections }: CMAScheduleProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-paper-dim border border-stone-line text-blue-800 p-4 rounded-md text-sm">
        <h4 className="font-bold mb-1">Financing Hierarchy</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>MPBF</strong> = Analytical permissible finance based on working capital gap.</li>
          <li><strong>Drawing Power</strong> = Operational borrowing constraint based on current stock/debtors.</li>
          <li><strong>Sanctioned Limit</strong> = Absolute bank facility ceiling.</li>
          <li><strong>Actual allowable CC capacity</strong> = MIN(Drawing Power, Sanctioned Limit).</li>
        </ul>
      </div>
      
      <ScheduleLayout title="Schedule 8 — CC / Working Capital Finance Schedule" historical={historical} projections={projections}>
        <ScheduleRow label="Opening CC Balance" historicalValue="-" projectedValues={projections.map(p => p.openingShortTermBorrowings)} />
        <ScheduleRow label="CC Draw" historicalValue="-" projectedValues={projections.map(p => p.ccDraw)} />
        <ScheduleRow label="CC Repayment" historicalValue="-" projectedValues={projections.map(p => p.ccRepayment)} />
        <ScheduleRow label="Closing CC Balance" isSubTotal={true} historicalValue={historical ? formatCurrency(historical.shortTermBorrowings) : '-'} projectedValues={projections.map(p => p.shortTermBorrowings)} />
        
        <ScheduleRow label="Facility Constraints" isHeader={true} />
        <ScheduleRow label="Sanctioned Limit" historicalValue="-" projectedValues={projections.map(p => ({ value: p.drawingPower.inputs?.sanctionedLimit ?? 0, formula: 'assump.sanctionedLimit', inputs: {} } as AuditedValue))} />
        <ScheduleRow label="Drawing Power" historicalValue="-" projectedValues={projections.map(p => p.drawingPower)} />
        <ScheduleRow label="MPBF Method 2" historicalValue="-" projectedValues={projections.map(p => p.mpbfMethod2)} />
        
        <ScheduleRow label="Metrics" isHeader={true} />
        <ScheduleRow label="Unfunded Deficit" historicalValue="-" projectedValues={projections.map(p => p.unfundedCashDeficit)} />
        <ScheduleRow label="CC Interest Expense" historicalValue="-" projectedValues={projections.map(p => p.shortTermInterest)} />
      </ScheduleLayout>
    </div>
  )
}
