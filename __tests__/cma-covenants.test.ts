import { expect, test, describe } from 'vitest';
import { evaluateCovenants } from '../lib/pipelines/cma-covenants';
import { CMAProjectedYear, AuditedValue } from '../lib/pipelines/cma';

describe('Covenant Evaluation', () => {
  const mockAudited = (val: number): AuditedValue => ({
    value: val,
    formula: '',
    inputs: {}
  });

  const baseYear: Partial<CMAProjectedYear> = {
    year: 1,
    currentRatio: mockAudited(0), // If calculated blindly by CMA it might be 0
    totalCurrentLiabilities: mockAudited(0), // The critical test case
    equity: mockAudited(100),
    tolTnwRatio: mockAudited(0.5),
    debtEquityRatio: mockAudited(0.5),
    dscr: mockAudited(2.0),
    netProfit: mockAudited(10),
    interest: mockAudited(10),
    termLoans: mockAudited(50),
    ebit: mockAudited(10),
    shortTermBorrowings: mockAudited(10),
    drawingPower: mockAudited(20),
    mpbfMethod2: mockAudited(20),
    unfundedCashDeficit: mockAudited(0)
  };

  test('VULN-001: Zero current liabilities should not false-positive as BREACH', () => {
    const projections = [baseYear as CMAProjectedYear];
    const covenants = evaluateCovenants(projections, 100);

    const yr1Covenants = covenants[0];
    const crCovenant = yr1Covenants.find(c => c.covenantId === 'current_ratio');

    expect(crCovenant).toBeDefined();
    expect(crCovenant?.status).toBe('NOT_APPLICABLE');
  });

  test('Negative current liabilities should be BREACH', () => {
    const invalidYear = {
      ...baseYear,
      totalCurrentLiabilities: mockAudited(-10),
      currentRatio: mockAudited(-5)
    };
    const projections = [invalidYear as CMAProjectedYear];
    const covenants = evaluateCovenants(projections, 100);

    const yr1Covenants = covenants[0];
    const crCovenant = yr1Covenants.find(c => c.covenantId === 'current_ratio');

    expect(crCovenant).toBeDefined();
    expect(crCovenant?.status).toBe('BREACH');
    expect(crCovenant?.message).toContain('Mathematically invalid');
  });
});
