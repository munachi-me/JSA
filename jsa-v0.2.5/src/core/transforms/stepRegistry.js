// Transformation steps. Each step declares its parameters (so the UI can render a form
// generically), and an apply() that returns a new dataset plus a plain-language summary
// of exactly what changed. Steps never mutate their input.
import { isNumericType, parseNumber, parseDate, parseBoolean } from '../data/dataTypes.js';
import { setColumnType } from '../data/datasetModel.js';
import { describe, toNumbers } from '../analytics/descriptive.js';
import { selectRows, addColumn, mapColumn, requireColumn, isNull } from './rows.js';
import { evaluateFilters } from './filters.js';
import { sortIndices } from './sorting.js';
import { compileExpression } from './expression.js';

const plural = (n, w) => `${n.toLocaleString()} ${w}${n === 1 ? '' : 's'}`;
const isTextual = (c) => ['text', 'categorical', 'identifier'].includes(c.type);

function modeOf(vals) {
  const counts = new Map();
  for (const v of vals) if (!isNull(v)) counts.set(v, (counts.get(v) || 0) + 1);
  let best = null, n = 0;
  for (const [v, c] of counts) if (c > n) { best = v; n = c; }
  return best;
}

export const STEPS = {
  filterRows: {
    label: 'Filter rows',
    params: [
      { name: 'action', kind: 'select', label: 'Action', options: [['keep', 'Keep matching rows'], ['remove', 'Remove matching rows']], default: 'keep' },
      { name: 'mode', kind: 'select', label: 'Match', options: [['all', 'All conditions'], ['any', 'Any condition']], default: 'all' },
      { name: 'conditions', kind: 'conditions', label: 'Conditions' },
    ],
    apply(ds, { action = 'keep', mode = 'all', conditions = [] }) {
      if (!conditions.length) throw new Error('Add at least one condition.');
      const hit = new Set(evaluateFilters(ds, conditions, mode));
      const keep = Array.from({ length: ds.rowCount }, (_, i) => i).filter((i) => (action === 'keep' ? hit.has(i) : !hit.has(i)));
      return { dataset: selectRows(ds, keep), summary: `${action === 'keep' ? 'Kept' : 'Removed matching rows, kept'} ${plural(keep.length, 'row')}; removed ${plural(ds.rowCount - keep.length, 'row')}.` };
    },
  },
  dropMissing: {
    label: 'Remove rows with missing values',
    params: [{ name: 'columns', kind: 'columns', label: 'Drop a row if any of these are missing' }],
    apply(ds, { columns = [] }) {
      if (!columns.length) throw new Error('Choose at least one column.');
      columns.forEach((c) => requireColumn(ds, c));
      const keep = [];
      for (let i = 0; i < ds.rowCount; i++) if (columns.every((c) => !isNull(ds.data[c][i]))) keep.push(i);
      return { dataset: selectRows(ds, keep), summary: `Removed ${plural(ds.rowCount - keep.length, 'row')} with missing values in ${plural(columns.length, 'column')}.` };
    },
  },
  fillMissing: {
    label: 'Fill missing values',
    params: [
      { name: 'column', kind: 'column', label: 'Column', types: 'any' },
      { name: 'method', kind: 'select', label: 'Fill with', options: [['mean', 'Mean (numeric)'], ['median', 'Median (numeric)'], ['mode', 'Most common value'], ['constant', 'A constant']], default: 'median' },
      { name: 'constant', kind: 'text', label: 'Constant (if chosen)' },
    ],
    apply(ds, { column, method, constant }) {
      const col = requireColumn(ds, column);
      const vals = ds.data[column];
      const missing = vals.filter(isNull).length;
      let fill;
      if (method === 'mean' || method === 'median') {
        if (!isNumericType(col.type)) throw new Error(`“${col.name}” is ${col.type}; mean and median need a numeric column.`);
        const s = describe(vals);
        if (!s.count) throw new Error(`“${col.name}” has no values to compute a ${method} from.`);
        fill = method === 'mean' ? s.mean : s.median;
      } else if (method === 'mode') {
        fill = modeOf(vals);
        if (fill === null) throw new Error(`“${col.name}” has no values to find a most common value in.`);
      } else if (method === 'constant') {
        if (constant === undefined || constant === '') throw new Error('Enter a constant.');
        if (isNumericType(col.type)) { fill = parseNumber(constant); if (fill === null) throw new Error(`“${constant}” is not a number.`); }
        else if (col.type === 'boolean') { fill = parseBoolean(constant); if (fill === null) throw new Error('Enter true or false.'); }
        else if (col.type === 'date' || col.type === 'datetime') { const d = parseDate(constant); if (!d) throw new Error('Enter an ISO date such as 2024-03-31.'); fill = d.toISOString(); }
        else fill = String(constant);
      } else throw new Error(`Unknown method: ${method}`);
      return { dataset: mapColumn(ds, column, (v) => (isNull(v) ? fill : v)), summary: `Filled ${plural(missing, 'missing cell')} in “${col.name}” with ${method === 'constant' ? 'the constant' : `the ${method}`} ${typeof fill === 'number' ? Number(fill.toFixed(6)) : fill}.` };
    },
  },
  dedupe: {
    label: 'Remove duplicate rows',
    params: [{ name: 'columns', kind: 'columns', label: 'Rows are duplicates when these match (none selected = all columns)' }],
    apply(ds, { columns = [] }) {
      const ids = columns.length ? columns : ds.columns.map((c) => c.id);
      ids.forEach((c) => requireColumn(ds, c));
      const seen = new Set(), keep = [];
      for (let i = 0; i < ds.rowCount; i++) { const k = JSON.stringify(ids.map((c) => ds.data[c][i])); if (!seen.has(k)) { seen.add(k); keep.push(i); } }
      return { dataset: selectRows(ds, keep), summary: `Removed ${plural(ds.rowCount - keep.length, 'duplicate row')}, keeping the first occurrence of each.` };
    },
  },
  changeCase: {
    label: 'Change text case',
    params: [
      { name: 'column', kind: 'column', label: 'Column', types: 'text' },
      { name: 'mode', kind: 'select', label: 'Case', options: [['lower', 'lowercase'], ['upper', 'UPPERCASE'], ['title', 'Title Case']], default: 'lower' },
    ],
    apply(ds, { column, mode }) {
      const col = requireColumn(ds, column);
      if (!isTextual(col)) throw new Error(`“${col.name}” is ${col.type}, not text.`);
      const f = { lower: (s) => s.toLowerCase(), upper: (s) => s.toUpperCase(), title: (s) => s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) }[mode];
      if (!f) throw new Error(`Unknown case mode: ${mode}`);
      let changed = 0;
      const out = mapColumn(ds, column, (v) => { if (isNull(v)) return v; const n = f(String(v)); if (n !== v) changed++; return n; });
      return { dataset: out, summary: `Changed ${plural(changed, 'cell')} in “${col.name}” to ${mode} case.` };
    },
  },
  replaceText: {
    label: 'Replace text',
    params: [
      { name: 'column', kind: 'column', label: 'Column', types: 'text' },
      { name: 'find', kind: 'text', label: 'Find' },
      { name: 'replaceWith', kind: 'text', label: 'Replace with' },
    ],
    apply(ds, { column, find, replaceWith = '' }) {
      const col = requireColumn(ds, column);
      if (!isTextual(col)) throw new Error(`“${col.name}” is ${col.type}, not text.`);
      if (!find) throw new Error('Enter the text to find.');
      let changed = 0;
      const out = mapColumn(ds, column, (v) => { if (isNull(v) || !String(v).includes(find)) return v; changed++; return String(v).split(find).join(replaceWith); });
      return { dataset: out, summary: `Replaced “${find}” in ${plural(changed, 'cell')} of “${col.name}”.` };
    },
  },
  convertType: {
    label: 'Change column type',
    params: [
      { name: 'column', kind: 'column', label: 'Column', types: 'any' },
      { name: 'type', kind: 'type', label: 'New type' },
    ],
    apply(ds, { column, type }) {
      const col = requireColumn(ds, column);
      const before = ds.data[column].filter(isNull).length;
      const out = setColumnType(ds, column, type);
      const lost = out.data[column].filter(isNull).length - before;
      return { dataset: out, summary: `“${col.name}” is now ${type}.${lost > 0 ? ` ${plural(lost, 'value')} could not be converted and became missing.` : ' No values were lost.'}` };
    },
  },
  round: {
    label: 'Round numbers',
    params: [
      { name: 'column', kind: 'column', label: 'Column', types: 'numeric' },
      { name: 'decimals', kind: 'number', label: 'Decimal places', default: 2 },
    ],
    apply(ds, { column, decimals = 2 }) {
      const col = requireColumn(ds, column);
      if (!isNumericType(col.type)) throw new Error(`“${col.name}” is not numeric.`);
      const d = Number(decimals);
      if (!Number.isInteger(d) || d < 0 || d > 10) throw new Error('Decimal places must be a whole number from 0 to 10.');
      const p = 10 ** d; let changed = 0;
      const out = mapColumn(ds, column, (v) => { if (isNull(v)) return v; const r = Math.round((v + Number.EPSILON) * p) / p; if (r !== v) changed++; return r; });
      return { dataset: d === 0 ? setColumnType(out, column, 'integer') : out, summary: `Rounded ${plural(changed, 'value')} in “${col.name}” to ${d} decimal place${d === 1 ? '' : 's'}.` };
    },
  },
  calcColumn: {
    label: 'Add calculated column',
    params: [
      { name: 'name', kind: 'text', label: 'New column name' },
      { name: 'expression', kind: 'text', label: 'Expression, e.g. [units] * [unit_price]' },
    ],
    apply(ds, { name, expression }) {
      if (!String(name || '').trim()) throw new Error('Enter a name for the new column.');
      const ex = compileExpression(expression, ds);
      const vals = Array.from({ length: ds.rowCount }, (_, i) => ex.evaluate(i));
      const nulls = vals.filter(isNull).length;
      const type = vals.every((v) => isNull(v) || Number.isInteger(v)) ? 'integer' : 'decimal';
      const { dataset, column } = addColumn(ds, name.trim(), type, vals, { expression });
      return { dataset, summary: `Added “${column.name}” = ${expression}.${nulls ? ` ${plural(nulls, 'row')} are missing because an input was missing or a division by zero occurred.` : ''}` };
    },
  },
  extractDate: {
    label: 'Extract date part',
    params: [
      { name: 'column', kind: 'column', label: 'Date column', types: 'date' },
      { name: 'part', kind: 'select', label: 'Part', options: [['year', 'Year'], ['quarter', 'Quarter'], ['month', 'Month (1–12)'], ['day', 'Day of month'], ['weekday', 'Weekday name']], default: 'month' },
    ],
    apply(ds, { column, part }) {
      const col = requireColumn(ds, column);
      if (col.type !== 'date' && col.type !== 'datetime') throw new Error(`“${col.name}” is ${col.type}, not a date.`);
      const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const f = { year: (d) => d.getUTCFullYear(), quarter: (d) => Math.floor(d.getUTCMonth() / 3) + 1, month: (d) => d.getUTCMonth() + 1, day: (d) => d.getUTCDate(), weekday: (d) => names[d.getUTCDay()] }[part];
      if (!f) throw new Error(`Unknown date part: ${part}`);
      const vals = ds.data[column].map((v) => { const d = isNull(v) ? null : parseDate(v); return d ? f(d) : null; });
      const { dataset, column: nc } = addColumn(ds, `${col.name} (${part})`, part === 'weekday' ? 'categorical' : 'integer', vals);
      return { dataset, summary: `Added “${nc.name}” (dates read as UTC). ${plural(vals.filter(isNull).length, 'row')} had no valid date.` };
    },
  },
  flagOutliers: {
    label: 'Flag potential outliers',
    params: [
      { name: 'column', kind: 'column', label: 'Numeric column', types: 'numeric' },
      { name: 'multiplier', kind: 'number', label: 'IQR multiplier', default: 1.5 },
    ],
    apply(ds, { column, multiplier = 1.5 }) {
      const col = requireColumn(ds, column);
      if (!isNumericType(col.type)) throw new Error(`“${col.name}” is not numeric.`);
      const k = Number(multiplier);
      if (!(k > 0)) throw new Error('The IQR multiplier must be greater than 0.');
      const s = describe(ds.data[column]);
      if (s.count < 4) throw new Error('At least 4 values are needed to flag outliers.');
      const lo = s.q1 - k * s.iqr, hi = s.q3 + k * s.iqr;
      const vals = ds.data[column].map((v) => (isNull(v) ? null : v < lo || v > hi));
      const n = vals.filter((v) => v === true).length;
      const { dataset, column: nc } = addColumn(ds, `${col.name} (outlier)`, 'boolean', vals);
      return { dataset, summary: `Flagged ${plural(n, 'row')} outside [${Number(lo.toFixed(4))}, ${Number(hi.toFixed(4))}] (Q1/Q3 ± ${k}×IQR) in “${nc.name}”. No rows were removed.` };
    },
  },
  sort: {
    label: 'Sort rows',
    params: [
      { name: 'column', kind: 'column', label: 'Column', types: 'any' },
      { name: 'direction', kind: 'select', label: 'Direction', options: [['asc', 'Ascending'], ['desc', 'Descending']], default: 'asc' },
    ],
    apply(ds, { column, direction }) {
      const col = requireColumn(ds, column);
      return { dataset: selectRows(ds, sortIndices(ds, column, direction)), summary: `Sorted ${plural(ds.rowCount, 'row')} by “${col.name}” ${direction === 'desc' ? 'descending' : 'ascending'}; missing values last.` };
    },
  },
};
