import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDatasets } from '../../app/DatasetContext.jsx';

/** Resolves the active dataset from the route (or the first open one) and renders a switcher. */
export function useActiveDataset() {
  const { id } = useParams();
  const { datasets } = useDatasets();
  return id ? datasets.find((d) => d.id === id) : datasets[0];
}

export function NoDataset({ title }) {
  return <div className="page"><h1>{title}</h1><p className="muted">Open a dataset first. Go to <Link to="/">Home</Link> to import one or open the sample.</p></div>;
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
