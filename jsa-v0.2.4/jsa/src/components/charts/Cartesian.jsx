import { niceTicks, linear, formatTick } from '../../core/visualization/scales.js';
import { colorAt, fmtNum, trunc } from './palette.js';

const W = 640, H = 360;
const TXT = { fill: 'var(--text2)', fontSize: 11 };
const GRID = { stroke: 'var(--border)', strokeWidth: 1 };

function Frame({ label, children }) {
  return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="chart-svg"><title>{label}</title>{children}</svg>;
}
function AxisTitles({ spec, xDefault, yDefault, m }) {
  const x = spec?.axis?.xTitle || xDefault, y = spec?.axis?.yTitle || yDefault;
  return (<>
    {x && <text x={(m.left + W - m.right) / 2} y={H - 6} textAnchor="middle" {...TXT}>{x}</text>}
    {y && <text transform={`translate(12 ${(m.top + H - m.bottom) / 2}) rotate(-90)`} textAnchor="middle" {...TXT}>{y}</text>}
  </>);
}
const step = (n, max = 10) => Math.max(1, Math.ceil(n / max));

/** Vertical or horizontal bars for one series. Bars always start at zero. */
export function BarChart({ data, spec, horizontal }) {
  const pts = data.points;
  const vals = pts.map((p) => p.value ?? 0);
  const t = niceTicks(Math.min(0, ...vals), Math.max(0, ...vals));
  const m = horizontal ? { top: 12, right: 24, bottom: 44, left: 130 } : { top: 12, right: 16, bottom: pts.length > 6 ? 78 : 52, left: 62 };
  const color = colorAt(spec, 0);
  const label = `${horizontal ? 'Horizontal bar' : 'Bar'} chart of ${data.measureLabel} by ${data.dimensionLabel}`;
  if (horizontal) {
    const x = linear(t.min, t.max, m.left, W - m.right), band = (H - m.top - m.bottom) / pts.length;
    return (<Frame label={label}>
      {t.ticks.map((v) => <g key={v}><line x1={x(v)} x2={x(v)} y1={m.top} y2={H - m.bottom} {...GRID} /><text x={x(v)} y={H - m.bottom + 16} textAnchor="middle" {...TXT}>{formatTick(v)}</text></g>)}
      {pts.map((p, i) => { const y0 = m.top + i * band; const a = x(0), b = x(p.value ?? 0);
        return (<g key={p.label}><title>{`${p.label}: ${fmtNum(p.value)}`}</title>
          <text x={m.left - 8} y={y0 + band / 2 + 4} textAnchor="end" {...TXT}>{trunc(p.label, 20)}</text>
          {p.value !== null && <rect x={Math.min(a, b)} y={y0 + band * 0.15} width={Math.abs(b - a)} height={band * 0.7} fill={color} rx="2" />}</g>); })}
      <line x1={x(0)} x2={x(0)} y1={m.top} y2={H - m.bottom} stroke="var(--text2)" />
      <AxisTitles spec={spec} xDefault={data.measureLabel} m={m} />
    </Frame>);
  }
  const y = linear(t.min, t.max, H - m.bottom, m.top), band = (W - m.left - m.right) / pts.length;
  const skip = step(pts.length, 12), rot = pts.length > 6;
  return (<Frame label={label}>
    {t.ticks.map((v) => <g key={v}><line x1={m.left} x2={W - m.right} y1={y(v)} y2={y(v)} {...GRID} /><text x={m.left - 8} y={y(v) + 4} textAnchor="end" {...TXT}>{formatTick(v)}</text></g>)}
    {pts.map((p, i) => { const x0 = m.left + i * band; const a = y(0), b = y(p.value ?? 0);
      return (<g key={p.label}><title>{`${p.label}: ${fmtNum(p.value)}`}</title>
        {p.value !== null && <rect x={x0 + band * 0.15} y={Math.min(a, b)} width={band * 0.7} height={Math.abs(b - a)} fill={color} rx="2" />}
        {i % skip === 0 && <text {...TXT} textAnchor={rot ? 'end' : 'middle'} transform={`translate(${x0 + band / 2} ${H - m.bottom + 14}) rotate(${rot ? -35 : 0})`}>{trunc(p.label, 14)}</text>}</g>); })}
    <line x1={m.left} x2={W - m.right} y1={y(0)} y2={y(0)} stroke="var(--text2)" />
    <AxisTitles spec={spec} xDefault={data.dimensionLabel} yDefault={data.measureLabel} m={m} />
  </Frame>);
}

/** Stacked (positive and negative stack separately) or grouped bars. */
export function MultiBarChart({ data, spec, mode }) {
  const { categories: cats, series } = data;
  const m = { top: 12, right: 16, bottom: cats.length > 6 ? 78 : 52, left: 62 };
  const tot = cats.map((_, i) => series.reduce((a, s) => a + (s.values[i] > 0 ? s.values[i] : 0), 0));
  const neg = cats.map((_, i) => series.reduce((a, s) => a + (s.values[i] < 0 ? s.values[i] : 0), 0));
  const all = series.flatMap((s) => s.values.filter((v) => v !== null));
  const t = mode === 'stacked' ? niceTicks(Math.min(0, ...neg), Math.max(0, ...tot)) : niceTicks(Math.min(0, ...all), Math.max(0, ...all));
  const y = linear(t.min, t.max, H - m.bottom, m.top), band = (W - m.left - m.right) / cats.length;
  const skip = step(cats.length, 12), rot = cats.length > 6;
  return (<Frame label={`${mode === 'stacked' ? 'Stacked' : 'Grouped'} bar chart of ${data.measureLabel} by ${data.dimensionLabel}, split by series`}>
    {t.ticks.map((v) => <g key={v}><line x1={m.left} x2={W - m.right} y1={y(v)} y2={y(v)} {...GRID} /><text x={m.left - 8} y={y(v) + 4} textAnchor="end" {...TXT}>{formatTick(v)}</text></g>)}
    {cats.map((c, i) => { const x0 = m.left + i * band; let pos = 0, ng = 0;
      return (<g key={c}>
        {series.map((s, k) => { const v = s.values[i]; if (v === null) return null;
          const tip = <title>{`${c} · ${s.name}: ${fmtNum(v)}`}</title>;
          if (mode === 'grouped') { const w = (band * 0.8) / series.length; const a = y(0), b = y(v);
            return <rect key={s.name} x={x0 + band * 0.1 + k * w} y={Math.min(a, b)} width={w * 0.92} height={Math.abs(b - a)} fill={colorAt(spec, k)} rx="2">{tip}</rect>; }
          const from = v >= 0 ? pos : ng; const to = from + v; if (v >= 0) pos = to; else ng = to;
          return <rect key={s.name} x={x0 + band * 0.15} y={Math.min(y(from), y(to))} width={band * 0.7} height={Math.abs(y(to) - y(from))} fill={colorAt(spec, k)}>{tip}</rect>; })}
        {i % skip === 0 && <text {...TXT} textAnchor={rot ? 'end' : 'middle'} transform={`translate(${x0 + band / 2} ${H - m.bottom + 14}) rotate(${rot ? -35 : 0})`}>{trunc(c, 14)}</text>}</g>); })}
    <line x1={m.left} x2={W - m.right} y1={y(0)} y2={y(0)} stroke="var(--text2)" />
    <AxisTitles spec={spec} xDefault={data.dimensionLabel} yDefault={data.measureLabel} m={m} />
  </Frame>);
}

/** Line (one or many series) or area (one series). Optional non-zero baseline for lines. */
export function LineChart({ data, spec, area }) {
  const multi = data.kind === 'multi';
  const cats = multi ? data.categories : data.points.map((p) => p.label);
  const series = multi ? data.series : [{ name: data.measureLabel, values: data.points.map((p) => p.value) }];
  const m = { top: 12, right: 20, bottom: cats.length > 6 ? 78 : 52, left: 62 };
  const all = series.flatMap((s) => s.values.filter((v) => v !== null));
  const zero = spec?.axis?.zeroBaseline !== false || area;
  const t = niceTicks(zero ? Math.min(0, ...all) : Math.min(...all), zero ? Math.max(0, ...all) : Math.max(...all));
  const y = linear(t.min, t.max, H - m.bottom, m.top);
  const n = cats.length, x = (i) => (n === 1 ? (m.left + W - m.right) / 2 : m.left + (i / (n - 1)) * (W - m.left - m.right));
  const skip = step(n, 12), rot = n > 6;
  return (<Frame label={`${area ? 'Area' : 'Line'} chart of ${data.measureLabel} by ${data.dimensionLabel}${zero ? '' : ' (axis does not start at zero)'}`}>
    {t.ticks.map((v) => <g key={v}><line x1={m.left} x2={W - m.right} y1={y(v)} y2={y(v)} {...GRID} /><text x={m.left - 8} y={y(v) + 4} textAnchor="end" {...TXT}>{formatTick(v)}</text></g>)}
    {series.map((s, k) => {
      const segs = []; let cur = [];
      s.values.forEach((v, i) => { if (v === null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([x(i), y(v)]); });
      if (cur.length) segs.push(cur);
      const color = colorAt(spec, k);
      return (<g key={s.name}>
        {segs.map((sg, j) => (<g key={j}>
          {area && sg.length > 1 && <path d={`M${sg[0][0]},${y(0)} ${sg.map((p) => `L${p[0]},${p[1]}`).join(' ')} L${sg[sg.length - 1][0]},${y(0)} Z`} fill={color} opacity="0.22" />}
          {sg.length > 1 && <path d={sg.map((p, q) => `${q ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')} fill="none" stroke={color} strokeWidth="2" />}</g>))}
        {s.values.map((v, i) => v !== null && <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill={color}><title>{`${cats[i]}${multi ? ` · ${s.name}` : ''}: ${fmtNum(v)}`}</title></circle>)}
      </g>); })}
    {cats.map((c, i) => i % skip === 0 && <text key={c} {...TXT} textAnchor={rot ? 'end' : 'middle'} transform={`translate(${x(i)} ${H - m.bottom + 14}) rotate(${rot ? -35 : 0})`}>{trunc(c, 14)}</text>)}
    <line x1={m.left} x2={W - m.right} y1={H - m.bottom} y2={H - m.bottom} stroke="var(--text2)" />
    <AxisTitles spec={spec} xDefault={data.dimensionLabel} yDefault={data.measureLabel} m={m} />
  </Frame>);
}

export function ScatterChart({ data, spec }) {
  const m = { top: 12, right: 20, bottom: 50, left: 62 };
  const xs = data.points.map((p) => p.x), ys = data.points.map((p) => p.y);
  const tx = niceTicks(Math.min(...xs), Math.max(...xs)), ty = niceTicks(Math.min(...ys), Math.max(...ys));
  const x = linear(tx.min, tx.max, m.left, W - m.right), y = linear(ty.min, ty.max, H - m.bottom, m.top);
  return (<Frame label={`Scatter plot of ${data.yLabel} against ${data.xLabel}`}>
    {ty.ticks.map((v) => <g key={`y${v}`}><line x1={m.left} x2={W - m.right} y1={y(v)} y2={y(v)} {...GRID} /><text x={m.left - 8} y={y(v) + 4} textAnchor="end" {...TXT}>{formatTick(v)}</text></g>)}
    {tx.ticks.map((v) => <text key={`x${v}`} x={x(v)} y={H - m.bottom + 16} textAnchor="middle" {...TXT}>{formatTick(v)}</text>)}
    {data.points.map((p, i) => <circle key={i} cx={x(p.x)} cy={y(p.y)} r="3.5" fill={colorAt(spec, 0)} opacity="0.65"><title>{`${data.xLabel}: ${fmtNum(p.x)}, ${data.yLabel}: ${fmtNum(p.y)}`}</title></circle>)}
    <AxisTitles spec={spec} xDefault={data.xLabel} yDefault={data.yLabel} m={m} />
  </Frame>);
}

export function Histogram({ data, spec }) {
  const m = { top: 12, right: 16, bottom: 50, left: 62 };
  const bins = data.bins;
  const lo = bins[0].x0, hi = bins[bins.length - 1].x1;
  const tx = niceTicks(lo, hi), ty = niceTicks(0, Math.max(...bins.map((b) => b.count)));
  const single = lo === hi;
  const x = linear(single ? lo - 1 : tx.min, single ? hi + 1 : tx.max, m.left, W - m.right), y = linear(ty.min, ty.max, H - m.bottom, m.top);
  return (<Frame label={`Histogram of ${data.label}`}>
    {ty.ticks.map((v) => <g key={v}><line x1={m.left} x2={W - m.right} y1={y(v)} y2={y(v)} {...GRID} /><text x={m.left - 8} y={y(v) + 4} textAnchor="end" {...TXT}>{formatTick(v)}</text></g>)}
    {bins.map((b, i) => { const a = single ? x(lo - 0.4) : x(b.x0), c = single ? x(lo + 0.4) : x(b.x1);
      return <rect key={i} x={a + 1} y={y(b.count)} width={Math.max(1, c - a - 2)} height={y(0) - y(b.count)} fill={colorAt(spec, 0)}><title>{`${fmtNum(b.x0)} to ${fmtNum(b.x1)}: ${b.count} rows`}</title></rect>; })}
    {(single ? [lo] : tx.ticks).map((v) => <text key={v} x={x(v)} y={H - m.bottom + 16} textAnchor="middle" {...TXT}>{formatTick(v)}</text>)}
    <line x1={m.left} x2={W - m.right} y1={y(0)} y2={y(0)} stroke="var(--text2)" />
    <AxisTitles spec={spec} xDefault={data.label} yDefault="Rows" m={m} />
  </Frame>);
}
