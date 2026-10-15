import { describe, it, expect } from 'vitest';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import { makeStep, runPipeline } from '../core/transforms/pipeline.js';

const column = (ds, name) => ds.columns.find((c) => c.name === name).id;

describe('advanced data preparation', () => {
  it('trims leading and trailing whitespace and marks whitespace-only cells missing', () => {
    const ds = datasetFromCsv('id,name\n1,"  Ada  "\n2,"   "\n3,Grace', { name: 'names' });
    const { dataset, results } = runPipeline(ds, [makeStep('trimWhitespace', { column: column(ds, 'name') })]);
    expect(results[0].ok).toBe(true);
    expect(dataset.data[column(ds, 'name')]).toEqual(['Ada', null, 'Grace']);
    expect(ds.data[column(ds, 'name')][0]).toBe('  Ada  ');
  });

  it('collapses repeated whitespace between words', () => {
    const ds = datasetFromCsv('label\n"  North   West  "\n"South\tEast"', { name: 'regions' });
    const { dataset, results } = runPipeline(ds, [makeStep('normalizeWhitespace', { column: column(ds, 'label') })]);
    expect(results[0].ok).toBe(true);
    expect(dataset.data[column(ds, 'label')][0]).toBe('North West');
  });

  it('converts configured missing markers case-insensitively', () => {
    const ds = datasetFromCsv('status\nNot available\n" unknown "\nActive\nOther', { name: 'statuses' });
    const { dataset, results } = runPipeline(ds, [makeStep('missingMarkers', { column: column(ds, 'status'), markers: 'not available, unknown' })]);
    expect(results[0].ok).toBe(true);
    expect(dataset.data[column(ds, 'status')]).toEqual([null, null, 'Active', 'Other']);
    expect(ds.data[column(ds, 'status')][0]).toBe('Not available');
  });

  it('rejects an empty marker list', () => {
    const ds = datasetFromCsv('status\nActive', { name: 'statuses' });
    const { results } = runPipeline(ds, [makeStep('missingMarkers', { column: column(ds, 'status'), markers: ' ,  ' })]);
    expect(results[0].ok).toBe(false);
    expect(results[0].error).toMatch(/at least one marker/i);
  });
});
