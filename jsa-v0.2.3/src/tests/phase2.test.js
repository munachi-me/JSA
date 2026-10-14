import { describe, it, expect } from 'vitest';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import { evaluateFilters } from '../core/transforms/filters.js';
import { sortIndices } from '../core/transforms/sorting.js';
import { compileExpression } from '../core/transforms/expression.js';
import { makeStep, runPipeline } from '../core/transforms/pipeline.js';
import { computeKpi } from '../core/analytics/kpis.js';
import { runAnalysis } from '../core/analytics/analyses.js';

const CSV = `id,region,units,price,date,churn
1,East,10,2,2024-01-15,Yes
2,East,20,2,2024-02-20,No
3,West,5,4,2024-02-25,No
4,West,,4,2024-03-01,Yes
5,North,1,0,2024-03-31,No
5,North,1,0,2024-03-31,No`;
const ds = () => datasetFromCsv(CSV, { name: 't' });
const col = (d, n) => d.columns.find((c) => c.name === n).id;

describe('filters', () => {
  it('numeric, text, between, missing and any/all', () => {
    const d = ds();
    expect(evaluateFilters(d, [{ column: col(d, 'units'), op: 'gt', value: '5' }])).toEqual([0, 1]);
    expect(evaluateFilters(d, [{ column: col(d, 'region'), op: 'eq', value: 'east' }])).toEqual([0, 1]);
    expect(evaluateFilters(d, [{ column: col(d, 'units'), op: 'between', value: '1', value2: '10' }])).toEqual([0, 2, 4, 5]);
    expect(evaluateFilters(d, [{ column: col(d, 'units'), op: 'isMissing' }])).toEqual([3]);
  });
  it('any vs all produce correct sets', () => {
    const d = ds();
    const c = [{ column: col(d, 'region'), op: 'eq', value: 'West' }, { column: col(d, 'churn'), op: 'eq', value: 'Yes' }];
    expect(evaluateFilters(d, c, 'all')).toEqual([3]);
    expect(evaluateFilters(d, c, 'any')).toEqual([0, 2, 3]);
  });
  it('date range', () => {
    const d = ds();
    expect(evaluateFilters(d, [{ column: col(d, 'date'), op: 'between', value: '2024-02-01', value2: '2024-02-29' }])).toEqual([1, 2]);
  });
  it('comparison operators exclude missing cells, and invalid input throws', () => {
    const d = ds();
    expect(evaluateFilters(d, [{ column: col(d, 'units'), op: 'ne', value: '10' }])).toEqual([1, 2, 4, 5]);
    expect(() => evaluateFilters(d, [{ column: col(d, 'units'), op: 'gt', value: 'abc' }])).toThrow(/not a valid/);
    expect(() => evaluateFilters(d, [{ column: 'nope', op: 'eq', value: '1' }])).toThrow(/Unknown column/);
    expect(() => evaluateFilters(d, [{ column: col(d, 'units'), op: 'between', value: '9', value2: '1' }])).toThrow(/lower bound/);
  });
});

describe('sorting', () => {
  it('sorts with missing last in both directions', () => {
    const d = ds(); const u = col(d, 'units');
    expect(sortIndices(d, u, 'asc')).toEqual([4, 5, 2, 0, 1, 3]);
    expect(sortIndices(d, u, 'desc')).toEqual([1, 0, 2, 4, 5, 3]);
  });
});

describe('expressions', () => {
  it('respects precedence, handles division by zero and missing', () => {
    const d = ds();
    const e = compileExpression('[units] * [price] + 1', d);
    expect([e.evaluate(0), e.evaluate(3)]).toEqual([21, null]);
    expect(compileExpression('[units] / [price]', d).evaluate(4)).toBeNull();
    expect(compileExpression('-(2 + 3) * 2', d).evaluate(0)).toBe(-10);
  });
  it('rejects unknown columns, non-numeric columns and garbage', () => {
    const d = ds();
    expect(() => compileExpression('[nope]', d)).toThrow(/Unknown column/);
    expect(() => compileExpression('[region] + 1', d)).toThrow(/not numeric/);
    expect(() => compileExpression('process.exit()', d)).toThrow();
    expect(() => compileExpression('1 +', d)).toThrow();
  });
});

describe('pipeline', () => {
  it('runs steps in order, reports what changed, leaves the source untouched', () => {
    const src = ds();
    const steps = [
      makeStep('dedupe', { columns: [] }),
      makeStep('fillMissing', { column: col(src, 'units'), method: 'median' }),
      makeStep('calcColumn', { name: 'revenue', expression: '[units] * [price]' }),
    ];
    const { dataset, results } = runPipeline(src, steps);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(results[0].summary).toMatch(/Removed 1 duplicate row/);
    expect(dataset.rowCount).toBe(5);
    expect(src.rowCount).toBe(6);
    expect(src.data.c2[3]).toBeNull();
    // median of {10,20,5,1} after dedupe = 7.5
    expect(dataset.data.c2[3]).toBe(7.5);
    expect(dataset.data[dataset.columns.at(-1).id]).toEqual([20, 40, 20, 30, 0]);
  });
  it('removing a step re-derives the dataset (undo)', () => {
    const src = ds();
    const a = makeStep('dedupe', { columns: [] });
    const b = makeStep('filterRows', { conditions: [{ column: col(src, 'region'), op: 'eq', value: 'East' }] });
    expect(runPipeline(src, [a, b]).dataset.rowCount).toBe(2);
    expect(runPipeline(src, [a]).dataset.rowCount).toBe(5);
  });
  it('a failing step is skipped and reported, later steps still run', () => {
    const src = ds();
    const bad = makeStep('fillMissing', { column: col(src, 'region'), method: 'mean' });
    const good = makeStep('dedupe', { columns: [] });
    const { dataset, results } = runPipeline(src, [bad, good]);
    expect(results[0].ok).toBe(false);
    expect(results[0].error).toMatch(/numeric/);
    expect(dataset.rowCount).toBe(5);
  });
  it('type conversion states how many values were lost', () => {
    const src = ds();
    const { results } = runPipeline(src, [makeStep('convertType', { column: col(src, 'region'), type: 'integer' })]);
    expect(results[0].summary).toMatch(/6 values could not be converted/);
  });
  it('extracts date parts and flags (not removes) outliers', () => {
    const src = datasetFromCsv('d,v\n2024-01-05,1\n2024-04-09,2\n2024-07-04,3\n2024-12-25,2\n2024-12-26,100');
    const { dataset, results } = runPipeline(src, [
      makeStep('extractDate', { column: 'c0', part: 'quarter' }),
      makeStep('extractDate', { column: 'c0', part: 'weekday' }),
      makeStep('flagOutliers', { column: 'c1' }),
    ]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(dataset.data.c2).toEqual([1, 2, 3, 4, 4]);
    expect(dataset.data.c3[0]).toBe('Friday');
    expect(dataset.data.c4).toEqual([false, false, false, false, true]);
    expect(dataset.rowCount).toBe(5);
  });
});

describe('KPIs', () => {
  it('churn rate = churned rows / all rows, from the data', () => {
    const d = ds();
    const k = computeKpi(d, { name: 'Churn', format: 'percent', numerator: { op: 'count', filters: [{ column: col(d, 'churn'), op: 'eq', value: 'Yes' }] }, denominator: { op: 'count' }, target: { value: 0.5, direction: 'lower' } });
    expect(k.value).toBeCloseTo(2 / 6, 12);
    expect(k.formatted).toBe('33.33%');
    expect(k.status).toBe('met');
  });
  it('plain sum with filters, and zero denominator yields null + warning', () => {
    const d = ds();
    expect(computeKpi(d, { numerator: { op: 'sum', column: col(d, 'units'), filters: [{ column: col(d, 'region'), op: 'eq', value: 'East' }] } }).value).toBe(30);
    const z = computeKpi(d, { numerator: { op: 'count' }, denominator: { op: 'count', filters: [{ column: col(d, 'region'), op: 'eq', value: 'Mars' }] } });
    expect(z.value).toBeNull();
    expect(z.warnings.length).toBe(1);
  });
});

describe('saved analyses', () => {
  it('reproduces the same result from the same definition and respects filters/sort/limit', () => {
    const d = ds();
    const def = { filters: [{ column: col(d, 'churn'), op: 'eq', value: 'No' }], groupBy: [col(d, 'region')], measures: [{ column: col(d, 'units'), op: 'sum', as: 'units' }], sortBy: 'units', sortDir: 'desc', limit: 2 };
    const a = runAnalysis(d, def), b = runAnalysis(JSON.parse(JSON.stringify(d)), JSON.parse(JSON.stringify(def)));
    expect(a.rows).toEqual(b.rows);
    expect(a.rows.map((r) => [r.c1, r.units])).toEqual([['East', 20], ['West', 5]]);
    expect(a.rowsUsed).toBe(4);
    expect(a.warnings.join()).toMatch(/first 2 of 3/);
  });
  it('errors on an unknown sort column', () => {
    const d = ds();
    expect(() => runAnalysis(d, { groupBy: [], measures: [{ op: 'count', as: 'n' }], sortBy: 'zzz' })).toThrow();
  });
});
