import { isNumericType, parseNumber, parseDate } from '../data/dataTypes.js';
import { isNull, requireColumn } from './rows.js';

const OPS = new Set(['eq', 'ne', 'contains', 'notContains', 'gt', 'gte', 'lt', 'lte', 'isMissing', 'isNotMissing']);
const VALUE_OPS = new Set(['eq', 'ne', 'contains', 'notContains', 'gt', 'gte', 'lt', 'lte']);

export function validateCondition(ds, condition) {
  const { column, op, value = '' } = condition || {};
  if (!OPS.has(op)) throw new Error(`Unsupported condition operator: ${op || '(empty)'}.`);
  const col = requireColumn(ds, column);
  if (VALUE_OPS.has(op) && String(value).trim() === '') throw new Error(`Enter a comparison value for “${col.name}”.`);
  if (['gt', 'gte', 'lt', 'lte'].includes(op)) {
    if (isNumericType(col.type) && parseNumber(value) === null) throw new Error(`Enter a valid number for “${col.name}”.`);
    if ((col.type === 'date' || col.type === 'datetime') && !parseDate(String(value))) throw new Error(`Enter a valid date for “${col.name}”.`);
  }
  return true;
}

function matches(ds, rowIndex, condition) {
  const { column, op, value = '' } = condition || {};
  if (!OPS.has(op)) throw new Error(`Unsupported condition operator: ${op || '(empty)'}.`);
  const col = requireColumn(ds, column);
  const actual = ds.data[column][rowIndex];
  if (op === 'isMissing') return isNull(actual) || (typeof actual === 'string' && !actual.trim());
  if (op === 'isNotMissing') return !(isNull(actual) || (typeof actual === 'string' && !actual.trim()));
  if (isNull(actual)) return false;

  if (['gt', 'gte', 'lt', 'lte'].includes(op)) {
    let a, b;
    if (isNumericType(col.type)) {
      a = Number(actual); b = parseNumber(value);
      if (b === null) throw new Error(`Enter a valid number for “${col.name}”.`);
    } else if (col.type === 'date' || col.type === 'datetime') {
      a = parseDate(actual)?.getTime(); b = parseDate(String(value))?.getTime();
      if (a === undefined || a === null || b === undefined || b === null) throw new Error(`Enter a valid date for “${col.name}”.`);
    } else {
      a = String(actual).toLocaleLowerCase(); b = String(value).toLocaleLowerCase();
    }
    if (op === 'gt') return a > b;
    if (op === 'gte') return a >= b;
    if (op === 'lt') return a < b;
    return a <= b;
  }

  const a = String(actual).toLocaleLowerCase();
  const b = String(value).toLocaleLowerCase();
  if (op === 'eq') return a === b;
  if (op === 'ne') return a !== b;
  if (op === 'contains') return a.includes(b);
  return !a.includes(b);
}

export function evaluateCondition(ds, rowIndex, condition) {
  return matches(ds, rowIndex, condition);
}
