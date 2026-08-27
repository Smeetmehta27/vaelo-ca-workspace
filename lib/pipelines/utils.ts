export type AuditedValue = {
  value: number;
  formula: string;
  inputs: Record<string, number>;
};

export function createAudited(value: number, formula: string, inputs: Record<string, number>): AuditedValue {
  return { value: Number(value.toFixed(2)), formula, inputs };
}

/**
 * Parses numeric inputs rigorously to prevent data integrity issues.
 * Rejects Infinity, NaN, and undefined. Can optionally reject negative numbers.
 */
export function parseNumStrict(val: string | number | null | undefined | FormDataEntryValue, allowNegative = true): number {
  if (val === null || val === undefined || val === '') {
    return NaN;
  }
  const num = Number(val);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return NaN;
  }
  if (!allowNegative && num < 0) {
    return NaN;
  }
  return num;
}
