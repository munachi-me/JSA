// Rule-based insight engine. Every insight is computed from the dataset it is shown for, carries
// its numeric evidence, the exact rule that produced it, and its limitations. No explanation of
// *why* a pattern exists is ever generated; "followUp" text is a suggestion, not a finding.
import { RULES } from './rules.js';
import { isNumericType } from '../data/dataTypes.js';

export const DEFAULTS = { minGroupSize: 5, maxCategories: 30, maxDims: 5, maxMeasures: 6, alpha: 0.05, perRuleCap: 5, totalCap: 40, missingThreshold: 0.05, measureOps: {} };
const INTENSIVE = /price|rate|ratio|pct|percent|score|age|avg|average|margin|discount|temperature|tenure|rating|per_|_per/i;

/** Heuristic default: per-unit or rate-like columns are averaged; everything else is totalled. Users can override. */
export function defaultMeasureOps(ds) {
  const out = {};
  for (const c of ds.columns) if (isNumericType(c.type)) out[c.id] = INTENSIVE.test(c.name) ? 'mean' : 'sum';
  return out;
}

function prepare(ds, opts) {
  const nonMissing = (id) => ds.data[id].filter((v) => v !== null && v !== undefined);
  const stats = {};
  for (const c of ds.columns) { const vals = nonMissing(c.id); stats[c.id] = { n: vals.length, distinct: new Set(vals.map(String)).size, missing: ds.rowCount - vals.length }; }
  const ops = { ...defaultMeasureOps(ds), ...(opts.measureOps || {}) };
  const measures = ds.columns.filter((c) => isNumericType(c.type) && stats[c.id].distinct >= 2).slice(0, opts.maxMeasures);
  const dims = ds.columns.filter((c) => ['categorical', 'text', 'boolean'].includes(c.type) && stats[c.id].distinct >= 2 && stats[c.id].distinct <= opts.maxCategories && stats[c.id].distinct / Math.max(1, stats[c.id].n) <= 0.5)
    .sort((a, b) => stats[a.id].distinct - stats[b.id].distinct).slice(0, opts.maxDims);
  const outcomes = ds.columns.filter((c) => c.type === 'boolean' && stats[c.id].distinct === 2);
  const dateCols = ds.columns.filter((c) => (c.type === 'date' || c.type === 'datetime') && stats[c.id].distinct >= 3).slice(0, 2);
  return { opts, stats, ops, measures, dims, outcomes, dateCols, skipped: [] };
}

export function generateInsights(ds, options = {}) {
  const opts = { ...DEFAULTS, ...options, measureOps: { ...(options.measureOps || {}) } };
  const ctx = prepare(ds, opts);
  const seen = new Set();
  const byRule = new Map();
  const all = [];
  for (const rule of RULES) {
    let found = [];
    try { found = rule(ds, ctx); } catch (e) { ctx.skipped.push(`A rule failed and was skipped: ${e.message}`); }
    for (const ins of found) {
      if (seen.has(ins.id)) continue;
      seen.add(ins.id); all.push({ ...ins, score: Math.round(Math.min(100, Math.max(0, ins.score)) * 10) / 10 });
    }
  }
  all.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const insights = [];
  for (const ins of all) {
    const k = byRule.get(ins.rule) || 0;
    if (k >= opts.perRuleCap || insights.length >= opts.totalCap) continue;
    byRule.set(ins.rule, k + 1); insights.push(ins);
  }
  return { insights, skipped: ctx.skipped, measureOps: ctx.ops, truncated: all.length > insights.length ? all.length - insights.length : 0 };
}
