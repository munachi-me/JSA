import { requireColumn, isNull } from './rows.js';
import { isNumericType } from '../data/dataTypes.js';

/** Stable sort; missing values always last. Returns the new row order. */
export function sortIndices(ds, columnId, direction = 'asc') {
  const col = requireColumn(ds, columnId);
  const vals = ds.data[col.id];
  const num = isNumericType(col.type);
  const order = col.sortOrder;
  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const idx = Array.from({ length: ds.rowCount }, (_, i) => i);
  const dir = direction === 'desc' ? -1 : 1;
  idx.sort((x, y) => {
    const a = vals[x], b = vals[y];
    if (isNull(a) && isNull(b)) return x - y;
    if (isNull(a)) return 1;
    if (isNull(b)) return -1;
    const c = order === 'month' ? monthOrder.indexOf(String(a)) - monthOrder.indexOf(String(b))
      : order === 'weekday' ? weekdayOrder.indexOf(String(a)) - weekdayOrder.indexOf(String(b))
      : num || col.type === 'boolean' ? (a < b ? -1 : a > b ? 1 : 0) : String(a).localeCompare(String(b), undefined, { numeric: true });
    return c * dir || x - y;
  });
  return idx;
}
