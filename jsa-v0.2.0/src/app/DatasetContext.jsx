import { createContext, useContext, useState, useCallback } from 'react';
import { datasetFromCsv, datasetFromJson, setColumnType } from '../core/data/datasetModel.js';

const Ctx = createContext(null);
export const useDatasets = () => useContext(Ctx);
export const MAX_BYTES = 25 * 1024 * 1024; // documented browser-side limit

export function DatasetProvider({ children }) {
  const [datasets, setDatasets] = useState([]);
  const [error, setError] = useState(null);

  const importText = useCallback((text, name, format) => {
    try {
      const base = name.replace(/\.[^.]+$/, '');
      const ds = format === 'json' ? datasetFromJson(text, { name: base }) : datasetFromCsv(text, { name: base });
      setDatasets((d) => [ds, ...d]);
      setError(null);
      return ds;
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

  const overrideType = useCallback((dsId, colId, type) =>
    setDatasets((all) => all.map((d) => (d.id === dsId ? setColumnType(d, colId, type) : d))), []);

  const remove = useCallback((id) => setDatasets((d) => d.filter((x) => x.id !== id)), []);

  return <Ctx.Provider value={{ datasets, error, setError, importFile, loadSample, overrideType, remove }}>{children}</Ctx.Provider>;
}
