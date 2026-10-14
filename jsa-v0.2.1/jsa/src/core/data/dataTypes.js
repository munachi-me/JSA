// Logical type inference based on actual values. Users can override results.

export const TYPES = ['integer', 'decimal', 'boolean', 'date', 'datetime', 'categorical', 'text', 'identifier'];

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
  const s = v.trim().replace(/^[$€£]/, '').replace(/,(?=\d{3}(\D|$))/g, '');
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

// ISO dates are parsed as UTC to avoid time-zone drift in grouping.
export function parseDate(v) {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (DATE_RE.test(s)) {
    const d = new Date(`${s}T00:00:00Z`);
    return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
  }
  if (DATETIME_RE.test(s)) {
    const d = new Date(/[Zz]|[-+]\d{2}:?\d{2}$/.test(s) ? s : `${s.replace(' ', 'T')}Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function inferColumnType(values, { categoricalMaxRatio = 0.5, categoricalMaxUnique = 50, name = '' } = {}) {
  const present = values.filter((v) => !isMissing(v)).map((v) => (typeof v === 'string' ? v.trim() : v));
  if (!present.length) return { type: 'text', confidence: 0, reason: 'No non-missing values.' };

  const all = (fn) => present.every(fn);
  const unique = new Set(present.map(String));

  if (all((v) => parseBoolean(v) !== null && typeof v !== 'number')) return res('boolean', 1, 'All values are true/false or yes/no.');
  if (all((v) => parseDate(v) !== null && DATE_RE.test(String(v)))) return res('date', 1, 'All values are ISO dates.');
  if (all((v) => parseDate(v) !== null)) return res('datetime', 1, 'All values are ISO datetimes.');

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

export const isNumericType = (t) => t === 'integer' || t === 'decimal';
