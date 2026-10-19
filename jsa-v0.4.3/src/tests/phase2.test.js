import { describe, it, expect } from 'vitest';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import { parseDate, parseTime, inferColumnType } from '../core/data/dataTypes.js';
import { evaluateFilters } from '../core/transforms/filters.js';
import { sortIndices } from '../core/transforms/sorting.js';
import { compileExpression } from '../core/transforms/expression.js';
import { makeStep, runPipeline } from '../core/transforms/pipeline.js';
import { computeKpi } from '../core/analytics/kpis.js';
import { runAnalysis } from '../core/analytics/analyses.js';
import { formatKpi } from '../core/analytics/kpis.js';

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
  it('supports does-not-contain and ends-with text conditions', () => {
    const d = ds(); const region = col(d, 'region');
    expect(evaluateFilters(d, [{ column: region, op: 'notContains', value: 'a' }])).toEqual([2, 3, 4, 5]);
    expect(evaluateFilters(d, [{ column: region, op: 'endsWith', value: 'st' }])).toEqual([0, 1, 2, 3]);
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
  it('sorts date and time columns chronologically, with missing values last', () => {
    const d = datasetFromCsv('date,time\n2024-10-02,14:30\n2022-01-05,08:15\n2023-06-15,12:45\n,');
    const date = col(d, 'date'); const time = col(d, 'time');
    expect(sortIndices(d, date, 'asc')).toEqual([1, 2, 0, 3]);
    expect(sortIndices(d, time, 'asc')).toEqual([1, 2, 0, 3]);
    expect(sortIndices(d, date, 'desc')).toEqual([0, 2, 1, 3]);
  });
  it('sorts with missing last in both directions', () => {
    const d = ds(); const u = col(d, 'units');
    expect(sortIndices(d, u, 'asc')).toEqual([4, 5, 2, 0, 1, 3]);
    expect(sortIndices(d, u, 'desc')).toEqual([1, 0, 2, 4, 5, 3]);
  });
});

describe('measure-level filters', () => {
  it('filters each measure independently inside grouped analysis', () => {
    const d = ds();
    const result = runAnalysis(d, { groupBy: [col(d, 'region')], filters: [], measures: [
      { op: 'count', as: 'all rows' },
      { op: 'count', as: 'east rows', filters: [{ column: col(d, 'region'), op: 'eq', value: 'East' }], filterMode: 'all' },
    ] });
    const east = result.rows.find((r) => r[col(d, 'region')] === 'East');
    const west = result.rows.find((r) => r[col(d, 'region')] === 'West');
    expect(east['all rows']).toBe(2); expect(east['east rows']).toBe(2);
    expect(west['all rows']).toBe(2); expect(west['east rows']).toBe(0);
  });
});

describe('KPI formatting', () => {
  it('respects user-selected precision for currency and decimal values', () => {
    expect(formatKpi(1234.5, { format: 'currency', precision: 2 })).toContain('1,234.50');
    expect(formatKpi(1234.5, { format: 'number', precision: 4 })).toBe('1,234.5000');
    expect(formatKpi(0.256, { format: 'percent', precision: 1 })).toBe('25.6%');
    expect(formatKpi(2 / 6, { format: 'percent' })).toBe('33.33%');
    expect(formatKpi(39)).toBe('39');
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


describe('v0.4.1 date and time handling', () => {
  it('parses common calendar formats and time-only values', () => {
    expect(parseDate('2024-03-31')?.toISOString()).toBe('2024-03-31T00:00:00.000Z');
    expect(parseDate('31/03/2024')?.toISOString()).toBe('2024-03-31T00:00:00.000Z');
    expect(parseDate('03/31/2024')?.toISOString()).toBe('2024-03-31T00:00:00.000Z');
    expect(parseDate('31/03/2024 14:05')?.toISOString()).toBe('2024-03-31T14:05:00.000Z');
    expect(parseTime('9:05')).toBe('09:05:00');
    expect(inferColumnType(['09:00', '14:30']).type).toBe('time');
    expect(inferColumnType(['31/03/2024', '01/04/2024']).type).toBe('date');
  });

  it('extracts month names, ISO week numbers, and time components', () => {
    const src = datasetFromCsv('date,time\n2024-01-01,09:15\n2024-03-31,14:45\n2024-12-31,23:59');
    const { dataset, results } = runPipeline(src, [
      makeStep('extractDate', { column: col(src, 'date'), part: 'monthName' }),
      makeStep('extractDate', { column: col(src, 'date'), part: 'weekNumber' }),
      makeStep('extractDate', { column: col(src, 'time'), part: 'hour' }),
    ]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(dataset.data.c2).toEqual(['January', 'March', 'December']);
    expect(dataset.columns.find((c) => c.id === 'c2').sortOrder).toBe('month');
    expect(sortIndices(dataset, 'c2', 'asc').map((i) => dataset.data.c2[i])).toEqual(['January', 'March', 'December']);
    expect(dataset.data.c3).toEqual([1, 13, 1]);
    expect(dataset.data.c4).toEqual([9, 14, 23]);
  });

  it('moves a column directly to a user-entered one-based position', () => {
    const src = ds();
    const { dataset, results } = runPipeline(src, [makeStep('reorderColumns', { column: col(src, 'date'), targetPosition: '2' })]);
    expect(results[0].ok).toBe(true);
    expect(dataset.columns.map((c) => c.name)).toEqual(['id', 'date', 'region', 'units', 'price', 'churn']);
    expect(results[0].summary).toMatch(/position 2/);
  });
});


describe('date-only value preservation', () => {
  it('stores slash-formatted date-only values as YYYY-MM-DD without a time', () => {
    const ds = datasetFromCsv('date\n12/10/2010\n01/05/2011');
    expect(ds.columns[0].type).toBe('date');
    expect(ds.data[ds.columns[0].id]).toEqual(['2010-12-10', '2011-01-05']);
  });

  it('keeps actual datetime columns as ISO datetimes', () => {
    const ds = datasetFromCsv('created_at\n2010-12-10T14:30:00Z\n2011-01-05T09:15:00Z');
    expect(ds.columns[0].type).toBe('datetime');
    expect(ds.data[ds.columns[0].id]).toEqual(['2010-12-10T14:30:00.000Z', '2011-01-05T09:15:00.000Z']);
  });
});
