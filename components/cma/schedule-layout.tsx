import { ReactNode } from 'react'
import { CMAScheduleProps } from './utils'
import { AuditedValueDisplay } from '../ui/audited-value'
import { AuditedValue } from '@/lib/pipelines/cma'

export function ScheduleLayout({ 
  title, 
  historical, 
  projections, 
  children 
}: CMAScheduleProps & { 
  title: string, 
  children: ReactNode 
}) {
  return (
    <div className="mb-10 w-full">
      <h3 className="text-xl font-serif text-ink mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-line border border-stone-line rounded-md shadow-sm">
          <thead className="bg-paper-dim">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-ink border-b border-stone-line">Metric</th>
              {historical && (
                <th className="px-6 py-4 text-right text-sm font-semibold text-ink-soft border-b border-stone-line bg-paper-dim">
                  Historical
                </th>
              )}
              {projections.map((p, i) => (
                <th key={i} className="px-6 py-4 text-right text-sm font-semibold text-ink border-b border-stone-line">
                  Year {p.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-paper divide-y divide-stone-line">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ScheduleRow({
  label,
  isHeader = false,
  isSubTotal = false,
  indent = false,
  historicalValue,
  projectedValues,
  isCurrency = true
}: {
  label: string,
  isHeader?: boolean,
  isSubTotal?: boolean,
  indent?: boolean,
  historicalValue?: string | number | null,
  projectedValues?: (AuditedValue | null | undefined)[],
  isCurrency?: boolean
}) {
  const rowClass = isHeader 
    ? 'bg-paper-dim font-bold text-ink' 
    : isSubTotal 
      ? 'bg-paper-dim font-semibold text-ink' 
      : 'hover:bg-paper-dim text-ink';

  const labelClass = indent ? 'pl-10 text-ink-soft' : '';

  return (
    <tr className={rowClass}>
      <td className={`px-6 py-4 text-sm ${labelClass}`}>{label}</td>
      {historicalValue !== undefined && (
        <td className="px-6 py-4 text-right font-mono font-medium text-ink-soft bg-paper-dim/50">
          {historicalValue}
        </td>
      )}
      {projectedValues?.map((val, i) => (
        <td key={i} className="px-6 py-4 text-right">
          {val ? <AuditedValueDisplay data={val} isCurrency={isCurrency} /> : '-'}
        </td>
      ))}
    </tr>
  )
}
