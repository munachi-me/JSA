import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../core/data/csvParser.js';
import { datasetFromCsv, datasetFromJson } from '../core/data/datasetModel.js';
import { describe } from '../core/analytics/descriptive.js';
import { profileDataset } from '../core/data/profile.js';
import { makeStep, runPipeline } from '../core/transforms/pipeline.js';
import { makeDashboard, addComponent, validateDashboard } from '../core/dashboard/dashboardSchema.js';
import { generateInsights } from '../core/insights/insightEngine.js';

test('CSV parser handles quoted delimiters and embedded newlines', () => {
  const parsed = parseCsv('name,amount,note\nAlice,10,"hello, world"\nBob,20,"line 1\nline 2"');
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0][2], 'hello, world');
  assert.equal(parsed.rows[1][2], 'line 1\nline 2');
});

test('CSV and JSON import create rectangular datasets', () => {
  const csv = datasetFromCsv('region,revenue\nEast,10\nWest,20', { name: 'sales' });
  assert.equal(csv.rowCount, 2);
  assert.equal(csv.columns.length, 2);
  const json = datasetFromJson('[{"region":"East","revenue":10},{"region":"West","extra":"x"}]');
  assert.equal(json.rowCount, 2);
  assert.equal(json.columns.length, 3);
  assert.throws(() => datasetFromJson('{bad json'), /Invalid JSON/);
});

test('descriptive statistics return expected values and report missing data', () => {
  const stats = describe([10, 20, 30, null]);
  assert.equal(stats.count, 3);
  assert.equal(stats.missing, 1);
  assert.equal(stats.sum, 60);
  assert.equal(stats.mean, 20);
  assert.equal(stats.median, 20);
});

test('transform pipeline is immutable and records a filter result', () => {
  const source = datasetFromCsv('region,revenue\nEast,10\nWest,20\nEast,30', { name: 'sales' });
  const revenue = source.columns.find((c) => c.name === 'revenue');
  const step = makeStep('filterRows', { action: 'keep', mode: 'all', conditions: [{ column: revenue.id, op: 'gt', value: 15 }] });
  const result = runPipeline(source, [step]);
  assert.equal(source.rowCount, 3, 'source dataset should remain unchanged');
  assert.equal(result.dataset.rowCount, 2);
  assert.equal(result.results[0].ok, true);
});

test('data profiling detects duplicate rows', () => {
  const ds = datasetFromCsv('region,revenue\nEast,10\nEast,10\nWest,20');
  const profile = profileDataset(ds);
  assert.equal(profile.duplicateRows, 1);
});

test('dashboard components can be created and validated', () => {
  const dashboard = addComponent(makeDashboard({ title: 'Sales overview' }), 'text', { text: 'Summary' }, 'Summary');
  const result = validateDashboard(dashboard);
  assert.equal(result.ok, true, result.errors.join('; '));
  assert.equal(dashboard.components.length, 1);
});

test('insight engine executes and returns its documented result shape', () => {
  const ds = datasetFromCsv('region,revenue\nEast,10\nWest,20\nEast,30\nWest,40\nEast,50\nWest,60\nEast,70\nWest,80\nEast,90\nWest,100');
  const result = generateInsights(ds);
  assert.ok(Array.isArray(result.insights));
  assert.ok(Array.isArray(result.skipped));
  assert.ok(Number.isInteger(result.truncated));
});
