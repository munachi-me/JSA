// Dataset-level quality profile: duplicates, missing cells, and human-readable issues.
import { isMissing } from './dataTypes.js';

export function countDuplicateRows(ds, columnIds = ds.columns.map((c) => c.id)) {
  const seen = new Set();
  let dup = 0;
  for (let i = 0; i < ds.rowCount; i++) {
    const key = JSON.stringify(columnIds.map((id) => ds.data[id][i]));
    if (seen.has(key)) dup++; else seen.add(key);
  }
  return dup;
}

export function profileDataset(ds) {
  const issues = [];
  let totalMissing = 0;
  for (const c of ds.columns) {
    const m = ds.data[c.id].filter((v) => isMissing(v)).length;
    totalMissing += m;
    if (ds.rowCount && m / ds.rowCount >= 0.2) issues.push(`“${c.name}” is ${(100 * m / ds.rowCount).toFixed(1)}% missing (${m} of ${ds.rowCount} rows).`);
    else if (m > 0) issues.push(`“${c.name}” has ${m} missing value${m > 1 ? 's' : ''}.`);
  }
  const duplicateRows = countDuplicateRows(ds);
  if (duplicateRows) issues.push(`${duplicateRows} row${duplicateRows > 1 ? 's are' : ' is'} an exact duplicate of an earlier row.`);
  return { totalMissing, duplicateRows, issues };
}
