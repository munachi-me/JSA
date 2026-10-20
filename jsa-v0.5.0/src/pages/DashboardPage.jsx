import { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Download, Plus, Trash2, Upload, X, Database, LayoutDashboard, BarChart3, Lightbulb, Calculator, ArrowRight, Clock3, Layers3 } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';
import { useDialogs } from '../app/DialogProvider.jsx';
import { makeDashboard, addComponent, removeComponent, duplicateComponent, updateComponent, setLayout, validateDashboard, findBrokenReferences } from '../core/dashboard/dashboardSchema.js';
import { controlConditions } from '../core/dashboard/filters.js';
import { exportDashboard, importDashboard } from '../core/dashboard/portable.js';
import { createStaticDashboardHtml } from '../core/dashboard/staticExport.js';
import { createInteractiveDashboardHtml } from '../core/dashboard/interactiveExport.js';
import { DEFAULT_EXPORT_APPEARANCE, normalizeExportAppearance } from '../core/dashboard/exportAppearance.js';
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
    <div className="page wide dashboard-page dashboard-library-page">
      <header className="dataset-page-heading dashboard-page-heading">
        <div className="dataset-heading-copy">
          <div className="dataset-eyebrow"><Database size={14} aria-hidden /> DATA WORKSPACE <span>/</span> DASHBOARDS</div>
          <h1>{ds.name}</h1>
          <p>Bring charts, KPIs, insights, and filters together in one interactive view.</p>
        </div>
        <div className="dataset-heading-actions dashboard-heading-actions">
          <DatasetPicker ds={ds} base="dashboards" />
          <Link className="btn" to={`/charts/${ds.id}`}><BarChart3 size={15} /> Charts</Link>
          <Link className="btn" to={`/insights/${ds.id}`}><Lightbulb size={15} /> Insights</Link>
        </div>
      </header>
      <div className="dashboard-summary-grid" aria-label="Dashboard summary">
        <article className="dashboard-summary-card"><span className="dashboard-summary-icon violet"><LayoutDashboard size={18} /></span><div><span>Saved dashboards</span><strong>{ds.dashboards.length.toLocaleString()}</strong><small>In this workspace</small></div></article>
        <article className="dashboard-summary-card"><span className="dashboard-summary-icon blue"><BarChart3 size={18} /></span><div><span>Saved charts</span><strong>{ds.visualizations.length.toLocaleString()}</strong><small>Available to add</small></div></article>
        <article className="dashboard-summary-card"><span className="dashboard-summary-icon green"><Calculator size={18} /></span><div><span>Saved KPIs</span><strong>{ds.kpis.length.toLocaleString()}</strong><small>Available to add</small></div></article>
      </div>
      {missing && <div role="alert" className="alert error">That dashboard does not exist.</div>}
      <section className="dashboard-library-section">
        <div className="dashboard-library-heading"><div><span className="dashboard-section-kicker">YOUR WORKSPACE</span><h2><Layers3 size={19} /> Dashboard library</h2><p>Open a dashboard to arrange components, apply filters, and publish a shareable export.</p></div><span className="dashboard-count-pill">{ds.dashboards.length} saved</span></div>
        <div className="dashboard-create-panel">
          <div className="dashboard-create-copy"><strong>Create a dashboard</strong><span>Start with a name, then add charts, KPIs, insights, and filters.</span></div>
          <div className="dashboard-create-controls">
            <input aria-label="New dashboard title" placeholder="Dashboard title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <button className="btn primary" onClick={create}><Plus size={16} aria-hidden /> New dashboard</button>
            <button className="btn" onClick={() => file.current.click()}><Upload size={16} aria-hidden /> Import</button>
            <input ref={file} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onImport(f); }} />
          </div>
        </div>
        {msg && <div role="alert" className="alert error">{msg}</div>}
        {ds.visualizations.length + ds.kpis.length === 0 && <p className="alert warn">You have no saved charts or KPIs yet. Start with <Link to={`/charts/${ds.id}`}>Charts</Link> or <Link to={`/analysis/${ds.id}`}>Analysis</Link>. You can also save findings from <Link to={`/insights/${ds.id}`}>Insights</Link> and add them here.</p>}
        {ds.dashboards.length === 0 ? <div className="dashboard-empty-state"><div className="dashboard-empty-icon"><LayoutDashboard size={24} /></div><h3>Your first dashboard starts here</h3><p>Combine visualizations and metrics into a single view that tells a clear story.</p><span><Plus size={14} /> Create a dashboard above to get started</span></div> : (
          <div className="dashboard-library-grid">{ds.dashboards.map((d) => (
            <article key={d.id} className="dashboard-library-card">
              <div className="dashboard-library-card-top"><span className="dashboard-card-icon"><LayoutDashboard size={17} /></span><span className="dashboard-card-status"><span /> Saved</span>
                <button className="iconbtn" aria-label={`Delete dashboard ${d.title}`} title="Delete dashboard" onClick={async () => { if (await dialogs.confirm(`Delete “${d.title}”? Its charts and KPIs are kept.`, { title: 'Delete dashboard', confirmText: 'Delete dashboard' })) deleteDashboard(ds.id, d.id); }}><Trash2 size={14} aria-hidden /></button>
              </div>
              <h3>{d.title || 'Untitled dashboard'}</h3><p>{d.description || 'A workspace for your charts, metrics, and findings.'}</p>
              <div className="dashboard-card-meta"><span><Layers3 size={13} /> {d.components.length} component{d.components.length === 1 ? '' : 's'}</span><span><Clock3 size={13} /> {new Date(d.updatedAt).toLocaleDateString()}</span></div>
              <Link className="btn primary dashboard-open-btn" to={`/dashboards/${ds.id}/${d.id}`}>Open dashboard <ArrowRight size={14} /></Link>
            </article>))}</div>)}
      </section>
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
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('static');
  const [appearance, setAppearance] = useState(() => ({ ...DEFAULT_EXPORT_APPEARANCE }));
  const [savedExportColors, setSavedExportColors] = useState(() => [...new Set(Object.values(DEFAULT_EXPORT_APPEARANCE).filter((v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)))]);
  const [activeExportColorField, setActiveExportColorField] = useState('accent');
  const [hexDrafts, setHexDrafts] = useState({});
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
      const html = createStaticDashboardHtml(ds, draft, { appearance });
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
      const html = createInteractiveDashboardHtml(ds, draft, { columns: exportColumns, appearance });
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
    <div className="page wide dashboard-page dashboard-editor-page">
      <header className="dataset-page-heading dashboard-page-heading dashboard-editor-heading">
        <div className="dataset-heading-copy">
          <div className="dataset-eyebrow"><Database size={14} aria-hidden /> DATA WORKSPACE <span>/</span> DASHBOARD BUILDER</div>
          <h1>Dashboard builder</h1>
          <p>Arrange your saved visualizations, metrics, insights, and filters into one clear view.</p>
        </div>
        <div className="dataset-heading-actions dashboard-heading-actions">
          <Link className="btn" to={`/dashboards/${ds.id}`}><ArrowRight size={15} className="dashboard-back-arrow" /> All dashboards</Link>
          <Link className="btn" to={`/insights/${ds.id}`}><Lightbulb size={15} /> Insights</Link>
        </div>
      </header>
      <div className="row tight dashboard-editor-actions" id="dashboard-export-actions">
        <input className="title-input" aria-label="Dashboard title" value={draft.title} onChange={(e) => set((d) => ({ ...d, title: e.target.value }))} />
        <button className={`btn ${editing ? '' : 'primary'}`} onClick={() => setEditing(!editing)}>{editing ? 'Preview' : 'Edit'}</button>
        <button className="btn primary" onClick={save} disabled={!dirty}>{dirty ? 'Save' : 'Saved'}</button>
        <button className="btn" onClick={download}><Download size={16} aria-hidden /> Download configuration</button>
        <button className="btn primary" onClick={() => setAppearanceOpen(true)}><Download size={16} aria-hidden /> Export HTML & styling</button>
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

      <div className="dash-layout">
        <Canvas dashboard={draft} editing={editing} selectedId={selected} onSelect={(id) => { setSelected(id); }} onOpenSettings={(id) => { setSelected(id); setSettingsOpen(true); }}
          onLayout={(rect, id, mode) => set((d) => { const next = setLayout(d, id, rect); if (mode === 'resize') { const old = d.components.find((c) => c.id === id); if (old && ['filter', 'kpi'].includes(old.type)) return updateComponent(next, id, { config: { compact: false } }); } return next; })}
          onDuplicate={(id) => set((d) => duplicateComponent(d, id))}
          onRemove={(id) => { set((d) => removeComponent(d, id)); if (selected === id) setSelected(null); }}
          renderBody={(c) => <DashComponent ds={filtered.ds} fullDs={ds} comp={c} filterValue={vals[c.id]} onFilterChange={(v) => setVals((s) => ({ ...s, [c.id]: v }))} />}
          settingsContent={editing && sel && settingsOpen ? <Settings key={sel.id} ds={ds} comp={sel} onAddTable={addTableForChart} onChange={(patch) => set((d) => updateComponent(d, sel.id, patch))} onRect={(rect) => set((d) => { const old = d.components.find((c) => c.id === sel.id); const next = setLayout(d, sel.id, rect); if (old && ['filter', 'kpi'].includes(old.type) && (old.layout.w !== rect.w || old.layout.h !== rect.h)) return updateComponent(next, sel.id, { config: { compact: false } }); return next; })} onClose={() => setSettingsOpen(false)} /> : null} />
      </div>
      {editing && <p className="muted small">Select the gear on a component to open its settings. Drag a component by its header and resize from the corner, or use arrow keys on the header (Shift+arrows to resize). Dashboard filters apply to every component using the same rows, so numbers always agree.</p>}
      {appearanceOpen && <div role="dialog" aria-modal="true" aria-labelledby="export-appearance-title" className="export-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(2,6,23,.76)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
        <section className="card" style={{ width: 'min(920px, 100%)', maxHeight: '92vh', overflow: 'auto' }}>
          <div className="row tight"><div><p className="dataset-eyebrow" style={{ margin: 0 }}>PRESENTATION SETTINGS</p><h2 id="export-appearance-title" style={{ marginTop: 4 }}>Export Appearance Studio</h2></div><button className="btn small-btn push" onClick={() => setAppearanceOpen(false)}>Close</button></div>
          <p className="muted small">Style the standalone HTML without changing JSA's in-app theme. Your choices apply to both static and interactive exports.</p>
          <div className="grid-two" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 18 }}>
            <div>
              <div className="field"><label htmlFor="export-format">Export format</label><select id="export-format" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}><option value="static">Static HTML snapshot</option><option value="interactive">Interactive HTML dashboard</option></select></div>
              <div className="field"><label htmlFor="export-preset">Theme preset</label><select id="export-preset" value={appearance.preset} onChange={(e) => { const preset = e.target.value; const presets = { midnight: { accent: '#7C6CFF', background: '#0B1020', panel: '#151C30', text: '#F3F5FF', muted: '#A8B2CC' }, executive: { accent: '#2457D6', background: '#F3F6FB', panel: '#FFFFFF', text: '#18202B', muted: '#64748B' }, minimal: { accent: '#0F766E', background: '#FFFFFF', panel: '#FFFFFF', text: '#20252D', muted: '#667085' }, custom: {} }; setAppearance((a) => ({ ...a, preset, ...(presets[preset] || {}) })); }}><option value="midnight">JSA Midnight</option><option value="executive">Executive</option><option value="minimal">Minimal</option><option value="custom">Custom</option></select></div>
              <div className="field"><label htmlFor="export-brand">Brand / report label</label><input id="export-brand" maxLength={60} value={appearance.brandLabel} onChange={(e) => setAppearance((a) => ({ ...a, preset: 'custom', brandLabel: e.target.value }))} placeholder="JSA" /></div>
              <div className="field"><label htmlFor="export-font">Typography</label><select id="export-font" value={appearance.font} onChange={(e) => setAppearance((a) => ({ ...a, font: e.target.value }))}><option value="system">System UI</option><option value="arial">Arial</option><option value="georgia">Georgia</option></select></div>
              <div className="field"><label htmlFor="export-radius">Card corners</label><select id="export-radius" value={appearance.radius} onChange={(e) => setAppearance((a) => ({ ...a, radius: e.target.value }))}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="rounded">Extra rounded</option></select></div>
              <div className="field"><label htmlFor="export-spacing">Layout spacing</label><select id="export-spacing" value={appearance.spacing} onChange={(e) => setAppearance((a) => ({ ...a, spacing: e.target.value }))}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="spacious">Spacious</option></select></div>
              <label className="check"><input type="checkbox" checked={appearance.showFooter} onChange={(e) => setAppearance((a) => ({ ...a, showFooter: e.target.checked }))} /> Include export footer and notes</label>
            </div>
            <div>
              <p className="field-label" style={{ marginTop: 0 }}>Color palette</p>
              {[['accent','Accent color'],['background','Page background'],['panel','Card background'],['text','Main text'],['muted','Secondary text']].map(([key,label]) => <div key={key} style={{ marginBottom: 12 }}>
                <label className="row tight" style={{ justifyContent: 'space-between', gap: 10 }}><span>{label}</span><span className="row tight" style={{ gap: 6 }}>
                  <input aria-label={`${label} picker`} type="color" value={appearance[key]} onFocus={() => setActiveExportColorField(key)} onChange={(e) => { const color = e.target.value.toUpperCase(); setAppearance((a) => ({ ...a, preset: 'custom', [key]: color })); setSavedExportColors((prev) => [color, ...prev.filter((c) => c.toLowerCase() !== color.toLowerCase())].slice(0, 16)); }} style={{ width: 48, height: 36, padding: 3, cursor: 'pointer' }} />
                  <input aria-label={`${label} hex code`} value={hexDrafts[key] ?? appearance[key]} onFocus={() => setActiveExportColorField(key)} maxLength={7} placeholder="#RRGGBB" onChange={(e) => { const raw = e.target.value.trim(); setHexDrafts((prev) => ({ ...prev, [key]: raw })); if (/^#[0-9a-f]{6}$/i.test(raw)) setAppearance((a) => ({ ...a, preset: 'custom', [key]: raw.toUpperCase() })); }} onBlur={(e) => { const raw = e.target.value.trim(); setHexDrafts((prev) => ({ ...prev, [key]: appearance[key] })); if (/^#[0-9a-f]{6}$/i.test(raw)) setSavedExportColors((prev) => [raw.toUpperCase(), ...prev.filter((c) => c.toLowerCase() !== raw.toLowerCase())].slice(0, 16)); }} style={{ width: 105 }} />
                  <select aria-label={`Copy color to ${label}`} title="Copy another color" onFocus={() => setActiveExportColorField(key)} value="" onChange={(e) => { const source = e.target.value; if (source) { const color = appearance[source]; setAppearance((a) => ({ ...a, preset: 'custom', [key]: color })); setSavedExportColors((prev) => [color, ...prev.filter((c) => c.toLowerCase() !== color.toLowerCase())].slice(0, 16)); } }} style={{ width: 72 }}><option value="">Copy…</option>{[['accent','Accent'],['background','Page'],['panel','Card'],['text','Text'],['muted','Secondary']].filter(([source]) => source !== key).map(([source,name]) => <option key={source} value={source}>{name}</option>)}</select>
                </span></label>
              </div>)}
              <div className="small muted" style={{ margin: '8px 0 6px' }}>Recent colors — tap any swatch to reuse it for the selected color field.</div>
              <div className="row tight" style={{ flexWrap: 'wrap', gap: 7 }} aria-label="Recent export colors">{savedExportColors.map((color) => <button type="button" key={color} title={`Apply ${color}`} aria-label={`Apply color ${color}`} onClick={() => { setAppearance((a) => ({ ...a, preset: 'custom', [activeExportColorField || 'accent']: color })); }} style={{ width: 30, height: 30, borderRadius: 7, border: '2px solid var(--border)', background: color, cursor: 'pointer' }} />)}</div>
              <div aria-label="Export theme preview" style={{ background: appearance.background, color: appearance.text, border: `1px solid ${appearance.muted}55`, borderRadius: appearance.radius === 'compact' ? 8 : appearance.radius === 'rounded' ? 22 : 14, padding: appearance.spacing === 'compact' ? 10 : appearance.spacing === 'spacious' ? 22 : 15, marginTop: 16, fontFamily: appearance.font === 'arial' ? 'Arial,sans-serif' : appearance.font === 'georgia' ? 'Georgia,serif' : 'system-ui,sans-serif' }}>
                <div style={{ color: appearance.accent, fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>{appearance.brandLabel || 'JSA'} · PREVIEW</div><div style={{ fontSize: 18, fontWeight: 750, margin: '5px 0 12px' }}>{draft.title || 'Untitled dashboard'}</div><div style={{ background: appearance.panel, border: `1px solid ${appearance.muted}44`, borderRadius: appearance.radius === 'compact' ? 6 : appearance.radius === 'rounded' ? 18 : 12, padding: 14 }}><div style={{ color: appearance.muted, fontSize: 12 }}>TOTAL REVENUE</div><div style={{ fontSize: 25, fontWeight: 800, margin: '2px 0' }}>₦2,450,000</div><div style={{ color: appearance.accent, fontSize: 12 }}>↗ Sample KPI card</div></div><div style={{ display: 'flex', gap: 5, alignItems: 'end', height: 48, padding: '8px 3px 0' }}>{[35,55,43,78,64,95,72].map((h,i) => <span key={i} style={{ height: `${h}%`, flex: 1, borderRadius: 3, background: appearance.accent, opacity: .45 + i * .08 }} />)}</div><div style={{ color: appearance.muted, fontSize: 11, marginTop: 7 }}>Preview only · exported charts retain their saved data and settings</div></div>
            </div>
          </div>
          <div className="row tight" style={{ marginTop: 18 }}><button className="btn" onClick={() => setAppearance({ ...DEFAULT_EXPORT_APPEARANCE })}>Reset appearance</button><button className="btn push" onClick={() => setAppearanceOpen(false)}>Cancel</button><button className="btn primary" onClick={() => { if (exportFormat === 'static') { setAppearanceOpen(false); downloadHtml(); } else { setExportColumns(ds.columns.map((c) => c.id)); setAppearanceOpen(false); setInteractiveExportOpen(true); } }}>Continue to {exportFormat === 'static' ? 'static export' : 'interactive export'}</button></div>
        </section>
      </div>}
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
    <aside className="card settings settings-redesign" role="dialog" aria-modal="true" aria-labelledby="component-settings-title" aria-label="Component settings">
      <div className="row tight settings-title"><div className="settings-heading-copy"><strong id="component-settings-title">Component settings</strong><span>Customize this dashboard element.</span></div><button className="iconbtn push" aria-label="Close component settings" onClick={onClose}><X size={16} aria-hidden /></button></div>
      <div className="field"><label htmlFor="ct">Title</label><input id="ct" value={comp.title} onChange={(e) => onChange({ title: e.target.value })} /></div>
      {(comp.type === 'chart' || comp.type === 'table') && <div className="field"><label htmlFor="cv">{comp.type === 'table' ? 'Source chart' : 'Chart'}</label><select id="cv" value={comp.config.vizId} onChange={(e) => onChange({ config: { vizId: e.target.value } })}>
        {!ds.visualizations.some((v) => v.id === comp.config.vizId) && <option value={comp.config.vizId}>(deleted chart)</option>}
        {ds.visualizations.map((v) => <option key={v.id} value={v.id}>{v.title || 'Untitled chart'}</option>)}</select></div>}
      {comp.type === 'chart' && <><label className="check"><input type="checkbox" checked={comp.config.showValues === undefined ? !!ds.visualizations.find((v) => v.id === comp.config.vizId)?.showValues : !!comp.config.showValues} onChange={(e) => onChange({ config: { showValues: e.target.checked } })} /> Show data values on chart</label><div className="field"><label htmlFor="sort-by">Sort categories</label><select id="sort-by" value={comp.config.sortBy ?? ds.visualizations.find((v) => v.id === comp.config.vizId)?.sort?.by ?? 'auto'} onChange={(e) => onChange({ config: { sortBy: e.target.value } })}><option value="auto">Automatic</option><option value="label">Alphabetical / label</option><option value="value">By value</option></select></div><div className="field"><label htmlFor="sort-dir">Sort direction</label><select id="sort-dir" value={comp.config.sortDir ?? ds.visualizations.find((v) => v.id === comp.config.vizId)?.sort?.dir ?? 'desc'} onChange={(e) => onChange({ config: { sortDir: e.target.value } })}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div><button className="btn small-btn" onClick={() => onAddTable(comp.config.vizId, comp.title)}>Add separate data table below chart</button></>}
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
