// Each rule: (ds, ctx) => Insight[]. kinds: 'fact' (observed), 'association' (statistical), 'quality'.
import { describe } from '../analytics/descriptive.js';
import { anova, chiSquareTest } from '../analytics/inference.js';
import { pearson } from '../analytics/correlation.js';
import { periodKey } from '../visualization/chartData.js';

const fmt = (n) => (n === null || n === undefined ? '—' : Math.abs(n) >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : Number(n.toFixed(3)).toLocaleString());
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const pStr = (p) => (p < 0.0001 ? '< 0.0001' : p.toFixed(4));
const cmp = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });
const OPW = { sum: 'total', mean: 'average' };
const OPS = { sum: (v) => v.reduce((a, b) => a + b, 0), mean: (v) => v.reduce((a, b) => a + b, 0) / v.length };

function groupsOf(ds, dimId, measId) {
  const m = new Map(), d = ds.data[dimId], v = ds.data[measId];
  for (let i = 0; i < ds.rowCount; i++) { if (d[i] === null || d[i] === undefined || v[i] === null || v[i] === undefined) continue; const k = String(d[i]); if (!m.has(k)) m.set(k, []); m.get(k).push(v[i]); }
  return m;
}
const qualifying = (m, min) => [...m.entries()].filter(([, v]) => v.length >= min).sort((a, b) => cmp(a[0], b[0]));
const dependsOn = (c, other) => c.derived && c.expression && c.expression.includes(`[${other.name}]`);

export function missingData(ds, ctx) {
  const out = [];
  for (const c of ds.columns) {
    const miss = ctx.stats[c.id].missing, ratio = ds.rowCount ? miss / ds.rowCount : 0;
    if (ratio < ctx.opts.missingThreshold) continue;
    out.push({ id: `missing:${c.id}`, rule: 'missingData', kind: 'quality', score: 55 + 40 * Math.min(1, ratio * 2),
      title: `“${c.name}” is missing in ${pct(ratio)} of rows`, description: `${miss.toLocaleString()} of ${ds.rowCount.toLocaleString()} rows have no value for “${c.name}”. Any statistic or chart using it excludes those rows.`,
      metric: c.name, subject: 'Missing values', evidence: [{ label: 'Missing rows', value: miss }, { label: 'Total rows', value: ds.rowCount }, { label: 'Share missing', value: ratio }],
      calculation: `Count of empty or null cells in “${c.name}” ÷ total rows. Flagged when at least ${pct(ctx.opts.missingThreshold, 0)} are missing.`,
      limitations: ['Whether values are missing at random cannot be determined from the data alone.'],
      followUp: 'Decide deliberately whether to fill, remove or keep these rows (Clean page). Each option changes later results.' });
  }
  return out;
}

export function duplicateRows(ds) {
  const seen = new Set(); let dup = 0;
  const ids = ds.columns.map((c) => c.id);
  for (let i = 0; i < ds.rowCount; i++) { const k = JSON.stringify(ids.map((id) => ds.data[id][i])); if (seen.has(k)) dup++; else seen.add(k); }
  if (!dup) return [];
  const ratio = dup / ds.rowCount;
  return [{ id: 'duplicates', rule: 'duplicateRows', kind: 'quality', score: 50 + 40 * Math.min(1, ratio * 20),
    title: `${dup.toLocaleString()} duplicate row${dup === 1 ? '' : 's'} found`, description: `${dup.toLocaleString()} rows (${pct(ratio, 2)}) match an earlier row in every column, so counts and totals include them twice.`,
    metric: 'Rows', subject: 'Exact duplicates', evidence: [{ label: 'Duplicate rows', value: dup }, { label: 'Total rows', value: ds.rowCount }],
    calculation: 'Rows whose values in all columns are identical to an earlier row.', limitations: ['Identical rows can be legitimate (for example, two identical orders). Check before removing.'],
    followUp: 'If they are not legitimate, remove them with the duplicate step on the Clean page.' }];
}

export function constantColumns(ds, ctx) {
  return ds.columns.filter((c) => ds.rowCount >= 2 && ctx.stats[c.id].n === ds.rowCount && ctx.stats[c.id].distinct === 1)
    .map((c) => ({ id: `constant:${c.id}`, rule: 'constantColumn', kind: 'quality', score: 30, title: `“${c.name}” has the same value in every row`,
      description: `Every one of the ${ds.rowCount.toLocaleString()} rows has “${c.name}” = ${String(ds.data[c.id][0])}. It cannot distinguish between rows in any comparison.`, metric: c.name, subject: 'Constant column',
      evidence: [{ label: 'Distinct values', value: 1 }, { label: 'Rows', value: ds.rowCount }], calculation: `Distinct non-missing values in “${c.name}” = 1 with no missing cells.`, limitations: [] }));
}

export function topBottom(ds, ctx) {
  const out = [];
  for (const dim of ctx.dims) for (const meas of ctx.measures) {
    if (dim.id === meas.id) continue;
    const all = groupsOf(ds, dim.id, meas.id), ok = qualifying(all, ctx.opts.minGroupSize);
    if (ok.length < 2) continue;
    const op = ctx.ops[meas.id] || 'sum';
    const vals = ok.map(([k, v]) => ({ label: k, value: OPS[op](v), rows: v.length }));
    const hi = vals.reduce((a, b) => (b.value > a.value ? b : a)), lo = vals.reduce((a, b) => (b.value < a.value ? b : a));
    if (hi.value === lo.value) continue;
    const spread = (hi.value - lo.value) / Math.max(Math.abs(hi.value), Math.abs(lo.value));
    const excluded = all.size - ok.length;
    out.push({ id: `topBottom:${dim.id}:${meas.id}:${op}`, rule: 'topBottom', kind: 'fact', score: 25 + 40 * Math.min(1, spread),
      title: `${hi.label} has the highest ${OPW[op]} ${meas.name} across ${dim.name}`,
      description: `${hi.label}: ${fmt(hi.value)} (${hi.rows.toLocaleString()} rows). Lowest is ${lo.label}: ${fmt(lo.value)} (${lo.rows.toLocaleString()} rows)${lo.value > 0 && hi.value > 0 ? `, so the highest is ${(hi.value / lo.value).toFixed(2)}× the lowest` : ''}.`,
      metric: `${OPW[op]} ${meas.name}`, subject: `${hi.label} vs ${lo.label}`,
      evidence: [{ label: `Highest (${hi.label})`, value: hi.value }, { label: `Lowest (${lo.label})`, value: lo.value }, { label: 'Rows in highest group', value: hi.rows }, { label: 'Rows in lowest group', value: lo.rows }, { label: 'Groups compared', value: ok.length }, { label: 'Groups excluded (too small)', value: excluded }],
      calculation: `For each “${dim.name}” group with at least ${ctx.opts.minGroupSize} rows that have a value, take the ${OPW[op]} of “${meas.name}” (${op === 'sum' ? 'column treated as a total' : 'column name suggests a per-unit or rate value, so it is averaged'}); report the largest and smallest.`,
      limitations: [op === 'sum' ? 'Totals depend on how many rows each group has, so a larger group can rank higher without performing better per row.' : 'Averages from small groups can swing widely.', 'Describes this dataset only; it does not test whether the difference is larger than chance.'],
      chartSpec: { type: 'bar', dimension: dim.id, measures: [{ op: op === 'sum' ? 'sum' : 'avg', column: meas.id, as: '' }], title: `${OPW[op]} ${meas.name} by ${dim.name}` } });
  }
  return out;
}

export function groupDifference(ds, ctx) {
  const tests = [];
  for (const dim of ctx.dims) for (const meas of ctx.measures) {
    if (dim.id === meas.id) continue;
    const ok = qualifying(groupsOf(ds, dim.id, meas.id), ctx.opts.minGroupSize);
    if (ok.length < 2) continue;
    const a = anova(ok.map(([, v]) => v));
    if (a) tests.push({ dim, meas, a, ok });
  }
  const threshold = ctx.opts.alpha / Math.max(1, tests.length);
  return tests.filter((t) => t.a.p < threshold && t.a.etaSquared >= 0.06).map(({ dim, meas, a, ok }) => {
    const means = ok.map(([k, v]) => [k, v.reduce((s, x) => s + x, 0) / v.length]).sort((x, y) => y[1] - x[1]);
    return { id: `groupDifference:${dim.id}:${meas.id}`, rule: 'groupDifference', kind: 'association', score: 50 + 45 * Math.min(1, a.etaSquared / 0.4),
      title: `${meas.name} differs across ${dim.name} groups`, description: `Row-level ${meas.name} averages ${fmt(means[0][1])} for ${means[0][0]} and ${fmt(means[means.length - 1][1])} for ${means[means.length - 1][0]}. The groups explain ${pct(a.etaSquared)} of the variation, and a gap this large is unlikely to arise by chance (p ${a.p < 0.0001 ? '< 0.0001' : `= ${a.p.toFixed(4)}`}).`,
      metric: `average ${meas.name}`, subject: dim.name,
      evidence: [{ label: 'F statistic', value: a.F }, { label: 'Degrees of freedom', value: `${a.df1}, ${a.df2}` }, { label: 'p-value', value: a.p }, { label: 'Effect size (η²)', value: a.etaSquared }, { label: 'Significance threshold used', value: threshold }, ...means.map(([k, m]) => ({ label: `Average for ${k}`, value: m }))],
      calculation: `One-way ANOVA of row-level “${meas.name}” by “${dim.name}” (groups with at least ${ctx.opts.minGroupSize} rows). Reported when p < ${ctx.opts.alpha}/${tests.length} (Bonferroni correction for ${tests.length} comparisons) and η² ≥ 0.06.`,
      limitations: ['This is an association between the grouping and the values. It does not show that the grouping causes the difference.', 'ANOVA assumes independent rows and roughly similar spread in each group, and is sensitive to extreme values.', `${tests.length} comparisons were tested; the threshold is tightened to limit false positives.`],
      followUp: `To learn whether ${dim.name} itself matters, compare groups while holding other related columns constant. This needs additional evidence.`,
      chartSpec: { type: 'bar', dimension: dim.id, measures: [{ op: 'avg', column: meas.id, as: '' }], title: `Average ${meas.name} by ${dim.name}` } };
  });
}

export function outcomeRate(ds, ctx) {
  const tests = [];
  for (const out of ctx.outcomes) for (const dim of ctx.dims) {
    if (dim.id === out.id) continue;
    const g = new Map();
    for (let i = 0; i < ds.rowCount; i++) { const d = ds.data[dim.id][i], o = ds.data[out.id][i]; if (d === null || d === undefined || o === null || o === undefined) continue; const k = String(d); if (!g.has(k)) g.set(k, { pos: 0, n: 0 }); g.get(k).n++; if (o === true) g.get(k).pos++; }
    const ok = [...g.entries()].filter(([, v]) => v.n >= ctx.opts.minGroupSize).sort((a, b) => cmp(a[0], b[0]));
    if (ok.length < 2) continue;
    const rates = ok.map(([k, v]) => ({ label: k, rate: v.pos / v.n, pos: v.pos, n: v.n }));
    const hi = rates.reduce((a, b) => (b.rate > a.rate ? b : a)), lo = rates.reduce((a, b) => (b.rate < a.rate ? b : a));
    const table = ok.map(([, v]) => [v.pos, v.n - v.pos]);
    const chi = chiSquareTest(table);
    tests.push({ out, dim, rates, hi, lo, chi, total: ok.reduce((s, [, v]) => s + v.n, 0), pos: ok.reduce((s, [, v]) => s + v.pos, 0) });
  }
  const threshold = ctx.opts.alpha / Math.max(1, tests.length);
  return tests.filter((t) => t.hi.rate - t.lo.rate >= 0.05).map((t) => {
    const sig = !!t.chi && t.chi.p < threshold;
    return { id: `outcomeRate:${t.out.id}:${t.dim.id}`, rule: 'outcomeRate', kind: 'association', score: 40 + 55 * Math.min(1, (t.chi?.cramersV ?? 0) / 0.5) - (sig ? 0 : 15),
      title: `Observed “${t.out.name}” rate is highest for ${t.hi.label} (${pct(t.hi.rate)}) and lowest for ${t.lo.label} (${pct(t.lo.rate)})`,
      description: `Among ${t.hi.n.toLocaleString()} ${t.hi.label} rows, ${t.hi.pos.toLocaleString()} are “${t.out.name}” = true; among ${t.lo.n.toLocaleString()} ${t.lo.label} rows, ${t.lo.pos.toLocaleString()}. Overall rate: ${pct(t.pos / t.total)}. ${sig ? `The differences across ${t.dim.name} groups are unlikely to be due to chance (chi-square p ${pStr(t.chi.p)}).` : `With this much data the differences are not statistically distinguishable from chance at the corrected threshold (p ${t.chi ? pStr(t.chi.p) : 'n/a'}).`}`,
      metric: `${t.out.name} rate`, subject: t.dim.name,
      evidence: [...t.rates.map((r) => ({ label: `${r.label}: rate`, value: r.rate })), ...t.rates.map((r) => ({ label: `${r.label}: rows (true / total)`, value: `${r.pos} / ${r.n}` })), { label: 'Overall rate', value: t.pos / t.total }, ...(t.chi ? [{ label: 'Chi-square', value: t.chi.chi2 }, { label: 'p-value', value: t.chi.p }, { label: "Cramér's V", value: t.chi.cramersV }] : []), { label: 'Significance threshold used', value: threshold }],
      calculation: `Share of rows where “${t.out.name}” is true within each “${t.dim.name}” group (groups with at least ${ctx.opts.minGroupSize} rows), tested with a chi-square test of independence; threshold ${ctx.opts.alpha}/${tests.length} (Bonferroni). Shown when the highest and lowest rates differ by at least 5 percentage points.`,
      limitations: ['This is an observed association. It does not show that the group causes the outcome.', ...(t.chi && t.chi.minExpected < 5 ? ['Some expected counts are below 5, so the chi-square p-value is approximate.'] : []), `${tests.length} comparisons were tested.`],
      followUp: `Whether ${t.dim.name} influences ${t.out.name}, rather than other columns that vary with it, needs additional evidence.` };
  });
}

export function extremes(ds, ctx) {
  const out = [];
  for (const m of ctx.measures) {
    const s = describe(ds.data[m.id]);
    if (s.count < 8 || s.iqr === 0) continue;
    const lo = s.q1 - 1.5 * s.iqr, hi = s.q3 + 1.5 * s.iqr;
    const idx = [];
    ds.data[m.id].forEach((v, i) => { if (typeof v === 'number' && (v < lo || v > hi)) idx.push(i); });
    if (!idx.length || idx.length / s.count > 0.1) continue;
    const vals = idx.map((i) => ds.data[m.id][i]);
    out.push({ id: `extremes:${m.id}`, rule: 'extremes', kind: 'fact', score: 30 + Math.min(40, (400 * idx.length) / s.count),
      title: `${idx.length} unusually ${vals.every((v) => v > hi) ? 'high' : vals.every((v) => v < lo) ? 'low' : 'high or low'} value${idx.length === 1 ? '' : 's'} in ${m.name}`,
      description: `${idx.length} of ${s.count.toLocaleString()} values fall outside ${fmt(lo)} to ${fmt(hi)}. The most extreme are ${fmt(Math.min(...vals))} and ${fmt(Math.max(...vals))}. Rows (1-based): ${idx.slice(0, 5).map((i) => i + 1).join(', ')}${idx.length > 5 ? ', …' : ''}.`,
      metric: m.name, subject: 'Outliers', evidence: [{ label: 'Values outside fences', value: idx.length }, { label: 'Values analysed', value: s.count }, { label: 'Lower fence', value: lo }, { label: 'Upper fence', value: hi }, { label: 'Q1', value: s.q1 }, { label: 'Q3', value: s.q3 }],
      calculation: 'Tukey fences: values below Q1 − 1.5×IQR or above Q3 + 1.5×IQR (quartiles by linear interpolation).',
      limitations: ['Unusual does not mean wrong. No rows were removed or changed.', 'Skewed data naturally produces more values beyond the fences.'],
      chartSpec: { type: 'histogram', column: m.id, title: `Distribution of ${m.name}` } });
  }
  return out;
}

export function concentration(ds, ctx) {
  const out = [];
  for (const dim of ctx.dims) for (const meas of ctx.measures) {
    if (dim.id === meas.id || (ctx.ops[meas.id] || 'sum') !== 'sum') continue;
    const g = groupsOf(ds, dim.id, meas.id);
    if (g.size < 5) continue;
    const vals = [...g.entries()].map(([k, v]) => [k, v.reduce((a, b) => a + b, 0)]);
    if (vals.some(([, v]) => v < 0)) continue;
    const total = vals.reduce((a, [, v]) => a + v, 0);
    if (total <= 0) continue;
    vals.sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]));
    const k = Math.ceil(vals.length * 0.2), share = vals.slice(0, k).reduce((a, [, v]) => a + v, 0) / total;
    if (share < 0.6) continue;
    out.push({ id: `concentration:${dim.id}:${meas.id}`, rule: 'concentration', kind: 'fact', score: 35 + 40 * Math.min(1, (share - 0.6) / 0.4),
      title: `${k} of ${vals.length} ${dim.name} groups account for ${pct(share, 0)} of ${meas.name}`, description: `The top ${k} (${vals.slice(0, k).map(([n]) => n).join(', ')}) sum to ${fmt(vals.slice(0, k).reduce((a, [, v]) => a + v, 0))} of ${fmt(total)} in total.`,
      metric: `total ${meas.name}`, subject: dim.name, evidence: [{ label: 'Top groups', value: k }, { label: 'All groups', value: vals.length }, { label: 'Share of total', value: share }, { label: 'Total', value: total }],
      calculation: `Total “${meas.name}” per “${dim.name}” group, sorted descending; share held by the top 20% of groups (rounded up). Shown when at least 60%.`,
      limitations: ['Assumes the column is additive (a total). Only shown for non-negative values.', 'Describes the data; it does not say whether the concentration is risky.'],
      chartSpec: { type: 'bar', dimension: dim.id, measures: [{ op: 'sum', column: meas.id, as: '' }], title: `Total ${meas.name} by ${dim.name}` } });
  }
  return out;
}

export function correlations(ds, ctx) {
  const cols = ctx.measures.filter((m) => !m.derived || true).slice(0, 10);
  const tests = [];
  for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) {
    const a = cols[i], b = cols[j];
    if (dependsOn(a, b) || dependsOn(b, a)) continue; // a calculated column trivially tracks its inputs
    const r = pearson(ds.data[a.id], ds.data[b.id]);
    if (r.r !== null && r.n >= 10) tests.push({ a, b, ...r });
  }
  const threshold = ctx.opts.alpha / Math.max(1, tests.length);
  return tests.filter((t) => Math.abs(t.r) >= 0.5 && t.p < threshold).map((t) => ({
    id: `correlation:${t.a.id}:${t.b.id}`, rule: 'correlation', kind: 'association', score: 40 + 55 * Math.abs(t.r),
    title: `${t.a.name} and ${t.b.name} ${t.r > 0 ? 'rise and fall together' : 'move in opposite directions'} (r = ${t.r.toFixed(2)})`,
    description: `Across ${t.n.toLocaleString()} rows with both values, the linear correlation is ${t.r.toFixed(3)} (${Math.abs(t.r) >= 0.7 ? 'strong' : 'moderate'}, p ${pStr(t.p)}).`, metric: `${t.a.name} vs ${t.b.name}`, subject: 'Correlation',
    evidence: [{ label: 'Pearson r', value: t.r }, { label: 'r²', value: t.r ** 2 }, { label: 'Pairs used', value: t.n }, { label: 'p-value', value: t.p }, { label: 'Significance threshold used', value: threshold }],
    calculation: `Pearson correlation on rows where both values are present; reported when |r| ≥ 0.5 and p < ${ctx.opts.alpha}/${tests.length} (Bonferroni). Pairs where one column is calculated from the other are skipped.`,
    limitations: ['Correlation does not establish causation.', 'Measures straight-line relationships only; a curved relationship can have a low r.', 'A few extreme values can create or hide a correlation.', `${tests.length} column pairs were tested.`],
    chartSpec: { type: 'scatter', x: t.a.id, y: t.b.id, title: `${t.b.name} vs ${t.a.name}` } }));
}

function nextPeriod(key, grain) {
  if (grain === 'year') return String(Number(key) + 1);
  if (grain === 'month') { const [y, m] = key.split('-').map(Number); return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`; }
  const d = new Date(`${key}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10);
}

export function timeChanges(ds, ctx) {
  const out = [];
  for (const dc of ctx.dateCols) {
    const times = ds.data[dc.id].map((v) => (v ? new Date(v).getTime() : null)).filter((t) => t !== null && Number.isFinite(t));
    if (times.length < 8) continue;
    const spanDays = (Math.max(...times) - Math.min(...times)) / 86400000;
    const grain = spanDays <= 45 ? 'day' : spanDays <= 1100 ? 'month' : 'year';
    const keys = ds.data[dc.id].map((v) => (v ? periodKey(v, grain) : null));
    const present = [...new Set(keys.filter(Boolean))].sort();
    if (present.length < 3) { ctx.skipped.push(`“${dc.name}” has fewer than 3 distinct ${grain}s, so no time analysis was run.`); continue; }
    const expected = [];
    for (let k = present[0], guard = 0; k <= present[present.length - 1] && guard < 5000; k = nextPeriod(k, grain), guard++) expected.push(k);
    const gaps = expected.filter((k) => !present.includes(k));
    if (gaps.length) out.push({ id: `gaps:${dc.id}`, rule: 'timeGaps', kind: 'quality', score: 45 + 40 * Math.min(1, gaps.length / expected.length * 2),
      title: `${gaps.length} of ${expected.length} ${grain}s between ${present[0]} and ${present[present.length - 1]} have no rows in “${dc.name}”`,
      description: `Missing ${grain}s: ${gaps.slice(0, 6).join(', ')}${gaps.length > 6 ? ', …' : ''}. Charts and period-over-period comparisons skip across these gaps unless the periods are filled.`, metric: dc.name, subject: 'Missing periods',
      evidence: [{ label: `Missing ${grain}s`, value: gaps.length }, { label: `Expected ${grain}s`, value: expected.length }, { label: 'First period', value: present[0] }, { label: 'Last period', value: present[present.length - 1] }],
      calculation: `Every ${grain} from the earliest to the latest date in “${dc.name}”, minus those with at least one row.`, limitations: ['A gap can be real (nothing happened) or a data collection problem. The data cannot tell which.'] });
    const series = [{ id: 'rows', name: 'Number of rows', op: 'sum', vals: new Map() }];
    for (const m of ctx.measures.slice(0, 3)) series.push({ id: m.id, name: m.name, op: ctx.ops[m.id] || 'sum', col: m.id, vals: new Map() });
    const acc = series.map(() => new Map());
    keys.forEach((k, i) => { if (!k) return; series.forEach((s, si) => { const v = s.col ? ds.data[s.col][i] : 1; if (v === null || v === undefined) return; const a = acc[si].get(k) || { sum: 0, n: 0 }; a.sum += v; a.n++; acc[si].set(k, a); }); });
    series.forEach((s, si) => { for (const [k, a] of acc[si]) s.vals.set(k, s.op === 'mean' ? a.sum / a.n : a.sum); });
    for (const s of series) {
      let up = null, down = null, pairs = 0;
      for (let i = 1; i < expected.length; i++) {
        const prev = s.vals.get(expected[i - 1]), cur = s.vals.get(expected[i]);
        if (prev === undefined || cur === undefined || prev <= 0) continue;
        pairs++;
        const ch = (cur - prev) / prev;
        if (!up || ch > up.ch) up = { ch, from: expected[i - 1], to: expected[i], prev, cur };
        if (!down || ch < down.ch) down = { ch, from: expected[i - 1], to: expected[i], prev, cur };
      }
      const word = s.op === 'mean' ? 'average ' : s.id === 'rows' ? '' : 'total ';
      const mk = (x, dir) => ({ id: `time:${dc.id}:${s.id}:${dir}`, rule: 'timeChange', kind: 'fact', score: 35 + 40 * Math.min(1, Math.abs(x.ch)),
        title: `${word}${s.name} ${dir === 'up' ? 'rose' : 'fell'} ${pct(Math.abs(x.ch), 0)} from ${x.from} to ${x.to}`,
        description: `${fmt(x.prev)} in ${x.from} → ${fmt(x.cur)} in ${x.to}. This is the largest ${grain}-over-${grain} ${dir === 'up' ? 'increase' : 'decrease'} among ${pairs} consecutive ${grain} pairs.`,
        metric: `${word}${s.name}`, subject: `${x.from} → ${x.to}`, evidence: [{ label: `Value in ${x.from}`, value: x.prev }, { label: `Value in ${x.to}`, value: x.cur }, { label: 'Change', value: x.ch }, { label: 'Consecutive pairs compared', value: pairs }],
        calculation: `${s.id === 'rows' ? 'Rows' : `${s.op === 'mean' ? 'Average' : 'Total'} of “${s.name}”`} per ${grain} of “${dc.name}”; change = (current − previous) ÷ previous for consecutive ${grain}s that both have data and a positive previous value.`,
        limitations: ['The last period may be incomplete, which would overstate a fall.', 'Percentage changes from small values are large and noisy.', 'Seasonality and one-off events are not modelled; the cause of the change is not known.'],
        chartSpec: { type: 'line', dimension: dc.id, timeGrain: grain === 'year' ? 'year' : grain, measures: s.id === 'rows' ? [{ op: 'count', column: '', as: '' }] : [{ op: s.op === 'mean' ? 'avg' : 'sum', column: s.id, as: '' }], title: `${s.name} by ${grain}` } });
      if (up && up.ch >= 0.1) out.push(mk(up, 'up'));
      if (down && down.ch <= -0.1) out.push(mk(down, 'down'));
    }
  }
  return out;
}

export const RULES = [missingData, duplicateRows, constantColumns, topBottom, groupDifference, outcomeRate, extremes, concentration, correlations, timeChanges];
