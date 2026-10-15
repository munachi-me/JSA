import { describe, it, expect } from 'vitest';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import { makeStep, runPipeline } from '../core/transforms/pipeline.js';

const source = () => datasetFromCsv(`name,age,city,code
Ada,19,Minna,NG-01
Bola,34,Lagos,NG-02
Chika,61,,GH-03
Dami,,Abuja,NG-04`);
const col = (ds, name) => ds.columns.find((c) => c.name === name).id;

describe('conditional column transformation', () => {
  it('uses ordered IF rules and a fallback value', () => {
    const ds = source();
    const { dataset, results } = runPipeline(ds, [makeStep('conditionalColumn', {
      name: 'Age group',
      rules: [
        { match: 'all', conditions: [{ column: col(ds, 'age'), op: 'lt', value: '25' }], result: 'Young' },
        { match: 'all', conditions: [{ column: col(ds, 'age'), op: 'gte', value: '60' }], result: 'Senior' },
      ],
      defaultValue: 'Adult',
    })]);
    expect(results[0].ok).toBe(true);
    expect(dataset.data[dataset.columns.at(-1).id]).toEqual(['Young', 'Adult', 'Senior', 'Adult']);
    expect(ds.columns).toHaveLength(4);
  });

  it('supports AND/OR within a rule and missing-value conditions', () => {
    const ds = source();
    const { dataset, results } = runPipeline(ds, [makeStep('conditionalColumn', {
      name: 'Group',
      rules: [
        { match: 'all', conditions: [
          { column: col(ds, 'age'), op: 'gte', value: '18' },
          { column: col(ds, 'city'), op: 'contains', value: 'lag' },
        ], result: 'adult in Lagos' },
        { match: 'any', conditions: [
          { column: col(ds, 'age'), op: 'isMissing', value: '' },
          { column: col(ds, 'city'), op: 'isMissing', value: '' },
        ], result: 'needs review' },
      ], defaultValue: 'other',
    })]);
    expect(results[0].ok).toBe(true);
    expect(dataset.data[dataset.columns.at(-1).id]).toEqual(['other', 'adult in Lagos', 'needs review', 'needs review']);
  });

  it('reports invalid conditions instead of silently creating a column', () => {
    const ds = source();
    const { results } = runPipeline(ds, [makeStep('conditionalColumn', {
      name: 'Invalid', rules: [{ match: 'all', conditions: [{ column: 'missing-column', op: 'eq', value: 'x' }], result: 'yes' }], defaultValue: 'no',
    })]);
    expect(results[0].ok).toBe(false);
    expect(results[0].error).toMatch(/Unknown column/);
  });
});

describe('split and combine column transformations', () => {
  it('splits a delimited column, trims values and preserves the original', () => {
    const ds = source();
    const { dataset, results } = runPipeline(ds, [makeStep('splitColumn', { column: col(ds, 'code'), delimiter: '-', parts: 2, trim: 'yes' })]);
    expect(results[0].ok).toBe(true);
    expect(dataset.columns.map((c) => c.name).slice(-2)).toEqual(['code part 1', 'code part 2']);
    expect(dataset.data[dataset.columns.at(-2).id]).toEqual(['NG', 'NG', 'GH', 'NG']);
    expect(dataset.data[dataset.columns.at(-1).id]).toEqual(['01', '02', '03', '04']);
    expect(dataset.data[col(dataset, 'code')]).toEqual(['NG-01', 'NG-02', 'GH-03', 'NG-04']);
  });

  it('keeps unmatched split parts missing and combines selected columns', () => {
    const ds = source();
    const { dataset, results } = runPipeline(ds, [
      makeStep('splitColumn', { column: col(ds, 'city'), delimiter: '-', parts: 2, trim: 'yes' }),
      makeStep('combineColumns', { name: 'Person', columns: [col(ds, 'name'), col(ds, 'city')], separator: ' — ', skipMissing: 'yes' }),
    ]);
    expect(results.every((r) => r.ok)).toBe(true);
    const split2 = dataset.columns.find((c) => c.name === 'city part 2');
    expect(dataset.data[split2.id]).toEqual([null, null, null, null]);
    const combined = dataset.columns.find((c) => c.name === 'Person');
    expect(dataset.data[combined.id]).toEqual(['Ada — Minna', 'Bola — Lagos', 'Chika', 'Dami — Abuja']);
  });

  it('rejects a missing delimiter and too few combine columns', () => {
    const ds = source();
    expect(runPipeline(ds, [makeStep('splitColumn', { column: col(ds, 'code'), delimiter: '', parts: 2 })]).results[0].ok).toBe(false);
    expect(runPipeline(ds, [makeStep('combineColumns', { name: 'bad', columns: [col(ds, 'name')] })]).results[0].ok).toBe(false);
  });
});


describe('column management transformations', () => {
  it('renames a column without changing its stable id or values', () => {
    const ds = source();
    const id = col(ds, 'name');
    const { dataset, results } = runPipeline(ds, [makeStep('renameColumn', { column: id, name: 'Customer name' })]);
    expect(results[0].ok).toBe(true);
    expect(dataset.columns.find((c) => c.id === id).name).toBe('Customer name');
    expect(dataset.data[id]).toEqual(['Ada', 'Bola', 'Chika', 'Dami']);
    expect(ds.columns.find((c) => c.id === id).name).toBe('name');
  });

  it('rejects empty or duplicate rename names', () => {
    const ds = source();
    expect(runPipeline(ds, [makeStep('renameColumn', { column: col(ds, 'name'), name: ' ' })]).results[0].ok).toBe(false);
    expect(runPipeline(ds, [makeStep('renameColumn', { column: col(ds, 'name'), name: 'age' })]).results[0].error).toMatch(/already exists/i);
  });

  it('deletes a column and its values while preserving remaining columns', () => {
    const ds = source();
    const id = col(ds, 'city');
    const { dataset, results } = runPipeline(ds, [makeStep('deleteColumn', { column: id })]);
    expect(results[0].ok).toBe(true);
    expect(dataset.columns.some((c) => c.id === id)).toBe(false);
    expect(Object.hasOwn(dataset.data, id)).toBe(false);
    expect(dataset.columns).toHaveLength(3);
  });

  it('prevents deleting the final remaining column', () => {
    const ds = source();
    const only = { ...ds, columns: [ds.columns[0]], data: { [ds.columns[0].id]: ds.data[ds.columns[0].id] } };
    const result = runPipeline(only, [makeStep('deleteColumn', { column: only.columns[0].id })]);
    expect(result.results[0].ok).toBe(false);
    expect(result.results[0].error).toMatch(/at least one column/i);
  });
});
