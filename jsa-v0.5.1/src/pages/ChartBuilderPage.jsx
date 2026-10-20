import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BarChart3, Database, SlidersHorizontal, Sparkles, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';
import { CHART_TYPES, typeInfo } from '../core/visualization/chartRegistry.js';
import { makeSpec, normalizeSpec, defaultSpecFor, suggestChartType, isDateType, validateSpec } from '../core/visualization/chartSpec.js';
import { buildChartData } from '../core/visualization/chartData.js';
import { suggestCharts } from '../core/analytics/suggestions.js';
import { AGG_OPS } from '../core/analytics/aggregation.js';
import { isNumericType } from '../core/data/dataTypes.js';
import { chartDataToCsv, safeExportName } from '../core/export/datasetExport.js';
import FilterEditor from '../components/data/FilterEditor.jsx';
import ChartRenderer from '../components/charts/ChartRenderer.jsx';
import DatasetPicker, { useActiveDataset, NoDataset } from '../components/data/DatasetPicker.jsx';

export default function ChartBuilderPage() {
  const ds = useActiveDataset();
  const [searchParams] = useSearchParams();
  const chartId = searchParams.get('chart');
  if (!ds) return <NoDataset title="Chart Builder" />;
  return <BuilderWorkspace key={`${ds.id}-${chartId || 'new'}`} ds={ds} chartId={chartId} />;
}

function BuilderWorkspace({ ds, chartId }) {
  const { saveViz } = useDatasets();
  const navigate = useNavigate();
  const saved = chartId ? ds.visualizations.find((v) => v.id === chartId) : null;
  const [spec, setSpec] = useState(() => saved ? normalizeSpec(ds, saved) : defaultSpecFor(ds));
  const [showAllChartSuggestions, setShowAllChartSuggestions] = useState(false);
  const info = typeInfo(spec.type);
  const analysis = spec.source?.kind === 'analysis' ? ds.analyses.find((a) => a.id === spec.source.analysisId) : null;
  const update = (p) => setSpec((s) => normalizeSpec(ds, { ...s, ...p }));
  const dimCols = analysis ? analysis.groupBy.map((id) => ds.columns.find((c) => c.id === id)).filter(Boolean) : ds.columns;
  const numCols = ds.columns.filter((c) => isNumericType(c.type));
  const dimCol = ds.columns.find((c) => c.id === spec.dimension);
  const hint = suggestChartType(ds, spec);
  const validationErrors = validateSpec(ds, spec);
  const chartSuggestions = useMemo(() => suggestCharts(ds), [ds]);
  const preview = useMemo(() => {
    try { return { data: buildChartData(ds, spec) }; } catch (e) { return { error: e.message }; }
  }, [ds, spec]);
  const setSource = (v) => {
    if (v === 'data') return update({ source: { kind: 'data' }, measures: makeSpec().measures });
    update({ source: { kind: 'analysis', analysisId: v }, dimension: '', series: '', measures: [{ op: 'sum', column: '', as: '' }] });
  };
  const save = () => {
    if (validationErrors.length) return;
    const next = { ...spec, title: spec.title.trim() || `${ds.name} chart`, id: spec.id || `viz${Date.now().toString(36)}` };
    saveViz(ds.id, next);
    navigate(`/charts/${ds.id}`, { state: { chartSaved: next.title } });
  };
  const m = spec.measures[0];
  const exportChartData = () => {
    if (preview.error || !preview.data) return;
    const url = URL.createObjectURL(new Blob([chartDataToCsv(preview.data)], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url;
    anchor.download = `${safeExportName(spec.title || ds.name)}-chart-data.csv`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="page wide charts-page chart-builder-page">
    <div className="dataset-page-heading charts-page-heading">
      <div className="dataset-heading-copy">
        <div className="dataset-eyebrow"><Database size={14} /> DATA WORKSPACE <span> / </span> <Link to={`/charts/${ds.id}`}>CHARTS</Link> <span> / </span> CHART BUILDER</div>
        <h1>{saved ? `Edit ${saved.title || 'chart'}` : 'Build a chart'}</h1>
        <p>Configure your visualization, inspect the live preview, and save it to your chart library.</p>
      </div>
      <div className="dataset-heading-actions charts-heading-actions">
        <DatasetPicker ds={ds} base="chart-builder" />
        <Link className="btn" to={`/charts/${ds.id}`}><ArrowLeft size={15} /> Back to charts</Link>
      </div>
    </div>
      <div className="charts-summary-grid" aria-label="Chart workspace summary">
        <div className="charts-summary-card"><span className="charts-summary-icon violet"><BarChart3 size={18} /></span><div><span>Chart type</span><strong>{info.label}</strong><small>Current visualization</small></div></div>
        <div className="charts-summary-card"><span className="charts-summary-icon blue"><Database size={18} /></span><div><span>Data source</span><strong>{analysis ? 'Saved analysis' : 'Cleaned data'}</strong><small>{analysis ? analysis.name : `${ds.rowCount.toLocaleString()} rows available`}</small></div></div>
        <div className="charts-summary-card"><span className="charts-summary-icon green"><Save size={18} /></span><div><span>Saved charts</span><strong>{ds.visualizations.length.toLocaleString()}</strong><small>Available in this browser</small></div></div>
      </div>

      {chartSuggestions.length > 0 && <section className="card smart-suggestions chart-smart-suggestions" aria-labelledby="smart-chart-heading">
        <div className="analysis-section-heading"><div><span className="eyebrow">SMART SUGGESTIONS</span><h2 id="smart-chart-heading">Charts for this dataset</h2><p className="muted small">JSA uses your column types to suggest useful starting points. Choose one to load it into the builder; review the preview before saving.</p></div><span className="analysis-section-tag">{chartSuggestions.length} ideas</span></div>
        <div className="smart-suggestion-grid">{(showAllChartSuggestions ? chartSuggestions : chartSuggestions.slice(0, 2)).map((suggestion) => <article className="smart-suggestion-card" key={suggestion.title}>
          <span className="smart-suggestion-icon"><Sparkles size={17} /></span><h3>{suggestion.title}</h3><p>{suggestion.reason}</p><span className="smart-suggestion-type">{typeInfo(suggestion.spec.type)?.label || suggestion.spec.type}</span>
          <button type="button" className="btn small-btn" onClick={() => { setSpec(normalizeSpec(ds, { ...suggestion.spec, id: undefined })); document.getElementById('chart-builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><SlidersHorizontal size={14} /> Use suggestion</button>
        </article>)}</div>
        {chartSuggestions.length > 2 && <div className="smart-suggestions-more"><button type="button" className="btn" aria-expanded={showAllChartSuggestions} onClick={() => setShowAllChartSuggestions((v) => !v)}>{showAllChartSuggestions ? 'Show less' : `Show all ${chartSuggestions.length} suggestions`} {showAllChartSuggestions ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button></div>}
      </section>}
      <div className="two-col charts-grid">
        <section className="chart-builder-panel" id="chart-builder">
          <div className="charts-panel-heading"><div><span className="charts-section-kicker">CONFIGURE</span><h2><SlidersHorizontal size={18} /> Chart builder</h2><p>Choose a chart type and the fields you want to explore.</p></div><span className="charts-type-pill">{info.label}</span></div>
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
          {validationErrors.length > 0 && <div className="alert warn chart-validation" role="status"><strong>Finish configuring this chart before saving:</strong><ul>{validationErrors.map((message) => <li key={message}>{message}</li>)}</ul></div>}
          <div className="row tight" id="chart-export-actions"><button className="btn primary" onClick={save} disabled={validationErrors.length > 0}>{spec.id ? 'Update chart' : 'Save chart'}</button>
            <button className="btn" onClick={exportChartData} disabled={!!preview.error || !preview.data}>Export plotted data (CSV)</button>
            {spec.id && <button className="btn" onClick={() => setSpec({ ...spec, id: undefined })}>Save as new</button>}</div>
        </section>

        <section className="preview chart-preview-panel">
          <div className="charts-panel-heading"><div><span className="charts-section-kicker">LIVE PREVIEW</span><h2><Sparkles size={18} /> {spec.title.trim() || 'Your chart'}</h2><p>Updates as you adjust the chart settings.</p></div><span className="charts-live-pill"><span /> Live</span></div>
          {preview.error ? <div role="alert" className="alert error">{preview.error}</div> : <ChartRenderer data={preview.data} spec={spec} />}
        </section>
      </div>


    <div className="chart-builder-footer"><span><span className="charts-live-dot" /> Preview updates as you configure the chart.</span><Link className="btn" to={`/charts/${ds.id}`}>Cancel <ArrowRight size={14} /></Link></div>
  </div>;
}
