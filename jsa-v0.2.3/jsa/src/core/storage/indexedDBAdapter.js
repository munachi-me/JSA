// Local persistence. Datasets (large, written once) and project metadata (small, written often) live in
// separate object stores. Everything stays in this browser; nothing is sent anywhere.
const DB_VERSION = 1;

const friendly = (e) => {
  const name = e?.name || e?.target?.error?.name;
  if (name === 'QuotaExceededError') return new Error('The browser is out of storage space. Close or delete a dataset, or free up space, then try again.');
  return new Error(`Could not save to this browser (${name || e?.message || 'unknown error'}).`);
};
const wrap = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(friendly(req.error)); });

export function createIndexedDBAdapter({ name = 'jsa', indexedDB: idb = globalThis.indexedDB } = {}) {
  if (!idb) return null;
  let dbPromise;
  const open = () => (dbPromise ||= new Promise((res, rej) => {
    const req = idb.open(name, DB_VERSION);
    req.onupgradeneeded = () => { req.result.createObjectStore('sources'); req.result.createObjectStore('meta'); };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(friendly(req.error));
    req.onblocked = () => rej(new Error('Another JSA tab is blocking a storage update. Close other JSA tabs and reload.'));
  }));
  const tx = async (stores, mode, fn) => {
    const db = await open();
    const t = db.transaction(stores, mode);
    const done = new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(friendly(t.error)); t.onabort = () => rej(friendly(t.error)); });
    const out = await fn(t);
    await done;
    return out;
  };
  return {
    async loadAll() {
      return tx(['sources', 'meta'], 'readonly', async (t) => {
        const [keys, sources, metas] = await Promise.all([wrap(t.objectStore('sources').getAllKeys()), wrap(t.objectStore('sources').getAll()), wrap(t.objectStore('meta').getAllKeys()).then(async (mk) => Promise.all(mk.map(async (k) => [k, await wrap(t.objectStore('meta').get(k))])))]);
        const metaMap = new Map(metas);
        return keys.map((k, i) => ({ source: sources[i], meta: metaMap.get(k) || null }))
          .sort((a, b) => String(b.source.provenance?.importedAt).localeCompare(String(a.source.provenance?.importedAt)));
      });
    },
    saveSource: (source) => tx(['sources'], 'readwrite', (t) => wrap(t.objectStore('sources').put(source, source.id))),
    saveMeta: (id, meta) => tx(['meta'], 'readwrite', (t) => wrap(t.objectStore('meta').put(meta, id))),
    remove: (id) => tx(['sources', 'meta'], 'readwrite', (t) => Promise.all([wrap(t.objectStore('sources').delete(id)), wrap(t.objectStore('meta').delete(id))])),
  };
}
