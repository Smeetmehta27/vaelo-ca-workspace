import { describe, it, expect } from 'vitest';
import { validateCMAInputs } from '../lib/pipelines/cma-validation';
import { CMAHistoricalInput, CMAAssumptions } from '../lib/pipelines/cma';

describe('CMA Input Validation (Phase 9)', () => {
  const getValidHistorical = (): CMAHistoricalInput => ({
    revenue: 10000000,
    cogs: 6000000,
    operatingExpenses: 2000000,
    stock: 1500000,
    debtors: 2500000,
    cash: 500000,
    otherCurrentAssets: 0,
    fixedAssets: 4500000,
    otherNonCurrentAssets: 0,
    creditors: 1000000,
    otherCurrentLiabilities: 0,
    termLoans: 5000000,
    otherNonCurrentLiabilities: 0,
    equity: 1000000,
    shortTermBorrowings: 2000000,
  });

  const getValidAssumptions = (): CMAAssumptions => ({
    revenueGrowthRate: 15,
    cogsMargin: 60,
    operatingExpensesMargin: 20,
    stockDays: 45,
    debtorDays: 60,
    creditorDays: 45,
    interestRate: 11,
    principalRepayment: 1000000,
    drawingPowerStockMargin: 25,
    drawingPowerDebtorMargin: 40,
    ocaMargin: 0,
    oclMargin: 0,
    capExMargin: 0,
    depreciationRate: 10,
    taxRate: 25,
    shortTermInterestRate: 10,
    sanctionedLimit: 3000000,
    minimumCashBalance: 50000,
  });

  it('passes for perfectly valid inputs', () => {
    const result = validateCMAInputs(getValidHistorical(), getValidAssumptions());
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('rejects negative revenue (HARD)', () => {
    const hist = getValidHistorical();
    hist.revenue = -5000;
    const result = validateCMAInputs(hist, getValidAssumptions());
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('revenue cannot be negative'))).toBe(true);
  });

  it('rejects negative margins (HARD)', () => {
    const assump = getValidAssumptions();
    assump.cogsMargin = -10;
    const result = validateCMAInputs(getValidHistorical(), assump);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('cogsMargin cannot be negative'))).toBe(true);
  });

  it('rejects >100% margins (HARD)', () => {
    const assump = getValidAssumptions();
    assump.taxRate = 120;
    const result = validateCMAInputs(getValidHistorical(), assump);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('taxRate cannot exceed 100%'))).toBe(true);
  });

  it('rejects NaN inputs (HARD)', () => {
    const hist = getValidHistorical();
    hist.cash = NaN;
    const result = validateCMAInputs(hist, getValidAssumptions());
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('missing or malformed'))).toBe(true);
  });

  it('generates warnings for loss-making historicals (WARN)', () => {
    const hist = getValidHistorical();
    hist.revenue = 100;
    hist.cogs = 120; // > revenue
    const result = validateCMAInputs(hist, getValidAssumptions());
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('COGS exceeds Revenue'))).toBe(true);
  });

  it('generates warnings for >100% CC utilization (WARN)', () => {
    const hist = getValidHistorical();
    const assump = getValidAssumptions();
    hist.shortTermBorrowings = 5000000;
    // To keep it balanced, reduce termLoans
    hist.termLoans = 5000000 - 3000000;
    const result = validateCMAInputs(hist, assump);
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('Historical Short-Term Borrowings already exceed'))).toBe(true);
  });

  it('rejects imbalanced historical balance sheet (HARD)', () => {
    const hist = getValidHistorical();
    hist.fixedAssets = 0; // Throws it out of balance by 4.5M
    const result = validateCMAInputs(hist, getValidAssumptions());
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Historical balance sheet does not balance'))).toBe(true);
  });

  it('generates warnings for negative equity (WARN)', () => {
    const hist = getValidHistorical();
    hist.equity = -50000; // distressed
    // Keep it balanced: original equity was 1,000,000, new is -50,000 (diff: -1,050,000)
    hist.fixedAssets -= 1050000;
    const result = validateCMAInputs(hist, getValidAssumptions());
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('Equity is negative'))).toBe(true);
  });

  it('generates warnings for unusual cash requirements (WARN)', () => {
    const assump = getValidAssumptions();
    assump.sanctionedLimit = 1000000;
    assump.minimumCashBalance = 2000000;
    const result = validateCMAInputs(getValidHistorical(), assump);
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('higher than the Sanctioned CC Limit'))).toBe(true);
  });
});
