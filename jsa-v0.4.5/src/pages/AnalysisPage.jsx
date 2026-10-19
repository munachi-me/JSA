import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, X, Database, ArrowRight, SlidersHorizontal, BarChart3, Pencil } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';
import { AGG_OPS } from '../core/analytics/aggregation.js';
import { runAnalysis } from '../core/analytics/analyses.js';
import { computeKpi } from '../core/analytics/kpis.js';
import { describe, describeCategorical } from '../core/analytics/descriptive.js';
import { pearson } from '../core/analytics/correlation.js';
import { isNumericType, parseNumber } from '../core/data/dataTypes.js';
import FilterEditor from '../components/data/FilterEditor.jsx';
import PartEditor from '../components/data/PartEditor.jsx';
import DatasetPicker, { useActiveDataset, NoDataset } from '../components/data/DatasetPicker.jsx';
import { analysisReportMarkdown, buildAnalysisReport, toCsv } from '../core/export/reporting.js';

const blankDef = () => ({ name: '', filters: [], filterMode: 'all', groupBy: [], measures: [{ op: 'count', column: '', as: 'count' }], sortBy: '', sortDir: 'desc', limit: '' });
const blankKpi = () => ({ name: '', description: '', format: 'number', precision: 2, numerator: { op: 'count', filters: [] }, denominator: null, targetValue: '', targetDir: 'higher' });
const fmt = (v, precision = 3) => (v === null || v === undefined ? '—' : typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: precision }) : String(v));

export default function AnalysisPage() {
  const ds = useActiveDataset();
  if (!ds) return <NoDataset title="Analysis" />;
  return <Inner key={ds.id} ds={ds} />;
}

function Inner({ ds }) {
  const { saveAnalysis, deleteAnalysis, saveKpi, updateKpi, deleteKpi } = useDatasets();
  const [def, setDef] = useState(blankDef);
  const [out, setOut] = useState(null);
  const [resultPrecision, setResultPrecision] = useState('3');
  const [kpi, setKpi] = useState(blankKpi);
  const [kpiError, setKpiError] = useState(null);
  const [editingKpiId, setEditingKpiId] = useState(null);
  const numericColumns = ds.columns.filter((c) => isNumericType(c.type));
  const [profileColumn, setProfileColumn] = useState(ds.columns[0]?.id || '');
  const [corrX, setCorrX] = useState(numericColumns[0]?.id || '');
  const [corrY, setCorrY] = useState(numericColumns[1]?.id || numericColumns[0]?.id || '');
  const colName = (id) => ds.columns.find((c) => c.id === id)?.name ?? id;
  const set = (p) => setDef((d) => ({ ...d, ...p }));
  const label = (m) => m.as || (m.op === 'count' ? 'count' : `${m.op} of ${colName(m.column)}`);
  const buildHistogram = (values, binCount = 8) => {
    const numbers = values.map(parseNumber).filter(Number.isFinite);
    if (!numbers.length) return { bins: [], count: 0, min: null, max: null };
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    if (min === max) return { bins: [{ start: min, end: max, count: numbers.length }], count: numbers.length, min, max };
    const width = (max - min) / binCount;
    const bins = Array.from({ length: binCount }, (_, i) => ({ start: min + width * i, end: i === binCount - 1 ? max : min + width * (i + 1), count: 0 }));
    numbers.forEach((value) => {
      const index = Math.min(binCount - 1, Math.floor((value - min) / width));
      bins[index].count += 1;
    });
    return { bins, count: numbers.length, min, max };
  };

  const normalized = (d) => ({ ...d, measures: d.measures.map((m, i) => ({ ...m, as: label(m) + (d.measures.slice(0, i).some((x) => label(x) === label(m)) ? ` (${i + 1})` : '') })), limit: d.limit ? Number(d.limit) : undefined, sortBy: d.sortBy || undefined });

  const run = (d = def) => {
    try {
      const n = normalized(d);
      if (n.measures.some((m) => m.op !== 'count' && !m.column)) throw new Error('Choose a column for every measure.');
      if (n.limit !== undefined && !(n.limit > 0)) throw new Error('Limit must be a positive number.');
      setOut({ ok: true, result: runAnalysis(ds, n), def: n });
    } catch (e) { setOut({ ok: false, error: e.message }); }
  };
  const load = (a) => { const d = { ...a, limit: a.limit ?? '', sortBy: a.sortBy ?? '' }; setDef(d); run(d); };
  const save = () => {
    if (!def.name.trim()) return setOut({ ok: false, error: 'Name the analysis before saving it.' });
    run(); const n = normalized(def); saveAnalysis(ds.id, { ...n, name: def.name.trim() });
  };

  const submitKpi = () => {
    try {
      if (!kpi.name.trim()) throw new Error('Name the KPI.');
      const def2 = { name: kpi.name.trim(), description: kpi.description, format: kpi.format, precision: Number(kpi.precision ?? 2), numerator: kpi.numerator, denominator: kpi.denominator || undefined,
        target: kpi.targetValue !== '' ? { value: Number(kpi.targetValue), direction: kpi.targetDir } : undefined };
      if (def2.target && !Number.isFinite(def2.target.value)) throw new Error('Target must be a number.');
      computeKpi(ds, def2); // validate by computing once before saving
      if (editingKpiId) updateKpi(ds.id, editingKpiId, { ...def2, id: editingKpiId });
      else saveKpi(ds.id, def2);
      setKpi(blankKpi()); setEditingKpiId(null); setKpiError(null);
    } catch (e) { setKpiError(e.message || 'This KPI definition is invalid. Check its aggregation and filters.'); }
  };

  const editKpi = (saved) => {
    setEditingKpiId(saved.id);
    setKpi({ name: saved.name || '', description: saved.description || '', format: saved.format || 'number', precision: saved.precision ?? 2,
      numerator: { op: 'count', filters: [], ...(saved.numerator || {}) },
      denominator: saved.denominator ? { op: 'count', filters: [], ...saved.denominator } : null,
      targetValue: saved.target?.value ?? '', targetDir: saved.target?.direction || 'higher' });
    setKpiError(null);
    document.getElementById('analysis-kpi-editor')?.setAttribute('open', '');
    window.setTimeout(() => document.getElementById('analysis-kpi-editor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0);
  };
  const cancelKpiEdit = () => { setEditingKpiId(null); setKpi(blankKpi()); setKpiError(null); };

  const resultCols = out?.ok ? out.result.columns : [...def.groupBy, ...def.measures.map(label)];
  const headers = (c) => (out?.ok && out.result.groupBy.includes(c) ? colName(c) : c);
  const safeFileName = (name) => (name || 'jsa-analysis').trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'jsa-analysis';
  const downloadText = (content, fileName, type) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const currentReport = () => buildAnalysisReport({ dataset: ds, definition: out?.def ?? def, result: out?.result });
  const exportResults = () => {
    if (!out?.ok) return;
    const columns = out.result.columns;
    const labels = Object.fromEntries(columns.map((column) => [column, headers(column)]));
    downloadText(toCsv(columns, out.result.rows, labels), `${safeFileName(out.def?.name)}.csv`, 'text/csv;charset=utf-8;');
  };
  const exportReportJson = () => {
    if (!out?.ok) return;
    downloadText(JSON.stringify(currentReport(), null, 2), `${safeFileName(out.def?.name)}-report.json`, 'application/json;charset=utf-8;');
  };
  const exportReportMarkdown = () => {
    if (!out?.ok) return;
    downloadText(analysisReportMarkdown(currentReport()), `${safeFileName(out.def?.name)}-report.md`, 'text/markdown;charset=utf-8;');
  };

  return (
    <div className="page wide dataset-page analysis-page">
      <div className="dataset-page-heading analysis-page-heading">
        <div className="dataset-heading-copy">
          <div className="dataset-eyebrow"><Database size={14} /> DATA WORKSPACE <span> / </span> ANALYSIS</div>
          <h1>{ds.name}</h1>
          <p>Profile columns, explore distributions, compare relationships, and build reusable metrics from your cleaned data.</p>
        </div>
        <div className="dataset-heading-actions analysis-heading-actions">
          <DatasetPicker ds={ds} base="analysis" />
          <Link className="btn" to={`/clean/${ds.id}`}><SlidersHorizontal size={15} /> Clean data</Link>
          <Link className="btn dataset-primary-action" to={`/charts/${ds.id}`}><BarChart3 size={15} /> Charts <ArrowRight size={15} /></Link>
        </div>
      </div>

      <section className="analysis-overview">
        <div className="analysis-heading">
          <div><span className="eyebrow">WORKSPACE / ANALYTICS</span><h2>Explore your data</h2><p className="muted">Profile columns, inspect distributions, and measure relationships before building a grouped analysis.</p></div>
          <div className="analysis-count"><strong>{ds.rowCount.toLocaleString()}</strong><span>rows loaded</span><strong>{ds.columns.length}</strong><span>columns</span></div>
        </div>
        <div className="analysis-tools">
          <section className="card analysis-tool">
            <div className="tool-title"><span className="tool-index">01</span><div><h3>Column profile</h3><p className="muted small">Descriptive statistics and frequent values</p></div></div>
            <label className="field"><span className="label">Select column</span><select value={profileColumn} onChange={(e) => setProfileColumn(e.target.value)}>{ds.columns.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.type}</option>)}</select></label>
            {profileColumn && (() => { const column = ds.columns.find((c) => c.id === profileColumn); const values = ds.data[profileColumn] || []; const stats = column && isNumericType(column.type) ? describe(values) : null; const cat = stats ? null : describeCategorical(values, 5); const items = stats ? [['Valid values', stats.count], ['Missing', stats.missing], ['Distinct', stats.distinct], ['Mean', stats.mean], ['Median', stats.median], ['Min', stats.min], ['Max', stats.max], ['Std. deviation', stats.stdDev], ['Range', stats.range], ['Q1 / Q3', stats.q1 === null ? '—' : `${fmt(stats.q1, column?.precision ?? 3)} / ${fmt(stats.q3, column?.precision ?? 3)}`]] : [['Valid values', cat.count], ['Missing', cat.missing], ['Distinct', cat.distinct]]; return <><div className="profile-grid">{items.map(([name, value]) => <div className="profile-stat" key={name}><span>{name}</span><strong>{fmt(value, column?.precision ?? 3)}</strong></div>)}</div>{cat && <div className="top-values"><h4>Most frequent values</h4>{cat.top.length ? cat.top.map((item) => <div className="frequency-row" key={item.value}><span title={item.value}>{item.value || '(blank)'}</span><div className="frequency-track"><i style={{ width: `${Math.max(2, item.count / (cat.top[0]?.count || 1) * 100)}%` }} /></div><strong>{item.count.toLocaleString()}</strong></div>) : <p className="muted small">No non-missing values to summarize.</p>}</div>}{stats && (() => { const histogram = buildHistogram(values); const maxBin = Math.max(1, ...histogram.bins.map((bin) => bin.count)); return <div className="distribution-chart"><div className="distribution-heading"><h4>Numeric distribution</h4><span className="muted small">{histogram.count.toLocaleString()} numeric values · {histogram.bins.length} bins</span></div>{histogram.bins.length ? <><div className="histogram" role="img" aria-label={`Histogram showing the distribution of ${column.name} across ${histogram.bins.length} bins`}>{histogram.bins.map((bin, index) => <div className="histogram-bin" key={`${bin.start}-${index}`} title={`${fmt(bin.start, column?.precision ?? 3)}–${fmt(bin.end, column?.precision ?? 3)}: ${bin.count} values`}><span>{bin.count ? bin.count.toLocaleString() : ''}</span><i style={{ height: `${Math.max(bin.count ? 3 : 0, bin.count / maxBin * 100)}%` }} /><small>{fmt(bin.start, column?.precision ?? 3)}</small></div>)}</div><p className="muted small">Values are grouped into equal-width intervals. The final interval includes the maximum value.</p></> : <p className="muted small">No numeric values available for a distribution chart.</p>}</div>; })()}{stats?.warnings.map((w) => <p className="muted small" key={w}>{w}</p>)}</>; })()}
          </section>
          <section className="card analysis-tool">
            <div className="tool-title"><span className="tool-index">02</span><div><h3>Correlation explorer</h3><p className="muted small">Pearson correlation for numeric columns</p></div></div>
            {numericColumns.length < 2 ? <p className="muted">At least two numeric columns are needed to calculate correlation.</p> : <>
              <div className="corr-selects"><label className="field"><span className="label">Variable X</span><select value={corrX} onChange={(e) => setCorrX(e.target.value)}>{numericColumns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="field"><span className="label">Variable Y</span><select value={corrY} onChange={(e) => setCorrY(e.target.value)}>{numericColumns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
              {(() => { const result = corrX === corrY ? { r: null, n: 0, p: null, warnings: ['Choose two different columns to compare.'] } : pearson((ds.data[corrX] || []).map(parseNumber), (ds.data[corrY] || []).map(parseNumber)); const strength = result.r === null ? 'Not available' : Math.abs(result.r) >= .7 ? 'Strong relationship' : Math.abs(result.r) >= .4 ? 'Moderate relationship' : Math.abs(result.r) >= .2 ? 'Weak relationship' : 'Very weak relationship'; return <div className="correlation-result"><div className="correlation-score"><span>Pearson r</span><strong>{fmt(result.r)}</strong><span className="muted small">{strength}</span></div><div className="correlation-details"><div><span>Complete pairs</span><strong>{result.n.toLocaleString()}</strong></div><div><span>p-value</span><strong>{fmt(result.p)}</strong></div></div>{result.r !== null && <div className="correlation-meter"><div className="correlation-axis"><span>−1</span><span>0</span><span>+1</span></div><div className="correlation-track"><i style={{ left: `${(result.r + 1) * 50}%` }} /></div></div>}{result.warnings.map((w) => <p className="muted small" key={w}>{w}</p>)}<p className="muted small">Correlation describes linear association, not causation. The p-value is an approximate significance test.</p></div>; })()}
            </>}
          </section>
        </div>
      </section>

      <section className="analysis-section analysis-key-metrics"><div className="analysis-section-heading"><div><span className="eyebrow">METRICS</span><h2>Key metrics</h2><p className="muted small">Track the measures that matter for this dataset.</p></div></div>
      <div className="kpis">
        {ds.kpis.length === 0 && <p className="muted">No KPIs yet. Define one below.</p>}
        {ds.kpis.map((k) => { let r; try { r = computeKpi(ds, k); } catch (e) { r = { formatted: '—', warnings: [e.message] }; }
          return (<div className="kpi kpi-editable" key={k.id} role="button" tabIndex={0} aria-label={`Edit KPI ${k.name}`} onClick={() => editKpi(k)} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); editKpi(k); } }}>
            <div className="row tight"><span className="muted">{k.name}</span><button type="button" className="iconbtn push" aria-label={`Edit KPI ${k.name}`} title="Edit KPI" onClick={(e) => { e.stopPropagation(); editKpi(k); }}><Pencil size={13} aria-hidden /></button><button type="button" className="iconbtn" aria-label={`Delete KPI ${k.name}`} title="Delete KPI" onClick={(e) => { e.stopPropagation(); deleteKpi(ds.id, k.id); }}><Trash2 size={14} aria-hidden /></button></div>
            <strong>{r.formatted}</strong>
            {r.status && <span className={r.status === 'met' ? 'oktext small' : 'errtext small'}>{r.status === 'met' ? '✓ Target met' : '✗ Target not met'}</span>}
            {k.description && <span className="muted small">{k.description}</span>}
            {r.warnings.map((w, i) => <span key={i} className="warntext small">{w}</span>)}
          </div>); })}
      </div>
      <details id="analysis-kpi-editor" className="card analysis-kpi-builder" open={!!editingKpiId || undefined}><summary>{editingKpiId ? `Edit KPI: ${kpi.name || 'Untitled'}` : 'Define a KPI'}</summary>
        <p className="muted small">Source dataset: <strong>{ds.name}</strong>. The selected aggregation columns and row filters below define this reusable KPI.</p>
        <div className="field"><label htmlFor="kn">Name</label><input id="kn" value={kpi.name} onChange={(e) => setKpi({ ...kpi, name: e.target.value })} /></div>
        <div className="field"><label htmlFor="kd">Description (optional)</label><input id="kd" value={kpi.description} onChange={(e) => setKpi({ ...kpi, description: e.target.value })} /></div>
        <PartEditor ds={ds} title="Value" part={kpi.numerator} onChange={(numerator) => setKpi({ ...kpi, numerator })} />
        <label className="check"><input type="checkbox" checked={!!kpi.denominator} onChange={(e) => setKpi({ ...kpi, denominator: e.target.checked ? { op: 'count', filters: [] } : null })} /> Divide by another value (ratio or rate)</label>
        {kpi.denominator && <PartEditor ds={ds} title="Divide by" part={kpi.denominator} onChange={(denominator) => setKpi({ ...kpi, denominator })} />}
        <div className="row tight">
          <label className="inline">Format <select value={kpi.format} onChange={(e) => setKpi({ ...kpi, format: e.target.value })}><option value="number">Decimal number</option><option value="percent">Percent</option><option value="currency">Currency (USD)</option></select></label>
          <label className="inline">Decimal places <select aria-label="KPI decimal places" value={String(kpi.precision ?? 2)} onChange={(e) => setKpi({ ...kpi, precision: Number(e.target.value) })}>{Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i}</option>)}</select></label>
          <label className="inline">Target <input type="number" step="any" value={kpi.targetValue} onChange={(e) => setKpi({ ...kpi, targetValue: e.target.value })} placeholder="optional" /></label>
          <select aria-label="Target direction" value={kpi.targetDir} onChange={(e) => setKpi({ ...kpi, targetDir: e.target.value })}><option value="higher">higher is better</option><option value="lower">lower is better</option></select>
        </div>
        <p className="muted small">Percent KPIs expect a ratio (for example, count of churned ÷ count of all). A percent target is a fraction: 0.2 means 20%.</p>
        <div className="row tight"><button className="btn primary" onClick={submitKpi}>{editingKpiId ? 'Save changes' : 'Save KPI'}</button>{editingKpiId && <button className="btn" type="button" onClick={cancelKpiEdit}>Cancel editing</button>}</div>
        <p className="muted small">Reusable KPI definitions are saved for this dataset and update dashboards that reference their KPI ID. Measures in a one-off grouped analysis remain part of that analysis and are edited separately.</p>
        {kpiError && <div role="alert" className="alert error">{kpiError}</div>}
      </details></section>

      <section className="analysis-section analysis-group-section"><div className="analysis-section-heading"><div><span className="eyebrow">DEEPER ANALYSIS</span><h2>Group and compare</h2><p className="muted small">Build a reusable summary by choosing dimensions, measures, filters, and sort order.</p></div><span className="analysis-section-tag">Custom analysis</span></div>
      <div className="card analysis-builder-card">
        <div className="field"><span className="label">Group by (optional)</span>
          <div className="checks group-by-options">{ds.columns.map((c) => <label key={c.id} className="check group-by-option"><input type="checkbox" checked={def.groupBy.includes(c.id)} onChange={(e) => set({ groupBy: e.target.checked ? [...def.groupBy, c.id] : def.groupBy.filter((x) => x !== c.id) })} /> {c.name}</label>)}</div></div>
        <div className="field"><span className="label">Measures</span>
          {def.measures.map((m, i) => (
            <div className="row tight" key={i}>
              <select aria-label="Operation" value={m.op} onChange={(e) => set({ measures: def.measures.map((x, k) => (k === i ? { ...x, op: e.target.value, as: '' } : x)) })}>{AGG_OPS.map((o) => <option key={o}>{o}</option>)}</select>
              {m.op !== 'count' && <select aria-label="Column" value={m.column} onChange={(e) => set({ measures: def.measures.map((x, k) => (k === i ? { ...x, column: e.target.value, as: '' } : x)) })}><option value="">Choose column</option>{ds.columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
              {def.measures.length > 1 && <button className="iconbtn" aria-label="Remove measure" onClick={() => set({ measures: def.measures.filter((_, k) => k !== i) })}><X size={14} aria-hidden /></button>}
              <details className="measure-filter-details"><summary>Measure filters {m.filters?.length ? `(${m.filters.length})` : ''}</summary><label className="inline">Match <select value={m.filterMode || 'all'} onChange={(e) => set({ measures: def.measures.map((x, k) => k === i ? { ...x, filterMode: e.target.value } : x) })}><option value="all">all conditions</option><option value="any">any condition</option></select></label><FilterEditor columns={ds.columns} value={m.filters || []} onChange={(filters) => set({ measures: def.measures.map((x, k) => k === i ? { ...x, filters } : x) })} /></details>
            </div>))}
          <button className="btn small-btn" onClick={() => set({ measures: [...def.measures, { op: 'sum', column: '', as: '', filters: [], filterMode: 'all' }] })}><Plus size={14} aria-hidden /> Add measure</button></div>
        <details><summary>Filters {def.filters.length ? `(${def.filters.length})` : ''}</summary>
          <label className="inline">Match <select value={def.filterMode} onChange={(e) => set({ filterMode: e.target.value })}><option value="all">all conditions</option><option value="any">any condition</option></select></label>
          <FilterEditor columns={ds.columns} value={def.filters} onChange={(filters) => set({ filters })} /></details>
        <div className="row tight">
          <label className="inline">Sort by <select value={def.sortBy} onChange={(e) => set({ sortBy: e.target.value })}><option value="">None</option>{resultCols.map((c) => <option key={c} value={c}>{headers(c)}</option>)}</select></label>
          <select aria-label="Sort direction" value={def.sortDir} onChange={(e) => set({ sortDir: e.target.value })}><option value="desc">descending</option><option value="asc">ascending</option></select>
          <label className="inline">Top <input className="narrow" type="number" min="1" value={def.limit} onChange={(e) => set({ limit: e.target.value })} placeholder="all" /></label>
        </div>
        <div className="row tight">
          <button className="btn primary" onClick={() => run()}>Run analysis</button>
          <input aria-label="Analysis name" placeholder="Name to save" value={def.name} onChange={(e) => set({ name: e.target.value })} />
          <button className="btn" onClick={save}>Save analysis</button>
        </div>
      </div>

      {out && !out.ok && <div role="alert" className="alert error">{out.error}</div>}
      {out?.ok && (<>
        <div className="analysis-result-toolbar"><p className="muted small">Based on {out.result.rowsUsed.toLocaleString()} of {out.result.rowsTotal.toLocaleString()} rows.</p><label className="inline">Result decimal places <select aria-label="Result decimal places" value={resultPrecision} onChange={(e) => setResultPrecision(e.target.value)}>{Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i}</option>)}</select></label></div>
        {out.result.warnings.map((w, i) => <div key={i} role="status" className="alert warn">{w}</div>)}
        <div className="row tight analysis-export-actions" id="analysis-export-actions">
          <button className="btn" onClick={exportResults} disabled={out.result.rows.length === 0}>Export results as CSV</button>
          <button className="btn" onClick={exportReportJson}>Export report as JSON</button>
          <button className="btn" onClick={exportReportMarkdown}>Export summary as Markdown</button>
          <span className="muted small">CSV is spreadsheet-ready; JSON preserves analysis settings and metadata; Markdown creates a shareable report summary.</span>
        </div>
        {out.result.rows.length > 0 && <div className="scroll"><table>
          <thead><tr>{out.result.columns.map((c) => <th key={c}>{headers(c)}</th>)}</tr></thead>
          <tbody>{out.result.rows.map((r, i) => <tr key={i}>{out.result.columns.map((c) => <td key={c} className={typeof r[c] === 'number' ? 'num' : ''}>{fmt(r[c], Number(resultPrecision))}</td>)}</tr>)}</tbody>
        </table></div>}
      </>)}

      <div className="analysis-section-heading saved-analyses-heading"><div><span className="eyebrow">YOUR WORK</span><h2>Saved analyses</h2><p className="muted small">Return to a previous result or remove analyses you no longer need.</p></div></div>
      {ds.analyses.length === 0 ? <p className="muted">Nothing saved yet. Run an analysis, name it, and save it.</p> : (
        <ul className="list plain">{ds.analyses.map((a) => (
          <li key={a.id} className="row tight"><button className="linkbtn" onClick={() => load(a)}>{a.name}</button>
            <span className="muted small">{a.groupBy.length ? `by ${a.groupBy.map(colName).join(', ')}` : 'overall'} · {a.measures.map((m) => m.as).join(', ')}</span>
            <button className="iconbtn push" aria-label={`Delete analysis ${a.name}`} onClick={() => deleteAnalysis(ds.id, a.id)}><Trash2 size={14} aria-hidden /></button></li>))}</ul>)}
      <p className="muted small analysis-storage-note">Saved analyses and KPIs are stored in this browser only.</p>
      </section>
    </div>
  );
}
