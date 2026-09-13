import { CMAProjectedYear, CMAHistoricalInput } from '@/lib/pipelines/cma'

export type ValueType = 'currency' | 'number' | 'ratio' | 'percentage' | 'text';


export interface CMAScheduleProps {
  historical: CMAHistoricalInput | null;
  projections: CMAProjectedYear[];
}

export function formatCurrency(value: number | undefined | null, decimals = 0): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
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

export function formatValue(value: number | undefined | null, type: ValueType = 'number', currencyDecimals?: number): string {
  if (value === undefined || value === null) return '-';
  switch (type) {
    case 'currency':
      return formatCurrency(value, currencyDecimals !== undefined ? currencyDecimals : 0);
    case 'percentage':
      return formatPercentage(value, 2);
    case 'ratio':
    case 'number':
      return formatNumber(value, 2);
    case 'text':
      return String(value);
    default:
      return String(value);
  }
}
