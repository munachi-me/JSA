// Logical type inference based on actual values. Users can override results.

export const TYPES = ['integer', 'decimal', 'currency', 'boolean', 'date', 'time', 'datetime', 'categorical', 'text', 'identifier'];

const MISSING = new Set(['', 'na', 'n/a', 'null', 'nan', 'none', '-', 'undefined']);
export const isMissing = (v) =>
  v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v)) ||
  (typeof v === 'string' && MISSING.has(v.trim().toLowerCase()));

const BOOL = new Set(['true', 'false', 'yes', 'no']);
const INT_RE = /^[-+]?\d+$/;
const DEC_RE = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[-+]\d{2}:?\d{2})?$/;

export function parseNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const s = v.trim().replace(/^(?:(?:USD|EUR|GBP|NGN|INR|JPY|CAD|AUD)\s*)/i, '').replace(/\s*(?:(?:USD|EUR|GBP|NGN|INR|JPY|CAD|AUD))$/i, '').replace(/^[$€£₦₹¥]/, '').replace(/[$€£₦₹¥]$/, '').replace(/,(?=\d{3}(\D|$))/g, '');
  if (!DEC_RE.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseBoolean(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (!BOOL.has(s)) return null;
  return s === 'true' || s === 'yes';
}

// Calendar dates are normalized to UTC to avoid time-zone drift in grouping.
const TIME_RE = /^(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/;

export function parseTime(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!TIME_RE.test(s)) return null;
  const [clock, fraction = ''] = s.split('.');
  const parts = clock.split(':').map(Number);
  return `${String(parts[0]).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}:${String(parts[2] ?? 0).padStart(2, '0')}${fraction ? `.${fraction}` : ''}`;
}

function parseDateOnly(s) {
  if (DATE_RE.test(s)) {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? d : null;
  }
  // Slash/dot dates support DD/MM/YYYY and MM/DD/YYYY. When both first
  // components are <= 12, use month-first so 12/10/2010 stays December 10,
  // matching the common browser/CSV interpretation. Values > 12 disambiguate the format.
  const m = s.match(/^(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{4})$/);
  if (m) {
    const a = Number(m[1]), b = Number(m[2]), year = Number(m[3]);
    let day, month;
    if (a > 12 && b <= 12) { day = a; month = b; }
    else if (b > 12 && a <= 12) { month = a; day = b; }
    else { month = a; day = b; }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day ? d : null;
  }
  // Month-name formats (e.g. 5 Jan 2024, January 5, 2024).
  if (/^(?:\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})$/.test(s)) {
    const d = new Date(`${s} UTC`);
    return Number.isNaN(d.getTime()) ? null : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  return null;
}

export function parseDate(v) {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  const dateOnly = parseDateOnly(s);
  if (dateOnly) return dateOnly;
  if (DATETIME_RE.test(s)) {
    const d = new Date(/[Zz]|[-+]\d{2}:?\d{2}$/.test(s) ? s : `${s.replace(' ', 'T')}Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // Common datetime forms with slash dates, e.g. 31/01/2024 14:05.
  const m = s.match(/^(\d{1,2}[\/. -]\d{1,2}[\/. -]\d{4})[ T]+(\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/);
  if (m) {
    const d = parseDateOnly(m[1]), t = parseTime(m[2]);
    if (!d || !t) return null;
    const [hh, mm, ss] = t.split(':');
    const millis = Number((ss.split('.')[1] || '').padEnd(3, '0').slice(0, 3));
    d.setUTCHours(Number(hh), Number(mm), Number(ss.split('.')[0]), millis);
    return d;
  }
  return null;
}

function isDateOnlyValue(v) {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  return !!parseDateOnly(s) && !/[T ]\d{1,2}:\d{2}/.test(s);
}

export function inferColumnType(values, { categoricalMaxRatio = 0.5, categoricalMaxUnique = 50, name = '' } = {}) {
  const present = values.filter((v) => !isMissing(v)).map((v) => (typeof v === 'string' ? v.trim() : v));
  if (!present.length) return { type: 'text', confidence: 0, reason: 'No non-missing values.' };

  const all = (fn) => present.every(fn);
  const unique = new Set(present.map(String));

  if (all((v) => parseBoolean(v) !== null && typeof v !== 'number')) return res('boolean', 1, 'All values are true/false or yes/no.');
  if (all((v) => parseTime(String(v)) !== null)) return res('time', 1, 'All values are times.');
  if (all((v) => parseDate(v) !== null && isDateOnlyValue(String(v)))) return res('date', 1, 'All values are calendar dates.');
  if (all((v) => parseDate(v) !== null)) return res('datetime', 1, 'All values are datetimes.');

  const currencyMarker = /[$€£₦₹¥]|\b(?:USD|EUR|GBP|NGN|INR|JPY|CAD|AUD)\b/i;
  if (all((v) => parseNumber(v) !== null && typeof v === 'string' && currencyMarker.test(v.trim()))) return res('currency', 0.95, 'Values contain recognizable currency symbols or codes.');

  if (all((v) => parseNumber(v) !== null)) {
    const ints = all((v) => INT_RE.test(String(v)) || Number.isInteger(v));
    // An all-unique integer column named like an ID is an identifier, not a measure.
    const idName = /(^|[_\s-])(id|uuid|key|code|number|no)$/i.test(name) || /^id$/i.test(name);
    if (ints && idName && unique.size === present.length) return res('identifier', 0.8, 'Unique integers in a column named like an identifier.');
    return ints ? res('integer', 1, 'All values are whole numbers.') : res('decimal', 1, 'All values are numeric.');
  }

  const ratio = unique.size / present.length;
  if (unique.size <= categoricalMaxUnique && ratio <= categoricalMaxRatio) return res('categorical', 0.8, `${unique.size} distinct values across ${present.length} rows.`);
  if (unique.size === present.length && /(^|[_\s-])(id|uuid|key)$/i.test(name)) return res('identifier', 0.8, 'Unique values in an identifier-like column.');
  return res('text', 0.7, 'Free-form text.');

  function res(type, confidence, reason) { return { type, confidence, reason }; }
}

export const isNumericType = (t) => t === 'integer' || t === 'decimal' || t === 'currency';
