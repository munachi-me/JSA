import { useState } from 'react';
import { STEPS } from '../../core/transforms/stepRegistry.js';
import { TYPES, isNumericType } from '../../core/data/dataTypes.js';
import FilterEditor from './FilterEditor.jsx';

const accepts = (kind, c) => kind === 'numeric' ? isNumericType(c.type)
  : kind === 'text' ? ['text', 'categorical', 'identifier'].includes(c.type)
  : kind === 'date' ? c.type === 'date' || c.type === 'datetime' : true;

function defaults(def, ds) {
  const p = {};
  for (const f of def.params) {
    if (f.default !== undefined) p[f.name] = f.default;
    else if (f.kind === 'column') p[f.name] = ds.columns.find((c) => accepts(f.types, c))?.id ?? '';
    else if (f.kind === 'columns' || f.kind === 'conditions') p[f.name] = [];
    else if (f.kind === 'type') p[f.name] = 'text';
    else p[f.name] = '';
  }
  return p;
}

export default function StepForm({ ds, type, onApply }) {
  const def = STEPS[type];
  const [params, setParams] = useState(() => defaults(def, ds));
  const [preview, setPreview] = useState(null);
  const set = (name, v) => { setParams((p) => ({ ...p, [name]: v })); setPreview(null); };

  const runPreview = () => {
    try { const out = def.apply(ds, params); setPreview({ ok: true, text: `${out.summary} (Preview only; nothing has changed yet.)` }); }
    catch (e) { setPreview({ ok: false, text: e.message }); }
  };

  return (
    <div className="stepform">
      {def.params.map((f) => {
        const id = `${type}-${f.name}`;
        const cols = ds.columns.filter((c) => accepts(f.types, c));
        return (
          <div className="field" key={f.name}>
            <label htmlFor={id}>{f.label}</label>
            {f.kind === 'column' && <select id={id} value={params[f.name]} onChange={(e) => set(f.name, e.target.value)}>{cols.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
            {f.kind === 'columns' && (
              <div id={id} className="checks">{ds.columns.map((c) => (
                <label key={c.id} className="check"><input type="checkbox" checked={params[f.name].includes(c.id)}
                  onChange={(e) => set(f.name, e.target.checked ? [...params[f.name], c.id] : params[f.name].filter((x) => x !== c.id))} /> {c.name}</label>))}</div>)}
            {f.kind === 'select' && <select id={id} value={params[f.name]} onChange={(e) => set(f.name, e.target.value)}>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
            {f.kind === 'type' && <select id={id} value={params[f.name]} onChange={(e) => set(f.name, e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>}
            {f.kind === 'text' && <input id={id} value={params[f.name]} onChange={(e) => set(f.name, e.target.value)} />}
            {f.kind === 'number' && <input id={id} type="number" step="any" value={params[f.name]} onChange={(e) => set(f.name, e.target.value)} />}
            {f.kind === 'conditions' && <FilterEditor columns={ds.columns} value={params[f.name]} onChange={(v) => set(f.name, v)} />}
          </div>);
      })}
      <div className="row tight">
        <button className="btn" onClick={runPreview}>Preview change</button>
        <button className="btn primary" onClick={() => onApply(type, params)}>Add step</button>
      </div>
      {preview && <div role="status" className={`alert ${preview.ok ? '' : 'error'}`}>{preview.text}</div>}
    </div>
  );
}
