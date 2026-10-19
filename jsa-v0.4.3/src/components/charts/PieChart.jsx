import { colorAt, fmtNum } from './palette.js';

const polar = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

export default function PieChart({ data, spec, donut }) {
  const { points, total } = data;
  const cx = 150, cy = 150, R = 130, r0 = donut ? 74 : 0;
  let a = -Math.PI / 2;
  const slices = points.map((p, i) => {
    const frac = p.value / total, a1 = a + frac * 2 * Math.PI;
    const big = a1 - a > Math.PI ? 1 : 0;
    let d;
    if (points.length === 1) d = donut ? `M${cx - R},${cy} a${R},${R} 0 1,0 ${2 * R},0 a${R},${R} 0 1,0 ${-2 * R},0 M${cx - r0},${cy} a${r0},${r0} 0 1,1 ${2 * r0},0 a${r0},${r0} 0 1,1 ${-2 * r0},0` : `M${cx - R},${cy} a${R},${R} 0 1,0 ${2 * R},0 a${R},${R} 0 1,0 ${-2 * R},0`;
    else { const [x0, y0] = polar(cx, cy, R, a), [x1, y1] = polar(cx, cy, R, a1), [x2, y2] = polar(cx, cy, r0, a1), [x3, y3] = polar(cx, cy, r0, a);
      d = r0 ? `M${x0},${y0} A${R},${R} 0 ${big} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${big} 0 ${x3},${y3} Z` : `M${cx},${cy} L${x0},${y0} A${R},${R} 0 ${big} 1 ${x1},${y1} Z`; }
    a = a1;
    return { ...p, frac, d, color: colorAt(spec, i) };
  });
  const label = `${donut ? 'Donut' : 'Pie'} chart of ${data.measureLabel} by ${data.dimensionLabel}`;
  return (
    <div className="pie">
      <svg viewBox="0 0 300 300" role="img" aria-label={label} className="chart-svg pie-svg"><title>{label}</title>
        {slices.map((s) => <path key={s.label} d={s.d} fill={s.color} fillRule="evenodd" stroke="var(--bg)" strokeWidth="1.5"><title>{`${s.label}: ${fmtNum(s.value)} (${(s.frac * 100).toFixed(1)}%)`}</title></path>)}
        {donut && <text x={cx} y={cy + 5} textAnchor="middle" fill="var(--text)" fontSize="16" fontFamily="ui-monospace,monospace">{fmtNum(total)}</text>}
      </svg>
      <ul className="legend vertical">{slices.map((s) => <li key={s.label}><span className="swatch" style={{ background: s.color }} aria-hidden /> {s.label} <span className="muted">{fmtNum(s.value)} · {(s.frac * 100).toFixed(1)}%</span></li>)}</ul>
    </div>
  );
}
