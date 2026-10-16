import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FlaskConical } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';

export default function HomePage() {
  const { importFile, loadSample, error, datasets } = useDatasets();
  const input = useRef(null);
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const go = (ds) => ds && nav(`/dataset/${ds.id}`);
  const openSample = async () => {
    if (busy) return;
    setBusy(true);
    try { go(await loadSample()); } finally { setBusy(false); }
  };
  const openFile = async (file) => {
    if (!file || busy) return;
    setBusy(true);
    try { go(await importFile(file)); } finally { setBusy(false); }
  };

  return (
    <div className="page">
      <h1>Bring in a dataset</h1>
      <p className="muted">Import a file to inspect its structure, spot quality problems and see statistics. Everything runs in your browser; nothing is uploaded anywhere.</p>
      <div className="row">
        <button className="btn primary" disabled={busy} onClick={() => input.current?.click()}><Upload size={16} aria-hidden /> Import CSV, TSV or JSON</button>
        <button className="btn" disabled={busy} onClick={openSample}><FlaskConical size={16} aria-hidden /> {busy ? 'Opening…' : 'Open sample sales data'}</button>
        <input ref={input} type="file" accept=".csv,.tsv,.txt,.json" hidden
          onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; await openFile(f); }} />
      </div>
      {busy && <p className="import-status muted" role="status">Reading and preparing your dataset… Please keep JSA open.</p>}
      {error && <div role="alert" className="alert error">{error}</div>}
      <h2>Open datasets</h2>
      {datasets.length === 0 ? <p className="muted">None yet. Import a file or open the sample to begin.</p> : (
        <ul className="list">
          {datasets.map((d) => (
            <li key={d.id}><button className="linkbtn" onClick={() => nav(`/dataset/${d.id}`)}>{d.name}</button>
              <span className="muted"> {d.rowCount.toLocaleString()} rows, {d.columns.length} columns</span></li>
          ))}
        </ul>
      )}
      <p className="muted small">Your datasets, cleaning steps, analyses, charts and dashboards are saved in this browser only (IndexedDB). Clearing site data or using a private window deletes them, so export dashboard configurations you want to keep.</p>
    </div>
  );
}
