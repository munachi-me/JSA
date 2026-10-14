import { describe, it, expect } from 'vitest';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import { runPipeline, makeStep } from '../core/transforms/pipeline.js';
import { betaIncomplete, tTwoTailedP, fPValue, chiSquareP, anova, chiSquareTest } from '../core/analytics/inference.js';
import { pearson } from '../core/analytics/correlation.js';
import { generateInsights, defaultMeasureOps } from '../core/insights/insightEngine.js';
import { readFileSync } from 'node:fs';

describe('inference (against known values)', () => {
  it('incomplete beta, t, F and chi-square p-values', () => {
    expect(betaIncomplete(0.5, 2, 3)).toBeCloseTo(0.6875, 6);
    expect(tTwoTailedP(2.0, 10)).toBeCloseTo(0.0734, 3);
    expect(fPValue(3.0984, 3, 20)).toBeCloseTo(0.05, 3);
    expect(chiSquareP(3.841, 1)).toBeCloseTo(0.05, 3);
    expect(chiSquareP(5.991, 2)).toBeCloseTo(0.05, 3);
    expect(chiSquareP(4, 2)).toBeCloseTo(Math.exp(-2), 8);
  });
  it('ANOVA matches a hand calculation: groups {1,2,3},{2,3,4},{5,6,7}', () => {
    const a = anova([[1, 2, 3], [2, 3, 4], [5, 6, 7]]);
    expect(a.F).toBeCloseTo(13, 10);
    expect([a.df1, a.df2]).toEqual([2, 6]);
    expect(a.p).toBeCloseTo((1 + 13 / 3) ** -3, 6);
    expect(a.etaSquared).toBeCloseTo(26 / 32, 10);
    expect(anova([[1, 1], [1, 1]]).p).toBe(1);
    expect(anova([[1, 2]])).toBeNull();
  });
  it('chi-square independence test', () => {
    const t = chiSquareTest([[10, 10], [10, 10]]);
    expect(t.chi2).toBe(0);
    expect(t.p).toBe(1);
    const u = chiSquareTest([[20, 0], [0, 20]]);
    expect(u.chi2).toBeCloseTo(40, 10);
    expect(u.cramersV).toBeCloseTo(1, 10);
  });
  it('Pearson: known r, perfect, constant and tiny samples', () => {
    expect(pearson([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]).r).toBeCloseTo(0.7745967, 6);
    expect(pearson([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]).p).toBeCloseTo(0.124, 2);
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toMatchObject({ r: 1, p: 0 });
    expect(pearson([1, 1, 1], [1, 2, 3]).r).toBeNull();
    expect(pearson([1, 2], [1, 2]).r).toBeNull();
    expect(pearson([1, null, 3, 4], [2, 5, 6, 8]).n).toBe(3);
  });
});

const churnCsv = () => {
  const rows = ['contract,tenure,churn'];
  const mk = (c, n, yes) => { for (let i = 0; i < n; i++) rows.push(`${c},${12 + (i % 24)},${i < yes ? 'Yes' : 'No'}`); };
  mk('Month-to-month', 100, 40); mk('One year', 100, 10); mk('Two year', 100, 5);
  return rows.join('\n');
};
const find = (r, rule) => r.insights.filter((i) => i.rule === rule);
const ev = (ins, label) => ins.evidence.find((e) => e.label === label).value;

describe('insight rules', () => {
  it('churn by contract: rates are computed from the data, with a chi-square test', () => {
    const r = generateInsights(datasetFromCsv(churnCsv()));
    const [ins] = find(r, 'outcomeRate');
    expect(ins.kind).toBe('association');
    expect(ev(ins, 'Month-to-month: rate')).toBeCloseTo(0.4, 12);
    expect(ev(ins, 'Two year: rate')).toBeCloseTo(0.05, 12);
    expect(ev(ins, 'Overall rate')).toBeCloseTo(55 / 300, 12);
    expect(ev(ins, 'p-value')).toBeLessThan(0.0001);
    expect(ins.title).toMatch(/highest for Month-to-month \(40\.0%\) and lowest for Two year \(5\.0%\)/);
    expect(ins.limitations.join(' ')).toMatch(/does not show that the group causes/);
    expect(ins.followUp).toMatch(/additional evidence/);
    // the engine states observed differences but never invents a reason
    expect(JSON.stringify(ins)).not.toMatch(/because|due to the contract|caused by/i);
  });
  it('equal rates across groups produce no association insight', () => {
    const rows = ['g,churn']; for (const g of ['a', 'b', 'c']) for (let i = 0; i < 50; i++) rows.push(`${g},${i < 10 ? 'Yes' : 'No'}`);
    const r = generateInsights(datasetFromCsv(rows.join('\n')));
    expect(find(r, 'outcomeRate')).toHaveLength(0);
    expect(r.insights.filter((i) => i.kind === 'association')).toHaveLength(0);
  });
  it('top/bottom uses the stated aggregation and excludes tiny groups', () => {
    const rows = ['region,units']; for (let i = 0; i < 6; i++) rows.push(`East,10`); for (let i = 0; i < 6; i++) rows.push(`West,4`); rows.push('Tiny,1000');
    const r = generateInsights(datasetFromCsv(rows.join('\n')));
    const [ins] = find(r, 'topBottom');
    expect(ev(ins, 'Highest (East)')).toBe(60);
    expect(ev(ins, 'Lowest (West)')).toBe(24);
    expect(ev(ins, 'Groups excluded (too small)')).toBe(1);
    expect(ins.title).toMatch(/East has the highest total units/);
  });
  it('rate-like column names are averaged and the choice can be overridden', () => {
    const ds = datasetFromCsv('region,unit_price\nA,2\nA,4\nA,6\nA,8\nA,10\nB,1\nB,1\nB,1\nB,1\nB,1');
    expect(defaultMeasureOps(ds).c1).toBe('mean');
    expect(ev(find(generateInsights(ds), 'topBottom')[0], 'Highest (A)')).toBe(6);
    expect(ev(find(generateInsights(ds, { measureOps: { c1: 'sum' } }), 'topBottom')[0], 'Highest (A)')).toBe(30);
  });
  it('missing data and duplicates are reported with counts', () => {
    const rows = ['a,b']; for (let i = 0; i < 10; i++) rows.push(`${i},${i < 2 ? '' : 'x'}`); rows.push('9,x');
    const r = generateInsights(datasetFromCsv(rows.join('\n')));
    const m = r.insights.find((i) => i.id === 'missing:c1');
    expect(ev(m, 'Missing rows')).toBe(2);
    expect(ev(m, 'Share missing')).toBeCloseTo(2 / 11, 12);
    expect(ev(r.insights.find((i) => i.id === 'duplicates'), 'Duplicate rows')).toBe(1);
  });
  it('extremes use Tukey fences and never change data', () => {
    const rows = ['v']; for (let i = 1; i <= 20; i++) rows.push(String(i)); rows.push('500');
    const ds = datasetFromCsv(rows.join('\n'));
    const [ins] = find(generateInsights(ds), 'extremes');
    expect(ev(ins, 'Values outside fences')).toBe(1);
    expect(ins.description).toMatch(/Rows \(1-based\): 21/);
    expect(ds.rowCount).toBe(21);
  });
  it('time changes: gaps and the largest period-over-period moves only across consecutive periods', () => {
    const rows = ['d,sales'];
    const add = (d, v) => rows.push(`${d},${v}`);
    for (let i = 0; i < 3; i++) add('2024-01-10', 100); // Jan: 300 over 3 rows
    for (let i = 0; i < 3; i++) add('2024-02-10', 150); // Feb: 450 (+50%)
    for (let i = 0; i < 3; i++) add('2024-03-10', 150); // Mar: 450
    for (let i = 0; i < 3; i++) add('2024-05-10', 600); // Apr missing → gap; May: 1800
    for (let i = 0; i < 3; i++) add('2024-06-10', 300); // Jun: 900 (-50%)
    const r = generateInsights(datasetFromCsv(rows.join('\n')));
    const gap = r.insights.find((i) => i.rule === 'timeGaps');
    expect(ev(gap, 'Missing months')).toBe(1);
    const up = r.insights.find((i) => i.id === 'time:c0:c1:up');
    expect(ev(up, 'Change')).toBeCloseTo(0.5, 12);
    expect([ev(up, 'Value in 2024-01'), ev(up, 'Value in 2024-02')]).toEqual([300, 450]);
    const down = r.insights.find((i) => i.id === 'time:c0:c1:down');
    expect(ev(down, 'Change')).toBeCloseTo(-0.5, 12);
    expect(ev(down, 'Consecutive pairs compared')).toBe(3); // Mar→Apr and Apr→May skipped: April has no data
  });
  it('correlation: finds a real relationship, skips calculated columns', () => {
    const rows = ['x,y,z']; for (let i = 0; i < 40; i++) rows.push(`${i},${2 * i + (i % 3)},${(i * 7) % 5}`);
    const src = datasetFromCsv(rows.join('\n'));
    const r = generateInsights(src);
    const c = find(r, 'correlation');
    expect(c).toHaveLength(1);
    expect(ev(c[0], 'Pearson r')).toBeGreaterThan(0.99);
    expect(c[0].limitations.join(' ')).toMatch(/does not establish causation/);
    const { dataset } = runPipeline(src, [makeStep('calcColumn', { name: 'x2', expression: '[x] * 2' })]);
    expect(generateInsights(dataset).insights.some((i) => i.rule === 'correlation' && i.id.includes('c3') && i.id.includes('c0'))).toBe(false);
  });
  it('is deterministic with unique ids and a complete structure', () => {
    const ds = datasetFromCsv(readFileSync('public/sample-data/sales.csv', 'utf8'));
    const a = generateInsights(ds), b = generateInsights(JSON.parse(JSON.stringify(ds)));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(new Set(a.insights.map((i) => i.id)).size).toBe(a.insights.length);
    expect(a.insights.length).toBeGreaterThan(0);
    for (const i of a.insights) {
      expect(['fact', 'association', 'quality']).toContain(i.kind);
      for (const f of ['title', 'description', 'metric', 'subject', 'calculation']) expect(typeof i[f], `${i.id} ${f}`).toBe('string');
      expect(Array.isArray(i.evidence) && i.evidence.length > 0).toBe(true);
      expect(Array.isArray(i.limitations)).toBe(true);
      if (i.kind === 'association') expect(i.limitations.length).toBeGreaterThan(0);
    }
  });
  it('handles tiny and empty datasets without throwing', () => {
    expect(generateInsights(datasetFromCsv('a\n1')).insights).toEqual([]);
    expect(() => generateInsights(datasetFromCsv('a,b\n,\n,'))).not.toThrow();
  });
});
