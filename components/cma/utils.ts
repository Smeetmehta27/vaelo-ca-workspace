import { CMAProjectedYear, CMAHistoricalInput } from '@/lib/pipelines/cma'

export type ValueType = 'currency' | 'number' | 'ratio' | 'percentage' | 'text';


export interface CMAScheduleProps {
  historical: CMAHistoricalInput | null;
  projections: CMAProjectedYear[];
}

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(value);
}

export function formatPercentage(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'percent',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(value / 100);
}

export function formatValue(value: number | undefined | null, type: ValueType = 'number', decimals = 2): string {
  if (value === undefined || value === null) return '-';
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value, decimals);
    case 'ratio':
    case 'number':
      return formatNumber(value, decimals);
    case 'text':
      return String(value);
    default:
      return String(value);
  }
}
