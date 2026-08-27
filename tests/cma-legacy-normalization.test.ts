import { describe, it, expect } from 'vitest';
import { CMAProjectedYear } from '../lib/pipelines/cma';
import { mapV1ToV2Projections } from '../lib/pipelines/cma-legacy-mapper';

describe('Legacy Normalization & Balance Sheet Crash Prevention', () => {
  
  it('should normalize a legacy projection missing Phase 8 fields', () => {
    // 1. Construct the affected legacy projection shape (missing the fields)
    const legacyProjection: Partial<CMAProjectedYear> = {
      year: 1,
      totalCurrentAssets: { value: 500, formula: '', inputs: {} },
      fixedAssets: { value: 300, formula: '', inputs: {} },
      otherNonCurrentAssets: { value: 100, formula: '', inputs: {} },
      totalCurrentLiabilities: { value: 400, formula: '', inputs: {} },
      termLoans: { value: 200, formula: '', inputs: {} },
      otherNonCurrentLiabilities: { value: 50, formula: '', inputs: {} },
      equity: { value: 250, formula: '', inputs: {} },
      creditors: { value: 100, formula: '', inputs: {} },
      otherCurrentLiabilities: { value: 50, formula: '', inputs: {} },
      // Omit totalAssets, totalLiabilitiesAndEquity, netWorkingCapital
    };

    // 2. Pass it through the same normalization path used by the UI
    const normalized = mapV1ToV2Projections([legacyProjection]);
    
    // 3. Assert that totalAssets and totalLiabilitiesAndEquity are present as AuditedValue objects
    expect(normalized[0].totalAssets).toBeDefined();
    expect(normalized[0].totalAssets.value).toBe(900); // 500 + 300 + 100
    
    expect(normalized[0].totalLiabilitiesAndEquity).toBeDefined();
    expect(normalized[0].totalLiabilitiesAndEquity.value).toBe(900); // 400 + 200 + 50 + 250
    
    // 4. Assert Assets = Liabilities + Equity remains intact
    expect(normalized[0].totalAssets.value).toEqual(normalized[0].totalLiabilitiesAndEquity.value);
    
    // 5. Assert other missing fields are backfilled correctly
    expect(normalized[0].netWorkingCapital).toBeDefined();
    expect(normalized[0].netWorkingCapital.value).toBe(100); // 500 - 400
    
    expect(normalized[0].workingCapitalGap).toBeDefined();
    expect(normalized[0].workingCapitalGap.value).toBe(350); // 500 - (100 + 50)
  });
});
