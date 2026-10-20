import { buildChartData } from '../visualization/chartData.js';
import { computeKpi } from '../analytics/kpis.js';
import { generateInsights } from '../insights/insightEngine.js';
import { exportAppearanceCss } from './exportAppearance.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (v) => v === null || v === undefined ? '—' : typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 3 }) : String(v);
const table = (headers, rows) => `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((x) => `<td>${esc(fmt(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

function svgText(x, y, value, anchor = 'middle', size = 11) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="currentColor">${esc(value)}</text>`;
}
function chartColor(spec, index) {
  const candidate = spec?.colors?.[index];
  if (typeof candidate === 'string' && /^#[0-9a-f]{6}$/i.test(candidate)) return candidate;
  return ['#6366F1', '#F59E0B', '#22C55E', '#EC4899', '#06B6D4', '#EF4444', '#A78BFA', '#84CC16'][index % 8];
}
function svgFrame(title, inner, { height = 340 } = {}) {
  return `<div class="viz-wrap"><svg class="viz-svg" viewBox="0 0 720 ${height}" role="img" aria-label="${esc(title)}" preserveAspectRatio="xMidYMid meet">${inner}</svg></div>`;
}
function legendMarkup(items) {
  return `<div class="viz-legend">${items.map(({ label, color, value, suffix = '' }) => `<div class="viz-legend-item"><span style="background:${color}"></span>${esc(label)}${value === undefined ? '' : ` <strong>${esc(fmt(value))}</strong>${suffix}`}</div>`).join('')}</div>`;
}
function renderStaticSvg(ds, spec, data, title) {
  const axis = '<line x1="58" y1="286" x2="690" y2="286" stroke="#cbd5e1"/><line x1="58" y1="24" x2="58" y2="286" stroke="#cbd5e1"/>';
  const tooltip = (label, value) => `<title>${esc(`${label}${value === undefined ? '' : `: ${fmt(value)}`}`)}</title>`;
  const cap = 40;
  let body = '';
  if (data.kind === 'scatter') {
    const pts = data.points || [];
    if (!pts.length) return '<p class="muted">No numeric points to display.</p>';
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    for (const p of pts) { if (Number.isFinite(p.x)) { xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x); } if (Number.isFinite(p.y)) { ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y); } }
    if (!Number.isFinite(xmin)) xmin = xmax = 0; if (!Number.isFinite(ymin)) ymin = ymax = 0;
    const sx = v => 70 + (v - xmin) / (xmax === xmin ? 1 : xmax - xmin) * 600;
    const sy = v => 274 - (v - ymin) / (ymax === ymin ? 1 : ymax - ymin) * 230;
    const marks = pts.slice(0, 2000).map(p => `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="3.5" fill="${chartColor(spec, 0)}" fill-opacity=".75">${tooltip(`${p.x}, ${p.y}`)}</circle>`).join('');
    body = svgFrame(title, `${axis}${marks}${svgText(370, 326, data.xLabel || 'X', 'middle', 12)}${svgText(16, 160, data.yLabel || 'Y', 'middle', 12)}`);
    if (pts.length > 2000) body += `<p class="muted small">Showing 2,000 of ${pts.length.toLocaleString()} points for responsiveness.</p>`;
    return body;
  }
  if (data.kind === 'histogram') {
    const bins = data.bins || []; if (!bins.length) return '<p class="muted">No numeric values to display.</p>';
    const max = Math.max(1, ...bins.map(b => Number(b.count) || 0)); const bw = 620 / bins.length;
    const bars = bins.map((b, i) => { const h = (Number(b.count) || 0) / max * 220, x = 66 + i * bw + bw * .08; return `<rect x="${x}" y="${280 - h}" width="${Math.max(1, bw * .84)}" height="${h}" fill="${chartColor(spec, 0)}">${tooltip(`${fmt(b.x0)} – ${fmt(b.x1)}`, b.count)}</rect>${spec.showValues ? svgText(x + bw * .42, Math.max(34, 280 - h - 5), b.count, 'middle', 10) : ''}`; }).join('');
    return svgFrame(title, `${axis}${bars}${svgText(370, 326, data.label || 'Value', 'middle', 12)}${svgText(16, 160, 'Count', 'middle', 12)}`);
  }
  if (data.kind === 'table') return table(data.columns.map(c => c.name), data.rows);
  if (data.kind === 'kpi') return `<div class="kpi-value">${esc(data.formatted)}</div>`;
  if (data.kind !== 'category' && data.kind !== 'multi') return '<p class="warning">This chart type is not supported by the static renderer.</p>';

  let cats, matrix, seriesNames;
  if (data.kind === 'multi') { cats = data.categories || []; seriesNames = data.series.map(s => s.name); matrix = cats.map((_, i) => data.series.map(s => s.values[i])); }
  else { cats = (data.points || []).map(p => p.label); seriesNames = [data.measureLabel || 'Value']; matrix = (data.points || []).map(p => [p.value]); }
  if (!cats.length) return '<p class="muted">No data to display for this chart.</p>';
  const originalCount = cats.length;
  if (cats.length > cap) { cats = cats.slice(0, cap); matrix = matrix.slice(0, cap); }
  const type = spec?.type || data.chart || 'bar';
  // Month-name dimensions must remain chronological in exported time-series charts.
  if (['line', 'area'].includes(type) && (spec?.sort?.by || 'auto') === 'auto') {
    const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    const monthShort = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const monthIndex = (label) => { const key = String(label).trim().replace(/\.$/, '').toLowerCase(); const full = monthNames.indexOf(key); return full >= 0 ? full : monthShort.indexOf(key); };
    if (cats.length && cats.every((label) => monthIndex(label) >= 0)) {
      const ordered = cats.map((label, index) => ({ label, values: matrix[index], index })).sort((a, b) => monthIndex(a.label) - monthIndex(b.label));
      cats = ordered.map((item) => item.label); matrix = ordered.map((item) => item.values);
    }
  }
  if (type === 'pie' || type === 'donut') {
    const points = cats.map((label, i) => ({ label, value: Math.max(0, Number(matrix[i]?.[0]) || 0) })).filter(p => p.value > 0);
    const total = points.reduce((sum, p) => sum + p.value, 0); if (!total) return '<p class="muted">Pie and donut charts need positive values.</p>';
    let angle = -Math.PI / 2; const cx = 210, cy = 166, R = 125, r = type === 'donut' ? 68 : 0;
    const paths = points.map((p, i) => { const frac = p.value / total, next = angle + frac * Math.PI * 2; let path;
      if (frac >= .999999) path = `M ${cx-R} ${cy} A ${R} ${R} 0 1 0 ${cx+R} ${cy} A ${R} ${R} 0 1 0 ${cx-R} ${cy}`;
      else { const x1=cx+R*Math.cos(angle), y1=cy+R*Math.sin(angle), x2=cx+R*Math.cos(next), y2=cy+R*Math.sin(next), big=next-angle>Math.PI?1:0;
        if (r) { const ix2=cx+r*Math.cos(next), iy2=cy+r*Math.sin(next), ix1=cx+r*Math.cos(angle), iy1=cy+r*Math.sin(angle); path=`M ${x1} ${y1} A ${R} ${R} 0 ${big} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${big} 0 ${ix1} ${iy1} Z`; }
        else path=`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${big} 1 ${x2} ${y2} Z`; }
      angle = next; return `<path d="${path}" fill="${chartColor(spec, i)}" stroke="#fff" stroke-width="1.5">${tooltip(p.label, p.value)}</path>`;
    }).join('');
    const legends = legendMarkup(points.map((p, i) => ({ label: p.label, color: chartColor(spec, i), value: p.value, suffix: ` <small>${(p.value / total * 100).toFixed(1)}%</small>` })));
    return `<div class="pie-layout">${svgFrame(title, `${paths}${r ? svgText(cx, cy + 5, fmt(total), 'middle', 17) : ''}`)}${legends}</div>${originalCount > cap ? `<p class="muted small">Showing ${cap} of ${originalCount} categories.</p>` : ''}`;
  }
  const isLine = type === 'line' || type === 'area';
  if (isLine) {
    const allValues = matrix.flat().map(Number).filter(Number.isFinite); let min = Math.min(0, ...allValues), max = Math.max(1, ...allValues); if (!Number.isFinite(min)) min = 0; if (!Number.isFinite(max) || max === min) max = min + 1;
    const sx = i => 88 + (cats.length === 1 ? 290 : i / (cats.length - 1) * 570), sy = v => 274 - (v - min) / (max - min) * 220;
    const tickValues = Array.from({ length: 5 }, (_, i) => min + (max - min) * i / 4);
    const grid = tickValues.map((value, i) => { const y = sy(value); return `<line x1="68" y1="${y}" x2="690" y2="${y}" stroke="#cbd5e1" stroke-opacity=".65"/><text x="60" y="${y + 4}" text-anchor="end" font-size="10" fill="currentColor">${esc(fmt(value))}</text>`; }).join('');
    let shapes = ''; seriesNames.forEach((name, si) => { const ps = matrix.map((vs, i) => ({ x: sx(i), y: sy(Number(vs?.[si]) || 0), v: Number(vs?.[si]) || 0 })); if (!ps.length) return; const line = ps.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
      if (type === 'area') shapes += `<path d="${line} L ${ps[ps.length-1].x} 274 L ${ps[0].x} 274 Z" fill="${chartColor(spec, si)}" fill-opacity=".16"/>`;
      shapes += `<path d="${line}" fill="none" stroke="${chartColor(spec, si)}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` + ps.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${chartColor(spec, si)}">${tooltip(`${cats[i]} · ${name}`, p.v)}</circle>${spec.showValues ? svgText(p.x, Math.max(36, p.y - 9 - si * 10), fmt(p.v), 'middle', 10) : ''}`).join('');
    });
    const labels = cats.map((c, i) => svgText(sx(i), 298, c, 'middle', cats.length > 12 ? 9 : 11)).join('');
    const xTitle = spec?.axis?.xTitle?.trim() || data.dimensionLabel || 'Category';
    const yTitle = spec?.axis?.yTitle?.trim() || data.measureLabel || 'Value';
    const titles = `${svgText(390, 335, xTitle, 'middle', 12)}<text x="17" y="160" text-anchor="middle" font-size="12" fill="currentColor" transform="rotate(-90 17 160)">${esc(yTitle)}</text>`;
    return `${svgFrame(title, `${grid}<line x1="68" y1="286" x2="690" y2="286" stroke="#cbd5e1"/><line x1="68" y1="24" x2="68" y2="286" stroke="#cbd5e1"/>${shapes}${labels}${titles}`, { height: 360 })}${seriesNames.length > 1 ? legendMarkup(seriesNames.map((label, i) => ({ label, color: chartColor(spec, i) }))) : ''}${originalCount > cap ? `<p class="muted small">Showing ${cap} of ${originalCount} categories.</p>` : ''}`;
  }
  if (type === 'grouped' || type === 'stacked') {
    let max = 1; for (const values of matrix) { const v = type === 'stacked' ? values.reduce((a, x) => a + (Number(x) || 0), 0) : Math.max(0, ...values.map(x => Number(x) || 0)); max = Math.max(max, v); }
    const groupW = 620 / cats.length; let bars = '';
    matrix.forEach((values, i) => { if (type === 'stacked') { let bottom = 280; values.forEach((value, j) => { const h = Math.max(0, Number(value) || 0) / max * 220; bottom -= h; bars += `<rect x="${66+i*groupW+groupW*.15}" y="${bottom}" width="${groupW*.7}" height="${h}" fill="${chartColor(spec,j)}">${tooltip(`${cats[i]} · ${seriesNames[j]}`, value)}</rect>${spec.showValues ? svgText(66+i*groupW+groupW*.5, Math.max(34,bottom-4), fmt(value), 'middle', 10) : ''}`; }); }
      else { const bw = groupW * .72 / Math.max(1, seriesNames.length); values.forEach((value, j) => { const h = Math.max(0, Number(value) || 0) / max * 220, x = 66 + i*groupW + groupW*.12 + j*bw; bars += `<rect x="${x}" y="${280-h}" width="${Math.max(1,bw-2)}" height="${h}" fill="${chartColor(spec,j)}">${tooltip(`${cats[i]} · ${seriesNames[j]}`, value)}</rect>${spec.showValues ? svgText(x+bw*.36, Math.max(34,280-h-4), fmt(value), 'middle', 10) : ''}`; }); } });
    const labels = cats.map((c, i) => svgText(66+i*groupW+groupW/2, 302, c, 'middle', cats.length > 12 ? 9 : 11)).join('');
    return `${svgFrame(title, `${axis}${bars}${labels}`)}${legendMarkup(seriesNames.map((label, i) => ({ label, color: chartColor(spec, i) })))}${originalCount > cap ? `<p class="muted small">Showing ${cap} of ${originalCount} categories.</p>` : ''}`;
  }
  if (type === 'hbar') {
    const max = Math.max(1, ...matrix.map(v => Math.abs(Number(v[0]) || 0)));
    return `<div class="bar-list">${cats.map((label, i) => { const value = Number(matrix[i]?.[0]) || 0; const pct = Math.max(0, Math.min(50, Math.abs(value) / max * 50)); const left = value < 0 ? `calc(50% - ${pct}%)` : '50%'; return `<div class="bar-row"><span>${esc(label)}</span><div class="bar-track" style="position:relative"><div class="bar" style="position:absolute;left:${left};width:${pct}%;background:${chartColor(spec,i)}"></div></div>${spec.showValues ? `<strong>${esc(fmt(value))}</strong>` : ''}</div>`; }).join('')}</div>${originalCount > cap ? `<p class="muted small">Showing ${cap} of ${originalCount} categories.</p>` : ''}`;
  }
  const vals = matrix.map(v => Number(v?.[0]) || 0); const min = Math.min(0, ...vals); const max = Math.max(0, 1, ...vals); const span = max - min || 1; const y = value => 280 - (value - min) / span * 220; const baseline = y(0); const bw = 620 / cats.length;
  const barAxis = `<line x1="58" y1="${baseline}" x2="690" y2="${baseline}" stroke="#94a3b8"/><line x1="58" y1="24" x2="58" y2="286" stroke="#cbd5e1"/>`;
  const bars = cats.map((label, i) => { const value = vals[i], valueY = y(value), top = Math.min(baseline, valueY), h = Math.max(1, Math.abs(baseline - valueY)), x = 66 + i*bw + bw*.12; return `<rect x="${x}" y="${top}" width="${Math.max(1,bw*.76)}" height="${h}" fill="${chartColor(spec,i)}">${tooltip(label,value)}</rect>${spec.showValues ? svgText(x+bw*.38, Math.max(34,top-5), fmt(value), 'middle', 10) : ''}`; }).join('');
  const labels = cats.map((c, i) => svgText(66+i*bw+bw/2, 302, c, 'middle', cats.length > 12 ? 9 : 11)).join('');
  return `${svgFrame(title, `${barAxis}${bars}${labels}${svgText(370, 336, spec?.axis?.xTitle || '', 'middle', 11)}`)}${originalCount > cap ? `<p class="muted small">Showing ${cap} of ${originalCount} categories.</p>` : ''}`;
}
function chartMarkup(ds, comp) {
  const spec = (ds.visualizations || []).find((v) => v.id === comp.config.vizId);
  if (!spec) return '<p class="warning">The saved chart for this component is missing.</p>';
  try {
    const data = buildChartData(ds, spec);
    const effectiveSpec = { ...spec, showValues: comp.config.showValues === undefined ? !!spec.showValues : !!comp.config.showValues, sort: { ...(spec.sort || {}), ...(comp.config.sortBy ? { by: comp.config.sortBy } : {}), ...(comp.config.sortDir ? { dir: comp.config.sortDir } : {}) } };
    const effectiveData = buildChartData(ds, effectiveSpec);
    const body = effectiveData.empty ? '<p class="muted">No data to display for this chart.</p>' : renderStaticSvg(ds, effectiveSpec, effectiveData, effectiveSpec.title || comp.title || 'Chart');
    const warnings = (data.warnings || []).map((w) => `<li>${esc(w)}</li>`).join('');
    const truncated = data.truncated ? `<li>Some values were omitted by the chart data limit (${esc(data.truncated.shown)} of ${esc(data.truncated.total)}).</li>` : '';
    return `${body}${warnings || truncated ? `<ul class="warnings">${warnings}${truncated}</ul>` : ''}`;
  } catch (e) { return `<p class="warning">Chart could not be exported: ${esc(e.message)}</p>`; }
}

/**
 * Creates an offline, static HTML snapshot of a dashboard. It embeds only the values rendered
 * in dashboard components (aggregated chart results, visible table rows, KPI values and insights),
 * not the full source dataset. Dashboard filter controls become explanatory notes because this
 * export is a snapshot, not a live JSA application.
 */
export function createStaticDashboardHtml(ds, dashboard, { generatedAt = new Date().toISOString(), appearance: appearanceInput } = {}) {
  const appearance = exportAppearanceCss(appearanceInput);
  if (!ds || !dashboard || !Array.isArray(dashboard.components)) throw new Error('A dataset and valid dashboard are required to export HTML.');
  if (!Array.isArray(ds.columns) || !ds.data || typeof ds.data !== 'object' || !Number.isFinite(Number(ds.rowCount))) throw new Error('A dataset with columns, column data, and a valid row count is required to export HTML.');
  const savedInsights = (() => { try { return generateInsights(ds, ds.insightOptions || {}).insights; } catch { return []; } })();
  const components = [...dashboard.components].sort((a, b) => (a.layout?.y ?? 0) - (b.layout?.y ?? 0) || (a.layout?.x ?? 0) - (b.layout?.x ?? 0));
  const cards = components.map((comp) => {
    let body = '';
    let heading = comp.title || comp.type;
    if (comp.type === 'chart' || comp.type === 'table') {
      const sourceChart = (ds.visualizations || []).find((v) => v.id === comp.config.vizId);
      heading = sourceChart?.title || comp.title || 'Untitled chart';
    } else if (comp.type === 'kpi') {
      const sourceKpi = (ds.kpis || []).find((k) => k.id === comp.config.kpiId);
      heading = sourceKpi?.name || comp.title || 'KPI';
    } else if (comp.type === 'filter') {
      const sourceColumn = ds.columns.find((c) => c.id === comp.config.column);
      heading = sourceColumn?.name || comp.title || 'Filter';
    }
    if (comp.type === 'chart') body = chartMarkup(ds, comp);
    else if (comp.type === 'table') {
      const spec = (ds.visualizations || []).find((v) => v.id === comp.config.vizId);
      if (!spec) body = '<p class="warning">The source chart is missing.</p>';
      else { try { const effectiveSpec = { ...spec, sort: { ...(spec.sort || {}), ...(comp.config.sortBy ? { by: comp.config.sortBy } : {}), ...(comp.config.sortDir ? { dir: comp.config.sortDir } : {}) } }; const d = buildChartData(ds, effectiveSpec); let headers = [], rows = []; if (d.kind === 'category' && d.points) { headers = [d.dimensionLabel || 'Category', d.measureLabel || 'Value']; rows = d.points.map((p) => [p.label, p.value]); } else if (d.kind === 'multi') { headers = [d.dimensionLabel || 'Category', ...d.series.map((x) => x.name)]; rows = d.categories.map((c, i) => [c, ...d.series.map((x) => x.values[i])]); } else if (d.kind === 'scatter') { headers = [d.xLabel || 'X', d.yLabel || 'Y']; rows = d.points.map((p) => [p.x, p.y]); } else if (d.kind === 'histogram') { headers = ['Range', 'Count']; rows = (d.bins || []).map((b) => [`${fmt(b.x0)} – ${fmt(b.x1)}`, b.count]); } else if (d.kind === 'table') { headers = d.columns.map((c) => c.name); rows = d.rows; } body = rows.length ? table(headers, rows) : '<p class="muted">No tabular data is available.</p>'; } catch (e) { body = `<p class="warning">Table could not be exported: ${esc(e.message)}</p>`; } }
    }
    else if (comp.type === 'kpi') {
      const kpi = (ds.kpis || []).find((k) => k.id === comp.config.kpiId);
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
    return `<section class="card" role="listitem" style="grid-column:${x + 1}/span ${w};grid-row:${y + 1}/span ${h}"><h2>${esc(heading)}</h2>${body}</section>`;
  }).join('\n');
  const title = esc(dashboard.title || 'JSA Dashboard');
  const description = esc(dashboard.description || '');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="generator" content="JSA"><title>${title}</title>
<style>
:root{color-scheme:${appearance.preset === 'midnight' ? 'dark' : 'light'};--accent:${appearance.accent};--ink:${appearance.text};--muted:${appearance.muted};--line:${appearance.muted}44;--panel:${appearance.panel};--bg:${appearance.background};--card-radius:${appearance.radius};--layout-gap:${appearance.spacing};--card-pad:${appearance.padding};--font-stack:${appearance.fontStack}}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 var(--font-stack)}.wrap{max-width:1440px;margin:auto;padding:32px}.head{margin-bottom:24px}.eyebrow{color:var(--accent);font-size:.78rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.head h1{margin:.25rem 0;font-size:clamp(1.7rem,4vw,2.6rem)}.muted{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-rows:minmax(70px,auto);gap:var(--layout-gap)}.card{min-width:0;overflow:hidden;background:var(--panel);border:1px solid var(--line);border-radius:var(--card-radius);padding:var(--card-pad);box-shadow:0 2px 8px #0f172a08}.card h2{font-size:1rem;margin:0 0 14px}.kpi-value{font-size:clamp(1.5rem,3vw,2.5rem);font-weight:750;letter-spacing:-.04em}.text-content{white-space:normal;overflow-wrap:anywhere}.viz-wrap{width:100%;min-width:0;overflow:hidden}.viz-svg{display:block;width:100%;height:auto;max-height:390px;overflow:visible}.pie-layout{display:grid;grid-template-columns:minmax(180px,1fr) minmax(150px,1fr);gap:12px;align-items:center}.viz-legend{display:flex;gap:8px 14px;flex-wrap:wrap;margin-top:10px;font-size:.82rem}.viz-legend-item{display:flex;align-items:center;gap:6px;min-width:0;overflow-wrap:anywhere}.viz-legend-item span{display:inline-block;width:10px;height:10px;flex:0 0 10px;border-radius:3px}.small{font-size:.82rem}.bars{display:grid;gap:10px}.bar-row{display:grid;grid-template-columns:minmax(70px,1fr) minmax(70px,2fr) auto;gap:10px;align-items:center;font-size:.9rem}.bar-row>span{overflow-wrap:anywhere}.bar-track{height:10px;background:linear-gradient(to right,transparent 49.7%,#94a3b8 49.7%,#94a3b8 50.3%,transparent 50.3%),#e8edf5;border-radius:999px;overflow:hidden}.bar{height:100%;background:var(--accent);border-radius:999px}.table-wrap{overflow:auto;max-width:100%}table{width:100%;border-collapse:collapse;font-size:.88rem}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap}th{background:var(--bg);color:var(--muted)}td{max-width:280px;overflow:hidden;text-overflow:ellipsis}.warnings{color:#92400e;font-size:.85rem;padding-left:20px}.warning{color:#b91c1c}.foot{margin-top:24px;border-top:1px solid var(--line);padding-top:14px;font-size:.8rem;color:var(--muted)}a{color:var(--accent)}.export-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 22px;padding:12px 14px;background:#fff;border:1px solid var(--line);border-radius:var(--card-radius)}.print-button{appearance:none;border:0;border-radius:8px;background:var(--accent);color:#fff;font:600 14px/1.2 system-ui,sans-serif;padding:11px 16px;cursor:pointer}.print-help{font-size:.88rem;color:var(--muted)}:focus-visible{outline:3px solid var(--accent);outline-offset:3px}@media(max-width:760px){.pie-layout{grid-template-columns:minmax(0,1fr)}.wrap{padding:16px}.grid{grid-template-columns:minmax(0,1fr);grid-auto-rows:auto}.card{grid-column:1!important;grid-row:auto!important;padding:14px}.bar-row{grid-template-columns:minmax(0,1fr) auto}.bar-track{grid-column:1/-1;grid-row:2}.bar-row strong{grid-column:2;grid-row:1}th,td{padding:7px 8px}.head p{overflow-wrap:anywhere}}@page{size:auto;margin:12mm}@media print{html,body{background:#fff!important;color:#111!important;font-size:10pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}.wrap{max-width:none;padding:0}.export-actions{display:none!important}.head{margin-bottom:14px}.head h1{font-size:22pt}.card{overflow:visible;box-shadow:none;break-inside:avoid;page-break-inside:avoid;border-color:#bbb;padding:12px}.grid{gap:8px;grid-auto-rows:minmax(40px,auto)}.foot{color:#444;break-inside:avoid}.bar-track{border:1px solid #bbb}.bar{print-color-adjust:exact;-webkit-print-color-adjust:exact}.table-wrap{overflow:visible}table{font-size:8.5pt}th,td{white-space:normal;overflow-wrap:anywhere}a{color:#111;text-decoration:none}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
</style></head><body><main class="wrap"><header class="head"><div class="eyebrow">${esc(appearance.brandLabel)} · Static dashboard snapshot</div><h1>${title}</h1>${description ? `<p class="muted">${description}</p>` : ''}<p class="muted">Dataset: ${esc(ds.name || 'Untitled dataset')} · ${Number(ds.rowCount || 0).toLocaleString()} rows · Generated ${esc(new Date(generatedAt).toLocaleString())}</p></header><div class="export-actions"><button class="print-button" type="button" onclick="window.print()">Print / Save as PDF</button><span class="print-help">Choose a printer or select “Save as PDF” in your browser’s print dialog.</span></div><div class="grid" role="list" aria-label="Dashboard components">${cards}</div>${appearance.showFooter ? `<footer class="foot">Exported from ${esc(appearance.brandLabel)}. This is a static snapshot: dashboard filter controls are not interactive and values will not refresh automatically. Only values rendered by the included components are embedded; inspect the HTML before sharing sensitive results.</footer>` : ''}</main></body></html>`;
}
