import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';
import { STEPS } from '../core/transforms/stepRegistry.js';
import StepForm from '../components/data/StepForm.jsx';
import DatasetPicker, { useActiveDataset, NoDataset } from '../components/data/DatasetPicker.jsx';

export default function CleanPage() {
  const ds = useActiveDataset();
  const { addStep, removeStep, clearSteps } = useDatasets();
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
          {steps.length === 0 ? <p className="muted">No steps yet. Add one to start cleaning.</p> : (
            <ol className="pipeline">{steps.map((s, i) => {
              const r = results[i];
              return (
                <li key={s.id} className={r.ok ? '' : 'failed'}>
                  <div><strong>{STEPS[s.type]?.label ?? s.type}</strong>
                    <div className={r.ok ? 'muted small' : 'errtext small'}>{r.ok ? r.summary : `Skipped: ${r.error}`}</div></div>
                  <button className="iconbtn" aria-label={`Remove step ${i + 1}`} onClick={() => removeStep(ds.id, s.id)}><Trash2 size={14} aria-hidden /></button>
                </li>);
            })}</ol>)}
          {steps.length > 0 && <button className="btn" onClick={() => { if (confirm('Remove all steps and return to the original data?')) clearSteps(ds.id); }}>Reset to original</button>}
        </section>
      </div>
    </div>
  );
}
