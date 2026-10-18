import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import { profileDataset } from '../core/data/profile.js';
import { aggregate } from '../core/analytics/aggregation.js';

it('imports the sample CSV, profiles it, and totals reconcile', () => {
  const ds = datasetFromCsv(readFileSync('public/sample-data/sales.csv', 'utf8'), { name: 'sales' });
  expect(ds.rowCount).toBe(240);
  const type = Object.fromEntries(ds.columns.map((c) => [c.name, c.type]));
  expect(type.order_id).toBe('identifier');
  expect(type.order_date).toBe('date');
  expect(type.units).toBe('integer');
  expect(profileDataset(ds).totalMissing).toBeGreaterThan(0); // discount has blanks
  const byRegion = aggregate(ds, { groupBy: ['c2'], measures: [{ column: 'c4', op: 'sum', as: 'u' }] });
  const grand = ds.data.c4.reduce((a, b) => a + b, 0);
  expect(byRegion.rows.reduce((a, r) => a + r.u, 0)).toBe(grand);
});
