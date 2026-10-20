import { useMemo } from 'react';
import { computeKpi } from '../../core/analytics/kpis.js';
import { buildChartData } from '../../core/visualization/chartData.js';
import { filterKind, selectOptions } from '../../core/dashboard/filters.js';
import ChartRenderer from '../charts/ChartRenderer.jsx';
import { generateInsights } from '../../core/insights/insightEngine.js';
import InsightCard from '../insights/InsightCard.jsx';

function ChartBody({ ds, comp }) {
  const viz = ds.visualizations.find((v) => v.id === comp.config.vizId);
  const out = useMemo(() => {
    if (!viz) return { error: 'The saved chart for this component was deleted. Choose another in the settings.' };
    try { const spec = { ...viz, title: comp.title || viz.title, showValues: comp.config.showValues === undefined ? !!viz.showValues : !!comp.config.showValues, sort: { ...(viz.sort || {}), ...(comp.config.sortBy ? { by: comp.config.sortBy } : {}), ...(comp.config.sortDir ? { dir: comp.config.sortDir } : {}) } }; return { spec, data: buildChartData(ds, spec) }; } catch (e) { return { error: e.message }; }
  }, [ds, viz, comp.title, comp.config.showValues, comp.config.sortBy, comp.config.sortDir]);
  if (out.error) return <div role="alert" className="alert error">{out.error}</div>;
  return <ChartRenderer data={out.data} spec={out.spec} />;
}


function ChartTable({ ds, comp }) {
  const viz = ds.visualizations.find((v) => v.id === comp.config.vizId);
  const out = useMemo(() => {
    if (!viz) return { error: 'The saved chart for this table was deleted. Choose another in settings.' };
    try { return { data: buildChartData(ds, viz) }; } catch (e) { return { error: e.message }; }
  }, [ds, viz]);
  if (out.error) return <div role="alert" className="alert error">{out.error}</div>;
  const d = out.data;
  let headers = [], rows = [];
  if (d.kind === 'category' && d.points) { headers = [d.dimensionLabel || 'Category', d.measureLabel || 'Value']; rows = d.points.map((p) => [p.label, p.value]); }
  else if (d.kind === 'multi') { headers = [d.dimensionLabel || 'Category', ...d.series.map((x) => x.name)]; rows = d.categories.map((c, i) => [c, ...d.series.map((x) => x.values[i])]); }
  else if (d.kind === 'scatter') { headers = [d.xLabel || 'X', d.yLabel || 'Y']; rows = d.points.map((p) => [p.x, p.y]); }
  else if (d.kind === 'histogram') { headers = ['Range', 'Count']; rows = (d.bins || []).map((b) => [`${Number(b.x0).toLocaleString()} – ${Number(b.x1).toLocaleString()}`, b.count]); }
  else if (d.kind === 'table') { headers = d.columns.map((c) => c.name); rows = d.rows; }
  if (!rows.length) return <p className="muted">No tabular data is available for this chart.</p>;
  return <div className="table-wrap dashboard-data-table"><table><thead><tr>{headers.map((h, i) => <th key={`${h}-${i}`}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j}>{v == null ? '—' : typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 3 }) : String(v)}</td>)}</tr>)}</tbody></table>{d.truncated && <p className="muted small">Showing {d.truncated.shown} of {d.truncated.total} values.</p>}</div>;
}

function KpiBody({ ds, comp }) {
  const kpi = ds.kpis.find((k) => k.id === comp.config.kpiId);
  const r = useMemo(() => { if (!kpi) return { error: 'This KPI was deleted. Choose another in the settings.' }; try { return computeKpi(ds, kpi); } catch (e) { return { error: e.message }; } }, [ds, kpi]);
  if (r.error) return <div role="alert" className="alert error">{r.error}</div>;
  return (<div className="kpi plain"><span className="muted">{comp.title || kpi.name}</span><strong>{r.formatted}</strong>
    {r.status && <span className={r.status === 'met' ? 'oktext small' : 'errtext small'}>{r.status === 'met' ? '✓ Target met' : '✗ Target not met'}</span>}
    {r.warnings.map((w, i) => <span key={i} className="warntext small">{w}</span>)}</div>);
}

function InsightBody({ ds, comp }) {
  const found = useMemo(() => { try { return generateInsights(ds, ds.insightOptions || {}).insights.find((i) => i.id === comp.config.insightId) || null; } catch { return null; } }, [ds, comp.config.insightId]);
  if (!found) return <p className="muted">This insight does not apply to the rows currently shown, or the data has changed since it was saved. It is recalculated from the data each time, never stored as text.</p>;
  return <InsightCard insight={found} compact titleOverride={comp.title} />;
}

function FilterBody({ ds, comp, value = {}, onChange }) {
  const col = ds.columns.find((c) => c.id === comp.config.column);
  if (!col) return <div role="alert" className="alert error">The filter’s column no longer exists.</div>;
  const kind = filterKind(col);
  const label = comp.title || col.name;
  if (kind === 'select') {
    const { options, truncated, total } = selectOptions(ds, col.id);
    return (<div className="field"><label htmlFor={`f-${comp.id}`}>{label}</label>
      <select id={`f-${comp.id}`} value={value.value ?? ''} onChange={(e) => onChange({ value: e.target.value })}><option value="">All</option>{options.map((o) => <option key={o}>{o}</option>)}</select>
      {truncated && <span className="muted small">Showing 200 of {total} values.</span>}</div>);
  }
  const type = kind === 'dateRange' ? 'date' : 'number';
  return (<div className="field"><span className="label">{label}</span>
    <div className="row tight"><input aria-label={`${label} from`} type={type} step="any" value={value.value ?? ''} onChange={(e) => onChange({ ...value, value: e.target.value })} />
      <span className="muted">to</span><input aria-label={`${label} to`} type={type} step="any" value={value.value2 ?? ''} onChange={(e) => onChange({ ...value, value2: e.target.value })} /></div></div>);
}

/** Renders one dashboard component. `ds` is the dataset already narrowed by dashboard filters. */
export default function DashComponent({ ds, fullDs, comp, filterValue, onFilterChange }) {
  const eff = comp.config.ignoreFilters ? fullDs : ds;
  if (comp.type === 'chart') return <ChartBody ds={eff} comp={comp} />;
  if (comp.type === 'table') return <ChartTable ds={eff} comp={comp} />;
  if (comp.type === 'kpi') return <KpiBody ds={eff} comp={comp} />;
  if (comp.type === 'insight') return <InsightBody ds={eff} comp={comp} />;
  if (comp.type === 'filter') return <FilterBody ds={fullDs} comp={comp} value={filterValue} onChange={onFilterChange} />;
  return (<div className="textblock">{comp.title && <strong>{comp.title}</strong>}<p>{comp.config.text}</p></div>);
}
