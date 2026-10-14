// Internal dataset representation. Columns have stable ids (c0, c1, …) so duplicate or
// renamed headers never break references. Storage is columnar; values are typed on load.
import { inferColumnType, isMissing, parseNumber, parseBoolean, parseDate } from './dataTypes.js';
import { parseCsv } from './csvParser.js';

let counter = 0;
const newId = (p) => `${p}_${Date.now().toString(36)}${(counter++).toString(36)}`;

function coerce(value, type) {
  if (isMissing(value)) return null;
  switch (type) {
    case 'integer': case 'decimal': return parseNumber(value);
    case 'boolean': return parseBoolean(value);
    case 'date': case 'datetime': { const d = parseDate(value); return d ? d.toISOString() : null; }
    default: return typeof value === 'string' ? value.trim() : value;
  }
}

function uniqueNames(names) {
  const seen = new Map();
  return names.map((n, i) => {
    const base = String(n ?? '').trim() || `Column ${i + 1}`;
    const k = seen.get(base) || 0;
    seen.set(base, k + 1);
    return k ? `${base} (${k + 1})` : base;
  });
}

/** Build a dataset from a header array and string/any rows. */
export function createDataset({ name, header, rows, source = {}, warnings = [] }) {
  const names = uniqueNames(header);
  const raw = header.map((_, c) => rows.map((r) => r[c]));
  const columns = names.map((colName, c) => {
    const inf = inferColumnType(raw[c], { name: header[c] });
    return { id: `c${c}`, name: colName, originalName: String(header[c] ?? ''), type: inf.type,
      inferredType: inf.type, typeReason: inf.reason, typeConfidence: inf.confidence };
  });
  const data = {};
  columns.forEach((col, c) => { data[col.id] = raw[c].map((v) => coerce(v, col.type)); });
  return {
    id: newId('ds'), name, columns, data, rowCount: rows.length, warnings,
    provenance: { ...source, importedAt: new Date().toISOString() },
    history: [],
  };
}

export function datasetFromCsv(text, { name = 'dataset', delimiter } = {}) {
  const parsed = parseCsv(text, { delimiter });
  if (parsed.errors.some((e) => e.type === 'empty_file')) throw new Error('The file is empty.');
  const ds = createDataset({ name, header: parsed.header, rows: parsed.rows,
    source: { format: 'csv', delimiter: parsed.delimiter }, warnings: parsed.errors });
  return ds;
}

export function datasetFromJson(text, { name = 'dataset' } = {}) {
  let json;
  try { json = JSON.parse(text); } catch (e) { throw new Error(`Invalid JSON: ${e.message}`); }
  const arr = Array.isArray(json) ? json : null;
  if (!arr || !arr.length) throw new Error('JSON must be a non-empty array of objects.');
  if (!arr.every((o) => o && typeof o === 'object' && !Array.isArray(o))) throw new Error('Every item in the JSON array must be an object.');
  const keys = [...new Set(arr.flatMap((o) => Object.keys(o)))];
  const warnings = [];
  const nested = keys.filter((k) => arr.some((o) => o[k] !== null && typeof o[k] === 'object'));
  if (nested.length) warnings.push({ type: 'nested_values', message: `Nested values in ${nested.join(', ')} were stored as JSON text.` });
  const rows = arr.map((o) => keys.map((k) => {
    const v = o[k];
    return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
  }));
  return createDataset({ name, header: keys, rows, source: { format: 'json' }, warnings });
}

export const getColumn = (ds, id) => ds.columns.find((c) => c.id === id);
export const getValues = (ds, id) => ds.data[id];

/** Override a column's type; re-coerces from current values. */
export function setColumnType(ds, columnId, type) {
  const col = getColumn(ds, columnId);
  if (!col) throw new Error(`Unknown column: ${columnId}`);
  return {
    ...ds,
    columns: ds.columns.map((c) => (c.id === columnId ? { ...c, type } : c)),
    data: { ...ds.data, [columnId]: ds.data[columnId].map((v) => coerce(v === null ? null : String(v), type)) },
  };
}

export function getRow(ds, index) {
  const row = {};
  for (const c of ds.columns) row[c.id] = ds.data[c.id][index];
  return row;
}
