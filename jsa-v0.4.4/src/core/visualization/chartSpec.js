// Library-independent visualization specification (schemaVersion 1).
import { isNumericType } from '../data/dataTypes.js';
import { typeInfo, SERIES_TYPES } from './chartRegistry.js';

export const SPEC_VERSION = 1;
export const isDateType = (c) => c && (c.type === 'date' || c.type === 'datetime');

export function makeSpec(partial = {}) {
  return {
    schemaVersion: SPEC_VERSION, id: undefined, title: '', description: '', type: 'bar',
    source: { kind: 'data' }, dimension: '', series: '', measures: [{ op: 'count', column: '', as: '' }],
    x: '', y: '', column: '', bins: '', kpiId: '', columns: [], filters: [], filterMode: 'all',
    timeGrain: 'month', sort: { by: 'auto', dir: 'desc' }, limit: 20, legend: true, showValues: false,
    axis: { xTitle: '', yTitle: '', zeroBaseline: true }, colors: [], tooltip: true, ...partial,
  };
}

const firstOf = (ds, pred) => ds.columns.find(pred)?.id ?? '';
const isGroupable = (c) => ['categorical', 'text', 'boolean', 'date', 'time', 'datetime'].includes(c.type);

/** Fill in required fields with sensible defaults for the current chart type. Never overrides valid choices. */
export function normalizeSpec(ds, spec) {
  const s = { ...spec, measures: spec.measures?.length ? spec.measures : makeSpec().measures };
  const has = (id) => ds.columns.some((c) => c.id === id);
  const info = typeInfo(s.type);
  if (s.source?.kind === 'analysis') {
    const a = ds.analyses.find((x) => x.id === s.source.analysisId);
    if (!a) return s;
    if (!a.groupBy.includes(s.dimension)) s.dimension = a.groupBy[0] ?? '';
    if (s.series && !a.groupBy.includes(s.series)) s.series = '';
    if (!a.measures.some((m) => m.as === s.measures[0].as)) s.measures = [{ op: 'sum', column: '', as: a.measures[0].as }];
    return s;
  }
  if (info.family === 'category') {
    if (!has(s.dimension)) s.dimension = firstOf(ds, isGroupable) || ds.columns[0]?.id || '';
    if (!has(s.series) || !SERIES_TYPES.includes(s.type) || s.series === s.dimension) s.series = '';
    if (info.needsSeries && !s.series) s.series = ds.columns.find((c) => isGroupable(c) && c.id !== s.dimension)?.id ?? '';
    const m = s.measures[0];
    if (m.op !== 'count' && !has(m.column)) s.measures = [{ ...m, column: firstOf(ds, (c) => isNumericType(c.type)) }];
  }
  const num = firstOf(ds, (c) => isNumericType(c.type));
  if (info.family === 'scatter') {
    if (!has(s.x)) s.x = num;
    if (!has(s.y)) s.y = ds.columns.filter((c) => isNumericType(c.type))[1]?.id ?? num;
  }
  if (info.family === 'histogram' && !has(s.column)) s.column = num;
  if (info.family === 'kpi' && !ds.kpis.some((k) => k.id === s.kpiId)) s.kpiId = ds.kpis[0]?.id ?? '';
  return s;
}

export const defaultSpecFor = (ds) => normalizeSpec(ds, makeSpec({ title: `${ds.name} overview` }));

/** Hint only: date dimensions read best as a line over time. */
export function suggestChartType(ds, spec) {
  if (typeInfo(spec.type)?.family === 'category' && isDateType(ds.columns.find((c) => c.id === spec.dimension)) && !['line', 'area'].includes(spec.type)) return 'line';
  return null;
}

/** Returns a list of human-readable problems; empty means the spec can be built. */
export function validateSpec(ds, spec) {
  const errs = [];
  const info = typeInfo(spec?.type);
  if (!info) return [`Unknown chart type “${spec?.type}”.`];
  const col = (id) => ds.columns.find((c) => c.id === id);
  const need = (id, label, pred, what) => {
    const c = col(id);
    if (!id) errs.push(`Choose a ${label}.`);
    else if (!c) errs.push(`The ${label} column no longer exists.`);
    else if (pred && !pred(c)) errs.push(`The ${label} “${c.name}” must be ${what}.`);
  };
  if (info.family === 'category') {
    const m = spec.measures?.[0];
    if (spec.source?.kind === 'analysis') {
      const a = ds.analyses.find((x) => x.id === spec.source.analysisId);
      if (!a) return ['The saved analysis for this chart no longer exists.'];
      if (!a.groupBy.length) return ['This analysis has no groups to chart. Add a group-by column to it first.'];
      if (!a.groupBy.includes(spec.dimension)) errs.push('Choose a dimension from the analysis’ group-by columns.');
      if (spec.series && !a.groupBy.includes(spec.series)) errs.push('The series must be one of the analysis’ group-by columns.');
      if (!a.measures.some((x) => x.as === m?.as)) errs.push('Choose one of the analysis’ measures.');
    } else {
      need(spec.dimension, 'dimension');
      if (!m) errs.push('Choose a measure.');
      else if (m.op !== 'count') need(m.column, 'measure column', (c) => isNumericType(c.type) || ['distinct', 'countNonMissing'].includes(m.op), 'numeric for this aggregation');
    }
    if (info.needsSeries && !spec.series) errs.push(`${info.label} needs a series column.`);
    if (spec.series && spec.series === spec.dimension) errs.push('The series must differ from the dimension.');
  } else if (info.family === 'scatter') {
    need(spec.x, 'X column', (c) => isNumericType(c.type), 'numeric');
    need(spec.y, 'Y column', (c) => isNumericType(c.type), 'numeric');
  } else if (info.family === 'histogram') {
    need(spec.column, 'column', (c) => isNumericType(c.type), 'numeric');
    if (spec.bins !== '' && spec.bins !== undefined && !(Number.isInteger(Number(spec.bins)) && Number(spec.bins) >= 1 && Number(spec.bins) <= 100)) errs.push('Bins must be a whole number from 1 to 100.');
  } else if (info.family === 'kpi') {
    if (!ds.kpis.some((k) => k.id === spec.kpiId)) errs.push('Choose a saved KPI. Define one on the Analysis page first.');
  }
  if (spec.limit !== '' && spec.limit !== undefined && spec.limit !== null && !(Number(spec.limit) >= 1)) errs.push('Top-N must be 1 or more.');
  return errs;
}
