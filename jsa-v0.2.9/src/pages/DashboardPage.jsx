import { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Download, Plus, Trash2, Upload, X } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';
import { useDialogs } from '../app/DialogProvider.jsx';
import { makeDashboard, addComponent, removeComponent, duplicateComponent, updateComponent, setLayout, validateDashboard, findBrokenReferences } from '../core/dashboard/dashboardSchema.js';
import { controlConditions } from '../core/dashboard/filters.js';
import { exportDashboard, importDashboard } from '../core/dashboard/portable.js';
import { createStaticDashboardHtml } from '../core/dashboard/staticExport.js';
import { createInteractiveDashboardHtml } from '../core/dashboard/interactiveExport.js';
import { evaluateFilters } from '../core/transforms/filters.js';
import { selectRows } from '../core/transforms/rows.js';
import Canvas from '../components/dashboard/Canvas.jsx';
import DashComponent from '../components/dashboard/DashComponent.jsx';
import DatasetPicker, { useActiveDataset, NoDataset } from '../components/data/DatasetPicker.jsx';

export default function DashboardPage() {
  const ds = useActiveDataset();
  const { did } = useParams();
  if (!ds) return <NoDataset title="Dashboards" />;
  const dash = did ? ds.dashboards.find((d) => d.id === did) : null;
  return dash ? <Editor key={dash.id} ds={ds} saved={dash} /> : <List ds={ds} missing={!!did} />;
}

function List({ ds, missing }) {
  const { saveDashboard, deleteDashboard, importBundle } = useDatasets();
  const dialogs = useDialogs();
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState(null);
  const file = useRef(null);
  const create = () => { const d = makeDashboard({ title: title.trim() || 'Untitled dashboard', datasetId: ds.id }); saveDashboard(ds.id, d); nav(`/dashboards/${ds.id}/${d.id}`); };
  const onImport = async (f) => {
    try {
      if (f.size > 2 * 1024 * 1024) throw new Error('That file is too large to be a dashboard configuration (2 MB max).');
      const out = importDashboard(ds, JSON.parse(await f.text()));
      importBundle(ds.id, out);
      nav(`/dashboards/${ds.id}/${out.dashboard.id}`);
    } catch (e) { setMsg(e instanceof SyntaxError ? 'That file is not valid JSON.' : e.message); }
  };
  return (
    <div className="page">
      <h1>Dashboards: {ds.name}</h1>
      <DatasetPicker ds={ds} base="dashboards" />
      {missing && <div role="alert" className="alert error">That dashboard does not exist.</div>}
      <div className="row">
        <input aria-label="New dashboard title" placeholder="Dashboard title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="btn primary" onClick={create}><Plus size={16} aria-hidden /> New dashboard</button>
        <button className="btn" onClick={() => file.current.click()}><Upload size={16} aria-hidden /> Import configuration</button>
        <input ref={file} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onImport(f); }} />
      </div>
      {msg && <div role="alert" className="alert error">{msg}</div>}
      {ds.visualizations.length + ds.kpis.length === 0 && <p className="alert warn">You have no saved charts or KPIs yet. Create some on the <Link to={`/charts/${ds.id}`}>Charts</Link> and <Link to={`/analysis/${ds.id}`}>Analysis</Link> pages to add to a dashboard.</p>}
      {ds.dashboards.length === 0 ? <p className="muted">No dashboards yet.</p> : (
        <ul className="list plain">{ds.dashboards.map((d) => (
          <li key={d.id} className="row tight"><Link to={`/dashboards/${ds.id}/${d.id}`}>{d.title}</Link>
            <span className="muted small">{d.components.length} component{d.components.length === 1 ? '' : 's'} · updated {new Date(d.updatedAt).toLocaleString()}</span>
            <button className="iconbtn push" aria-label={`Delete dashboard ${d.title}`} onClick={async () => { if (await dialogs.confirm(`Delete “${d.title}”? Its charts and KPIs are kept.`, { title: 'Delete dashboard', confirmText: 'Delete dashboard' })) deleteDashboard(ds.id, d.id); }}><Trash2 size={14} aria-hidden /></button></li>))}</ul>)}
    </div>
  );
}

function AddRow({ label, options, onAdd, empty }) {
  const [v, setV] = useState('');
  const val = options.some(([k]) => k === v) ? v : options[0]?.[0] ?? '';
  return options.length === 0 ? <span className="muted small">{empty}</span> : (
    <span className="row tight addrow"><select aria-label={label} value={val} onChange={(e) => setV(e.target.value)}>{options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <button className="btn small-btn" onClick={() => onAdd(val)}><Plus size={14} aria-hidden /> {label}</button></span>);
}

function Editor({ ds, saved }) {
  const { saveDashboard } = useDatasets();
  const [draft, setDraft] = useState(saved);
  const [editing, setEditing] = useState(true);
  const [selected, setSelected] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vals, setVals] = useState({});
  const [note, setNote] = useState(null);
  const [interactiveExportOpen, setInteractiveExportOpen] = useState(false);
  const [exportColumns, setExportColumns] = useState(() => ds.columns.map((c) => c.id));
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const conds = useMemo(() => controlConditions(ds, draft.components, vals), [ds, draft.components, vals]);
  const filtered = useMemo(() => {
    if (!conds.length) return { ds, error: null };
    try { return { ds: selectRows(ds, evaluateFilters(ds, conds)), error: null }; } catch (e) { return { ds, error: e.message }; }
  }, [ds, conds]);
  const broken = useMemo(() => findBrokenReferences(draft, ds), [draft, ds]);
  const sel = draft.components.find((c) => c.id === selected);
  const set = (fn) => setDraft((d) => fn(d));
  const add = (type, config, title = '') => set((d) => addComponent(d, type, config, title));
  const addTableForChart = (vizId, title = '') => { const next = addComponent(draft, 'table', { vizId }, title ? `${title} — data table` : 'Chart data table'); const added = next.components[next.components.length - 1]; setDraft(next); setSelected(added.id); setSettingsOpen(true); };

  const download = () => {
    const blob = new Blob([JSON.stringify(exportDashboard(ds, draft), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${draft.title.replace(/[^\w-]+/g, '_') || 'dashboard'}.jsa-dashboard.json`; a.click();
    URL.revokeObjectURL(a.href);
  };
  const downloadHtml = () => {
    try {
      const html = createStaticDashboardHtml(ds, draft);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${draft.title.replace(/[^\w-]+/g, '_') || 'dashboard'}.html`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNote(null);
    } catch (e) { setNote(`Could not export HTML: ${e.message}`); }
  };
  const downloadInteractiveHtml = () => {
    try {
      const html = createInteractiveDashboardHtml(ds, draft, { columns: exportColumns });
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${draft.title.replace(/[^\w-]+/g, '_') || 'dashboard'}-interactive.html`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setInteractiveExportOpen(false); setNote(null);
    } catch (e) { setNote(`Could not export interactive HTML: ${e.message}`); }
  };
  const save = () => {
    const v = validateDashboard(draft);
    if (!v.ok) return setNote(v.errors.join(' '));
    saveDashboard(ds.id, { ...v.dashboard, updatedAt: new Date().toISOString() }); setNote(null);
  };
  const activeFilters = conds.length;

  return (
    <div className="page wide">
      <p className="small"><Link to={`/dashboards/${ds.id}`}>← All dashboards</Link></p>
      <div className="row tight">
        <input className="title-input" aria-label="Dashboard title" value={draft.title} onChange={(e) => set((d) => ({ ...d, title: e.target.value }))} />
        <button className={`btn ${editing ? '' : 'primary'}`} onClick={() => setEditing(!editing)}>{editing ? 'Preview' : 'Edit'}</button>
        <button className="btn primary" onClick={save} disabled={!dirty}>{dirty ? 'Save' : 'Saved'}</button>
        <button className="btn" onClick={download}><Download size={16} aria-hidden /> Download configuration</button>
        <button className="btn" onClick={downloadHtml}><Download size={16} aria-hidden /> Export static HTML</button>
        <button className="btn primary" onClick={() => { setExportColumns(ds.columns.map((c) => c.id)); setInteractiveExportOpen(true); }}><Download size={16} aria-hidden /> Export interactive HTML</button>
      </div>
      {editing ? <input className="wide-input" aria-label="Dashboard description" placeholder="Description (optional)" value={draft.description} onChange={(e) => set((d) => ({ ...d, description: e.target.value }))} />
        : draft.description && <p className="muted">{draft.description}</p>}
      {dirty && <p className="warntext small" role="status">Unsaved changes</p>}
      {note && <div role="alert" className="alert error">{note}</div>}
      {broken.map((b, i) => <div key={i} role="status" className="alert warn">{b}</div>)}
      {filtered.error && <div role="alert" className="alert error">A filter has an invalid value ({filtered.error}), so filtering is paused.</div>}

      {editing && (
        <div className="card toolbar">
          <AddRow label="Add chart" options={ds.visualizations.map((v) => [v.id, v.title || 'Untitled chart'])} empty="No saved charts yet." onAdd={(id) => add('chart', { vizId: id })} />
          <AddRow label="Add KPI" options={ds.kpis.map((k) => [k.id, k.name])} empty="No KPIs yet." onAdd={(id) => add('kpi', { kpiId: id })} />
          <AddRow label="Add filter" options={ds.columns.map((c) => [c.id, c.name])} empty="" onAdd={(id) => add('filter', { column: id })} />
          <button className="btn small-btn" onClick={() => add('text', { text: 'Write a note about this dashboard.' }, 'Notes')}><Plus size={14} aria-hidden /> Add text</button>
          <AddRow label="Add insight" options={ds.insights.filter((x) => x.status === 'saved' && x.insight).map((x) => [x.id, x.insight.title])} empty="Save insights on the Insights page to add them here." onAdd={(id) => add('insight', { insightId: id })} />
        </div>)}

      {(activeFilters > 0 || Object.keys(vals).length > 0) && (
        <p className="small muted">{activeFilters} dashboard filter{activeFilters === 1 ? '' : 's'} active: {filtered.ds.rowCount.toLocaleString()} of {ds.rowCount.toLocaleString()} rows. Filters apply to every component except those marked “ignore dashboard filters”. <button className="linkbtn" onClick={() => setVals({})}>Reset filters</button></p>)}

      <div className={editing && settingsOpen && sel ? 'dash-layout with-panel' : 'dash-layout'}>
        <Canvas dashboard={draft} editing={editing} selectedId={selected} onSelect={(id) => { setSelected(id); }} onOpenSettings={(id) => { setSelected(id); setSettingsOpen(true); }}
          onLayout={(rect, id) => set((d) => setLayout(d, id, rect))}
          onDuplicate={(id) => set((d) => duplicateComponent(d, id))}
          onRemove={(id) => { set((d) => removeComponent(d, id)); if (selected === id) setSelected(null); }}
          renderBody={(c) => <DashComponent ds={filtered.ds} fullDs={ds} comp={c} filterValue={vals[c.id]} onFilterChange={(v) => setVals((s) => ({ ...s, [c.id]: v }))} />} />
        {editing && sel && settingsOpen && <Settings key={sel.id} ds={ds} comp={sel} onAddTable={addTableForChart} onChange={(patch) => set((d) => updateComponent(d, sel.id, patch))}
          onRect={(rect) => set((d) => setLayout(d, sel.id, rect))} onClose={() => setSettingsOpen(false)} />}
      </div>
      {editing && <p className="muted small">Select the gear on a component to open its settings. Drag a component by its header and resize from the corner, or use arrow keys on the header (Shift+arrows to resize). Dashboard filters apply to every component using the same rows, so numbers always agree.</p>}
      {interactiveExportOpen && <div role="dialog" aria-modal="true" aria-labelledby="interactive-export-title" className="export-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(2,6,23,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <section className="card" style={{ width: 'min(720px, 100%)', maxHeight: '90vh', overflow: 'auto' }}>
          <div className="row tight"><h2 id="interactive-export-title">Export interactive dashboard</h2><button className="btn small-btn push" onClick={() => setInteractiveExportOpen(false)}>Close</button></div>
          <p className="muted small">Choose exactly which dataset columns to embed in the standalone HTML file. Charts, KPIs, and filters that need an omitted column will show a missing-data message.</p>
          <div role="alert" className="alert warn"><strong>Privacy warning:</strong> the exported HTML contains the selected row-level data. Anyone who gets the file can inspect that data, even if it is not visible in a chart. Do not export confidential columns unless sharing is authorized.</div>
          <div className="row tight" style={{ marginBottom: 10 }}><button className="btn small-btn" onClick={() => setExportColumns(ds.columns.map((c) => c.id))}>Select all</button><button className="btn small-btn" onClick={() => setExportColumns([])}>Select none</button><span className="muted small push">{exportColumns.length} of {ds.columns.length} columns selected · {ds.rowCount.toLocaleString()} rows</span></div>
          <div className="export-column-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8, padding: '8px 0 16px' }}>
            {ds.columns.map((c) => <label key={c.id} className="check" style={{ padding: 8, border: '1px solid var(--border)', borderRadius: 8, minWidth: 0, overflowWrap: 'anywhere' }}><input type="checkbox" checked={exportColumns.includes(c.id)} onChange={(e) => setExportColumns((prev) => e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id))} /> <span>{c.name}<span className="muted small"> · {c.type}</span></span></label>)}
          </div>
          {ds.rowCount * exportColumns.length > 500000 && <p className="alert warn">Large export: { (ds.rowCount * exportColumns.length).toLocaleString() } data cells will be embedded. The HTML file may be large and slower to open on mobile devices.</p>}
          <div className="row tight"><button className="btn" onClick={() => setInteractiveExportOpen(false)}>Cancel</button><button className="btn primary push" onClick={downloadInteractiveHtml}>Export {exportColumns.length} columns</button></div>
        </section>
      </div>}
    </div>
  );
}

function Settings({ ds, comp, onChange, onRect, onClose, onAddTable }) {
  const L = comp.layout;
  const num = (k, min) => (
    <label className="inline">{k.toUpperCase()} <input className="narrow" type="number" min={min} value={L[k]} onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) onRect({ ...L, [k]: v }); }} /></label>);
  return (
    <aside className="card settings" aria-label="Component settings">
      <div className="row tight settings-title"><strong>Component settings</strong><button className="iconbtn push" aria-label="Close component settings" onClick={onClose}><X size={16} aria-hidden /></button></div>
      <div className="field"><label htmlFor="ct">Title</label><input id="ct" value={comp.title} onChange={(e) => onChange({ title: e.target.value })} /></div>
      {(comp.type === 'chart' || comp.type === 'table') && <div className="field"><label htmlFor="cv">{comp.type === 'table' ? 'Source chart' : 'Chart'}</label><select id="cv" value={comp.config.vizId} onChange={(e) => onChange({ config: { vizId: e.target.value } })}>
        {!ds.visualizations.some((v) => v.id === comp.config.vizId) && <option value={comp.config.vizId}>(deleted chart)</option>}
        {ds.visualizations.map((v) => <option key={v.id} value={v.id}>{v.title || 'Untitled chart'}</option>)}</select></div>}
      {comp.type === 'chart' && <button className="btn small-btn" onClick={() => onAddTable(comp.config.vizId, comp.title)}>Add separate data table below chart</button>}
      {comp.type === 'kpi' && <div className="field"><label htmlFor="ck">KPI</label><select id="ck" value={comp.config.kpiId} onChange={(e) => onChange({ config: { kpiId: e.target.value } })}>
        {!ds.kpis.some((k) => k.id === comp.config.kpiId) && <option value={comp.config.kpiId}>(deleted KPI)</option>}
        {ds.kpis.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select></div>}
      {comp.type === 'text' && <div className="field"><label htmlFor="cx">Text</label><textarea id="cx" rows={4} maxLength={5000} value={comp.config.text ?? ''} onChange={(e) => onChange({ config: { text: e.target.value } })} /></div>}
      {comp.type === 'filter' && <div className="field"><label htmlFor="cc">Filter column</label><select id="cc" value={comp.config.column} onChange={(e) => onChange({ config: { column: e.target.value } })}>{ds.columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
      {(comp.type === 'chart' || comp.type === 'table' || comp.type === 'kpi' || comp.type === 'insight') && <label className="check"><input type="checkbox" checked={!!comp.config.ignoreFilters} onChange={(e) => onChange({ config: { ignoreFilters: e.target.checked } })} /> Ignore dashboard filters (component shows all rows)</label>}
      <div className="row tight">{num('x', 0)}{num('y', 0)}{num('w', 2)}{num('h', 2)}</div>
      <p className="muted small">Grid is 12 columns wide. Other components move out of the way.</p>
    </aside>
  );
}
