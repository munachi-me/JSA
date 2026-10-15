// Validation + migration for dashboard documents loaded from storage or imported from JSON.
import { DASHBOARD_VERSION, COMPONENT_TYPES, GRID_COLS, makeDashboard, makeComponent } from './dashboardSchema.js';
import { compact } from './layout.js';

const FILTER_KINDS = ['select', 'range', 'dateRange'];
const MAX_COMPONENTS = 100;

// Each entry upgrades a document from version N to N+1. Version 0 is the shape of a document that has no
// schemaVersion (scaffold: no legacy format has shipped, but loading old files must never silently break).
const MIGRATIONS = {
  0: (d) => {
    const widgets = Array.isArray(d.widgets) ? d.widgets : Array.isArray(d.components) ? d.components : [];
    const mapType = (k) => (k === 'kpi' ? 'kpi' : k === 'text' ? 'text' : 'chart');
    return makeDashboard({ ...d, id: d.id || makeDashboard().id, schemaVersion: 1, filters: d.filters || [], theme: d.theme || { accent: '#6366F1' },
      components: widgets.map((w) => makeComponent(mapType(w.kind || w.type), { id: w.id || undefined, title: w.title || '', ref: w.ref || '', text: w.text || '',
        layout: { x: w.x ?? w.layout?.x ?? 0, y: w.y ?? w.layout?.y ?? 0, w: w.w ?? w.layout?.w ?? 6, h: w.h ?? w.layout?.h ?? 4 } })).map((c, i) => (widgets[i]?.id ? c : { ...c })) });
  },
};

export function migrateDashboard(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('A dashboard must be a JSON object.');
  let doc = raw;
  let v = Number.isInteger(doc.schemaVersion) ? doc.schemaVersion : 0;
  if (v > DASHBOARD_VERSION) throw new Error(`This dashboard uses schema version ${v}, which is newer than this app supports (${DASHBOARD_VERSION}). Update JSA to open it.`);
  while (v < DASHBOARD_VERSION) { if (!MIGRATIONS[v]) throw new Error(`No migration from schema version ${v}.`); doc = MIGRATIONS[v](doc); v = doc.schemaVersion; }
  return doc;
}

export function validateDashboard(d) {
  const errs = [];
  if (!d || typeof d !== 'object') return ['The dashboard is not an object.'];
  if (d.schemaVersion !== DASHBOARD_VERSION) errs.push(`Unsupported schema version ${d.schemaVersion}.`);
  if (typeof d.id !== 'string' || !d.id) errs.push('The dashboard needs an id.');
  if (typeof d.title !== 'string' || d.title.length > 200) errs.push('The title must be text of at most 200 characters.');
  if (typeof d.description !== 'string' || d.description.length > 5000) errs.push('The description must be text of at most 5,000 characters.');
  if (!Array.isArray(d.components)) return [...errs, 'The components list is missing.'];
  if (d.components.length > MAX_COMPONENTS) errs.push(`A dashboard can hold at most ${MAX_COMPONENTS} components.`);
  const ids = new Set();
  d.components.forEach((c, i) => {
    const at = `Component ${i + 1}`;
    if (!c || typeof c !== 'object') return errs.push(`${at} is not an object.`);
    if (typeof c.id !== 'string' || !c.id) errs.push(`${at} needs an id.`);
    else if (ids.has(c.id)) errs.push(`${at} repeats the id “${c.id}”.`);
    ids.add(c.id);
    if (!COMPONENT_TYPES[c.type]) errs.push(`${at} has an unknown type “${c.type}”.`);
    if (typeof c.title !== 'string' || c.title.length > 200) errs.push(`${at} has an invalid title.`);
    if (typeof c.text !== 'string' || c.text.length > 5000) errs.push(`${at} has invalid text (limit 5,000 characters).`);
    const l = c.layout;
    const ints = l && ['x', 'y', 'w', 'h'].every((k) => Number.isInteger(l[k]));
    if (!ints) errs.push(`${at} has an invalid layout.`);
    else if (l.x < 0 || l.y < 0 || l.w < 1 || l.h < 1 || l.x + l.w > GRID_COLS) errs.push(`${at} sits outside the ${GRID_COLS}-column grid.`);
  });
  if (!Array.isArray(d.filters)) errs.push('The filters list is missing.');
  else d.filters.forEach((f, i) => { if (!f || typeof f.id !== 'string' || typeof f.column !== 'string' || !FILTER_KINDS.includes(f.kind)) errs.push(`Filter ${i + 1} is invalid.`); });
  return errs;
}

/** Parse → migrate → validate → check references against a dataset. Never throws. */
export function loadDashboard(input, ds = null) {
  try {
    const raw = typeof input === 'string' ? JSON.parse(input) : input;
    const doc = migrateDashboard(raw);
    const errors = validateDashboard(doc);
    if (errors.length) return { dashboard: null, errors, warnings: [] };
    const warnings = [];
    if (ds) {
      const viz = new Set((ds.visualizations || []).map((v) => v.id)), kpis = new Set((ds.kpis || []).map((k) => k.id));
      doc.components.forEach((c, i) => {
        if (c.type === 'chart' && !viz.has(c.ref)) warnings.push(`Component ${i + 1} refers to a saved chart that does not exist here.`);
        if (c.type === 'kpi' && !kpis.has(c.ref)) warnings.push(`Component ${i + 1} refers to a KPI that does not exist here.`);
      });
      doc.filters.forEach((f) => { if (!ds.columns.some((c) => c.id === f.column)) warnings.push(`The filter “${f.label || f.column}” uses a column that does not exist in this dataset.`); });
    }
    return { dashboard: { ...doc, components: compact(doc.components) }, errors: [], warnings };
  } catch (e) {
    return { dashboard: null, errors: [e instanceof SyntaxError ? `Not valid JSON: ${e.message}` : e.message], warnings: [] };
  }
}

export const serializeDashboard = (d) => JSON.stringify(d, null, 2);
