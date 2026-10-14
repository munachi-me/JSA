// IndexedDB persistence. Sources (large, written once) and meta (steps, analyses, charts,
// dashboards: small, rewritten on change) are kept in separate stores. All data stays in this browser.
const DB = 'jsa', VERSION = 1;

export const idbAvailable = () => typeof indexedDB !== 'undefined';

function open() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, VERSION);
    r.onupgradeneeded = () => {
      // Keep upgrades safe when a future schema version adds only one store.
      if (!r.result.objectStoreNames.contains('sources')) r.result.createObjectStore('sources');
      if (!r.result.objectStoreNames.contains('meta')) r.result.createObjectStore('meta');
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error('The database is blocked by another tab. Close other JSA tabs and retry.'));
  });
}
const run = (db, stores, mode, fn) => new Promise((resolve, reject) => {
  const t = db.transaction(stores, mode);
  const out = fn(t);
  t.oncomplete = () => resolve(out);
  t.onerror = () => reject(t.error);
  t.onabort = () => reject(t.error || new Error('The save was aborted.'));
});

export function createIdbStore() {
  let dbp;
  const db = () => (dbp ||= open());
  return {
    async saveSource(source) { const d = await db(); await run(d, ['sources'], 'readwrite', (t) => { t.objectStore('sources').put(source, source.id); }); },
    async saveMeta(id, meta) { const d = await db(); await run(d, ['meta'], 'readwrite', (t) => { t.objectStore('meta').put(meta, id); }); },
    async remove(id) { const d = await db(); await run(d, ['sources', 'meta'], 'readwrite', (t) => { t.objectStore('sources').delete(id); t.objectStore('meta').delete(id); }); },
    async loadAll() {
      const d = await db();
      const r = await run(d, ['sources', 'meta'], 'readonly', (t) => ({
        sk: t.objectStore('sources').getAllKeys(), sv: t.objectStore('sources').getAll(),
        mk: t.objectStore('meta').getAllKeys(), mv: t.objectStore('meta').getAll() }));
      const meta = new Map(r.mk.result.map((k, i) => [k, r.mv.result[i]]));
      return r.sk.result.map((k, i) => ({ source: r.sv.result[i], meta: meta.get(k) || null }));
    },
  };
}
