import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, CircleDashed, Database, RotateCcw, SlidersHorizontal, Sparkles, Trash2, WandSparkles, Calculator } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';
import { useDialogs } from '../app/DialogProvider.jsx';
import { STEPS } from '../core/transforms/stepRegistry.js';
import StepForm from '../components/data/StepForm.jsx';
import DatasetPicker, { useActiveDataset, NoDataset } from '../components/data/DatasetPicker.jsx';

export default function CleanPage() {
  const ds = useActiveDataset();
  const { addStep, removeStep, moveStep, clearSteps } = useDatasets();
  const dialogs = useDialogs();
  const [type, setType] = useState('filterRows');
  if (!ds) return <NoDataset title="Clean data" />;
  const { steps, results } = ds.pipeline;
  const successfulSteps = results.filter((r) => r?.ok).length;
  const failedSteps = results.filter((r) => r && !r.ok).length;
  const rowsChanged = ds.sourceRowCount - ds.rowCount;
  const operationCount = Object.keys(STEPS).length;

  return (
    <div className="page wide clean-page">
      <header className="dataset-page-heading clean-page-heading">
        <div className="dataset-heading-copy">
          <div className="dataset-eyebrow"><Database size={14} aria-hidden /> DATA WORKSPACE <span>/</span> CLEAN DATA</div>
          <h1>{ds.name}</h1>
          <p>Prepare your data with a repeatable cleaning pipeline. Steps run in order on a copy, so your original import stays untouched.</p>
        </div>
        <div className="dataset-heading-actions clean-heading-actions">
          <DatasetPicker ds={ds} base="clean" />
          <Link className="btn" to={`/dataset/${ds.id}`}><Database size={15} aria-hidden /> Dataset explorer</Link>
          <Link className="btn dataset-primary-action" to={`/analysis/${ds.id}`}><Calculator size={15} aria-hidden /> Analysis <ArrowRight size={15} aria-hidden /></Link>
        </div>
      </header>

      <section className="clean-summary-grid" aria-label="Cleaning summary">
        <article className="clean-summary-card">
          <div className="clean-summary-icon blue"><Database size={19} aria-hidden /></div>
          <div><span>Imported rows</span><strong>{ds.sourceRowCount.toLocaleString()}</strong><small>Original dataset</small></div>
        </article>
        <article className="clean-summary-card">
          <div className="clean-summary-icon violet"><Sparkles size={19} aria-hidden /></div>
          <div><span>Current rows</span><strong>{ds.rowCount.toLocaleString()}</strong><small>{rowsChanged > 0 ? `${rowsChanged.toLocaleString()} rows removed` : rowsChanged < 0 ? `${Math.abs(rowsChanged).toLocaleString()} rows added` : 'Row count unchanged'}</small></div>
        </article>
        <article className="clean-summary-card">
          <div className="clean-summary-icon green"><CheckCircle2 size={19} aria-hidden /></div>
          <div><span>Pipeline steps</span><strong>{steps.length}</strong><small>{successfulSteps} completed{failedSteps ? ` · ${failedSteps} skipped` : ''}</small></div>
        </article>
        <article className="clean-summary-card">
          <div className="clean-summary-icon amber"><WandSparkles size={19} aria-hidden /></div>
          <div><span>Operations</span><strong>{operationCount}</strong><small>Available to apply</small></div>
        </article>
      </section>

      <div className="clean-workspace">
        <section className="clean-panel clean-builder-panel">
          <div className="clean-panel-heading">
            <div className="clean-panel-icon"><Sparkles size={17} aria-hidden /></div>
            <div><span className="clean-section-kicker">STEP BUILDER</span><h2>Add a step</h2><p>Choose a transformation, configure it, then preview before applying.</p></div>
          </div>
          <div className="clean-operation-select field">
            <label htmlFor="steptype">Transformation</label>
            <select id="steptype" value={type} onChange={(e) => setType(e.target.value)}>{Object.entries(STEPS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select>
          </div>
          <StepForm key={`${ds.id}-${type}`} ds={ds} type={type} onApply={(t, p) => addStep(ds.id, t, p)} />
          <div className="clean-safety-note"><CheckCircle2 size={15} aria-hidden /><span><strong>Non-destructive workflow</strong>Your original imported data remains available. Remove or reorder steps whenever you need.</span></div>
        </section>

        <section className="clean-panel clean-pipeline-panel">
          <div className="clean-panel-heading clean-pipeline-heading">
            <div className="clean-panel-icon"><CircleDashed size={17} aria-hidden /></div>
            <div><span className="clean-section-kicker">TRANSFORMATION FLOW</span><h2>Your pipeline <span className="clean-count-badge">{steps.length}</span></h2><p>Applied from top to bottom. Reorder steps to change the result.</p></div>
          </div>
          {steps.length === 0 ? (
            <div className="clean-empty-pipeline">
              <div className="clean-empty-illustration"><WandSparkles size={25} aria-hidden /></div>
              <h3>Your pipeline starts here</h3>
              <p>No transformations have been added yet. Pick an operation on the left to start preparing this dataset.</p>
              <div className="clean-empty-hint"><span>01</span> Choose a transformation <ArrowRight size={13} aria-hidden /><span>02</span> Preview and add it</div>
            </div>
          ) : (
            <ol className="pipeline clean-pipeline">{steps.map((s, i) => {
              const r = results[i] ?? { ok: false, error: 'No result available for this step.' };
              return (
                <li key={s.id} className={`clean-pipeline-step ${r.ok ? 'step-success' : 'failed'}`}>
                  <div className="clean-step-index">{String(i + 1).padStart(2, '0')}</div>
                  <div className="clean-step-content">
                    <div className="clean-step-title-row"><strong>{STEPS[s.type]?.label ?? s.type}</strong><span className={`clean-step-status ${r.ok ? 'is-success' : 'is-failed'}`}>{r.ok ? 'Applied' : 'Skipped'}</span></div>
                    <div className={r.ok ? 'muted small clean-step-summary' : 'errtext small clean-step-summary'}>{r.ok ? r.summary : r.error}</div>
                    {r.ok && Number.isFinite(r.rowsBefore) && Number.isFinite(r.rowsAfter) && r.rowsBefore !== r.rowsAfter &&
                      <div className="clean-row-change"><span>Rows affected</span><strong>{r.rowsBefore.toLocaleString()} <ArrowRight size={12} aria-hidden /> {r.rowsAfter.toLocaleString()}</strong></div>}
                  </div>
                  <div className="pipeline-actions clean-pipeline-actions" aria-label={`Controls for step ${i + 1}`}>
                    <button type="button" className="iconbtn" aria-label={`Move step ${i + 1} up`} title="Move up" disabled={i === 0} onClick={() => moveStep(ds.id, s.id, -1)}><ArrowUp size={15} aria-hidden /></button>
                    <button type="button" className="iconbtn" aria-label={`Move step ${i + 1} down`} title="Move down" disabled={i === steps.length - 1} onClick={() => moveStep(ds.id, s.id, 1)}><ArrowDown size={15} aria-hidden /></button>
                    <button type="button" className="iconbtn clean-remove-step" aria-label={`Remove step ${i + 1}`} title="Remove step" onClick={() => removeStep(ds.id, s.id)}><Trash2 size={15} aria-hidden /></button>
                  </div>
                </li>);
            })}</ol>
          )}
          {steps.length > 0 && <div className="clean-pipeline-footer"><span>{successfulSteps} of {steps.length} steps applied{failedSteps ? ` · ${failedSteps} skipped` : ''}</span><button type="button" className="btn clean-reset-btn" onClick={async () => { if (await dialogs.confirm('Remove all steps and return to the original data?', { title: 'Reset cleaning pipeline', confirmText: 'Reset pipeline' })) clearSteps(ds.id); }}><RotateCcw size={14} aria-hidden /> Reset pipeline</button></div>}
        </section>
      </div>
    </div>
  );
}
