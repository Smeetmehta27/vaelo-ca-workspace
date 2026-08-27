import { HealthSnapshotRequest } from './financial-health'

export type HealthValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateHealthInputs(req: HealthSnapshotRequest): HealthValidationResult {
  const errors: string[] = [];
  
  const isInvalidNum = (val: unknown) => typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val);

  for (const [key, value] of Object.entries(req.liquidity)) {
    if (isInvalidNum(value)) {
      errors.push(`Liquidity field '${key}' is missing or malformed.`);
    }
  }

  for (const [key, value] of Object.entries(req.expenseGrowth)) {
    if (isInvalidNum(value)) {
      errors.push(`Expense Growth field '${key}' is missing or malformed.`);
    }
  }

  for (const [key, value] of Object.entries(req.cashRunway)) {
    if (isInvalidNum(value)) {
      errors.push(`Cash Runway field '${key}' is missing or malformed.`);
    }
  }

  req.revenueVolatility.historicalRevenue.forEach((val, i) => {
    if (isInvalidNum(val)) {
      errors.push(`Revenue Volatility historical value at index ${i} is missing or malformed.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
