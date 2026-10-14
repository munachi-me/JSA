import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { datasetFromCsv, datasetFromJson } from '../core/data/datasetModel.js';
import { runPipeline, makeStep } from '../core/transforms/pipeline.js';

const Ctx = createContext(null);
export const useDatasets = () => useContext(Ctx);
export const MAX_BYTES = 25 * 1024 * 1024; // documented browser-side limit
let uid = 0;
const nid = (p) => `${p}${Date.now().toString(36)}${(uid++).toString(36)}`;

// Each entry keeps the untouched source, the ordered steps, and saved analyses / KPIs.
// The working dataset is always derived (source + steps), so undo is just removing a step.
export function DatasetProvider({ children, initialSources = [] }) {
  const [entries, setEntries] = useState(() => initialSources.map((source) => ({ source, steps: [], analyses: [], kpis: [] })));
  const [error, setError] = useState(null);

  const datasets = useMemo(() => entries.map((e) => {
    const { dataset, results } = runPipeline(e.source, e.steps);
    return { ...dataset, id: e.source.id, name: e.source.name, sourceRowCount: e.source.rowCount,
      pipeline: { steps: e.steps, results }, analyses: e.analyses, kpis: e.kpis };
  }), [entries]);

  const patch = useCallback((id, fn) => setEntries((all) => all.map((e) => (e.source.id === id ? fn(e) : e))), []);

  const importText = useCallback((text, name, format) => {
    try {
      const base = name.replace(/\.[^.]+$/, '');
      const source = format === 'json' ? datasetFromJson(text, { name: base }) : datasetFromCsv(text, { name: base });
      setEntries((d) => [{ source, steps: [], analyses: [], kpis: [] }, ...d]);
      setError(null);
      return source;
    } catch (e) { setError(e.message); return null; }
  }, []);

  const importFile = useCallback(async (file) => {
    if (file.size > MAX_BYTES) { setError(`${file.name} is larger than 25 MB, the browser-side limit.`); return null; }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'tsv', 'txt', 'json'].includes(ext)) { setError('Unsupported file type. Use CSV, TSV or JSON.'); return null; }
    return importText(await file.text(), file.name, ext === 'json' ? 'json' : 'csv');
  }, [importText]);

  const loadSample = useCallback(async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}sample-data/sales.csv`);
    if (!res.ok) { setError('Could not load the sample dataset.'); return null; }
    return importText(await res.text(), 'sales-demo.csv', 'csv');
  }, [importText]);

  const addStep = useCallback((id, type, params) => patch(id, (e) => ({ ...e, steps: [...e.steps, makeStep(type, params)] })), [patch]);
  const removeStep = useCallback((id, stepId) => patch(id, (e) => ({ ...e, steps: e.steps.filter((s) => s.id !== stepId) })), [patch]);
  const clearSteps = useCallback((id) => patch(id, (e) => ({ ...e, steps: [] })), [patch]);
  // A type override replaces an earlier override of the same column instead of piling up steps.
  const overrideType = useCallback((id, column, type) => patch(id, (e) => {
    const rest = e.steps.filter((s) => !(s.type === 'convertType' && s.params.column === column));
    return { ...e, steps: [...rest, makeStep('convertType', { column, type })] };
  }), [patch]);
  const saveAnalysis = useCallback((id, def) => patch(id, (e) => ({ ...e, analyses: [...e.analyses, { ...def, id: nid('an') }] })), [patch]);
  const deleteAnalysis = useCallback((id, aid) => patch(id, (e) => ({ ...e, analyses: e.analyses.filter((a) => a.id !== aid) })), [patch]);
  const saveKpi = useCallback((id, def) => patch(id, (e) => ({ ...e, kpis: [...e.kpis, { ...def, id: nid('kpi') }] })), [patch]);
  const deleteKpi = useCallback((id, kid) => patch(id, (e) => ({ ...e, kpis: e.kpis.filter((k) => k.id !== kid) })), [patch]);
  const remove = useCallback((id) => setEntries((d) => d.filter((x) => x.source.id !== id)), []);

  return <Ctx.Provider value={{ datasets, error, setError, importFile, loadSample, overrideType, remove, addStep, removeStep, clearSteps, saveAnalysis, deleteAnalysis, saveKpi, deleteKpi }}>{children}</Ctx.Provider>;
}
