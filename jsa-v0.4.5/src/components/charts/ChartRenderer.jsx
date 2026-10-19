import { BarChart, MultiBarChart, LineChart, ScatterChart, Histogram } from './Cartesian.jsx';
import PieChart from './PieChart.jsx';
import { colorAt, fmtNum } from './palette.js';

function Legend({ items, spec }) {
  return <ul className="legend">{items.map((n, i) => <li key={n}><span className="swatch" style={{ background: colorAt(spec, i) }} aria-hidden /> {n}</li>)}</ul>;
}

function KpiCard({ data }) {
  return (<div className="kpi big"><span className="muted">{data.name}</span><strong>{data.formatted}</strong>
    {data.status && <span className={data.status === 'met' ? 'oktext small' : 'errtext small'}>{data.status === 'met' ? '✓ Target met' : '✗ Target not met'}</span>}
    {data.description && <span className="muted small">{data.description}</span>}</div>);
}

function TableChart({ data }) {
  return (<div className="scroll"><table><thead><tr>{data.columns.map((c) => <th key={c.id}>{c.name}</th>)}</tr></thead>
    <tbody>{data.rows.map((r, i) => <tr key={i}>{r.map((v, k) => <td key={k} className={data.columns[k].numeric ? 'num' : ''}>{v === null ? <span className="muted">null</span> : typeof v === 'number' ? fmtNum(v) : String(v)}</td>)}</tr>)}</tbody></table></div>);
}

function DataTable({ data }) {
  if (data.kind === 'category') return <table><thead><tr><th>{data.dimensionLabel}</th><th>{data.measureLabel}</th></tr></thead><tbody>{data.points.map((p) => <tr key={p.label}><td>{p.label}</td><td className="num">{fmtNum(p.value)}</td></tr>)}</tbody></table>;
  if (data.kind === 'multi') return <table><thead><tr><th>{data.dimensionLabel}</th>{data.series.map((s) => <th key={s.name}>{s.name}</th>)}</tr></thead><tbody>{data.categories.map((c, i) => <tr key={c}><td>{c}</td>{data.series.map((s) => <td key={s.name} className="num">{fmtNum(s.values[i])}</td>)}</tr>)}</tbody></table>;
  if (data.kind === 'histogram') return <table><thead><tr><th>From</th><th>To</th><th>Rows</th></tr></thead><tbody>{data.bins.map((b, i) => <tr key={i}><td className="num">{fmtNum(b.x0)}</td><td className="num">{fmtNum(b.x1)}</td><td className="num">{b.count}</td></tr>)}</tbody></table>;
  return null;
}

/** Renders any chart-data object produced by buildChartData. Never draws placeholder values. */
export default function ChartRenderer({ data, spec }) {
  if (data.kind === 'kpi') return <><KpiCard data={data} />{data.warnings.map((w, i) => <p key={i} className="warntext small">{w}</p>)}</>;
  const notes = data.warnings.map((w, i) => <p key={i} className="warntext small" role="status">{w}</p>);
  if (data.empty) return <div className="empty-chart"><strong>Nothing to show</strong><p className="muted">No rows matched this chart’s fields and filters. Loosen a filter or choose different fields.</p>{notes}</div>;
  const type = spec.type;
  let body;
  if (data.kind === 'table') body = <TableChart data={data} />;
  else if (data.kind === 'scatter') body = <ScatterChart data={data} spec={spec} />;
  else if (data.kind === 'histogram') body = <Histogram data={data} spec={spec} />;
  else if (type === 'pie' || type === 'donut') body = <PieChart data={data} spec={spec} donut={type === 'donut'} />;
  else if (type === 'stacked' || type === 'grouped') body = <MultiBarChart data={data} spec={spec} mode={type} />;
  else if (type === 'line' || type === 'area') body = <LineChart data={data} spec={spec} area={type === 'area'} />;
  else body = <BarChart data={data} spec={spec} horizontal={type === 'hbar'} />;
  const legendItems = data.kind === 'multi' && spec.legend !== false ? data.series.map((s) => s.name) : null;
  const showData = ['category', 'multi', 'histogram'].includes(data.kind);
  return (<figure className="chart">
    {spec.title && <figcaption><strong>{spec.title}</strong>{spec.description && <div className="muted small">{spec.description}</div>}</figcaption>}
    {body}
    {legendItems && <Legend items={legendItems} spec={spec} />}
    {data.rowsTotal !== undefined && data.rowsUsed !== undefined && data.rowsUsed !== data.rowsTotal && <p className="muted small">Based on {data.rowsUsed.toLocaleString()} of {data.rowsTotal.toLocaleString()} rows (filters applied).</p>}
    {notes}
    {showData && <details><summary>Show data as table</summary><div className="scroll"><DataTable data={data} /></div></details>}
  </figure>);
}
