// Turns (dataset, spec) into render-ready data. All numbers come from the analytics engine.
// Output always carries warnings and truncation info so the UI can say when data was cut.
import { aggregate } from '../analytics/aggregation.js';
import { runAnalysis } from '../analytics/analyses.js';
import { computeKpi } from '../analytics/kpis.js';
import { toNumbers } from '../analytics/descriptive.js';
import { evaluateFilters } from '../transforms/filters.js';
import { sortIndices } from '../transforms/sorting.js';
import { parseDate, isNumericType } from '../data/dataTypes.js';
import { validateSpec, isDateType } from './chartSpec.js';
import { typeInfo, LIMITED_TYPES } from './chartRegistry.js';

export const SCATTER_CAP = 2000;
export const TABLE_CAP = 100;
const collate = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });
const cmpNum = (a, b) => (a === b ? 0 : a === null ? 1 : b === null ? -1 : a - b);

export function periodKey(v, grain) {
  const d = parseDate(v);
  if (!d) return null;
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1;
  if (grain === 'year') return `${y}`;
  if (grain === 'quarter') return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  if (grain === 'day') return d.toISOString().slice(0, 10);
  return `${y}-${String(m).padStart(2, '0')}`;
}

function resultTable(ds, spec) {
  const m = spec.measures[0];
  if (spec.source?.kind === 'analysis') {
    const res = runAnalysis(ds, ds.analyses.find((a) => a.id === spec.source.analysisId));
    return { rows: res.rows, dimKey: spec.dimension, serKey: spec.series || null, valKey: m.as, rowsUsed: res.rowsUsed, rowsTotal: res.rowsTotal, warnings: res.warnings, timeish: false, measureLabel: m.as, additive: true };
  }
  const idx = evaluateFilters(ds, spec.filters, spec.filterMode);
  const dimCol = ds.columns.find((c) => c.id === spec.dimension);
  const timeish = isDateType(dimCol);
  let work = ds, dimKey = spec.dimension;
  if (timeish) {
    const keys = ds.data[dimKey].map((v) => (v === null || v === undefined ? null : periodKey(v, spec.timeGrain || 'month')));
    work = { ...ds, columns: [...ds.columns, { id: '__period', name: dimCol.name, type: 'categorical' }], data: { ...ds.data, __period: keys } };
    dimKey = '__period';
  }
  const res = aggregate(work, { groupBy: [dimKey, ...(spec.series ? [spec.series] : [])], measures: [{ column: m.column, op: m.op, as: 'value' }], rowIndices: idx });
  const colName = ds.columns.find((c) => c.id === m.column)?.name;
  return { rows: res.rows, dimKey, serKey: spec.series || null, valKey: 'value', rowsUsed: idx.length, rowsTotal: ds.rowCount, warnings: res.warnings, timeish,
    measureLabel: m.op === 'count' ? 'Count' : `${m.op} of ${colName}`, additive: ['sum', 'count'].includes(m.op),
    dimensionLabel: timeish ? `${dimCol.name} (by ${spec.timeGrain || 'month'})` : dimCol.name };
}

function orderLabels(labels, totals, spec, timeish) {
  const by = spec.sort?.by || 'auto', dir = spec.sort?.dir || 'desc';
  const lineLike = ['line', 'area'].includes(spec.type);
  const out = [...labels];
  if ((timeish || lineLike) && by !== 'value') { out.sort(collate); if (by === 'label' && dir === 'desc') out.reverse(); }
  else if (by === 'label') out.sort((a, b) => collate(a, b) * (dir === 'asc' ? 1 : -1));
  else out.sort((a, b) => cmpNum(totals.get(b), totals.get(a)) * (by === 'value' && dir === 'asc' ? -1 : 1) || collate(a, b));
  return out;
}

function buildCategory(ds, spec) {
  const t = resultTable(ds, spec);
  const warnings = [...t.warnings];
  const dimensionLabel = t.dimensionLabel || ds.columns.find((c) => c.id === t.dimKey)?.name || '';
  const label = (v) => String(v);
  const totals = new Map();
  const cells = new Map();
  for (const r of t.rows) {
    const d = label(r[t.dimKey]), s = t.serKey ? label(r[t.serKey]) : '';
    const v = r[t.valKey];
    cells.set(`${d}\u0000${s}`, v);
    if (v !== null) totals.set(d, (totals.get(d) ?? 0) + v); else if (!totals.has(d)) totals.set(d, null);
  }
  let cats = orderLabels([...new Set(t.rows.map((r) => label(r[t.dimKey])))], totals, spec, t.timeish);
  const base = { warnings, rowsUsed: t.rowsUsed, rowsTotal: t.rowsTotal, measureLabel: t.measureLabel, dimensionLabel, empty: false, truncated: null, chart: spec.type };
  if (!cats.length) return { ...base, kind: 'category', points: [], empty: true };

  const limit = spec.limit === '' || !spec.limit ? null : Number(spec.limit);
  let other = null;
  if (limit && LIMITED_TYPES.includes(spec.type) && cats.length > limit) {
    base.truncated = { shown: limit, total: cats.length };
    const dropped = cats.slice(limit);
    cats = cats.slice(0, limit);
    const pieLike = spec.type === 'pie' || spec.type === 'donut';
    if (pieLike && t.additive && [...totals.values()].every((v) => v === null || v >= 0)) {
      other = dropped.reduce((a, d) => a + (totals.get(d) ?? 0), 0);
      warnings.push(`Showing the top ${limit} of ${base.truncated.total} categories; the rest are combined as “Other”.`);
    } else warnings.push(`Showing the top ${limit} of ${base.truncated.total} categories.${pieLike ? ' Shares are relative to the categories shown.' : ''}`);
  }

  if (t.serKey) {
    const names = [...new Set(t.rows.map((r) => label(r[t.serKey])))].sort(collate);
    return { ...base, kind: 'multi', categories: cats, series: names.map((n) => ({ name: n, values: cats.map((c) => cells.get(`${c}\u0000${n}`) ?? null) })) };
  }
  let points = cats.map((c) => ({ label: c, value: cells.get(`${c}\u0000`) ?? null }));
  const nulls = points.filter((p) => p.value === null).length;
  if (nulls) warnings.push(`${nulls} categor${nulls === 1 ? 'y has' : 'ies have'} no value for this measure and ${nulls === 1 ? 'is' : 'are'} left blank.`);
  if (spec.type === 'pie' || spec.type === 'donut') {
    const neg = points.filter((p) => p.value !== null && p.value < 0).length;
    if (neg) { warnings.push(`Pie and donut charts cannot show negative values; ${neg} categor${neg === 1 ? 'y was' : 'ies were'} left out. Try a bar chart.`); }
    points = points.filter((p) => p.value !== null && p.value > 0);
    if (other) points.push({ label: 'Other', value: other });
    if (!points.length) return { ...base, kind: 'category', points: [], empty: true };
  }
  return { ...base, kind: 'category', points, total: points.reduce((a, p) => a + (p.value ?? 0), 0) };
}

function buildScatter(ds, spec) {
  const idx = evaluateFilters(ds, spec.filters, spec.filterMode);
  const warnings = [];
  const pts = [];
  let dropped = 0;
  for (const i of idx) {
    const x = ds.data[spec.x][i], y = ds.data[spec.y][i];
    if (typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y }); else dropped++;
  }
  if (dropped) warnings.push(`${dropped} row${dropped === 1 ? '' : 's'} with a missing X or Y value ${dropped === 1 ? 'was' : 'were'} left out.`);
  let truncated = null, shown = pts;
  if (pts.length > SCATTER_CAP) {
    const step = pts.length / SCATTER_CAP;
    shown = Array.from({ length: SCATTER_CAP }, (_, k) => pts[Math.floor(k * step)]);
    truncated = { shown: SCATTER_CAP, total: pts.length, sampled: true };
    warnings.push(`Showing an evenly spaced sample of ${SCATTER_CAP.toLocaleString()} of ${pts.length.toLocaleString()} points.`);
  }
  const name = (id) => ds.columns.find((c) => c.id === id).name;
  return { kind: 'scatter', chart: 'scatter', points: shown, xLabel: name(spec.x), yLabel: name(spec.y), empty: !shown.length, warnings, truncated, rowsUsed: idx.length, rowsTotal: ds.rowCount };
}

function buildHistogram(ds, spec) {
  const idx = evaluateFilters(ds, spec.filters, spec.filterMode);
  const { nums, missing, invalid } = toNumbers(idx.map((i) => ds.data[spec.column][i]));
  const warnings = [];
  if (missing + invalid) warnings.push(`${missing + invalid} missing or invalid value${missing + invalid === 1 ? ' was' : 's were'} left out.`);
  const label = ds.columns.find((c) => c.id === spec.column).name;
  const base = { kind: 'histogram', chart: 'histogram', label, warnings, truncated: null, rowsUsed: idx.length, rowsTotal: ds.rowCount };
  if (!nums.length) return { ...base, bins: [], empty: true };
  const min = Math.min(...nums), max = Math.max(...nums);
  if (min === max) return { ...base, bins: [{ x0: min, x1: max, count: nums.length }], empty: false };
  const n = spec.bins ? Number(spec.bins) : Math.min(100, Math.ceil(Math.log2(nums.length) + 1)); // Sturges
  const w = (max - min) / n;
  const bins = Array.from({ length: n }, (_, k) => ({ x0: min + k * w, x1: k === n - 1 ? max : min + (k + 1) * w, count: 0 }));
  for (const v of nums) bins[Math.min(n - 1, Math.floor((v - min) / w))].count++; // last bin includes max
  return { ...base, bins, empty: false };
}

function buildTable(ds, spec) {
  const idx = evaluateFilters(ds, spec.filters, spec.filterMode);
  let order = idx;
  if (ds.columns.some((c) => c.id === spec.sort?.by)) { const keep = new Set(idx); order = sortIndices(ds, spec.sort.by, spec.sort.dir).filter((i) => keep.has(i)); }
  const colIds = (spec.columns?.length ? spec.columns : ds.columns.slice(0, 8).map((c) => c.id)).filter((id) => ds.data[id]);
  const shown = order.slice(0, TABLE_CAP);
  const warnings = order.length > TABLE_CAP ? [`Showing the first ${TABLE_CAP} of ${order.length.toLocaleString()} rows.`] : [];
  return { kind: 'table', chart: 'table', columns: colIds.map((id) => ({ id, name: ds.columns.find((c) => c.id === id).name, numeric: isNumericType(ds.columns.find((c) => c.id === id).type) })),
    rows: shown.map((i) => colIds.map((id) => ds.data[id][i])), empty: !shown.length, warnings, truncated: order.length > TABLE_CAP ? { shown: TABLE_CAP, total: order.length } : null, rowsUsed: idx.length, rowsTotal: ds.rowCount };
}

function buildKpi(ds, spec) {
  const k = ds.kpis.find((x) => x.id === spec.kpiId);
  const r = computeKpi(ds, k);
  return { kind: 'kpi', chart: 'kpi', name: k.name, description: k.description, formatted: r.formatted, value: r.value, status: r.status, warnings: r.warnings, empty: false, truncated: null };
}

export function buildChartData(ds, spec) {
  const errs = validateSpec(ds, spec);
  if (errs.length) throw new Error(errs.join(' '));
  switch (typeInfo(spec.type).family) {
    case 'category': return buildCategory(ds, spec);
    case 'scatter': return buildScatter(ds, spec);
    case 'histogram': return buildHistogram(ds, spec);
    case 'table': return buildTable(ds, spec);
    case 'kpi': return buildKpi(ds, spec);
    default: throw new Error(`Unknown chart type “${spec.type}”.`);
  }
}
