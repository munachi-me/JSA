import { AGG_OPS } from '../../core/analytics/aggregation.js';
import FilterEditor from './FilterEditor.jsx';

export default function PartEditor({ ds, part, onChange, title }) {
  const set = (patch) => onChange({ ...part, ...patch });
  return (
    <fieldset className="part">
      <legend>{title}</legend>
      <div className="row tight">
        <select aria-label={`${title} operation`} value={part.op} onChange={(e) => set({ op: e.target.value })}>{AGG_OPS.map((o) => <option key={o}>{o}</option>)}</select>
        {part.op !== 'count' && <select aria-label={`${title} column`} value={part.column || ''} onChange={(e) => set({ column: e.target.value })}>
          <option value="">Choose column</option>{ds.columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
      </div>
      <details><summary>Only rows where… {part.filters?.length ? `(${part.filters.length})` : ''}</summary>
        <FilterEditor columns={ds.columns} value={part.filters || []} onChange={(filters) => set({ filters })} /></details>
    </fieldset>
  );
}
