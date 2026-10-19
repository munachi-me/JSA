import { useState } from 'react';
import { STEPS } from '../../core/transforms/stepRegistry.js';
import { TYPES, isNumericType } from '../../core/data/dataTypes.js';
import FilterEditor from './FilterEditor.jsx';
import ConditionalRulesEditor from './ConditionalRulesEditor.jsx';

const accepts = (kind, c) => kind === 'numeric' ? isNumericType(c.type)
  : kind === 'text' ? ['text', 'categorical', 'identifier'].includes(c.type)
  : kind === 'date' ? ['date', 'time', 'datetime'].includes(c.type) : true;

function defaults(def, ds) {
  const p = {};
  for (const f of def.params) {
    if (f.default !== undefined) p[f.name] = f.default;
    else if (f.kind === 'column') p[f.name] = ds.columns.find((c) => accepts(f.types, c))?.id ?? '';
    else if (f.kind === 'columns' || f.kind === 'conditions') p[f.name] = [];
    else if (f.kind === 'splitNames') { const source = ds.columns.find((c) => c.id === p.column); p[f.name] = Array.from({ length: Number(p.parts) || 2 }, (_, i) => `${source?.name || 'Column'} part ${i + 1}`); }
    else if (f.kind === 'conditionalRules') p[f.name] = [{ match: 'all', conditions: [{ column: ds.columns[0]?.id ?? '', op: 'eq', value: '' }], result: '' }];
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
    try { const out = def.apply(ds, params); setPreview({ ok: true, text: `${out.summary} (Preview only; nothing has changed yet.)`, dataset: out.dataset, inputRows: ds.rowCount, summary: out.summary }); }
    catch (e) { setPreview({ ok: false, text: e.message || 'This transformation could not be previewed.' }); }
  };

  const applyStep = () => {
    try {
      const out = def.apply(ds, params);
      onApply(type, params);
      setPreview({ ok: true, text: `Added to pipeline: ${out.summary}` });
    } catch (e) {
      setPreview({ ok: false, text: e.message || 'Check the settings and try again.' });
    }
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
            {f.kind === 'select' && (type !== 'extractDate' || f.name !== 'nameStyle' || ['monthName', 'weekday'].includes(params.part)) && <select id={id} value={params[f.name]} onChange={(e) => set(f.name, e.target.value)}>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
            {type === 'extractDate' && f.name === 'nameStyle' && !['monthName', 'weekday'].includes(params.part) && <p className="muted small">Only used when extracting a month name or weekday name.</p>}
            {f.kind === 'type' && <select id={id} value={params[f.name]} onChange={(e) => set(f.name, e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>}
            {f.kind === 'text' && <input id={id} value={params[f.name]} onChange={(e) => set(f.name, e.target.value)} />}
            {f.kind === 'splitNames' && <div className="split-name-fields">{Array.from({ length: Math.max(2, Math.min(10, Number(params.parts) || 2)) }, (_, i) => { const selected = ds.columns.find((c) => c.id === params.column); const fallback = `${selected?.name || 'Column'} part ${i + 1}`; const names = Array.isArray(params[f.name]) ? params[f.name] : []; return <label className="split-name-field" key={i} htmlFor={`${id}-${i + 1}`}><span>Output {i + 1}</span><input id={`${id}-${i + 1}`} value={names[i] ?? fallback} onChange={(e) => { const next = Array.from({ length: Math.max(2, Math.min(10, Number(params.parts) || 2)) }, (_, j) => names[j] ?? `${selected?.name || 'Column'} part ${j + 1}`); next[i] = e.target.value; set(f.name, next); }} /></label>; })}</div>}
            {f.kind === 'number' && <input id={id} type="number" step="any" value={params[f.name]} onChange={(e) => { const value = e.target.value; if (type === 'splitColumn' && f.name === 'parts') { const count = Math.max(2, Math.min(10, Number(value) || 2)); const selected = ds.columns.find((c) => c.id === params.column); const existing = params.outputNames || []; setParams((p) => ({ ...p, [f.name]: value, outputNames: Array.from({ length: count }, (_, i) => existing[i] ?? `${selected?.name || 'Column'} part ${i + 1}`) })); setPreview(null); } else set(f.name, value); }} />}
            {f.kind === 'conditions' && <FilterEditor columns={ds.columns} value={params[f.name]} onChange={(v) => set(f.name, v)} />}
            {f.kind === 'conditionalRules' && <ConditionalRulesEditor columns={ds.columns} value={params[f.name]} onChange={(v) => set(f.name, v)} />}
          </div>);
      })}
      <div className="row tight">
        <button type="button" className="btn" onClick={runPreview}>Preview change</button>
        <button type="button" className="btn primary" onClick={applyStep}>Add step</button>
      </div>
      {preview && <div role="status" className={`alert ${preview.ok ? '' : 'error'}`}>{preview.text}</div>}
      {preview?.ok && preview.dataset && <section className="transform-preview" aria-label="Transformation preview">
        <div className="transform-preview-heading"><strong>Preview output</strong><span>{preview.dataset.rowCount.toLocaleString()} rows · {preview.dataset.columns.length} columns</span></div>
        <p className="muted small">Showing the first {Math.min(25, preview.dataset.rowCount)} output rows. This preview does not modify the dataset or add a pipeline step.</p>
        <div className="scroll transform-preview-table-wrap"><table><thead><tr><th>#</th>{preview.dataset.columns.map((c) => <th key={c.id}>{c.name}</th>)}</tr></thead><tbody>{Array.from({ length: Math.min(25, preview.dataset.rowCount) }, (_, i) => <tr key={i}><td>{i + 1}</td>{preview.dataset.columns.map((c) => <td key={c.id}>{preview.dataset.data[c.id]?.[i] == null ? <span className="muted">null</span> : String(preview.dataset.data[c.id][i])}</td>)}</tr>)}</tbody></table></div>
      </section>}
    </div>
  );
}
