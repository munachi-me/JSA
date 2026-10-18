import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, EyeOff, Eye, BarChart3, LayoutDashboard, Database, Calculator, ArrowRight, Lightbulb, Sparkles, ShieldCheck, SlidersHorizontal } from 'lucide-react';
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
  const newCount = res.insights.filter((i) => !status(i.id)).length;
  const savedCount = ds.insights.filter((x) => x.status === 'saved').length;
  const dismissedCount = ds.insights.filter((x) => x.status === 'dismissed').length;
  const qualityCount = res.insights.filter((i) => i.kind === 'quality').length;

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
    <div className="page wide insights-page">
      <header className="dataset-page-heading insights-page-heading">
        <div className="dataset-heading-copy">
          <div className="dataset-eyebrow"><Database size={14} aria-hidden /> DATA WORKSPACE <span>/</span> INSIGHTS</div>
          <h1>{ds.name}</h1>
          <p>Rule-based findings calculated from the cleaned data ({ds.rowCount.toLocaleString()} rows). Discover useful patterns, data quality signals, and relationships.</p>
        </div>
        <div className="dataset-heading-actions">
          <DatasetPicker ds={ds} base="insights" />
          <Link className="btn" to={`/dataset/${ds.id}`}><Database size={15} aria-hidden /> Dataset explorer</Link>
          <Link className="btn dataset-primary-action" to={`/analysis/${ds.id}`}><Calculator size={15} aria-hidden /> Analysis <ArrowRight size={15} aria-hidden /></Link>
        </div>
      </header>

      <section className="insights-summary-grid" aria-label="Insight summary">
        <article className="insights-summary-card"><span className="insights-summary-icon violet"><Lightbulb size={19} aria-hidden /></span><div><span>New findings</span><strong>{newCount.toLocaleString()}</strong><small>Ready for review</small></div></article>
        <article className="insights-summary-card"><span className="insights-summary-icon blue"><BookmarkCheck size={19} aria-hidden /></span><div><span>Saved insights</span><strong>{savedCount.toLocaleString()}</strong><small>Kept in your library</small></div></article>
        <article className="insights-summary-card"><span className="insights-summary-icon amber"><EyeOff size={19} aria-hidden /></span><div><span>Dismissed</span><strong>{dismissedCount.toLocaleString()}</strong><small>Hidden from new findings</small></div></article>
        <article className="insights-summary-card"><span className="insights-summary-icon green"><ShieldCheck size={19} aria-hidden /></span><div><span>Quality signals</span><strong>{qualityCount.toLocaleString()}</strong><small>Potential data issues</small></div></article>
      </section>

      {msg && <div role="status" className="alert insights-message">{msg}</div>}

      <details className="card insights-measure-settings"><summary><SlidersHorizontal size={15} aria-hidden /> Numeric summary settings <span className="muted small">Adjust how numeric columns are summarized</span></summary>
        <p className="muted small">Totals suit additive columns (units, revenue). Averages suit per-unit or rate columns (price, rating). JSA guesses from the column name; change it if the guess is wrong.</p>
        {numeric.length === 0 ? <p className="muted">This dataset has no numeric columns.</p> : <div className="insights-measure-grid">{numeric.map((c) => (
          <label key={c.id} className="insights-measure-control"><span>{c.name}</span><select aria-label={`Summary method for ${c.name}`} value={opts.measureOps?.[c.id] || defaults[c.id]} onChange={(e) => setInsightOptions(ds.id, { ...opts, measureOps: { ...(opts.measureOps || {}), [c.id]: e.target.value } })}><option value="sum">Total</option><option value="mean">Average</option></select></label>))}</div>}
      </details>

      <section className="insights-results-section">
        <div className="insights-results-heading"><div><span className="insights-section-kicker">FINDINGS WORKSPACE</span><h2>Explore insights</h2><p>Review new patterns, save useful findings, or add them to a dashboard.</p></div><div className="insights-live-badge"><span /> Calculated from {ds.rowCount.toLocaleString()} rows</div></div>
        <div className="insights-toolbar">
          <div className="insights-tabs" role="group" aria-label="Insight status">
            {[['active', 'New', newCount], ['saved', 'Saved', savedCount], ['dismissed', 'Dismissed', dismissedCount]].map(([k, l, count]) => <button key={k} className={`btn ${tab === k ? 'primary' : ''}`} aria-pressed={tab === k} onClick={() => setTab(k)}>{l}<span className="insights-tab-count">{count}</span></button>)}
          </div>
          <div className="insights-toolbar-filters">
            <label className="insights-filter-control"><span>Finding type</span><select aria-label="Filter insights by type" value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">All types</option>{['fact', 'association', 'quality'].map((k) => <option key={k} value={k}>{kindLabel(k)}</option>)}</select></label>
            {ds.dashboards.length > 0 && <label className="insights-filter-control"><span>Add to dashboard</span><select aria-label="Target dashboard" value={dashId} onChange={(e) => setTarget(e.target.value)}>{ds.dashboards.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select></label>}
          </div>
        </div>

        {res.skipped.length > 0 && <details className="insights-skipped-note"><summary>Why some checks were skipped ({res.skipped.length})</summary>{res.skipped.map((s, i) => <p key={i} className="muted small">{s}</p>)}</details>}
        {shown.length === 0 ? <div className="empty-chart insights-empty-state"><div className="insights-empty-icon"><Sparkles size={22} aria-hidden /></div><strong>{tab === 'active' ? 'No new insights found' : tab === 'saved' ? 'No saved insights yet' : 'No dismissed insights'}</strong>
          <p className="muted">{tab === 'active' ? 'JSA did not find a pattern that meets its thresholds in this data. That is a valid result: small or uniform datasets may have nothing notable to report.' : tab === 'saved' ? 'Save a useful finding to keep it here and add it to dashboards.' : 'Dismissed findings stay here so you can restore them whenever you need.'}</p></div> : (
          <div className="insight-list insights-results-list">{shown.map((ins) => {
            const st = status(ins.id)?.status;
            const stale = tab === 'saved' && !live.has(ins.id);
            return (
              <InsightCard key={ins.id} insight={ins} note={stale ? 'This saved insight is not detected in the current data (it may have changed after cleaning). The text below is a snapshot.' : null}
                actions={<div className="row tight insights-card-actions">
                  {st === 'saved' ? <button className="btn small-btn" onClick={() => setInsightStatus(ds.id, ins.id, null)}><BookmarkCheck size={14} aria-hidden /> Unsave</button>
                    : <button className="btn small-btn" onClick={() => setInsightStatus(ds.id, ins.id, 'saved', ins)}><Bookmark size={14} aria-hidden /> Save</button>}
                  {st === 'dismissed' ? <button className="btn small-btn" onClick={() => setInsightStatus(ds.id, ins.id, null)}><Eye size={14} aria-hidden /> Restore</button>
                    : st !== 'saved' && <button className="btn small-btn" onClick={() => setInsightStatus(ds.id, ins.id, 'dismissed')}><EyeOff size={14} aria-hidden /> Dismiss</button>}
                  {ins.chartSpec && <button className="btn small-btn" onClick={() => saveChart(ins)}><BarChart3 size={14} aria-hidden /> Save as chart</button>}
                  <button className="btn small-btn" disabled={!dashId} onClick={() => toDashboard(ins)}><LayoutDashboard size={14} aria-hidden /> Add to dashboard</button>
                </div>} />);
          })}</div>)}
        {res.truncated > 0 && tab === 'active' && <p className="muted small insights-truncated-note">{res.truncated} lower-priority insight{res.truncated === 1 ? '' : 's'} not shown.</p>}
      </section>
    </div>
  );
}
