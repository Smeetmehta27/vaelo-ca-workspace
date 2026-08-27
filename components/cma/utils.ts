import { CMAProjectedYear, CMAHistoricalInput } from '@/lib/pipelines/cma'

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
