// Row filters. Semantics (documented): every comparison operator excludes missing cells
// (including "not equals"); use isMissing / notMissing to test for them explicitly.
import { parseNumber, parseBoolean, parseDate, isNumericType } from '../data/dataTypes.js';
import { requireColumn, isNull } from './rows.js';

export const FILTER_OPS = [
  { id: 'eq', label: 'equals' }, { id: 'ne', label: 'does not equal' },
  { id: 'gt', label: 'is greater than' }, { id: 'gte', label: 'is at least' },
  { id: 'lt', label: 'is less than' }, { id: 'lte', label: 'is at most' },
  { id: 'between', label: 'is between', second: true },
  { id: 'contains', label: 'contains' }, { id: 'startsWith', label: 'starts with' },
  { id: 'isMissing', label: 'is missing', noValue: true }, { id: 'notMissing', label: 'is not missing', noValue: true },
];
const opDef = (id) => FILTER_OPS.find((o) => o.id === id);

function keyFor(type, v) {
  if (isNull(v)) return null;
  if (isNumericType(type)) return typeof v === 'number' ? v : parseNumber(v);
  if (type === 'date' || type === 'datetime') { const d = parseDate(v); return d ? d.getTime() : null; }
  if (type === 'boolean') return typeof v === 'boolean' ? v : parseBoolean(v);
  return String(v);
}
function parseOperand(type, raw, label) {
  if (raw === '' || raw === undefined || raw === null) throw new Error(`${label}: enter a value.`);
  const k = keyFor(type, typeof raw === 'string' ? raw.trim() : raw);
  if (k === null) throw new Error(`${label}: “${raw}” is not a valid ${type} value.`);
  return k;
}

export function compileCondition(ds, cond) {
  const col = requireColumn(ds, cond.column);
  const def = opDef(cond.op);
  if (!def) throw new Error(`Unsupported filter operator: ${cond.op}`);
  const label = `Filter on “${col.name}”`;
  const get = (i) => ds.data[col.id][i];
  if (cond.op === 'isMissing') return (i) => isNull(get(i));
  if (cond.op === 'notMissing') return (i) => !isNull(get(i));
  if (cond.op === 'contains' || cond.op === 'startsWith') {
    if (!cond.value) throw new Error(`${label}: enter text to match.`);
    const needle = String(cond.value).toLowerCase();
    return (i) => { const v = get(i); if (isNull(v)) return false; const s = String(v).toLowerCase(); return cond.op === 'contains' ? s.includes(needle) : s.startsWith(needle); };
  }
  const a = parseOperand(col.type, cond.value, label);
  const b = def.second ? parseOperand(col.type, cond.value2, label) : null;
  if (def.second && a > b) throw new Error(`${label}: the lower bound is larger than the upper bound.`);
  return (i) => {
    const k = keyFor(col.type, get(i));
    if (k === null) return false;
    switch (cond.op) {
      case 'eq': return typeof k === 'string' ? k.toLowerCase() === String(a).toLowerCase() : k === a;
      case 'ne': return typeof k === 'string' ? k.toLowerCase() !== String(a).toLowerCase() : k !== a;
      case 'gt': return k > a; case 'gte': return k >= a;
      case 'lt': return k < a; case 'lte': return k <= a;
      case 'between': return k >= a && k <= b;
      default: return false;
    }
  };
}

/** Returns indices of rows matching the conditions. No conditions → all rows. */
export function evaluateFilters(ds, conditions = [], mode = 'all') {
  const preds = conditions.map((c) => compileCondition(ds, c));
  const out = [];
  for (let i = 0; i < ds.rowCount; i++) {
    if (!preds.length || (mode === 'any' ? preds.some((p) => p(i)) : preds.every((p) => p(i)))) out.push(i);
  }
  return out;
}
