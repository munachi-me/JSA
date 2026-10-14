import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatasets } from '../app/DatasetContext.jsx';
import { TYPES, isNumericType } from '../core/data/dataTypes.js';
import { describe, describeCategorical } from '../core/analytics/descriptive.js';
import { profileDataset } from '../core/data/profile.js';

const PAGE = 25;
const fmt = (n) => (n === null || n === undefined ? '—' : Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 3 }));

export default function DatasetPage() {
  const { id } = useParams();
  const { datasets, overrideType, remove } = useDatasets();
  const ds = id ? datasets.find((d) => d.id === id) : datasets[0];
  const [page, setPage] = useState(0);
  const profile = useMemo(() => (ds ? profileDataset(ds) : null), [ds]);

  if (!ds) return <div className="page"><h1>No dataset open</h1><p className="muted">Go to <Link to="/">Home</Link> to import one.</p></div>;

  const pages = Math.max(1, Math.ceil(ds.rowCount / PAGE));
  const start = page * PAGE;
  const end = Math.min(start + PAGE, ds.rowCount);

  return (
    <div className="page wide">
      <h1>{ds.name}</h1>
      <p className="muted"><Link to={`/clean/${ds.id}`}>Clean</Link> · <Link to={`/analysis/${ds.id}`}>Analyze</Link></p>
      <p className="muted">{ds.rowCount.toLocaleString()} rows · {ds.columns.length} columns · {profile.duplicateRows} duplicate rows · {profile.totalMissing.toLocaleString()} missing cells{ds.pipeline.steps.length ? ` · after ${ds.pipeline.steps.length} cleaning step(s); original had ${ds.sourceRowCount.toLocaleString()} rows` : ''}</p>

      {ds.warnings.length > 0 && <div role="status" className="alert warn"><strong>Import warnings</strong><ul>{ds.warnings.slice(0, 5).map((w, i) => <li key={i}>{w.message}</li>)}</ul>{ds.warnings.length > 5 && <span>…and {ds.warnings.length - 5} more.</span>}</div>}
      {profile.issues.length > 0 && <div role="status" className="alert warn"><strong>Data quality</strong><ul>{profile.issues.map((m, i) => <li key={i}>{m}</li>)}</ul></div>}

      <h2>Columns</h2>
      <div className="scroll"><table>
        <thead><tr><th>Column</th><th>Type</th><th>Missing</th><th>Distinct</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std dev</th></tr></thead>
        <tbody>{ds.columns.map((c) => {
          const vals = ds.data[c.id];
          const num = isNumericType(c.type);
          const s = num ? describe(vals) : null;
          const cat = !num ? describeCategorical(vals) : null;
          return (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td><select aria-label={`Type for ${c.name}`} value={c.type} title={c.typeReason}
                onChange={(e) => overrideType(ds.id, c.id, e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></td>
              <td className="num">{(num ? s.missing : cat.missing).toLocaleString()}</td>
              <td className="num">{(num ? s.distinct : cat.distinct).toLocaleString()}</td>
              {num ? <><td className="num">{fmt(s.mean)}</td><td className="num">{fmt(s.median)}</td><td className="num">{fmt(s.min)}</td><td className="num">{fmt(s.max)}</td><td className="num">{fmt(s.stdDev)}</td></>
                : <td colSpan={5} className="muted">Top: {cat.top.map((t) => `${t.value} (${t.count})`).join(', ') || '—'}</td>}
            </tr>);
        })}</tbody>
      </table></div>
      <p className="muted small">Standard deviation uses the sample formula (n−1). Hover a type to see why it was inferred.</p>

      <h2>Preview</h2>
      <div className="scroll"><table>
        <thead><tr>{ds.columns.map((c) => <th key={c.id}>{c.name}</th>)}</tr></thead>
        <tbody>{Array.from({ length: end - start }, (_, k) => start + k).map((i) => (
          <tr key={i}>{ds.columns.map((c) => { const v = ds.data[c.id][i]; return <td key={c.id} className={isNumericType(c.type) ? 'num' : ''}>{v === null ? <span className="muted">null</span> : String(v)}</td>; })}</tr>
        ))}</tbody>
      </table></div>
      <div className="row pager">
        <button className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
        <span className="muted">Rows {(start + 1).toLocaleString()}–{end.toLocaleString()} of {ds.rowCount.toLocaleString()}</span>
        <button className="btn" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>
        <button className="btn danger" onClick={() => { if (confirm(`Close ${ds.name}? It is only stored in memory.`)) remove(ds.id); }}>Close dataset</button>
      </div>
    </div>
  );
}
