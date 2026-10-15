import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';
import { STEPS } from '../core/transforms/stepRegistry.js';
import StepForm from '../components/data/StepForm.jsx';
import DatasetPicker, { useActiveDataset, NoDataset } from '../components/data/DatasetPicker.jsx';

export default function CleanPage() {
  const ds = useActiveDataset();
  const { addStep, removeStep, moveStep, clearSteps } = useDatasets();
  const [type, setType] = useState('filterRows');
  if (!ds) return <NoDataset title="Clean data" />;
  const { steps, results } = ds.pipeline;

  return (
    <div className="page wide">
      <h1>Clean data: {ds.name}</h1>
      <p className="muted">Steps run in order on a copy. Your original import is never changed; remove a step to undo it. <Link to={`/dataset/${ds.id}`}>View dataset</Link> · <Link to={`/analysis/${ds.id}`}>Analyze</Link></p>
      <DatasetPicker ds={ds} base="clean" />
      <div className="stat-row">
        <div><span className="muted">Original rows</span><strong>{ds.sourceRowCount.toLocaleString()}</strong></div>
        <div><span className="muted">Current rows</span><strong>{ds.rowCount.toLocaleString()}</strong></div>
        <div><span className="muted">Steps</span><strong>{steps.length}</strong></div>
      </div>

      <div className="two-col">
        <section>
          <h2>Add a step</h2>
          <div className="field"><label htmlFor="steptype">Operation</label>
            <select id="steptype" value={type} onChange={(e) => setType(e.target.value)}>{Object.entries(STEPS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select></div>
          <StepForm key={`${ds.id}-${type}`} ds={ds} type={type} onApply={(t, p) => addStep(ds.id, t, p)} />
        </section>
        <section>
          <h2>Pipeline</h2>
          <p className="muted small">Steps run from top to bottom. Use the arrows to change the order; later steps run on the result of earlier steps.</p>
          {steps.length === 0 ? <p className="muted">No steps yet. Add one to start cleaning.</p> : (
            <ol className="pipeline">{steps.map((s, i) => {
              const r = results[i];
              return (
                <li key={s.id} className={r.ok ? '' : 'failed'}>
                  <div><strong>{i + 1}. {STEPS[s.type]?.label ?? s.type}</strong>
                    <div className={r.ok ? 'muted small' : 'errtext small'}>{r.ok ? r.summary : `Skipped: ${r.error}`}</div>
                    {r.ok && Number.isFinite(r.rowsBefore) && Number.isFinite(r.rowsAfter) && r.rowsBefore !== r.rowsAfter &&
                      <div className="muted small">Rows: {r.rowsBefore.toLocaleString()} → {r.rowsAfter.toLocaleString()}</div>}
                  </div>
                  <div className="pipeline-actions" aria-label={`Controls for step ${i + 1}`}>
                    <button type="button" className="iconbtn" aria-label={`Move step ${i + 1} up`} title="Move up" disabled={i === 0} onClick={() => moveStep(ds.id, s.id, -1)}><ArrowUp size={14} aria-hidden /></button>
                    <button type="button" className="iconbtn" aria-label={`Move step ${i + 1} down`} title="Move down" disabled={i === steps.length - 1} onClick={() => moveStep(ds.id, s.id, 1)}><ArrowDown size={14} aria-hidden /></button>
                    <button type="button" className="iconbtn" aria-label={`Remove step ${i + 1}`} title="Remove step" onClick={() => removeStep(ds.id, s.id)}><Trash2 size={14} aria-hidden /></button>
                  </div>
                </li>);
            })}</ol>)}
          {steps.length > 0 && <button className="btn" onClick={() => { if (confirm('Remove all steps and return to the original data?')) clearSteps(ds.id); }}>Reset to original</button>}
        </section>
      </div>
    </div>
  );
}
