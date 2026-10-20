import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Activity, AlertCircle, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, CircleAlert, Database, Info, Lightbulb, ScanSearch, ShieldCheck } from 'lucide-react';
import { analyzeDataset } from '../../core/data/intelligence.js';

const fmt = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 3 });

export default function DatasetIntelligencePanel({ ds }) {
  const report = useMemo(() => analyzeDataset(ds), [ds]);
  const [showColumns, setShowColumns] = useState(false);
  const { id } = useParams();
  const routeId = id || ds.id;
  const actionHref = (action) => action === 'clean' ? `/clean/${routeId}` : action === 'analysis' ? `/analysis/${routeId}` : `/dataset/${routeId}`;
  const Icon = report.score >= 90 ? ShieldCheck : report.score >= 75 ? Activity : AlertCircle;
  return (
    <section className="dataset-intelligence card" aria-labelledby="dataset-intelligence-title">
      <div className="dataset-intelligence-head">
        <div className="dataset-intelligence-title"><span className="dataset-intelligence-icon"><Database size={19} /></span><div><span className="dataset-section-kicker">DATASET INTELLIGENCE ENGINE</span><h2 id="dataset-intelligence-title">What JSA found</h2><p>Automated checks and evidence-based next steps for this dataset.</p></div></div>
        <div className={`dataset-health-score ${report.score >= 90 ? 'good' : report.score >= 75 ? 'fair' : 'attention'}`}><Icon size={18} /><strong>{report.score}</strong><span>/ 100</span><small>{report.scoreLabel} data health</small></div>
      </div>
      <div className="dataset-intelligence-metrics">
        <div><span>Completeness</span><strong>{((1 - report.summary.missingRate) * 100).toFixed(1)}%</strong><small>{fmt(report.summary.missingCells)} missing cells</small></div>
        <div><span>Exact duplicates</span><strong>{fmt(report.summary.duplicateRows)}</strong><small>{(report.summary.duplicateRate * 100).toFixed(1)}% of rows</small></div>
        <div><span>Numeric fields</span><strong>{fmt(report.summary.numericColumns)}</strong><small>{fmt(report.summary.outlierColumns)} with possible outliers</small></div>
        <div><span>Date fields</span><strong>{fmt(report.summary.dateColumns)}</strong><small>Detected date ranges</small></div>
      </div>
      <div className="dataset-intelligence-recommendations">
        <div className="dataset-intelligence-subhead"><h3><Lightbulb size={16} /> Recommended next steps</h3><span>{report.recommendations.length} finding(s)</span></div>
        {report.recommendations.map((item) => <article key={item.id} className={`dataset-intelligence-item ${item.severity}`}>
          <span className="dataset-intelligence-item-icon">{item.severity === 'good' ? <CheckCircle2 size={17} /> : item.severity === 'high' ? <CircleAlert size={17} /> : <Info size={17} />}</span>
          <div className="dataset-intelligence-item-copy"><strong>{item.title}</strong><p>{item.detail}</p>{item.columns?.length > 0 && <small>Columns: {item.columns.join(', ')}</small>}</div>
          <Link className="btn small-btn" to={actionHref(item.action)}>{item.actionLabel}<ArrowRight size={13} /></Link>
        </article>)}
      </div>
      <div className="dataset-intelligence-columns-toggle"><button className="btn" type="button" aria-expanded={showColumns} onClick={() => setShowColumns((v) => !v)}><ScanSearch size={15} /> Column profiles {showColumns ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button><span>Missingness, distinct values, numeric ranges, and date ranges</span></div>
      {showColumns && <div className="dataset-intelligence-table-wrap"><table className="dataset-intelligence-table"><thead><tr><th>Column</th><th>Type</th><th>Missing</th><th>Distinct</th><th>Profile / signal</th></tr></thead><tbody>{report.columnProfiles.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.type}</td><td>{c.count ? `${(c.missingRate * 100).toFixed(1)}%` : '—'}</td><td>{fmt(c.distinct)}</td><td>{c.constant ? 'Constant value' : c.likelyIdentifier ? 'Identifier-like' : c.numeric ? `Min ${fmt(c.numeric.min)} · Median ${fmt(c.numeric.median)} · Max ${fmt(c.numeric.max)}${c.numeric.outliers ? ` · ${c.numeric.outliers} possible outlier(s)` : ''}` : c.dateRange ? `${c.dateRange.start.slice(0, 10)} → ${c.dateRange.end.slice(0, 10)}` : c.missingRate >= 0.2 ? 'High missingness' : 'No standout signal'}</td></tr>)}</tbody></table></div>}
      <p className="dataset-intelligence-method"><Info size={13} /> {report.methodology}</p>
    </section>
  );
}
