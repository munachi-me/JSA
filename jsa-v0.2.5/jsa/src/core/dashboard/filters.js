// Dashboard filter controls become ordinary row conditions applied once to the dataset, so every
// compatible component sees the same filtered rows (same semantics for charts, KPIs, tables).
import { isNumericType } from '../data/dataTypes.js';

export function filterKind(col) {
  if (isNumericType(col.type)) return 'range';
  if (col.type === 'date' || col.type === 'datetime') return 'dateRange';
  return 'select';
}

/** values: { [filterComponentId]: { value, value2 } } */
export function controlConditions(ds, components, values = {}) {
  const out = [];
  for (const c of components) {
    if (c.type !== 'filter') continue;
    const col = ds.columns.find((x) => x.id === c.config.column);
    const v = values[c.id];
    if (!col || !v) continue;
    const a = (v.value ?? '').toString().trim(), b = (v.value2 ?? '').toString().trim();
    if (filterKind(col) === 'select') { if (a !== '') out.push({ column: col.id, op: 'eq', value: a }); continue; }
    if (a !== '' && b !== '') out.push({ column: col.id, op: 'between', value: a, value2: b });
    else if (a !== '') out.push({ column: col.id, op: 'gte', value: a });
    else if (b !== '') out.push({ column: col.id, op: 'lte', value: b });
  }
  return out;
}

export function selectOptions(ds, columnId, cap = 200) {
  const vals = ds.data[columnId] || [];
  const set = new Set();
  for (const v of vals) if (v !== null && v !== undefined) set.add(String(v));
  const all = [...set].sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
  return { options: all.slice(0, cap), truncated: all.length > cap, total: all.length };
}
