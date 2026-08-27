import { DealFeasibilityRequest } from './feasibility'

export type FeasibilityValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateFeasibilityInputs(req: DealFeasibilityRequest): FeasibilityValidationResult {
  const errors: string[] = [];
  
  const isInvalidNum = (val: unknown) => typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val);

  // Acquirer
  for (const [key, value] of Object.entries(req.acquirer)) {
    if (key !== 'name' && isInvalidNum(value)) {
      errors.push(`Acquirer field '${key}' is missing or malformed.`);
    }
  }

  // Target
  for (const [key, value] of Object.entries(req.target)) {
    if (key !== 'name' && key !== 'standaloneValue' && isInvalidNum(value)) {
      errors.push(`Target field '${key}' is missing or malformed.`);
    }
    if (key === 'standaloneValue' && value !== undefined && isInvalidNum(value)) {
      errors.push(`Target field 'standaloneValue' is malformed.`);
    }
  }

  // Deal Terms
  for (const [key, value] of Object.entries(req.dealTerms)) {
    if (key !== 'dealType' && isInvalidNum(value)) {
      errors.push(`Deal Terms field '${key}' is missing or malformed.`);
    }
  }

  // Financing
  for (const [key, value] of Object.entries(req.financing)) {
    if (isInvalidNum(value)) {
      errors.push(`Financing field '${key}' is missing or malformed.`);
    }
  }

  // Synergies
  for (const [key, value] of Object.entries(req.synergies)) {
    if (isInvalidNum(value)) {
      errors.push(`Synergies field '${key}' is missing or malformed.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
