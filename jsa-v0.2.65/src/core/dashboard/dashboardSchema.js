// Versioned dashboard document + pure edit operations. A dashboard references saved charts and
// KPIs by id and stores layout, titles and per-component options. It holds no data of its own.
import { COLS, MIN_W, MIN_H, placeNew, settle } from './layout.js';

export const SCHEMA_VERSION = 1;
export const COMPONENT_TYPES = ['chart', 'kpi', 'text', 'filter', 'insight'];
export const DEFAULT_SIZE = { chart: { w: 6, h: 5 }, kpi: { w: 3, h: 2 }, text: { w: 6, h: 2 }, filter: { w: 3, h: 2 }, insight: { w: 6, h: 3 } };
// from-version → function returning the next version's document. Empty until the schema changes.
export const MIGRATIONS = {};

let n = 0;
export const newId = (p) => `${p}${Date.now().toString(36)}${(n++).toString(36)}`;
const now = () => new Date().toISOString();

export function makeDashboard({ title = 'Untitled dashboard', description = '', datasetId = '' } = {}) {
  return { schemaVersion: SCHEMA_VERSION, id: newId('dash'), title, description, datasetId, columns: COLS, rowHeight: 80,
    theme: { accent: '#6366F1' }, components: [], createdAt: now(), updatedAt: now() };
}

const layouts = (d) => d.components.map((c) => ({ id: c.id, ...c.layout }));
const withLayouts = (d, items) => {
  const m = new Map(items.map((i) => [i.id, i]));
  return { ...d, updatedAt: now(), components: d.components.map((c) => { const { x, y, w, h } = m.get(c.id); return { ...c, layout: { x, y, w, h } }; }) };
};

export function addComponent(d, type, config = {}, title = '') {
  if (!COMPONENT_TYPES.includes(type)) throw new Error(`Unknown component type “${type}”.`);
  const size = DEFAULT_SIZE[type];
  const layout = placeNew(layouts(d), size.w, size.h);
  const comp = { id: newId('cmp'), type, title, layout, config };
  return { ...d, updatedAt: now(), components: [...d.components, comp] };
}
export const removeComponent = (d, id) => {
  const next = { ...d, updatedAt: now(), components: d.components.filter((c) => c.id !== id) };
  return withLayouts(next, settle(layouts(next)));
};
export function duplicateComponent(d, id) {
  const src = d.components.find((c) => c.id === id);
  if (!src) throw new Error('That component no longer exists.');
  const layout = placeNew(layouts(d), src.layout.w, src.layout.h);
  return { ...d, updatedAt: now(), components: [...d.components, { ...src, id: newId('cmp'), config: { ...src.config }, layout }] };
}
export const updateComponent = (d, id, patch) => ({ ...d, updatedAt: now(),
  components: d.components.map((c) => (c.id === id ? { ...c, ...patch, config: { ...c.config, ...(patch.config || {}) } } : c)) });
/** Move/resize one component; others make way. Returns the updated dashboard. */
export function setLayout(d, id, rect) {
  const items = layouts(d).map((i) => (i.id === id ? { ...i, ...rect } : i));
  return withLayouts(d, settle(items, id, d.columns || COLS));
}
export const compactLayout = (d) => withLayouts(d, settle(layouts(d), null, d.columns || COLS));

export function migrateDashboard(doc, migrations = MIGRATIONS, target = SCHEMA_VERSION) {
  if (!doc || typeof doc !== 'object') throw new Error('The dashboard file is not a valid object.');
  let v = doc.schemaVersion;
  if (!Number.isInteger(v) || v < 1) throw new Error('The dashboard has no valid schemaVersion.');
  if (v > target) throw new Error(`This dashboard was made by a newer version of JSA (schema ${v}); this version understands up to ${target}.`);
  let out = doc;
  while (v < target) {
    const fn = migrations[v];
    if (!fn) throw new Error(`No migration is available from schema ${v}.`);
    out = { ...fn(out), schemaVersion: v + 1 };
    v++;
  }
  return out;
}

/** Validate (and migrate) an untrusted dashboard document. Returns { ok, errors, dashboard }. */
export function validateDashboard(doc, opts = {}) {
  const errors = [];
  let d;
  try { d = migrateDashboard(doc, opts.migrations, opts.target); } catch (e) { return { ok: false, errors: [e.message], dashboard: null }; }
  const str = (v, max) => typeof v === 'string' && v.length <= max;
  if (!str(d.id, 100) || !d.id) errors.push('The dashboard needs an id.');
  if (!str(d.title, 200)) errors.push('The dashboard title must be text of at most 200 characters.');
  if (d.description !== undefined && !str(d.description, 2000)) errors.push('The description must be text of at most 2,000 characters.');
  if (!Array.isArray(d.components)) { errors.push('The dashboard needs a components list.'); return { ok: false, errors, dashboard: null }; }
  const seen = new Set();
  d.components.forEach((c, i) => {
    const at = `Component ${i + 1}`;
    if (!c || typeof c !== 'object') return errors.push(`${at} is not an object.`);
    if (!str(c.id, 100) || !c.id) errors.push(`${at} needs an id.`);
    else if (seen.has(c.id)) errors.push(`${at} repeats the id “${c.id}”.`);
    seen.add(c.id);
    if (!COMPONENT_TYPES.includes(c.type)) errors.push(`${at} has an unsupported type “${c.type}”.`);
    if (c.title !== undefined && !str(c.title, 200)) errors.push(`${at} has an invalid title.`);
    const l = c.layout;
    const okInt = (v, min) => Number.isInteger(v) && v >= min;
    if (!l || !okInt(l.x, 0) || !okInt(l.y, 0) || !okInt(l.w, MIN_W) || !okInt(l.h, MIN_H) || l.x + l.w > COLS) errors.push(`${at} has an invalid layout.`);
    const cfg = c.config;
    if (!cfg || typeof cfg !== 'object') return errors.push(`${at} needs a config.`);
    if (c.type === 'chart' && !str(cfg.vizId, 100)) errors.push(`${at} must reference a saved chart.`);
    if (c.type === 'kpi' && !str(cfg.kpiId, 100)) errors.push(`${at} must reference a KPI.`);
    if (c.type === 'text' && !str(cfg.text ?? '', 5000)) errors.push(`${at} text is too long (5,000 characters max).`);
    if (c.type === 'filter' && !str(cfg.column, 100)) errors.push(`${at} must name a column.`);
    if (c.type === 'insight' && !str(cfg.insightId, 200)) errors.push(`${at} must reference an insight.`);
  });
  if (errors.length) return { ok: false, errors, dashboard: null };
  return { ok: true, errors, dashboard: compactLayout({ ...d, columns: COLS, rowHeight: d.rowHeight || 80, theme: d.theme || { accent: '#6366F1' }, description: d.description ?? '' }) };
}

/** Problems with references into a dataset (deleted charts/KPIs/columns). Non-fatal, shown in the UI. */
export function findBrokenReferences(d, ds) {
  const out = [];
  for (const c of d.components) {
    if (c.type === 'chart' && !ds.visualizations.some((v) => v.id === c.config.vizId)) out.push(`“${c.title || 'Chart'}” points to a chart that no longer exists.`);
    if (c.type === 'kpi' && !ds.kpis.some((k) => k.id === c.config.kpiId)) out.push(`“${c.title || 'KPI'}” points to a KPI that no longer exists.`);
    if (c.type === 'filter' && !ds.columns.some((x) => x.id === c.config.column)) out.push('A filter points to a column that no longer exists.');
  }
  return out;
}
