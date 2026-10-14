import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, EyeOff, Eye, BarChart3, LayoutDashboard } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';
import { generateInsights, defaultMeasureOps } from '../core/insights/insightEngine.js';
import { makeSpec, normalizeSpec } from '../core/visualization/chartSpec.js';
import { addComponent } from '../core/dashboard/dashboardSchema.js';
import { isNumericType } from '../core/data/dataTypes.js';
import InsightCard, { kindLabel } from '../components/insights/InsightCard.jsx';
import DatasetPicker, { useActiveDataset, NoDataset } from '../components/data/DatasetPicker.jsx';

export default function InsightsPage() {
  const ds = useActiveDataset();
  if (!ds) return <NoDataset title="Insights" />;
  return <Inner key={ds.id} ds={ds} />;
}

function Inner({ ds }) {
  const { setInsightStatus, setInsightOptions, saveViz, saveDashboard } = useDatasets();
  const [tab, setTab] = useState('active');
  const [kind, setKind] = useState('all');
  const [msg, setMsg] = useState(null);
  const [target, setTarget] = useState('');
  const opts = ds.insightOptions || {};
  const res = useMemo(() => generateInsights(ds, opts), [ds, opts]);
  const status = (id) => ds.insights.find((x) => x.id === id);
  const live = new Map(res.insights.map((i) => [i.id, i]));
  const numeric = ds.columns.filter((c) => isNumericType(c.type));
  const defaults = defaultMeasureOps(ds);
  const dashId = ds.dashboards.some((d) => d.id === target) ? target : ds.dashboards[0]?.id ?? '';

  const list = tab === 'active' ? res.insights.filter((i) => !status(i.id))
    : tab === 'dismissed' ? res.insights.filter((i) => status(i.id)?.status === 'dismissed')
    : ds.insights.filter((x) => x.status === 'saved' && x.insight).map((x) => live.get(x.id) || x.insight);
  const shown = list.filter((i) => kind === 'all' || i.kind === kind);

  const saveChart = (ins) => {
    const spec = normalizeSpec(ds, makeSpec({ ...ins.chartSpec, description: ins.title }));
    saveViz(ds.id, { ...spec, id: `viz${Date.now().toString(36)}` });
    setMsg(`Saved the chart “${spec.title}”. Find it on the Charts page.`);
  };
  const toDashboard = (ins) => {
    const d = ds.dashboards.find((x) => x.id === dashId);
    if (!d) return setMsg('Create a dashboard first on the Dashboards page.');
    if (status(ins.id)?.status !== 'saved') setInsightStatus(ds.id, ins.id, 'saved', ins);
    saveDashboard(ds.id, addComponent(d, 'insight', { insightId: ins.id }));
    setMsg(`Added to “${d.title}”. It is recalculated from the data each time the dashboard is shown.`);
  };

  return (
    <div className="page wide">
      <h1>Insights: {ds.name}</h1>
      <p className="muted">Rule-based findings calculated from the cleaned data ({ds.rowCount.toLocaleString()} rows). Each shows its numbers, its rule and its limits. These describe patterns in this dataset; they do not explain why they exist. <Link to={`/clean/${ds.id}`}>Clean data</Link></p>
      <DatasetPicker ds={ds} base="insights" />
      {msg && <div role="status" className="alert">{msg}</div>}

      <details className="card"><summary>How numeric columns are summarized</summary>
        <p className="muted small">Totals suit additive columns (units, revenue). Averages suit per-unit or rate columns (price, rating). The default is guessed from the column name; change it if the guess is wrong.</p>
        {numeric.length === 0 ? <p className="muted">This dataset has no numeric columns.</p> : numeric.map((c) => (
          <label key={c.id} className="inline">{c.name} <select value={opts.measureOps?.[c.id] || defaults[c.id]} onChange={(e) => setInsightOptions(ds.id, { ...opts, measureOps: { ...(opts.measureOps || {}), [c.id]: e.target.value } })}><option value="sum">Total</option><option value="mean">Average</option></select></label>))}
      </details>

      <div className="row tight">
        {[['active', 'New'], ['saved', 'Saved'], ['dismissed', 'Dismissed']].map(([k, l]) => <button key={k} className={`btn ${tab === k ? 'primary' : ''}`} aria-pressed={tab === k} onClick={() => setTab(k)}>{l}{k === 'saved' ? ` (${ds.insights.filter((x) => x.status === 'saved').length})` : ''}</button>)}
        <label className="inline">Type <select value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">All</option>{['fact', 'association', 'quality'].map((k) => <option key={k} value={k}>{kindLabel(k)}</option>)}</select></label>
        {ds.dashboards.length > 0 && <label className="inline">Add to <select value={dashId} onChange={(e) => setTarget(e.target.value)}>{ds.dashboards.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select></label>}
      </div>

      {res.skipped.map((s, i) => <p key={i} className="muted small">{s}</p>)}
      {shown.length === 0 ? <div className="empty-chart"><strong>{tab === 'active' ? 'No new insights' : 'Nothing here'}</strong>
        <p className="muted">{tab === 'active' ? 'None of the rules found a pattern that meets its thresholds in this data. That is a result, not a failure: small or uniform data often has nothing notable to report.' : tab === 'saved' ? 'Save an insight to keep it here and add it to dashboards.' : 'Dismissed insights appear here so you can restore them.'}</p></div> : (
        <div className="insight-list">{shown.map((ins) => {
          const st = status(ins.id)?.status;
          const stale = tab === 'saved' && !live.has(ins.id);
          return (
            <InsightCard key={ins.id} insight={ins} note={stale ? 'This saved insight is not detected in the current data (it may have changed after cleaning). The text below is a snapshot.' : null}
              actions={<div className="row tight">
                {st === 'saved' ? <button className="btn small-btn" onClick={() => setInsightStatus(ds.id, ins.id, null)}><BookmarkCheck size={14} aria-hidden /> Unsave</button>
                  : <button className="btn small-btn" onClick={() => setInsightStatus(ds.id, ins.id, 'saved', ins)}><Bookmark size={14} aria-hidden /> Save</button>}
                {st === 'dismissed' ? <button className="btn small-btn" onClick={() => setInsightStatus(ds.id, ins.id, null)}><Eye size={14} aria-hidden /> Restore</button>
                  : st !== 'saved' && <button className="btn small-btn" onClick={() => setInsightStatus(ds.id, ins.id, 'dismissed')}><EyeOff size={14} aria-hidden /> Dismiss</button>}
                {ins.chartSpec && <button className="btn small-btn" onClick={() => saveChart(ins)}><BarChart3 size={14} aria-hidden /> Save as chart</button>}
                <button className="btn small-btn" disabled={!dashId} onClick={() => toDashboard(ins)}><LayoutDashboard size={14} aria-hidden /> Add to dashboard</button>
              </div>} />);
        })}</div>)}
      {res.truncated > 0 && tab === 'active' && <p className="muted small">{res.truncated} lower-priority insight{res.truncated === 1 ? '' : 's'} not shown.</p>}
    </div>
  );
}
