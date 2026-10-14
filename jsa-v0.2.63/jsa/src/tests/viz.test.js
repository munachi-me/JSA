import { describe, it, expect } from 'vitest';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import { buildChartData, periodKey } from '../core/visualization/chartData.js';
import { makeSpec, normalizeSpec, validateSpec, defaultSpecFor, suggestChartType } from '../core/visualization/chartSpec.js';
import { niceTicks, formatTick } from '../core/visualization/scales.js';

const withExtras = (ds) => ({ ...ds, analyses: [], kpis: [], visualizations: [] });
const CSV = `region,product,units,date,price
East,A,10,2024-01-15,1.5
East,B,20,2024-01-20,2
West,A,5,2024-02-10,3
West,B,,2024-03-05,4
North,A,1,2024-03-31,5
North,A,3,2024-03-31,5`;
const ds = () => withExtras(datasetFromCsv(CSV));
const id = (d, n) => d.columns.find((c) => c.name === n).id;
const spec = (d, p) => makeSpec({ dimension: id(d, 'region'), measures: [{ op: 'sum', column: id(d, 'units'), as: '' }], ...p });

describe('category charts', () => {
  it('bar: aggregates real values, sorted by value desc by default', () => {
    const d = ds();
    const r = buildChartData(d, spec(d, { type: 'bar' }));
    expect(r.points).toEqual([{ label: 'East', value: 30 }, { label: 'West', value: 5 }, { label: 'North', value: 4 }]);
    expect(r.measureLabel).toBe('sum of units');
  });
  it('sort by label and top-N with truncation notice', () => {
    const d = ds();
    const r = buildChartData(d, spec(d, { type: 'bar', sort: { by: 'label', dir: 'asc' }, limit: 2 }));
    expect(r.points.map((p) => p.label)).toEqual(['East', 'North']);
    expect(r.truncated).toEqual({ shown: 2, total: 3 });
    expect(r.warnings.join()).toMatch(/top 2 of 3/);
  });
  it('line over a date dimension groups by month, chronologically', () => {
    const d = ds();
    const r = buildChartData(d, spec(d, { type: 'line', dimension: id(d, 'date'), timeGrain: 'month' }));
    expect(r.points).toEqual([{ label: '2024-01', value: 30 }, { label: '2024-02', value: 5 }, { label: '2024-03', value: 4 }]);
    expect(buildChartData(d, spec(d, { type: 'line', dimension: id(d, 'date'), timeGrain: 'quarter' })).points).toEqual([{ label: '2024-Q1', value: 39 }]);
    expect(periodKey('2024-12-31', 'year')).toBe('2024');
  });
  it('stacked and grouped build a series matrix', () => {
    const d = ds();
    const r = buildChartData(d, spec(d, { type: 'stacked', series: id(d, 'product'), sort: { by: 'label', dir: 'asc' } }));
    expect(r.kind).toBe('multi');
    expect(r.categories).toEqual(['East', 'North', 'West']);
    expect(r.series).toEqual([{ name: 'A', values: [10, 4, 5] }, { name: 'B', values: [20, null, null] }]);
  });
  it('pie: drops negatives with a warning and groups the rest as Other when additive', () => {
    const d = ds();
    const r = buildChartData(d, spec(d, { type: 'pie', limit: 2 }));
    expect(r.points).toEqual([{ label: 'East', value: 30 }, { label: 'West', value: 5 }, { label: 'Other', value: 4 }]);
    expect(r.total).toBe(39);
    const neg = withExtras(datasetFromCsv('k,v\na,5\nb,-3\nc,2'));
    const rn = buildChartData(neg, makeSpec({ type: 'pie', dimension: 'c0', measures: [{ op: 'sum', column: 'c1', as: '' }] }));
    expect(rn.points.map((p) => p.label)).toEqual(['a', 'c']);
    expect(rn.warnings.join()).toMatch(/negative/);
  });
  it('filters are respected and an empty result is reported, not faked', () => {
    const d = ds();
    const r = buildChartData(d, spec(d, { type: 'bar', filters: [{ column: id(d, 'region'), op: 'eq', value: 'Mars' }] }));
    expect(r.empty).toBe(true);
    expect(r.points).toEqual([]);
  });
  it('charts a saved analysis result', () => {
    const d = ds();
    d.analyses = [{ id: 'a1', name: 'by region', filters: [], groupBy: [id(d, 'region')], measures: [{ column: id(d, 'units'), op: 'sum', as: 'units' }] }];
    const r = buildChartData(d, makeSpec({ type: 'bar', source: { kind: 'analysis', analysisId: 'a1' }, dimension: id(d, 'region'), measures: [{ op: 'sum', as: 'units' }] }));
    expect(r.points[0]).toEqual({ label: 'East', value: 30 });
  });
});

describe('other chart types', () => {
  it('histogram with explicit bins covers every value once; max falls in the last bin', () => {
    const d = withExtras(datasetFromCsv('v\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10'));
    const r = buildChartData(d, makeSpec({ type: 'histogram', column: 'c0', bins: 5 }));
    expect(r.bins.map((b) => b.count)).toEqual([2, 2, 2, 2, 2]);
    expect(r.bins[0].x0).toBe(1);
    expect(r.bins[4].x1).toBe(10);
    expect(r.bins.reduce((a, b) => a + b.count, 0)).toBe(10);
  });
  it('histogram handles constant values and uses Sturges by default', () => {
    expect(buildChartData(withExtras(datasetFromCsv('v\n5\n5\n5')), makeSpec({ type: 'histogram', column: 'c0' })).bins).toEqual([{ x0: 5, x1: 5, count: 3 }]);
    const d = withExtras(datasetFromCsv(`v\n${Array.from({ length: 64 }, (_, i) => i).join('\n')}`));
    expect(buildChartData(d, makeSpec({ type: 'histogram', column: 'c0' })).bins).toHaveLength(7);
  });
  it('scatter omits missing pairs with a warning and samples large sets', () => {
    const d = ds();
    const r = buildChartData(d, makeSpec({ type: 'scatter', x: id(d, 'units'), y: id(d, 'price') }));
    expect(r.points).toHaveLength(5);
    expect(r.warnings.join()).toMatch(/1 row/);
    const big = withExtras(datasetFromCsv(`x,y\n${Array.from({ length: 5000 }, (_, i) => `${i},${i * 2}`).join('\n')}`));
    const rb = buildChartData(big, makeSpec({ type: 'scatter', x: 'c0', y: 'c1' }));
    expect(rb.points).toHaveLength(2000);
    expect(rb.truncated.sampled).toBe(true);
  });
  it('table caps rows and sorts by a column', () => {
    const d = ds();
    const r = buildChartData(d, makeSpec({ type: 'table', sort: { by: id(d, 'price'), dir: 'desc' } }));
    expect(r.rows[0][4]).toBe(5);
    expect(r.rows).toHaveLength(6);
  });
  it('kpi card reads a saved KPI', () => {
    const d = ds();
    d.kpis = [{ id: 'k1', name: 'Units', numerator: { op: 'sum', column: id(d, 'units') } }];
    const r = buildChartData(d, makeSpec({ type: 'kpi', kpiId: 'k1' }));
    expect(r.value).toBe(39);
    expect(r.formatted).toBe('39');
  });
});

describe('spec helpers', () => {
  it('validates missing and wrongly-typed fields', () => {
    const d = ds();
    expect(validateSpec(d, makeSpec({ type: 'bar' }))).toContain('Choose a dimension.');
    expect(validateSpec(d, makeSpec({ type: 'scatter', x: id(d, 'region'), y: id(d, 'units') })).join()).toMatch(/must be numeric/);
    expect(validateSpec(d, makeSpec({ type: 'stacked', dimension: id(d, 'region') })).join()).toMatch(/needs a series/);
    expect(validateSpec(d, makeSpec({ type: 'histogram', column: id(d, 'units'), bins: 0 })).join()).toMatch(/Bins/);
    expect(() => buildChartData(d, makeSpec({ type: 'kpi' }))).toThrow(/KPI/);
  });
  it('normalize fills sensible defaults; default spec builds a chart', () => {
    const d = ds();
    const s = normalizeSpec(d, makeSpec({ type: 'scatter' }));
    expect([s.x, s.y]).toEqual([id(d, 'units'), id(d, 'price')]);
    expect(normalizeSpec(d, makeSpec({ type: 'stacked' })).series).not.toBe('');
    expect(buildChartData(d, defaultSpecFor(d)).empty).toBe(false);
  });
  it('suggests a line chart for date dimensions only', () => {
    const d = ds();
    expect(suggestChartType(d, spec(d, { type: 'bar', dimension: id(d, 'date') }))).toBe('line');
    expect(suggestChartType(d, spec(d, { type: 'bar' }))).toBeNull();
  });
  it('nice ticks and tick formatting', () => {
    expect(niceTicks(0, 97)).toEqual({ ticks: [0, 20, 40, 60, 80, 100], min: 0, max: 100 });
    expect(niceTicks(5, 5).ticks.length).toBeGreaterThan(1);
    expect(formatTick(12500)).toBe('12.5k');
    expect(formatTick(0.25)).toBe('0.25');
  });
});
