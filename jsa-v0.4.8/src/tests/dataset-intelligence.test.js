import { describe, it, expect } from 'vitest';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import { analyzeDataset } from '../core/data/intelligence.js';

describe('Dataset Intelligence Engine', () => {
  it('summarizes missing cells, exact duplicates, and numeric fields', () => {
    const ds = datasetFromCsv('name,age,score\nAda,30,10\nBen,,12\nBen,,12\nCy,35,100');
    const report = analyzeDataset(ds);
    expect(report.summary.rows).toBe(4);
    expect(report.summary.columns).toBe(3);
    expect(report.summary.missingCells).toBe(2);
    expect(report.summary.duplicateRows).toBe(1);
    expect(report.summary.numericColumns).toBe(2);
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.recommendations.some((r) => r.id === 'missing')).toBe(true);
    expect(report.recommendations.some((r) => r.id === 'duplicates')).toBe(true);
  });

  it('flags constant columns and possible IQR outliers without claiming they are errors', () => {
    const ds = datasetFromCsv('group,value\nA,10\nA,11\nA,10\nA,12\nA,500');
    const report = analyzeDataset(ds);
    expect(report.recommendations.some((r) => r.id === 'constant')).toBe(true);
    expect(report.recommendations.some((r) => r.id === 'outliers')).toBe(true);
    expect(report.columnProfiles.find((c) => c.name === 'value').numeric.max).toBe(500);
    expect(report.methodology).toContain('not necessarily errors');
  });

  it('handles an empty-row dataset without crashing', () => {
    const ds = datasetFromCsv('name,amount');
    const report = analyzeDataset(ds);
    expect(report.summary.rows).toBe(0);
    expect(report.score).toBe(100);
    expect(report.recommendations[0].id).toBe('healthy');
  });
});
