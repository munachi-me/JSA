// Saved analysis = a plain JSON definition that fully reproduces its result from a dataset.
//  { id, name, filters, filterMode, groupBy:[colId], measures:[{column?, op, as}], sortBy?, sortDir?, limit? }
import { evaluateFilters } from '../transforms/filters.js';
import { aggregate } from './aggregation.js';

export function runAnalysis(ds, def) {
  const idx = evaluateFilters(ds, def.filters || [], def.filterMode || 'all');
  const res = aggregate(ds, { groupBy: def.groupBy || [], measures: def.measures, rowIndices: idx });
  let rows = res.rows;
  const warnings = [...res.warnings];
  if (def.sortBy) {
    if (!res.columns.includes(def.sortBy)) throw new Error(`Cannot sort by unknown result column “${def.sortBy}”.`);
    const dir = def.sortDir === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const x = a[def.sortBy], y = b[def.sortBy];
      if (x === null && y === null) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir;
    });
  }
  if (def.limit && rows.length > def.limit) { warnings.push(`Showing the first ${def.limit} of ${rows.length} groups.`); rows = rows.slice(0, def.limit); }
  return { ...res, rows, warnings, rowsUsed: idx.length, rowsTotal: ds.rowCount };
}
