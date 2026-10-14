// Descriptive statistics. Conventions (documented):
//  - Missing / non-finite values are excluded; `missing` reports how many.
//  - variance & stdDev default to the SAMPLE formula (n-1); pass { population: true } for n.
//  - Percentiles use linear interpolation between closest ranks (Excel PERCENTILE.INC / R type 7).
//  - Quartiles are percentiles 25/50/75 under the same method.
import { isMissing, parseNumber } from '../data/dataTypes.js';

export function toNumbers(values) {
  const nums = [];
  let missing = 0;
  let invalid = 0;
  for (const v of values) {
    if (isMissing(v)) { missing++; continue; }
    const n = typeof v === 'number' ? (Number.isFinite(v) ? v : null) : parseNumber(v);
    if (n === null) invalid++; else nums.push(n);
  }
  return { nums, missing, invalid };
}

export function percentile(sorted, p) {
  if (!sorted.length) return null;
  if (p < 0 || p > 100) throw new RangeError('Percentile must be between 0 and 100.');
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function describe(values, { population = false } = {}) {
  const { nums, missing, invalid } = toNumbers(values);
  const warnings = [];
  if (invalid) warnings.push(`${invalid} non-numeric value(s) were ignored.`);
  const out = { count: nums.length, missing, invalid, warnings, distinct: new Set(nums).size,
    sum: null, mean: null, median: null, min: null, max: null, range: null,
    variance: null, stdDev: null, q1: null, q3: null, iqr: null, varianceType: population ? 'population' : 'sample' };
  if (!nums.length) return out;

  // Kahan summation reduces floating-point drift on long columns.
  let sum = 0, c = 0;
  for (const x of nums) { const y = x - c; const t = sum + y; c = (t - sum) - y; sum = t; }
  const sorted = [...nums].sort((a, b) => a - b);
  out.sum = sum;
  out.mean = sum / nums.length;
  out.min = sorted[0];
  out.max = sorted[sorted.length - 1];
  out.range = out.max - out.min;
  out.median = percentile(sorted, 50);
  out.q1 = percentile(sorted, 25);
  out.q3 = percentile(sorted, 75);
  out.iqr = out.q3 - out.q1;
  const denom = population ? nums.length : nums.length - 1;
  if (denom > 0) {
    out.variance = nums.reduce((a, x) => a + (x - out.mean) ** 2, 0) / denom;
    out.stdDev = Math.sqrt(out.variance);
  } else {
    warnings.push('Variance needs at least 2 values (sample) — returned null.');
  }
  return out;
}

export function describeCategorical(values, topN = 5) {
  const counts = new Map();
  let missing = 0;
  for (const v of values) {
    if (isMissing(v)) { missing++; continue; }
    const k = String(v);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, topN)
    .map(([value, count]) => ({ value, count }));
  return { count: values.length - missing, missing, distinct: counts.size, top };
}

export function safeDivide(a, b) { return b === 0 || b === null || b === undefined ? null : a / b; }
