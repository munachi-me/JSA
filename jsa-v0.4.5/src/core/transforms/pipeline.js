// Ordered, replayable pipeline. The source dataset is never modified: the working dataset is
// always source + steps. A failing step is skipped and reported, never silently ignored.
import { STEPS } from './stepRegistry.js';

let n = 0;
export const newStepId = () => `s${Date.now().toString(36)}${(n++).toString(36)}`;
export const makeStep = (type, params) => ({ id: newStepId(), type, params });

export function runPipeline(source, steps = []) {
  let ds = source;
  const results = steps.map((step) => {
    const def = STEPS[step.type];
    if (!def) return { stepId: step.id, ok: false, error: `Unknown step type “${step.type}”.` };
    try {
      const before = ds.rowCount;
      const out = def.apply(ds, step.params || {});
      ds = out.dataset;
      return { stepId: step.id, ok: true, summary: out.summary, rowsBefore: before, rowsAfter: ds.rowCount };
    } catch (e) {
      return { stepId: step.id, ok: false, error: e.message };
    }
  });
  const history = steps.map((s, i) => ({ id: s.id, type: s.type, params: s.params, ok: results[i].ok }));
  return { dataset: { ...ds, history }, results };
}


// Move a pipeline step one position up (-1) or down (1) without mutating the list.
// Invalid IDs and moves beyond either end return the original list unchanged.
export function reorderSteps(steps = [], stepId, direction) {
  if (direction !== -1 && direction !== 1) return steps;
  const index = steps.findIndex((step) => step.id === stepId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= steps.length) return steps;
  const next = [...steps];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
