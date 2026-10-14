import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FlaskConical } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';

export default function HomePage() {
  const { importFile, loadSample, error, datasets } = useDatasets();
  const input = useRef(null);
  const nav = useNavigate();
  const go = (ds) => ds && nav(`/dataset/${ds.id}`);

  return (
    <div className="page">
      <h1>Bring in a dataset</h1>
      <p className="muted">Import a file to inspect its structure, spot quality problems and see statistics. Everything runs in your browser; nothing is uploaded anywhere.</p>
      <div className="row">
        <button className="btn primary" onClick={() => input.current.click()}><Upload size={16} aria-hidden /> Import CSV or JSON</button>
        <button className="btn" onClick={async () => go(await loadSample())}><FlaskConical size={16} aria-hidden /> Open sample sales data</button>
        <input ref={input} type="file" accept=".csv,.tsv,.txt,.json" hidden
          onChange={async (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) go(await importFile(f)); }} />
      </div>
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
      <p className="muted small">Datasets live in memory for this session. Persistent projects arrive in a later phase, so reloading the page clears them.</p>
    </div>
  );
}
