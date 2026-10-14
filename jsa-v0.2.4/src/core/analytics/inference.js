// Inference helpers built on the regularized incomplete beta / gamma functions
// (Numerical Recipes algorithms). Accuracy is about 1e-7, verified in tests against known values.
function lgamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, t = x + 5.5;
  t -= (x + 0.5) * Math.log(t);
  let s = 1.000000000190015;
  for (const k of c) s += k / ++y;
  return -t + Math.log((2.5066282746310005 * s) / x);
}
function betacf(x, a, b) {
  const FP = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m; let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d;
    const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break;
  }
  return h;
}
export function betaIncomplete(x, a, b) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(x, a, b)) / a : 1 - (bt * betacf(1 - x, b, a)) / b;
}
export function gammaP(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) { let ap = a, sum = 1 / a, del = sum; for (let n = 0; n < 500; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 3e-14) break; } return sum * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
  let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break; }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}
export const tTwoTailedP = (t, df) => (Number.isFinite(t) ? betaIncomplete(df / (df + t * t), df / 2, 0.5) : 0);
export const fPValue = (F, d1, d2) => (F <= 0 ? 1 : Number.isFinite(F) ? betaIncomplete(d2 / (d2 + d1 * F), d2 / 2, d1 / 2) : 0);
export const chiSquareP = (chi2, df) => (chi2 <= 0 ? 1 : 1 - gammaP(df / 2, chi2 / 2));

const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

/** One-way ANOVA. groups: arrays of numbers (each with ≥1 value, at least 2 groups, N > k). */
export function anova(groups) {
  const k = groups.length, N = groups.reduce((s, g) => s + g.length, 0);
  if (k < 2 || N <= k) return null;
  const grand = groups.reduce((s, g) => s + g.reduce((a, v) => a + v, 0), 0) / N;
  let ssb = 0, ssw = 0;
  for (const g of groups) { const m = mean(g); ssb += g.length * (m - grand) ** 2; for (const v of g) ssw += (v - m) ** 2; }
  const df1 = k - 1, df2 = N - k;
  const F = ssw === 0 ? (ssb === 0 ? 0 : Infinity) : ssb / df1 / (ssw / df2);
  return { F, df1, df2, p: fPValue(F, df1, df2), etaSquared: ssb + ssw === 0 ? 0 : ssb / (ssb + ssw) };
}

/** Pearson chi-square test of independence on a rows×cols table of counts. */
export function chiSquareTest(table) {
  const r = table.length, c = table[0].length;
  const rows = table.map((row) => row.reduce((a, b) => a + b, 0));
  const cols = Array.from({ length: c }, (_, j) => table.reduce((a, row) => a + row[j], 0));
  const N = rows.reduce((a, b) => a + b, 0);
  if (r < 2 || c < 2 || N === 0 || cols.some((x) => x === 0)) return null;
  let chi2 = 0, minExpected = Infinity;
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) { const e = (rows[i] * cols[j]) / N; minExpected = Math.min(minExpected, e); chi2 += (table[i][j] - e) ** 2 / e; }
  const df = (r - 1) * (c - 1);
  return { chi2, df, p: chiSquareP(chi2, df), minExpected, cramersV: Math.sqrt(chi2 / (N * Math.min(r - 1, c - 1))) };
}
