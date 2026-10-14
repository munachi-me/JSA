// Reusable KPI definitions. A KPI is one aggregate, or a ratio of two aggregates, each with its own filters.
//  { id, name, description, numerator:{op,column,filters,mode}, denominator?:{…}, format:'number'|'currency'|'percent',
//    unit?, target?:{value, direction:'higher'|'lower'} }
// Ratios with a zero/missing denominator return null with a warning (never Infinity/NaN).
import { evaluateFilters } from '../transforms/filters.js';
import { applyAggregation, AGG_OPS } from './aggregation.js';

export function evaluatePart(ds, part) {
  if (!part || !AGG_OPS.includes(part.op)) throw new Error(`Unsupported aggregation: ${part?.op}`);
  const idx = evaluateFilters(ds, part.filters || [], part.mode || 'all');
  if (part.op === 'count') return { value: idx.length, rows: idx.length };
  if (!ds.data[part.column]) throw new Error('Choose a column for this aggregation.');
  const col = ds.data[part.column];
  return { value: applyAggregation(part.op, idx.map((i) => col[i])), rows: idx.length };
}

export function computeKpi(ds, kpi) {
  const warnings = [];
  const num = evaluatePart(ds, kpi.numerator);
  let value = num.value;
  if (kpi.denominator) {
    const den = evaluatePart(ds, kpi.denominator);
    if (den.value === null || den.value === 0) { value = null; warnings.push('The denominator is zero or has no values, so the ratio cannot be calculated.'); }
    else if (num.value === null) value = null;
    else value = num.value / den.value;
  } else if (value === null) warnings.push('No values matched, so the result is empty.');
  let status = null;
  if (kpi.target && value !== null) status = (kpi.target.direction === 'lower' ? value <= kpi.target.value : value >= kpi.target.value) ? 'met' : 'not met';
  return { value, formatted: formatKpi(value, kpi), warnings, status, numeratorRows: num.rows };
}

export function formatKpi(value, { format = 'number', unit = '' } = {}) {
  if (value === null || value === undefined) return '—';
  if (format === 'percent') return `${(value * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
  if (format === 'currency') return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 3 })}${unit ? ` ${unit}` : ''}`;
}
