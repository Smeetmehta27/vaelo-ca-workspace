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
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md shadow-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 border-b border-gray-200">Metric</th>
              {historical && (
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600 border-b border-gray-200 bg-slate-100">
                  Historical
                </th>
              )}
              {projections.map((p, i) => (
                <th key={i} className="px-6 py-4 text-right text-sm font-semibold text-slate-900 border-b border-gray-200">
                  Year {p.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
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
    ? 'bg-slate-100 font-bold text-slate-900' 
    : isSubTotal 
      ? 'bg-slate-50 font-semibold text-slate-900' 
      : 'hover:bg-slate-50 text-slate-700';

  const labelClass = indent ? 'pl-10 text-slate-500' : '';

  return (
    <tr className={rowClass}>
      <td className={`px-6 py-4 text-sm ${labelClass}`}>{label}</td>
      {historicalValue !== undefined && (
        <td className="px-6 py-4 text-right font-medium text-slate-600 bg-slate-50/50">
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
