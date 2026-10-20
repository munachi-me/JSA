import { useNavigate, useParams, Link } from 'react-router-dom';
import { Database, ArrowRight, FileUp, Sparkles } from 'lucide-react';
import { useDatasets } from '../../app/DatasetContext.jsx';

/** Resolves the active dataset from the route (or the first open one) and renders a switcher. */
export function useActiveDataset() {
  const { id } = useParams();
  const { datasets } = useDatasets();
  return id ? datasets.find((d) => d.id === id) : datasets[0];
}

export function NoDataset({ title }) {
  return (
    <div className="page wide dataset-page no-dataset-page">
      <div className="dataset-page-heading">
        <div className="dataset-heading-copy">
          <div className="dataset-eyebrow"><Database size={14} /> DATA WORKSPACE <span> / </span> {String(title || 'WORKSPACE').toLocaleUpperCase()}</div>
          <h1>{title || 'Workspace'}</h1>
          <p>{title === 'Dataset Explorer'
            ? 'Your data workspace is ready. Import a file or open a sample to inspect columns, preview records, and review data quality.'
            : 'Your workspace is ready. Open a dataset to unlock the tools and insights in this section.'}</p>
        </div>
      </div>
      <section className="no-dataset-card" aria-labelledby="no-dataset-title">
        <div className="no-dataset-art" aria-hidden="true"><Database size={27} /><span><Sparkles size={14} /></span></div>
        <span className="no-dataset-kicker">NOTHING OPEN YET</span>
        <h2 id="no-dataset-title">{title === 'Dataset Explorer' ? 'Bring your data into JSA' : 'Open a dataset first'}</h2>
        <p>{title === 'Dataset Explorer'
          ? 'Start with a CSV or JSON file, or explore the sample dataset. Your columns, data preview, and quality summary will appear here once a dataset is open.'
          : 'Import a CSV or JSON file, or load the sample dataset. Your workspace will appear here as soon as data is available.'}</p>
        <div className="no-dataset-actions">
          <Link className="btn primary" to="/"><FileUp size={16} /> Import or open data <ArrowRight size={15} /></Link>
          <Link className="no-dataset-secondary" to="/">Go to Home</Link>
        </div>
        <div className="no-dataset-footnote"><span /> Your datasets stay in this browser</div>
      </section>
    </div>
  );
}

export default function DatasetPicker({ ds, base }) {
  const { datasets } = useDatasets();
  const nav = useNavigate();
  if (datasets.length < 2) return null;
  return (
    <label className="dataset-picker inline">
      <span>Dataset to view</span>
      <select
        aria-label={`Select dataset for ${base} page`}
        value={ds.id}
        onChange={(e) => nav(`/${base}/${e.target.value}`)}
      >
        {datasets.map((d) => (
          <option key={d.id} value={d.id}>
            {`Dataset ${datasets.indexOf(d) + 1} — ${d.name} (${d.rowCount.toLocaleString()} rows, ${d.columns.length} columns)`}
          </option>
        ))}
      </select>
    </label>
  );
}
