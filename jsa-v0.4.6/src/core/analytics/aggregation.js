import { evaluateFilters } from '../transforms/filters.js';
// Group-by with multiple keys and measures. Returns a result table plus warnings.
import { isMissing } from '../data/dataTypes.js';
import { toNumbers, percentile } from './descriptive.js';

const OPS = {
  count: (vals) => vals.length,
  countNonMissing: (vals) => vals.filter((v) => !isMissing(v)).length,
  distinct: (vals) => new Set(vals.filter((v) => !isMissing(v)).map(String)).size,
  sum: (vals) => { const { nums } = toNumbers(vals); return nums.length ? nums.reduce((a, b) => a + b, 0) : null; },
  avg: (vals) => { const { nums } = toNumbers(vals); return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null; },
  min: (vals) => { const { nums } = toNumbers(vals); return nums.length ? Math.min(...nums) : null; },
  max: (vals) => { const { nums } = toNumbers(vals); return nums.length ? Math.max(...nums) : null; },
  median: (vals) => { const { nums } = toNumbers(vals); return nums.length ? percentile([...nums].sort((a, b) => a - b), 50) : null; },
};
export const AGG_OPS = Object.keys(OPS);

/**
 * @param ds dataset
 * @param {{groupBy: string[], measures: {column?: string, op: string, as?: string}[], rowIndices?: number[]}} spec
 */
export function aggregate(ds, { groupBy = [], measures, rowIndices }) {
  const warnings = [];
  if (!measures?.length) throw new Error('At least one measure is required.');
  for (const id of groupBy) if (!ds.data[id]) throw new Error(`Unknown group column: ${id}`);
  for (const m of measures) {
    if (!OPS[m.op]) throw new Error(`Unsupported aggregation: ${m.op}`);
    if (m.op !== 'count' && !ds.data[m.column]) throw new Error(`Unknown measure column: ${m.column}`);
  }
  const idx = rowIndices || Array.from({ length: ds.rowCount }, (_, i) => i);
  const groups = new Map();
  for (const i of idx) {
    const keyVals = groupBy.map((g) => { const v = ds.data[g][i]; return isMissing(v) ? '(missing)' : v; });
    const key = JSON.stringify(keyVals);
    if (!groups.has(key)) groups.set(key, { keyVals, rows: [] });
    groups.get(key).rows.push(i);
  }
  const names = measures.map((m) => m.as || `${m.op}${m.column ? `_${m.column}` : ''}`);
  const measureIndices = measures.map((m) => m.filters?.length ? new Set(evaluateFilters(ds, m.filters, m.filterMode || 'all')) : null);
  const rows = [...groups.values()].map(({ keyVals, rows: r }) => {
    const row = {};
    groupBy.forEach((g, k) => { row[g] = keyVals[k]; });
    measures.forEach((m, k) => { const eligible = measureIndices[k] ? r.filter((i) => measureIndices[k].has(i)) : r; row[names[k]] = OPS[m.op](m.op === 'count' ? eligible : eligible.map((i) => ds.data[m.column][i])); });
    return row;
  });
  if (!rows.length) warnings.push('No rows matched; the result is empty.');
  return { columns: [...groupBy, ...names], groupBy, measureNames: names, rows, warnings };
}
export const applyAggregation = (op, vals) => OPS[op](vals);
