import { describe, it, expect } from 'vitest';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import { suggestKpis, suggestCharts, suggestAnalyses } from '../core/analytics/suggestions.js';

const makeDataset = () => {
  const ds = datasetFromCsv('date,region,revenue,units\n2024-01-01,East,20,2\n2024-02-01,West,30,3\n2024-03-01,East,40,4');
  return { ...ds, kpis: [], analyses: [], visualizations: [] };
};

describe('Smart KPI & Chart Suggestions', () => {
  it('suggests KPIs from row count, numeric columns, and categorical columns', () => {
    const ds = makeDataset();
    const suggestions = suggestKpis(ds);
    expect(suggestions.some((s) => s.name === 'Total records' && s.numerator.op === 'count')).toBe(true);
    expect(suggestions.some((s) => s.name === 'Total revenue' && s.numerator.op === 'sum')).toBe(true);
    expect(suggestions.some((s) => s.name === 'Average revenue' && s.numerator.op === 'avg')).toBe(true);
    expect(suggestions.some((s) => s.name === 'Unique region' && s.numerator.op === 'distinct')).toBe(true);
  });

  it('suggests suitable chart configurations and leaves them unsaved', () => {
    const ds = makeDataset();
    const suggestions = suggestCharts(ds);
    expect(suggestions.some((s) => s.spec.type === 'line' && s.spec.dimension === ds.columns.find((c) => c.name === 'date').id)).toBe(true);
    expect(suggestions.some((s) => s.spec.type === 'bar' && s.spec.dimension === ds.columns.find((c) => c.name === 'region').id)).toBe(true);
    expect(suggestions.some((s) => s.spec.type === 'scatter')).toBe(true);
    expect(ds.visualizations).toHaveLength(0);
  });

  it('suggests grouped analyses, investigations, and data-quality checks without saving them', () => {
    const ds = makeDataset();
    const suggestions = suggestAnalyses(ds);
    expect(suggestions.some((s) => s.category === 'Grouped analysis' && s.definition?.groupBy?.length === 1)).toBe(true);
    expect(suggestions.some((s) => s.category === 'Investigation' && s.action === 'correlation')).toBe(true);
    expect(suggestions.some((s) => s.category === 'Investigation' && s.action === 'chart')).toBe(true);
    expect(suggestions.some((s) => s.category === 'Data quality')).toBe(true);
    expect(ds.analyses).toHaveLength(0);
    expect(ds.visualizations).toHaveLength(0);
  });

  it('does not crash when recommendations have no usable columns', () => {
    expect(suggestAnalyses({ columns: [], rowCount: 0 })).toEqual([]);
  });

  it('does not repeat already-defined KPI suggestions', () => {
    const ds = makeDataset();
    ds.kpis = [{ name: 'Total records', numerator: { op: 'count' } }];
    expect(suggestKpis(ds).some((s) => s.name === 'Total records')).toBe(false);
  });

  it('handles datasets without columns safely', () => {
    expect(suggestKpis({ columns: [], rowCount: 0, kpis: [] })).toEqual([]);
    expect(suggestCharts({ columns: [] })).toEqual([]);
  });
});
