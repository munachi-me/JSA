import { Plus, X } from 'lucide-react';
import { FILTER_OPS } from '../../core/transforms/filters.js';

export default function FilterEditor({ columns, value = [], onChange }) {
  const set = (i, patch) => onChange(value.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const add = () => onChange([...value, { column: columns[0]?.id, op: 'eq', value: '', value2: '' }]);
  return (
    <div className="filters">
      {value.length === 0 && <p className="muted small">No conditions: every row is included.</p>}
      {value.map((c, i) => {
        const def = FILTER_OPS.find((o) => o.id === c.op);
        const col = columns.find((x) => x.id === c.column);
        const inputType = col && (col.type === 'date' || col.type === 'datetime') ? 'date' : 'text';
        return (
          <div className="row tight" key={i}>
            <select aria-label="Column" value={c.column} onChange={(e) => set(i, { column: e.target.value })}>{columns.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select aria-label="Operator" value={c.op} onChange={(e) => set(i, { op: e.target.value })}>{FILTER_OPS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
            {!def.noValue && <input aria-label="Value" type={inputType} value={c.value} onChange={(e) => set(i, { value: e.target.value })} />}
            {def.second && <><span className="muted">and</span><input aria-label="Upper value" type={inputType} value={c.value2} onChange={(e) => set(i, { value2: e.target.value })} /></>}
            <button className="iconbtn" aria-label="Remove condition" onClick={() => onChange(value.filter((_, k) => k !== i))}><X size={14} aria-hidden /></button>
          </div>);
      })}
      <button className="btn small-btn" onClick={add} disabled={!columns.length}><Plus size={14} aria-hidden /> Add condition</button>
    </div>
  );
}
