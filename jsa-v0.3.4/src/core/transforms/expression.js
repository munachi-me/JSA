// Safe arithmetic expressions for calculated columns. No eval. Column refs: [Column name].
// Supports + - * / ( ) unary minus and numbers. Division by zero or a missing input → null.
import { isNumericType } from '../data/dataTypes.js';

function tokenize(src) {
  const t = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if ('+-*/()'.includes(c)) { t.push({ t: c }); i++; continue; }
    if (c === '[') { const j = src.indexOf(']', i); if (j < 0) throw new Error('Missing closing ] in expression.'); t.push({ t: 'col', name: src.slice(i + 1, j) }); i = j + 1; continue; }
    const m = /^(\d+\.?\d*|\.\d+)/.exec(src.slice(i));
    if (m) { t.push({ t: 'num', v: Number(m[1]) }); i += m[1].length; continue; }
    throw new Error(`Unexpected character “${c}” in expression.`);
  }
  return t;
}

function parse(tokens) {
  let p = 0;
  const peek = () => tokens[p]?.t;
  const expr = () => { let n = term(); while (peek() === '+' || peek() === '-') { const op = tokens[p++].t; n = { op, l: n, r: term() }; } return n; };
  const term = () => { let n = factor(); while (peek() === '*' || peek() === '/') { const op = tokens[p++].t; n = { op, l: n, r: factor() }; } return n; };
  const factor = () => {
    const k = tokens[p];
    if (!k) throw new Error('Expression ended unexpectedly.');
    if (k.t === '-') { p++; return { op: 'neg', l: factor() }; }
    if (k.t === 'num') { p++; return { num: k.v }; }
    if (k.t === 'col') { p++; return { col: k.name }; }
    if (k.t === '(') { p++; const n = expr(); if (peek() !== ')') throw new Error('Missing closing ) in expression.'); p++; return n; }
    throw new Error(`Unexpected “${k.t}” in expression.`);
  };
  const ast = expr();
  if (p < tokens.length) throw new Error(`Unexpected “${tokens[p].t}” in expression.`);
  return ast;
}

export function compileExpression(src, ds) {
  if (!String(src || '').trim()) throw new Error('Enter an expression, for example [units] * [unit_price].');
  const ast = parse(tokenize(src));
  const ids = {};
  (function resolve(n) {
    if (n.col !== undefined) {
      const c = ds.columns.find((x) => x.name === n.col);
      if (!c) throw new Error(`Unknown column [${n.col}].`);
      if (!isNumericType(c.type)) throw new Error(`Column [${n.col}] is ${c.type}, not numeric.`);
      ids[n.col] = c.id;
    }
    if (n.l) resolve(n.l); if (n.r) resolve(n.r);
  })(ast);
  const ev = (n, i) => {
    if (n.num !== undefined) return n.num;
    if (n.col !== undefined) { const v = ds.data[ids[n.col]][i]; return v === null || v === undefined ? null : v; }
    if (n.op === 'neg') { const a = ev(n.l, i); return a === null ? null : -a; }
    const a = ev(n.l, i), b = ev(n.r, i);
    if (a === null || b === null) return null;
    switch (n.op) { case '+': return a + b; case '-': return a - b; case '*': return a * b; default: return b === 0 ? null : a / b; }
  };
  return { evaluate: (i) => { const v = ev(ast, i); return v !== null && Number.isFinite(v) ? v : null; } };
}
