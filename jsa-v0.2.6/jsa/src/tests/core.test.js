import { describe as suite, it, expect } from 'vitest';
import { parseCsv } from '../core/data/csvParser.js';
import { inferColumnType } from '../core/data/dataTypes.js';
import { datasetFromCsv, datasetFromJson, setColumnType } from '../core/data/datasetModel.js';
import { describe as stats, percentile } from '../core/analytics/descriptive.js';
import { aggregate } from '../core/analytics/aggregation.js';

suite('csv parser', () => {
  it('handles quotes, escaped quotes and embedded newlines', () => {
    const r = parseCsv('a,b\n"x, y","he said ""hi"""\n"line1\nline2",z');
    expect(r.rows).toEqual([['x, y', 'he said "hi"'], ['line1\nline2', 'z']]);
    expect(r.errors).toEqual([]);
  });
  it('detects semicolon and tab delimiters', () => {
    expect(parseCsv('a;b\n1;2').header).toEqual(['a', 'b']);
    expect(parseCsv('a\tb\n1\t2').delimiter).toBe('\t');
  });
  it('reports malformed rows and keeps data rectangular', () => {
    const r = parseCsv('a,b,c\n1,2\n1,2,3,4');
    expect(r.errors.filter((e) => e.type === 'malformed_row')).toHaveLength(2);
    expect(r.rows.every((x) => x.length === 3)).toBe(true);
  });
  it('flags empty input and unterminated quotes', () => {
    expect(parseCsv('').errors[0].type).toBe('empty_file');
    expect(parseCsv('a,b\n"oops,1').errors.some((e) => e.type === 'unterminated_quote')).toBe(true);
  });
  it('strips BOM and handles CRLF', () => {
    expect(parseCsv('\uFEFFa,b\r\n1,2\r\n').rows).toEqual([['1', '2']]);
  });
});

suite('type inference', () => {
  it('infers basic types', () => {
    expect(inferColumnType(['1', '2', '3']).type).toBe('integer');
    expect(inferColumnType(['1.5', '2']).type).toBe('decimal');
    expect(inferColumnType(['2024-01-05', '2024-02-10']).type).toBe('date');
    expect(inferColumnType(['yes', 'no']).type).toBe('boolean');
  });
  it('does not treat unique integer IDs as measures', () => {
    expect(inferColumnType(['1', '2', '3'], { name: 'customer_id' }).type).toBe('identifier');
  });
  it('rejects impossible dates', () => {
    expect(inferColumnType(['2024-02-31']).type).not.toBe('date');
  });
  it('ignores missing markers', () => {
    expect(inferColumnType(['1', '', 'NA', '3']).type).toBe('integer');
  });
});

suite('descriptive statistics', () => {
  it('matches 10, 20, 30', () => {
    const s = stats([10, 20, 30]);
    expect([s.count, s.sum, s.mean, s.median, s.min, s.max, s.range]).toEqual([3, 60, 20, 20, 10, 30, 20]);
  });
  it('sample vs population variance for 2,4,4,4,5,5,7,9', () => {
    const v = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(stats(v, { population: true }).variance).toBeCloseTo(4, 10);
    expect(stats(v, { population: true }).stdDev).toBeCloseTo(2, 10);
    expect(stats(v).variance).toBeCloseTo(32 / 7, 10);
  });
  it('quartiles use linear interpolation (1..5)', () => {
    const s = stats([1, 2, 3, 4, 5]);
    expect([s.q1, s.median, s.q3, s.iqr]).toEqual([2, 3, 4, 2]);
    expect(percentile([1, 2, 3, 4], 25)).toBeCloseTo(1.75, 10);
  });
  it('handles empty, missing and invalid input', () => {
    expect(stats([]).mean).toBeNull();
    const s = stats([1, null, 'x', NaN, 3]);
    expect(s.count).toBe(2);
    expect(s.missing).toBe(2);
    expect(s.invalid).toBe(1);
    expect(s.warnings.length).toBe(1);
  });
  it('single value: variance is null with a warning, not NaN', () => {
    const s = stats([5]);
    expect(s.variance).toBeNull();
    expect(s.warnings.length).toBe(1);
  });
});

suite('dataset model + aggregation', () => {
  const csv = 'id,region,units,price\n1,East,10,2.5\n2,East,20,2.5\n3,West,5,4\n4,West,,4\n5,North,1,1';
  it('builds columns with stable ids and typed data', () => {
    const ds = datasetFromCsv(csv, { name: 't' });
    expect(ds.rowCount).toBe(5);
    expect(ds.columns.map((c) => c.id)).toEqual(['c0', 'c1', 'c2', 'c3']);
    expect(ds.columns[2].type).toBe('integer');
    expect(ds.data.c2[3]).toBeNull();
  });
  it('de-duplicates repeated header names', () => {
    const ds = datasetFromCsv('a,a\n1,2');
    expect(ds.columns.map((c) => c.name)).toEqual(['a', 'a (2)']);
  });
  it('groups and aggregates, ignoring missing values', () => {
    const ds = datasetFromCsv(csv);
    const r = aggregate(ds, { groupBy: ['c1'], measures: [{ column: 'c2', op: 'sum', as: 'units' }, { op: 'count', as: 'n' }, { column: 'c2', op: 'avg', as: 'avg' }] });
    const by = Object.fromEntries(r.rows.map((x) => [x.c1, x]));
    expect(by.East.units).toBe(30);
    expect(by.West.units).toBe(5);
    expect(by.West.n).toBe(2);
    expect(by.West.avg).toBe(5);
    expect(by.North.units).toBe(1);
  });
  it('rejects unknown columns and ops', () => {
    const ds = datasetFromCsv(csv);
    expect(() => aggregate(ds, { groupBy: ['nope'], measures: [{ op: 'count' }] })).toThrow();
    expect(() => aggregate(ds, { measures: [{ column: 'c2', op: 'bogus' }] })).toThrow();
  });
  it('JSON import unions keys and warns on nested values', () => {
    const ds = datasetFromJson('[{"a":1,"b":{"x":1}},{"a":2,"c":"z"}]');
    expect(ds.columns.map((c) => c.name)).toEqual(['a', 'b', 'c']);
    expect(ds.warnings[0].type).toBe('nested_values');
    expect(() => datasetFromJson('{"a":1}')).toThrow();
  });
  it('type override re-coerces data', () => {
    const ds = setColumnType(datasetFromCsv('id,v\n1,5\n2,6'), 'c1', 'text');
    expect(ds.data.c1).toEqual(['5', '6']);
  });
});
