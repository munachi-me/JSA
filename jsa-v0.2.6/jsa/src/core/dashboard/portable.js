// Dashboard configuration export/import. The export embeds the charts, KPIs and analyses the
// dashboard uses, so it can be re-imported elsewhere. It contains NO row data, and it is a
// configuration file, not a standalone dashboard application.
import { SCHEMA_VERSION, newId, validateDashboard } from './dashboardSchema.js';

export const FORMAT = 'jsa-dashboard';

export function exportDashboard(ds, dash) {
  const vizIds = new Set(dash.components.filter((c) => c.type === 'chart').map((c) => c.config.vizId));
  const visualizations = ds.visualizations.filter((v) => vizIds.has(v.id));
  const kpiIds = new Set([...dash.components.filter((c) => c.type === 'kpi').map((c) => c.config.kpiId), ...visualizations.map((v) => v.kpiId).filter(Boolean)]);
  const analysisIds = new Set(visualizations.map((v) => v.source?.kind === 'analysis' && v.source.analysisId).filter(Boolean));
  const colIds = new Set(dash.components.filter((c) => c.type === 'filter').map((c) => c.config.column));
  const collect = (o) => { if (Array.isArray(o)) o.forEach(collect); else if (o && typeof o === 'object') { for (const [k, v] of Object.entries(o)) { if (['column', 'dimension', 'series', 'x', 'y'].includes(k) && typeof v === 'string' && v) colIds.add(v); else if (k === 'groupBy' && Array.isArray(v)) v.forEach((x) => colIds.add(x)); else collect(v); } } };
  const kpis = ds.kpis.filter((k) => kpiIds.has(k.id));
  const analyses = ds.analyses.filter((a) => analysisIds.has(a.id));
  collect(visualizations); collect(kpis); collect(analyses);
  const columns = [...colIds].map((id) => ds.columns.find((c) => c.id === id)).filter(Boolean).map((c) => ({ id: c.id, name: c.name, type: c.type }));
  return { format: FORMAT, schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(),
    note: 'JSA dashboard configuration. Contains layout, charts, KPIs and analysis definitions, but no data.',
    columns, dashboard: dash, visualizations, kpis, analyses };
}

/** Returns { dashboard, visualizations, kpis, analyses } with fresh ids, or throws a readable Error. */
export function importDashboard(ds, payload) {
  if (!payload || payload.format !== FORMAT) throw new Error('This is not a JSA dashboard file.');
  const v = validateDashboard(payload.dashboard);
  if (!v.ok) throw new Error(`The dashboard is invalid: ${v.errors.join(' ')}`);
  const bad = (payload.columns || []).filter((c) => { const mine = ds.columns.find((x) => x.id === c.id); return !mine || mine.name !== c.name; });
  if (bad.length) throw new Error(`This dataset does not have the columns the dashboard needs: ${bad.map((c) => `“${c.name}”`).join(', ')}. Open the dataset the dashboard was made for.`);
  const map = new Map();
  const remap = (old, prefix) => { if (!map.has(old)) map.set(old, newId(prefix)); return map.get(old); };
  const analyses = (payload.analyses || []).map((a) => ({ ...a, id: remap(a.id, 'an') }));
  const kpis = (payload.kpis || []).map((k) => ({ ...k, id: remap(k.id, 'kpi') }));
  const visualizations = (payload.visualizations || []).map((s) => ({ ...s, id: remap(s.id, 'viz'),
    ...(s.kpiId ? { kpiId: remap(s.kpiId, 'kpi') } : {}), ...(s.source?.kind === 'analysis' ? { source: { ...s.source, analysisId: remap(s.source.analysisId, 'an') } } : {}) }));
  const dashboard = { ...v.dashboard, id: newId('dash'), datasetId: ds.id, title: `${v.dashboard.title} (imported)`,
    components: v.dashboard.components.map((c) => ({ ...c, id: newId('cmp'), config: { ...c.config,
      ...(c.config.vizId ? { vizId: remap(c.config.vizId, 'viz') } : {}), ...(c.config.kpiId ? { kpiId: remap(c.config.kpiId, 'kpi') } : {}) } })) };
  return { dashboard, visualizations, kpis, analyses };
}
