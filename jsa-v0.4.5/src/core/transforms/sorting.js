import { requireColumn, isNull } from './rows.js';
import { isNumericType, parseDate, parseTime } from '../data/dataTypes.js';

/** Stable sort; missing values always last. Returns the new row order. */
export function sortIndices(ds, columnId, direction = 'asc') {
  const col = requireColumn(ds, columnId);
  const vals = ds.data[col.id];
  const num = isNumericType(col.type);
  const order = col.sortOrder;
  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const monthIndex = (v) => monthOrder.findIndex((name) => name.toLowerCase() === String(v).replace(/\.$/, '').toLowerCase()) >= 0 ? monthOrder.findIndex((name) => name.toLowerCase() === String(v).replace(/\.$/, '').toLowerCase()) : ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(String(v).replace(/\.$/, '').toLowerCase());
  const weekdayIndex = (v) => { const full = weekdayOrder.findIndex((name) => name.toLowerCase() === String(v).replace(/\.$/, '').toLowerCase()); return full >= 0 ? full : ['mon','tue','wed','thu','fri','sat','sun'].indexOf(String(v).replace(/\.$/, '').toLowerCase()); };
  const idx = Array.from({ length: ds.rowCount }, (_, i) => i);
  const dir = direction === 'desc' ? -1 : 1;
  idx.sort((x, y) => {
    const a = vals[x], b = vals[y];
    if (isNull(a) && isNull(b)) return x - y;
    if (isNull(a)) return 1;
    if (isNull(b)) return -1;
    const dateKey = (v) => { const d = parseDate(String(v)); return d ? d.getTime() : null; };
    const timeKey = (v) => { const t = parseTime(String(v)); if (!t) return null; const [h, m, sec] = t.split(':').map(Number); return h * 3600 + m * 60 + sec; };
    const ak = col.type === 'date' || col.type === 'datetime' ? dateKey(a) : col.type === 'time' ? timeKey(a) : null;
    const bk = col.type === 'date' || col.type === 'datetime' ? dateKey(b) : col.type === 'time' ? timeKey(b) : null;
    const c = order === 'month' ? monthIndex(a) - monthIndex(b)
      : order === 'weekday' ? weekdayIndex(a) - weekdayIndex(b)
      : (col.type === 'date' || col.type === 'datetime') && ak !== null && bk !== null ? (ak < bk ? -1 : ak > bk ? 1 : 0)
      : col.type === 'time' && ak !== null && bk !== null ? (ak < bk ? -1 : ak > bk ? 1 : 0)
      : num || col.type === 'boolean' ? (a < b ? -1 : a > b ? 1 : 0) : String(a).localeCompare(String(b), undefined, { numeric: true });
    return c * dir || x - y;
  });
  return idx;
}
