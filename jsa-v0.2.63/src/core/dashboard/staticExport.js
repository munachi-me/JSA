import { buildChartData } from '../visualization/chartData.js';
import { computeKpi } from '../analytics/kpis.js';
import { generateInsights } from '../insights/insightEngine.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (v) => v === null || v === undefined ? '—' : typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 3 }) : String(v);
const table = (headers, rows) => `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((x) => `<td>${esc(fmt(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

function chartMarkup(ds, comp) {
  const spec = ds.visualizations.find((v) => v.id === comp.config.vizId);
  if (!spec) return '<p class="warning">The saved chart for this component is missing.</p>'; 
  try {
    const data = buildChartData(ds, { ...spec, title: comp.title || spec.title });
    let body = '';
    if (data.kind === 'category') {
      const max = Math.max(1, ...data.points.map((p) => Number(p.value) || 0));
      body = `<div class="bars" role="list" aria-label="${esc(data.dimensionLabel || comp.title || 'Chart values')}">${data.points.map((p) => { const width = Math.max(0, Math.min(100, (Number(p.value) || 0) / max * 100)); return `<div class="bar-row" role="listitem"><span>${esc(p.label)}</span><div class="bar-track" role="img" aria-label="${esc(p.label)}: ${esc(fmt(p.value))}"><div class="bar" style="width:${width}%"></div></div><strong>${esc(fmt(p.value))}</strong></div>`; }).join('')}</div>`;
    } else if (data.kind === 'multi') {
      body = table(['Category', ...data.series.map((s) => s.name)], data.categories.map((c, i) => [c, ...data.series.map((s) => s.values[i])]));
    } else if (data.kind === 'scatter') {
      body = table([data.xLabel, data.yLabel], data.points.slice(0, 100).map((p) => [p.x, p.y]));
    } else if (data.kind === 'histogram') {
      body = table(['Range start', 'Range end', 'Count'], data.bins.map((b) => [b.x0, b.x1, b.count]));
    } else if (data.kind === 'table') {
      body = table(data.columns.map((c) => c.name), data.rows);
    } else if (data.kind === 'kpi') {
      body = `<div class="kpi-value">${esc(data.formatted)}</div>`;
    }
    const warnings = (data.warnings || []).map((w) => `<li>${esc(w)}</li>`).join('');
    return `${data.empty ? '<p class="muted">No data to display for this chart.</p>' : body}${warnings ? `<ul class="warnings">${warnings}</ul>` : ''}`;
  } catch (e) { return `<p class="warning">Chart could not be exported: ${esc(e.message)}</p>`; }
}

/**
 * Creates an offline, static HTML snapshot of a dashboard. It embeds only the values rendered
 * in dashboard components (aggregated chart results, visible table rows, KPI values and insights),
 * not the full source dataset. Dashboard filter controls become explanatory notes because this
 * export is a snapshot, not a live JSA application.
 */
export function createStaticDashboardHtml(ds, dashboard, { generatedAt = new Date().toISOString() } = {}) {
  if (!ds || !dashboard || !Array.isArray(dashboard.components)) throw new Error('A dataset and valid dashboard are required to export HTML.');
  const savedInsights = (() => { try { return generateInsights(ds, ds.insightOptions || {}).insights; } catch { return []; } })();
  const components = [...dashboard.components].sort((a, b) => (a.layout?.y ?? 0) - (b.layout?.y ?? 0) || (a.layout?.x ?? 0) - (b.layout?.x ?? 0));
  const cards = components.map((comp) => {
    let body = '';
    let heading = comp.title || comp.type;
    if (comp.type === 'chart') {
      const sourceChart = ds.visualizations.find((v) => v.id === comp.config.vizId);
      heading = sourceChart?.title || comp.title || 'Untitled chart';
    } else if (comp.type === 'kpi') {
      const sourceKpi = ds.kpis.find((k) => k.id === comp.config.kpiId);
      heading = sourceKpi?.name || comp.title || 'KPI';
    } else if (comp.type === 'filter') {
      const sourceColumn = ds.columns.find((c) => c.id === comp.config.column);
      heading = sourceColumn?.name || comp.title || 'Filter';
    }
    if (comp.type === 'chart') body = chartMarkup(ds, comp);
    else if (comp.type === 'kpi') {
      const kpi = ds.kpis.find((k) => k.id === comp.config.kpiId);
      if (!kpi) body = '<p class="warning">This KPI is missing.</p>';
      else { try { const result = computeKpi(ds, kpi); body = `<div class="kpi-value">${esc(result.formatted)}</div>${result.status ? `<p class="muted">Target ${esc(result.status)}</p>` : ''}${result.warnings?.length ? `<ul class="warnings">${result.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}`; } catch (e) { body = `<p class="warning">KPI could not be calculated: ${esc(e.message)}</p>`; } }
    } else if (comp.type === 'text') body = `<div class="text-content">${esc(comp.config.text || '').replace(/\n/g, '<br>')}</div>`;
    else if (comp.type === 'filter') { const col = ds.columns.find((c) => c.id === comp.config.column); body = `<p class="muted">Interactive filter for <strong>${esc(col?.name || 'missing column')}</strong> is available in the JSA editor. This exported HTML is a static snapshot.</p>`; }
    else if (comp.type === 'insight') { const insight = savedInsights.find((i) => i.id === comp.config.insightId); body = insight ? `<p>${esc(insight.summary || insight.title || 'Insight')}</p>${insight.followUp ? `<p class="muted">Next: ${esc(insight.followUp)}</p>` : ''}` : '<p class="muted">This insight is not available for the current dataset.</p>'; }
    else body = '<p class="warning">This component type is not supported by the static HTML exporter.</p>'; 
    const x = Math.max(0, Math.min(11, Number(comp.layout?.x) || 0));
    const w = Math.max(1, Math.min(12 - x, Number(comp.layout?.w) || 6));
    const y = Math.max(0, Number(comp.layout?.y) || 0);
    const h = Math.max(1, Number(comp.layout?.h) || 2);
    return `<section class="card" style="grid-column:${x + 1}/span ${w};grid-row:${y + 1}/span ${h}"><h2>${esc(heading)}</h2>${body}</section>`;
  }).join('\n');
  const title = esc(dashboard.title || 'JSA Dashboard');
  const description = esc(dashboard.description || '');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="generator" content="JSA"><title>${title}</title>
<style>
:root{color-scheme:light;--accent:${/^#[0-9a-f]{6}$/i.test(dashboard.theme?.accent || '') ? dashboard.theme.accent : '#6366f1'};--ink:#18202b;--muted:#64748b;--line:#e2e8f0;--panel:#fff;--bg:#f5f7fb}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:1440px;margin:auto;padding:32px}.head{margin-bottom:24px}.eyebrow{color:var(--accent);font-size:.78rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.head h1{margin:.25rem 0;font-size:clamp(1.7rem,4vw,2.6rem)}.muted{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-rows:minmax(70px,auto);gap:16px}.card{min-width:0;overflow:hidden;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px;box-shadow:0 2px 8px #0f172a08}.card h2{font-size:1rem;margin:0 0 14px}.kpi-value{font-size:clamp(1.5rem,3vw,2.5rem);font-weight:750;letter-spacing:-.04em}.text-content{white-space:normal;overflow-wrap:anywhere}.bars{display:grid;gap:10px}.bar-row{display:grid;grid-template-columns:minmax(70px,1fr) minmax(70px,2fr) auto;gap:10px;align-items:center;font-size:.9rem}.bar-row>span{overflow-wrap:anywhere}.bar-track{height:10px;background:#e8edf5;border-radius:999px;overflow:hidden}.bar{height:100%;background:var(--accent);border-radius:999px}.table-wrap{overflow:auto;max-width:100%}table{width:100%;border-collapse:collapse;font-size:.88rem}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap}th{background:#f8fafc;color:#475569}td{max-width:280px;overflow:hidden;text-overflow:ellipsis}.warnings{color:#92400e;font-size:.85rem;padding-left:20px}.warning{color:#b91c1c}.foot{margin-top:24px;border-top:1px solid var(--line);padding-top:14px;font-size:.8rem;color:var(--muted)}a{color:var(--accent)}.export-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 22px;padding:12px 14px;background:#fff;border:1px solid var(--line);border-radius:12px}.print-button{appearance:none;border:0;border-radius:8px;background:var(--accent);color:#fff;font:600 14px/1.2 system-ui,sans-serif;padding:11px 16px;cursor:pointer}.print-help{font-size:.88rem;color:var(--muted)}:focus-visible{outline:3px solid var(--accent);outline-offset:3px}@media(max-width:760px){.wrap{padding:16px}.grid{grid-template-columns:minmax(0,1fr);grid-auto-rows:auto}.card{grid-column:1!important;grid-row:auto!important;padding:14px}.bar-row{grid-template-columns:minmax(0,1fr) auto}.bar-track{grid-column:1/-1;grid-row:2}.bar-row strong{grid-column:2;grid-row:1}th,td{padding:7px 8px}.head p{overflow-wrap:anywhere}}@page{size:auto;margin:12mm}@media print{html,body{background:#fff!important;color:#111!important;font-size:10pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}.wrap{max-width:none;padding:0}.export-actions{display:none!important}.head{margin-bottom:14px}.head h1{font-size:22pt}.card{overflow:visible;box-shadow:none;break-inside:avoid;page-break-inside:avoid;border-color:#bbb;padding:12px}.grid{gap:8px;grid-auto-rows:minmax(40px,auto)}.foot{color:#444;break-inside:avoid}.bar-track{border:1px solid #bbb}.bar{print-color-adjust:exact;-webkit-print-color-adjust:exact}.table-wrap{overflow:visible}table{font-size:8.5pt}th,td{white-space:normal;overflow-wrap:anywhere}a{color:#111;text-decoration:none}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
</style></head><body><main class="wrap"><header class="head"><div class="eyebrow">JSA · Static dashboard snapshot</div><h1>${title}</h1>${description ? `<p class="muted">${description}</p>` : ''}<p class="muted">Dataset: ${esc(ds.name || 'Untitled dataset')} · ${Number(ds.rowCount || 0).toLocaleString()} rows · Generated ${esc(new Date(generatedAt).toLocaleString())}</p></header><div class="export-actions"><button class="print-button" type="button" onclick="window.print()">Print / Save as PDF</button><span class="print-help">Choose a printer or select “Save as PDF” in your browser’s print dialog.</span></div><div class="grid">${cards}</div><footer class="foot">Exported from JSA. This is a static snapshot: dashboard filter controls are not interactive and values will not refresh automatically. Only values rendered by the included components are embedded; inspect the HTML before sharing sensitive results.</footer></main></body></html>`;
}
