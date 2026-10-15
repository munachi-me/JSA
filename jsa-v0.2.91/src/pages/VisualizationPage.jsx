import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';
import { CHART_TYPES, typeInfo } from '../core/visualization/chartRegistry.js';
import { makeSpec, normalizeSpec, defaultSpecFor, suggestChartType, isDateType } from '../core/visualization/chartSpec.js';
import { buildChartData } from '../core/visualization/chartData.js';
import { AGG_OPS } from '../core/analytics/aggregation.js';
import { isNumericType } from '../core/data/dataTypes.js';
import FilterEditor from '../components/data/FilterEditor.jsx';
import ChartRenderer from '../components/charts/ChartRenderer.jsx';
import DatasetPicker, { useActiveDataset, NoDataset } from '../components/data/DatasetPicker.jsx';

export default function VisualizationPage() {
  const ds = useActiveDataset();
  if (!ds) return <NoDataset title="Charts" />;
  return <Workspace key={ds.id} ds={ds} />;
}

function Workspace({ ds }) {
  const { saveViz, deleteViz } = useDatasets();
  const [spec, setSpec] = useState(() => defaultSpecFor(ds));
  const info = typeInfo(spec.type);
  const analysis = spec.source?.kind === 'analysis' ? ds.analyses.find((a) => a.id === spec.source.analysisId) : null;
  const update = (p) => setSpec((s) => normalizeSpec(ds, { ...s, ...p }));
  const nameOf = (id) => ds.columns.find((c) => c.id === id)?.name ?? id;
  const dimCols = analysis ? analysis.groupBy.map((id) => ds.columns.find((c) => c.id === id)).filter(Boolean) : ds.columns;
  const numCols = ds.columns.filter((c) => isNumericType(c.type));
  const dimCol = ds.columns.find((c) => c.id === spec.dimension);
  const hint = suggestChartType(ds, spec);

  const preview = useMemo(() => {
    try { return { data: buildChartData(ds, spec) }; } catch (e) { return { error: e.message }; }
  }, [ds, spec]);

  const setSource = (v) => {
    if (v === 'data') return update({ source: { kind: 'data' }, measures: makeSpec().measures });
    update({ source: { kind: 'analysis', analysisId: v }, dimension: '', series: '', measures: [{ op: 'sum', column: '', as: '' }] });
  };
  const save = () => {
    const next = { ...spec, title: spec.title.trim() || `${ds.name} chart`, id: spec.id || `viz${Date.now().toString(36)}` };
    setSpec(next); // keep the id so saving again updates this chart instead of duplicating it
    saveViz(ds.id, next);
  };
  const m = spec.measures[0];

  return (
    <div className="page wide">
      <h1>Charts: {ds.name}</h1>
      <p className="muted">Charts are built from the cleaned data or from a saved analysis, and always show real values. Add saved charts to a dashboard from the Dashboards page.</p>
      <DatasetPicker ds={ds} base="charts" />
      <div className="two-col charts-grid">
        <section>
          <div className="field"><label htmlFor="vt">Title</label><input id="vt" value={spec.title} onChange={(e) => setSpec({ ...spec, title: e.target.value })} /></div>
          <div className="field"><label htmlFor="vd">Description (optional)</label><input id="vd" value={spec.description} onChange={(e) => setSpec({ ...spec, description: e.target.value })} /></div>
          <div className="row tight">
            <label className="inline">Chart <select value={spec.type} onChange={(e) => update({ type: e.target.value })}>{CHART_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
            {info.family === 'category' && <label className="inline">Data <select value={analysis ? analysis.id : 'data'} onChange={(e) => setSource(e.target.value)}><option value="data">Cleaned data</option>{ds.analyses.map((a) => <option key={a.id} value={a.id}>Analysis: {a.name}</option>)}</select></label>}
          </div>
          {hint && <p className="alert warn">Dates usually read best as a line over time. <button className="linkbtn" onClick={() => update({ type: hint })}>Switch to a {typeInfo(hint).label.toLowerCase()}</button></p>}

          {info.family === 'category' && (<>
            <div className="row tight">
              <label className="inline">{spec.type === 'pie' || spec.type === 'donut' ? 'Slices' : 'Categories'} <select value={spec.dimension} onChange={(e) => update({ dimension: e.target.value })}>{dimCols.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              {isDateType(dimCol) && !analysis && <label className="inline">Group dates by <select value={spec.timeGrain} onChange={(e) => update({ timeGrain: e.target.value })}>{['day', 'month', 'quarter', 'year'].map((g) => <option key={g}>{g}</option>)}</select></label>}
            </div>
            {info.series && <label className="inline">Split by {info.needsSeries ? '' : '(optional)'} <select value={spec.series} onChange={(e) => update({ series: e.target.value })}>{!info.needsSeries && <option value="">None</option>}{dimCols.filter((c) => c.id !== spec.dimension).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
            <div className="row tight">
              {analysis ? <label className="inline">Measure <select value={m.as} onChange={(e) => update({ measures: [{ op: 'sum', column: '', as: e.target.value }] })}>{analysis.measures.map((x) => <option key={x.as}>{x.as}</option>)}</select></label>
                : (<><label className="inline">Measure <select value={m.op} onChange={(e) => update({ measures: [{ ...m, op: e.target.value }] })}>{AGG_OPS.map((o) => <option key={o}>{o}</option>)}</select></label>
                  {m.op !== 'count' && <select aria-label="Measure column" value={m.column} onChange={(e) => update({ measures: [{ ...m, column: e.target.value }] })}>{(['distinct', 'countNonMissing'].includes(m.op) ? ds.columns : numCols).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}</>)}
            </div>
          </>)}
          {info.family === 'scatter' && <div className="row tight">
            <label className="inline">X <select value={spec.x} onChange={(e) => update({ x: e.target.value })}>{numCols.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="inline">Y <select value={spec.y} onChange={(e) => update({ y: e.target.value })}>{numCols.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>}
          {info.family === 'histogram' && <div className="row tight">
            <label className="inline">Column <select value={spec.column} onChange={(e) => update({ column: e.target.value })}>{numCols.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="inline">Bins <input className="narrow" type="number" min="1" max="100" value={spec.bins} placeholder="auto" onChange={(e) => update({ bins: e.target.value })} /></label></div>}
          {info.family === 'table' && <div className="field"><span className="label">Columns (none selected = first 8)</span><div className="checks">{ds.columns.map((c) => <label key={c.id} className="check"><input type="checkbox" checked={spec.columns.includes(c.id)} onChange={(e) => update({ columns: e.target.checked ? [...spec.columns, c.id] : spec.columns.filter((x) => x !== c.id) })} /> {c.name}</label>)}</div></div>}
          {info.family === 'kpi' && (ds.kpis.length ? <label className="inline">KPI <select value={spec.kpiId} onChange={(e) => update({ kpiId: e.target.value })}>{ds.kpis.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select></label> : <p className="muted">No KPIs defined yet. Create one on the Analysis page.</p>)}

          {!analysis && info.family !== 'kpi' && <details><summary>Filters {spec.filters.length ? `(${spec.filters.length})` : ''}</summary>
            <label className="inline">Match <select value={spec.filterMode} onChange={(e) => update({ filterMode: e.target.value })}><option value="all">all conditions</option><option value="any">any condition</option></select></label>
            <FilterEditor columns={ds.columns} value={spec.filters} onChange={(filters) => update({ filters })} /></details>}

          {['category', 'table'].includes(info.family) && <div className="row tight">
            <label className="inline">Sort <select value={spec.sort.by} onChange={(e) => update({ sort: { ...spec.sort, by: e.target.value } })}><option value="auto">Automatic</option>{info.family === 'category' ? <><option value="value">By value</option><option value="label">By label</option></> : ds.columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <select aria-label="Sort direction" value={spec.sort.dir} onChange={(e) => update({ sort: { ...spec.sort, dir: e.target.value } })}><option value="desc">descending</option><option value="asc">ascending</option></select>
            {info.family === 'category' && <label className="inline">Top <input className="narrow" type="number" min="1" value={spec.limit} placeholder="all" onChange={(e) => update({ limit: e.target.value })} /></label>}
          </div>}

          {!['table', 'kpi'].includes(info.family) && <details><summary>Appearance</summary>
            <div className="row tight">
              <label className="inline">Color <input type="color" value={spec.colors[0] || '#6366F1'} onChange={(e) => update({ colors: [e.target.value] })} /></label>
              {(spec.type === 'line' || spec.type === 'scatter') && <label className="check"><input type="checkbox" checked={spec.axis.zeroBaseline} onChange={(e) => update({ axis: { ...spec.axis, zeroBaseline: e.target.checked } })} /> Start value axis at zero</label>}
              <label className="check"><input type="checkbox" checked={spec.legend} onChange={(e) => update({ legend: e.target.checked })} /> Show legend</label>
              <label className="check"><input type="checkbox" checked={!!spec.showValues} onChange={(e) => update({ showValues: e.target.checked })} /> Show data values on chart</label>
            </div>
            <div className="row tight"><input aria-label="Horizontal axis title" placeholder="Horizontal axis title" value={spec.axis.xTitle} onChange={(e) => update({ axis: { ...spec.axis, xTitle: e.target.value } })} />
              <input aria-label="Vertical axis title" placeholder="Vertical axis title" value={spec.axis.yTitle} onChange={(e) => update({ axis: { ...spec.axis, yTitle: e.target.value } })} /></div>
            <p className="muted small">Bars always start at zero so lengths stay honest. A line or scatter axis that does not start at zero is labeled as such for screen readers.</p>
          </details>}
          <div className="row tight"><button className="btn primary" onClick={save}>{spec.id ? 'Update saved chart' : 'Save chart'}</button>
            {spec.id && <button className="btn" onClick={() => setSpec({ ...spec, id: undefined })}>Save as new</button>}</div>
        </section>

        <section className="preview">
          {preview.error ? <div role="alert" className="alert error">{preview.error}</div> : <ChartRenderer data={preview.data} spec={spec} />}
        </section>
      </div>

      <h2>Saved charts</h2>
      {ds.visualizations.length === 0 ? <p className="muted">Nothing saved yet. Configure a chart and save it.</p> : (
        <ul className="list plain">{ds.visualizations.map((v) => (
          <li key={v.id} className="row tight"><button className="linkbtn" onClick={() => setSpec(normalizeSpec(ds, v))}>{v.title || 'Untitled chart'}</button>
            <span className="muted small">{typeInfo(v.type)?.label}{v.dimension ? ` · ${nameOf(v.dimension)}` : ''}</span>
            <button className="iconbtn push" aria-label={`Delete chart ${v.title}`} onClick={() => deleteViz(ds.id, v.id)}><Trash2 size={14} aria-hidden /></button></li>))}</ul>)}
      <p className="muted small">Saved charts are stored in this browser only.</p>
    </div>
  );
}
