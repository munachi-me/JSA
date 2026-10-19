// Immutable dataset helpers shared by all transforms.
export function selectRows(ds, indices) {
  const data = {};
  for (const c of ds.columns) { const src = ds.data[c.id]; data[c.id] = indices.map((i) => src[i]); }
  return { ...ds, data, rowCount: indices.length };
}
export function nextColumnId(ds) {
  let n = ds.columns.length;
  while (ds.data[`c${n}`]) n++;
  return `c${n}`;
}
export function addColumn(ds, name, type, values, extra = {}) {
  const id = nextColumnId(ds);
  let finalName = name, k = 2;
  while (ds.columns.some((c) => c.name === finalName)) finalName = `${name} (${k++})`;
  const col = { id, name: finalName, originalName: finalName, type, inferredType: type, typeReason: 'Created by a transformation.', typeConfidence: 1, derived: true, ...extra };
  return { dataset: { ...ds, columns: [...ds.columns, col], data: { ...ds.data, [id]: values } }, column: col };
}
export function mapColumn(ds, id, fn) {
  return { ...ds, data: { ...ds.data, [id]: ds.data[id].map(fn) } };
}
export const isNull = (v) => v === null || v === undefined;
export function requireColumn(ds, id) {
  const col = ds.columns.find((c) => c.id === id);
  if (!col) throw new Error(`Unknown column: ${id}`);
  return col;
}
