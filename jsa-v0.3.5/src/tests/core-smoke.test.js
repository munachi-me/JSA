import { test, expect } from 'vitest';
import { parseCsv } from '../core/data/csvParser.js';
import { datasetFromCsv, datasetFromJson } from '../core/data/datasetModel.js';
import { describe } from '../core/analytics/descriptive.js';
import { profileDataset } from '../core/data/profile.js';
import { makeStep, runPipeline } from '../core/transforms/pipeline.js';
import { makeDashboard, addComponent, validateDashboard } from '../core/dashboard/dashboardSchema.js';
import { generateInsights } from '../core/insights/insightEngine.js';

test('CSV parser handles quoted delimiters and embedded newlines', () => {
  const parsed = parseCsv('name,amount,note\nAlice,10,"hello, world"\nBob,20,"line 1\nline 2"');
  expect(parsed.errors).toHaveLength(0);
  expect(parsed.rows).toHaveLength(2);
  expect(parsed.rows[0][2]).toBe('hello, world');
  expect(parsed.rows[1][2]).toBe('line 1\nline 2');
});

test('CSV and JSON import create rectangular datasets', () => {
  const csv = datasetFromCsv('region,revenue\nEast,10\nWest,20', { name: 'sales' });
  expect(csv.rowCount).toBe(2);
  expect(csv.columns).toHaveLength(2);
  const json = datasetFromJson('[{"region":"East","revenue":10},{"region":"West","extra":"x"}]');
  expect(json.rowCount).toBe(2);
  expect(json.columns).toHaveLength(3);
  expect(() => datasetFromJson('{bad json')).toThrow(/Invalid JSON/);
});

test('descriptive statistics return expected values and report missing data', () => {
  const stats = describe([10, 20, 30, null]);
  expect(stats.count).toBe(3);
  expect(stats.missing).toBe(1);
  expect(stats.sum).toBe(60);
  expect(stats.mean).toBe(20);
  expect(stats.median).toBe(20);
});

test('transform pipeline is immutable and records a filter result', () => {
  const source = datasetFromCsv('region,revenue\nEast,10\nWest,20\nEast,30', { name: 'sales' });
  const revenue = source.columns.find((c) => c.name === 'revenue');
  const step = makeStep('filterRows', { action: 'keep', mode: 'all', conditions: [{ column: revenue.id, op: 'gt', value: 15 }] });
  const result = runPipeline(source, [step]);
  expect(source.rowCount, 'source dataset should remain unchanged').toBe(3);
  expect(result.dataset.rowCount).toBe(2);
  expect(result.results[0].ok).toBe(true);
});

test('data profiling detects duplicate rows', () => {
  const ds = datasetFromCsv('region,revenue\nEast,10\nEast,10\nWest,20');
  const profile = profileDataset(ds);
  expect(profile.duplicateRows).toBe(1);
});

test('dashboard components can be created and validated', () => {
  const dashboard = addComponent(makeDashboard({ title: 'Sales overview' }), 'text', { text: 'Summary' }, 'Summary');
  const result = validateDashboard(dashboard);
  expect(result.ok, result.errors.join('; ')).toBe(true);
  expect(dashboard.components).toHaveLength(1);
});

test('insight engine executes and returns its documented result shape', () => {
  const ds = datasetFromCsv('region,revenue\nEast,10\nWest,20\nEast,30\nWest,40\nEast,50\nWest,60\nEast,70\nWest,80\nEast,90\nWest,100');
  const result = generateInsights(ds);
  expect(Array.isArray(result.insights)).toBe(true);
  expect(Array.isArray(result.skipped)).toBe(true);
  expect(Number.isInteger(result.truncated)).toBe(true);
});
