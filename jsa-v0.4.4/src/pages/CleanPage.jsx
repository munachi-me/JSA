import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, CircleDashed, Database, RotateCcw, Sparkles, Trash2, WandSparkles, Calculator, Eye } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';
import { useDialogs } from '../app/DialogProvider.jsx';
import { STEPS } from '../core/transforms/stepRegistry.js';
import { runPipeline } from '../core/transforms/pipeline.js';
import StepForm from '../components/data/StepForm.jsx';
import DatasetPicker, { useActiveDataset, NoDataset } from '../components/data/DatasetPicker.jsx';

export default function CleanPage() {
  const ds = useActiveDataset();
  const { addStep, removeStep, moveStep, clearSteps } = useDatasets();
  const dialogs = useDialogs();
  const [type, setType] = useState('filterRows');
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  if (!ds) return <NoDataset title="Clean data" />;
  const { steps, results } = ds.pipeline;
  const selectedHistoryIndex = steps.findIndex((step) => step.id === selectedHistoryId);
  const selectedHistoryStep = selectedHistoryIndex >= 0 ? steps[selectedHistoryIndex] : null;
  const selectedHistoryDataset = selectedHistoryStep ? runPipeline(ds.originalDataset, steps.slice(0, selectedHistoryIndex + 1)).dataset : null;
  const selectedHistoryDefinition = selectedHistoryStep ? STEPS[selectedHistoryStep.type] : null;
  const describeParam = (field, value) => {
    if (field?.kind === 'column') return ds.originalDataset.columns.find((c) => c.id === value)?.name || value || '—';
    if (field?.kind === 'columns' && Array.isArray(value)) return value.map((id) => ds.originalDataset.columns.find((c) => c.id === id)?.name || id).join(', ') || 'None selected';
    if (value && typeof value === 'object') return JSON.stringify(value, null, 2);
    return value === undefined || value === '' ? '—' : String(value);
  };
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
                    <button type="button" className={`iconbtn clean-inspect-icon ${selectedHistoryId === s.id ? 'is-active' : ''}`} aria-label={`${selectedHistoryId === s.id ? 'Close' : 'Inspect'} stage for step ${i + 1}`} title={selectedHistoryId === s.id ? 'Close stage inspector' : 'Inspect stage'} aria-pressed={selectedHistoryId === s.id} onClick={() => setSelectedHistoryId((current) => current === s.id ? null : s.id)}><Eye size={15} aria-hidden /></button>
                    <button type="button" className="iconbtn clean-remove-step" aria-label={`Remove step ${i + 1}`} title="Remove step" onClick={() => { removeStep(ds.id, s.id); setSelectedHistoryId((current) => current === s.id ? null : current); }}><Trash2 size={15} aria-hidden /></button>
                  </div>
                  {selectedHistoryId === s.id && selectedHistoryDataset && <section className="pipeline-history-inspector clean-stage-inline" aria-label={`Read-only dataset after pipeline step ${i + 1}`}>
                    <div className="pipeline-history-heading"><div><span className="clean-section-kicker">READ-ONLY STAGE INSPECTOR</span><h3>Dataset after step {i + 1}: {STEPS[s.type]?.label || s.type}</h3><p>Historical snapshot reconstructed from the original import through this step. This view is read-only and does not alter the active dataset.</p></div><button type="button" className="iconbtn" aria-label="Close stage inspector" onClick={() => setSelectedHistoryId(null)}><span aria-hidden>×</span></button></div>
                    <div className="pipeline-history-metrics">
                      <span><strong>{selectedHistoryDataset.rowCount.toLocaleString()}</strong> rows at this stage</span>
                      <span><strong>{selectedHistoryDataset.columns.length}</strong> columns</span>
                      <span><strong>{ds.sourceRowCount.toLocaleString()}</strong> imported rows</span>
                      <span><strong>{ds.columns.length}</strong> current columns</span>
                      <span><strong>{selectedHistoryDataset.rowCount - ds.sourceRowCount > 0 ? '+' : ''}{(selectedHistoryDataset.rowCount - ds.sourceRowCount).toLocaleString()}</strong> row change vs. import</span>
                    </div>
                    <div className="pipeline-history-logic"><strong>Step details & saved settings</strong><div className="pipeline-history-param"><span>Pipeline position</span><code>Step {i + 1} of {steps.length}</code></div><div className="pipeline-history-param"><span>Operation</span><code>{selectedHistoryDefinition?.label || selectedHistoryStep.type} ({selectedHistoryStep.type})</code></div><div className="pipeline-history-param"><span>Dataset</span><code>{ds.name}</code></div>{(selectedHistoryDefinition?.params || []).map((field) => <div className="pipeline-history-param" key={field.name}><span>{field.label}</span><code>{describeParam(field, selectedHistoryStep.params?.[field.name])}</code></div>)}{!(selectedHistoryDefinition?.params || []).length && <div className="pipeline-history-param"><span>Parameters</span><code>{JSON.stringify(selectedHistoryStep.params || {}, null, 2)}</code></div>}</div>
                    <div className="transform-preview-heading"><strong>Column profile</strong><span>Schema and completeness at this stage</span></div>
                    <div className="transform-preview-table-wrap pipeline-history-profile-wrap"><table><thead><tr><th>Column</th><th>Type</th><th>Non-empty</th><th>Missing</th><th>Distinct</th></tr></thead><tbody>{selectedHistoryDataset.columns.map((c) => { const values = selectedHistoryDataset.data[c.id] || []; const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== '').length; const distinct = new Set(values.filter((v) => v !== null && v !== undefined && v !== '').map((v) => String(v))).size; return <tr key={c.id}><td>{c.name}</td><td>{c.type || c.dataType || 'Unknown'}</td><td>{nonEmpty.toLocaleString()}</td><td>{(selectedHistoryDataset.rowCount - nonEmpty).toLocaleString()}</td><td>{distinct.toLocaleString()}</td></tr>; })}</tbody></table></div>
                    <div className="transform-preview-heading"><strong>Read-only data snapshot</strong><span>First {Math.min(25, selectedHistoryDataset.rowCount)} of {selectedHistoryDataset.rowCount.toLocaleString()} rows</span></div>
                    <div className="scroll transform-preview-table-wrap"><table><thead><tr><th>#</th>{selectedHistoryDataset.columns.map((c) => <th key={c.id}>{c.name}</th>)}</tr></thead><tbody>{Array.from({ length: Math.min(25, selectedHistoryDataset.rowCount) }, (_, rowIndex) => <tr key={rowIndex}><td>{rowIndex + 1}</td>{selectedHistoryDataset.columns.map((c) => <td key={c.id}>{selectedHistoryDataset.data[c.id]?.[rowIndex] == null || selectedHistoryDataset.data[c.id]?.[rowIndex] === '' ? <span className="muted">{selectedHistoryDataset.data[c.id]?.[rowIndex] === '' ? '(empty)' : 'null'}</span> : String(selectedHistoryDataset.data[c.id][rowIndex])}</td>)}</tr>)}</tbody></table></div>
                  </section>}
                </li>);
            })}</ol>
          )}
          {steps.length > 0 && <div className="clean-pipeline-footer"><span>{successfulSteps} of {steps.length} steps applied{failedSteps ? ` · ${failedSteps} skipped` : ''}</span><button type="button" className="btn clean-reset-btn" onClick={async () => { if (await dialogs.confirm('Remove all steps and return to the original data?', { title: 'Reset cleaning pipeline', confirmText: 'Reset pipeline' })) clearSteps(ds.id); }}><RotateCcw size={14} aria-hidden /> Reset pipeline</button></div>}
        </section>
      </div>
    </div>
  );
}
