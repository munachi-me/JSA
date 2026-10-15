// Pearson correlation on pairwise-complete observations. Association only; never implies causation.
import { tTwoTailedP } from './inference.js';

export function pearson(xs, ys) {
  const px = [], py = [];
  const len = Math.min(xs.length, ys.length);
  for (let i = 0; i < len; i++) if (typeof xs[i] === 'number' && typeof ys[i] === 'number' && Number.isFinite(xs[i]) && Number.isFinite(ys[i])) { px.push(xs[i]); py.push(ys[i]); }
  const n = px.length;
  const out = { r: null, n, p: null, warnings: [] };
  if (n < 3) { out.warnings.push('At least 3 complete pairs are needed.'); return out; }
  const mx = px.reduce((a, b) => a + b, 0) / n, my = py.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = px[i] - mx, dy = py[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  if (sxx === 0 || syy === 0) { out.warnings.push('One variable is constant, so correlation is undefined.'); return out; }
  out.r = Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy)));
  out.p = Math.abs(out.r) === 1 ? 0 : tTwoTailedP(out.r * Math.sqrt((n - 2) / (1 - out.r ** 2)), n - 2);
  return out;
}
