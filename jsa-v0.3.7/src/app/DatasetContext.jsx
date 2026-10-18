import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { datasetFromCsv, datasetFromJson } from '../core/data/datasetModel.js';
import { runPipeline, makeStep, reorderSteps } from '../core/transforms/pipeline.js';
import { createIdbStore, idbAvailable } from '../storage/idb.js';

const Ctx = createContext(null);
export const useDatasets = () => useContext(Ctx);
export const MAX_BYTES = 25 * 1024 * 1024; // documented browser-side limit
let uid = 0;
const nid = (p) => `${p}${Date.now().toString(36)}${(uid++).toString(36)}`;

// Each entry keeps the untouched source, the ordered steps, and saved analyses / KPIs.
// The working dataset is always derived (source + steps), so undo is just removing a step.
export function DatasetProvider({ children, initialSources = [], persist = true }) {
  const [entries, setEntries] = useState(() => initialSources.map((source) => ({ source, steps: [], analyses: [], kpis: [], visualizations: [], dashboards: [], insights: [], insightOptions: {} })));
  const [error, setError] = useState(null);
  const store = useMemo(() => (persist && idbAvailable() ? createIdbStore() : null), [persist]);
  const [ready, setReady] = useState(!store);
  const [storageError, setStorageError] = useState(null);
  const written = useRef(new Set());
  const describeErr = (e) => `${e?.name === 'QuotaExceededError' ? 'This browser has run out of storage space.' : 'Saving to this browser failed.'} Your work is still open in memory; avoid closing the tab until it saves. (${e?.message || e?.name || 'unknown error'})`;

  useEffect(() => {
    if (!store) return undefined;
    let dead = false;
    store.loadAll().then((rows) => {
      if (dead) return;
      written.current = new Set(rows.map((r) => r.source.id));
      setEntries(rows.map(({ source, meta }) => ({ source, steps: meta?.steps ?? [], analyses: meta?.analyses ?? [], kpis: meta?.kpis ?? [], visualizations: meta?.visualizations ?? [], dashboards: meta?.dashboards ?? [], insights: meta?.insights ?? [], insightOptions: meta?.insightOptions ?? {} })));
      setReady(true);
    }).catch((e) => { if (!dead) { setStorageError(`Could not load saved work. ${e?.message || ''}`); setReady(true); } });
    return () => { dead = true; };
  }, [store]);

  useEffect(() => {
    if (!store || !ready) return undefined;
    const t = setTimeout(async () => {
      try {
        for (const e of entries) {
          const id = e.source.id;
          if (!written.current.has(id)) { await store.saveSource(e.source); written.current.add(id); }
          await store.saveMeta(id, { steps: e.steps, analyses: e.analyses, kpis: e.kpis, visualizations: e.visualizations, dashboards: e.dashboards, insights: e.insights, insightOptions: e.insightOptions });
        }
        for (const id of [...written.current]) if (!entries.some((e) => e.source.id === id)) { await store.remove(id); written.current.delete(id); }
        setStorageError(null);
      } catch (err) { setStorageError(describeErr(err)); }
    }, 400);
    return () => clearTimeout(t);
  }, [entries, store, ready]);

  const datasets = useMemo(() => entries.map((e) => {
    const { dataset, results } = runPipeline(e.source, e.steps);
    return { ...dataset, id: e.source.id, name: e.source.name, sourceRowCount: e.source.rowCount, originalDataset: e.source,
      pipeline: { steps: e.steps, results }, analyses: e.analyses, kpis: e.kpis, visualizations: e.visualizations, dashboards: e.dashboards, insights: e.insights, insightOptions: e.insightOptions };
  }), [entries]);

  const patch = useCallback((id, fn) => setEntries((all) => all.map((e) => (e.source.id === id ? fn(e) : e))), []);

  const importText = useCallback((text, name, format) => {
    try {
      const base = name.replace(/\.[^.]+$/, '');
      const source = format === 'json' ? datasetFromJson(text, { name: base }) : datasetFromCsv(text, { name: base });
      setEntries((d) => [{ source, steps: [], analyses: [], kpis: [], visualizations: [], dashboards: [], insights: [], insightOptions: {} }, ...d]);
      setError(null);
      return source;
    } catch (e) { setError(e.message); return null; }
  }, []);

  const importFile = useCallback(async (file) => {
    if (!file) return null;
    if (file.size > MAX_BYTES) { setError(`${file.name} is larger than 25 MB, the browser-side limit.`); return null; }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'tsv', 'txt', 'json'].includes(ext)) { setError('Unsupported file type. Use CSV, TSV or JSON.'); return null; }
    try {
      const content = await file.text();
      return importText(content, file.name, ext === 'json' ? 'json' : 'csv');
    } catch (e) {
      setError(`Could not read ${file.name}. Check that the file is accessible, then try again${e?.message ? ` (${e.message})` : ''}.`);
      return null;
    }
  }, [importText]);

  const loadSample = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}sample-data/sales.csv`);
      if (!res.ok) { setError(`Could not load the sample dataset (request failed with status ${res.status}).`); return null; }
      return importText(await res.text(), 'sales-demo.csv', 'csv');
    } catch (e) {
      setError(`Could not load the sample dataset. Check your connection or reload JSA${e?.message ? ` (${e.message})` : ''}.`);
      return null;
    }
  }, [importText]);

  const addStep = useCallback((id, type, params) => patch(id, (e) => ({ ...e, steps: [...e.steps, makeStep(type, params)] })), [patch]);
  const removeStep = useCallback((id, stepId) => patch(id, (e) => ({ ...e, steps: e.steps.filter((s) => s.id !== stepId) })), [patch]);
  const moveStep = useCallback((id, stepId, direction) => patch(id, (e) => ({ ...e, steps: reorderSteps(e.steps, stepId, direction) })), [patch]);
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
  const saveViz = useCallback((id, spec) => patch(id, (e) => {
    const saved = { ...spec, id: spec.id || nid('viz') };
    const exists = e.visualizations.some((v) => v.id === saved.id);
    return { ...e, visualizations: exists ? e.visualizations.map((v) => (v.id === saved.id ? saved : v)) : [...e.visualizations, saved] };
  }), [patch]);
  const deleteViz = useCallback((id, vid) => patch(id, (e) => ({ ...e, visualizations: e.visualizations.filter((v) => v.id !== vid) })), [patch]);
  const saveDashboard = useCallback((id, dash) => patch(id, (e) => {
    const exists = e.dashboards.some((d) => d.id === dash.id);
    return { ...e, dashboards: exists ? e.dashboards.map((d) => (d.id === dash.id ? dash : d)) : [...e.dashboards, dash] };
  }), [patch]);
  const deleteDashboard = useCallback((id, did) => patch(id, (e) => ({ ...e, dashboards: e.dashboards.filter((d) => d.id !== did) })), [patch]);
  // Adds an imported dashboard together with the charts, KPIs and analyses it uses (ids preserved).
  const importBundle = useCallback((id, b) => patch(id, (e) => ({ ...e, dashboards: [...e.dashboards, b.dashboard], visualizations: [...e.visualizations, ...b.visualizations], kpis: [...e.kpis, ...b.kpis], analyses: [...e.analyses, ...b.analyses] })), [patch]);
  // status: 'saved' | 'dismissed' | null (clears). A saved insight keeps a snapshot of what it said.
  const setInsightStatus = useCallback((id, insightId, status, snapshot) => patch(id, (e) => {
    const rest = e.insights.filter((x) => x.id !== insightId);
    return { ...e, insights: status ? [...rest, { id: insightId, status, savedAt: new Date().toISOString(), insight: status === 'saved' ? snapshot : undefined }] : rest };
  }), [patch]);
  const setInsightOptions = useCallback((id, insightOptions) => patch(id, (e) => ({ ...e, insightOptions })), [patch]);
  const remove = useCallback((id) => setEntries((d) => d.filter((x) => x.source.id !== id)), []);

  return <Ctx.Provider value={{ datasets, error, setError, importFile, loadSample, overrideType, remove, addStep, removeStep, moveStep, clearSteps, saveAnalysis, deleteAnalysis, saveKpi, deleteKpi, saveViz, deleteViz, saveDashboard, deleteDashboard, importBundle, setInsightStatus, setInsightOptions, ready, storageError, persistent: !!store }}>{children}</Ctx.Provider>;
}
