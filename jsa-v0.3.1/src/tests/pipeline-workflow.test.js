import { describe, it, expect } from 'vitest';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import { makeStep, reorderSteps, runPipeline } from '../core/transforms/pipeline.js';

describe('data preparation pipeline ordering', () => {
  it('moves a step up or down without mutating the original list', () => {
    const steps = [makeStep('filterRows', {}), makeStep('dedupe', {}), makeStep('sort', {})];
    const movedUp = reorderSteps(steps, steps[2].id, -1);
    expect(movedUp.map((step) => step.id)).toEqual([steps[0].id, steps[2].id, steps[1].id]);
    expect(steps.map((step) => step.id)).toEqual([steps[0].id, steps[1].id, steps[2].id]);
    expect(reorderSteps(movedUp, steps[2].id, 1).map((step) => step.id)).toEqual(steps.map((step) => step.id));
  });

  it('leaves the list unchanged for invalid moves and boundary moves', () => {
    const steps = [makeStep('filterRows', {}), makeStep('dedupe', {})];
    expect(reorderSteps(steps, steps[0].id, -1)).toBe(steps);
    expect(reorderSteps(steps, steps[1].id, 1)).toBe(steps);
    expect(reorderSteps(steps, 'missing', -1)).toBe(steps);
    expect(reorderSteps(steps, steps[0].id, 0)).toBe(steps);
  });

  it('replays the pipeline in the new order and reports row counts per successful step', () => {
    const source = datasetFromCsv('name,value\nA,1\nA,2\nB,3', { name: 'pipeline-order' });
    const name = source.columns.find((column) => column.name === 'name');
    const duplicate = makeStep('dedupe', { columns: [name.id] });
    const filter = makeStep('filterRows', { action: 'keep', mode: 'all', conditions: [{ column: source.columns.find((column) => column.name === 'value').id, op: 'gte', value: 2 }] });
    const originalOrder = runPipeline(source, [duplicate, filter]);
    const reordered = runPipeline(source, [filter, duplicate]);
    expect(originalOrder.results[0].rowsBefore).toBe(3);
    expect(originalOrder.results[0].rowsAfter).toBe(2);
    expect(originalOrder.dataset.rowCount).toBe(1);
    expect(reordered.dataset.rowCount).toBe(2);
  });
});
