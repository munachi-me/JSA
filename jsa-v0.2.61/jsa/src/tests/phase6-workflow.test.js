import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import { profileDataset } from '../core/data/profile.js';
import { runPipeline, makeStep } from '../core/transforms/pipeline.js';
import { aggregate } from '../core/analytics/aggregation.js';
import { generateInsights } from '../core/insights/insightEngine.js';
import { makeDashboard, addComponent, validateDashboard } from '../core/dashboard/dashboardSchema.js';
import { exportDashboard, importDashboard } from '../core/dashboard/portable.js';
import { createStaticDashboardHtml } from '../core/dashboard/staticExport.js';
import { makeSpec } from '../core/visualization/chartSpec.js';
import { createIndexedDBAdapter } from '../core/storage/indexedDBAdapter.js';

describe('Phase 6 end-to-end data workflow', () => {
  const csv = [
    'region,revenue,units',
    'East,100,2',
    'West,200,4',
    'East,150,3',
    'West,50,1',
    'East,300,6',
  ].join('\n');

  it('keeps the source unchanged and feeds transformed rows into downstream analysis', () => {
    const source = datasetFromCsv(csv, { name: 'sales' });
    const revenue = source.columns.find((c) => c.name === 'revenue');
    const step = makeStep('filterRows', {
      action: 'keep', mode: 'all',
      conditions: [{ column: revenue.id, op: 'gte', value: 150 }],
    });
    const { dataset: working, results } = runPipeline(source, [step]);

    expect(results[0].ok).toBe(true);
    expect(source.rowCount).toBe(5);
    expect(working.rowCount).toBe(3);
    expect(working.data[revenue.id]).toEqual([200, 150, 300]);

    const region = working.columns.find((c) => c.name === 'region');
    const totals = aggregate(working, {
      groupBy: [region.id],
      measures: [{ column: revenue.id, op: 'sum', as: 'total_revenue' }],
    });
    expect(totals.rows.reduce((sum, row) => sum + row.total_revenue, 0)).toBe(650);

    const profile = profileDataset(working);
    expect(profile.totalMissing).toBe(0);
    expect(profile.duplicateRows).toBe(0);
    const insightResult = generateInsights(working);
    expect(Array.isArray(insightResult.insights)).toBe(true);
    expect(Array.isArray(insightResult.skipped)).toBe(true);
  });

  it('exports and re-imports dashboard configuration without embedding source rows', () => {
    const ds = datasetFromCsv(csv, { name: 'sales' });
    const dashboard = addComponent(makeDashboard({ title: 'Sales overview', datasetId: ds.id }), 'text', { text: 'Revenue summary' }, 'Summary');
    expect(validateDashboard(dashboard).ok).toBe(true);

    const payload = exportDashboard({ ...ds, visualizations: [], kpis: [], analyses: [] }, dashboard);
    expect(payload.format).toBe('jsa-dashboard');
    expect(JSON.stringify(payload)).not.toContain('"revenue":100');

    const imported = importDashboard(ds, JSON.parse(JSON.stringify(payload)));
    expect(imported.dashboard.title).toBe('Sales overview (imported)');
    expect(imported.dashboard.components).toHaveLength(1);
    expect(imported.dashboard.components[0].config.text).toBe('Revenue summary');
    expect(imported.dashboard.datasetId).toBe(ds.id);
  });

  it('creates a self-contained static HTML snapshot and escapes user content', () => {
    const ds = datasetFromCsv(csv, { name: 'sales' });
    const dashboard = addComponent(
      makeDashboard({ title: '<Sales & Summary>', description: 'Offline report', datasetId: ds.id }),
      'text',
      { text: '<script>alert(1)</script> & report' },
      'Executive notes'
    );
    const html = createStaticDashboardHtml(ds, dashboard, { generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('&lt;Sales &amp; Summary&gt;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; report');
    expect(html).toContain('static snapshot');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('"revenue":100');
  });


  it('exports supported component types and includes responsive and print-friendly styles', () => {
    const base = datasetFromCsv(csv, { name: 'sales' });
    const region = base.columns.find((c) => c.name === 'region');
    const revenue = base.columns.find((c) => c.name === 'revenue');
    const spec = makeSpec({
      id: 'viz-sales-region', title: 'Revenue by region', type: 'bar',
      dimension: region.id, measures: [{ op: 'sum', column: revenue.id, as: 'revenue_total' }],
    });
    const ds = {
      ...base,
      visualizations: [spec],
      kpis: [{ id: 'kpi-revenue', name: 'Total revenue', numerator: { op: 'sum', column: revenue.id }, format: 'currency' }],
      analyses: [],
      insights: [],
    };
    let dashboard = makeDashboard({ title: 'Sales report', datasetId: ds.id });
    dashboard = addComponent(dashboard, 'chart', { vizId: spec.id }, 'Dashboard chart label');
    dashboard = addComponent(dashboard, 'kpi', { kpiId: 'kpi-revenue' }, 'Dashboard KPI label');
    dashboard = addComponent(dashboard, 'filter', { column: region.id }, 'Dashboard filter label');
    dashboard = addComponent(dashboard, 'insight', { insightId: 'missing-insight' }, 'Saved insight');
    dashboard = addComponent(dashboard, 'text', { text: 'Quarterly summary' }, 'Notes');

    const html = createStaticDashboardHtml(ds, dashboard, { generatedAt: '2026-01-01T00:00:00.000Z' });
    expect(html).toContain('Revenue by region');
    expect(html).not.toContain('Dashboard chart label');
    expect(html).toContain('role="list"');
    expect(html).toContain('Total revenue');
    expect(html).not.toContain('Dashboard KPI label');
    expect(html).toContain('Print / Save as PDF');
    expect(html).toContain('window.print()');
    expect(html).toContain('Choose a printer or select “Save as PDF”');
    expect(html).toContain('Interactive filter for');
    expect(html).toContain('<h2>region</h2>');
    expect(html).not.toContain('<h2>Dashboard filter label</h2>');
    expect(html).toContain('This insight is not available');
    expect(html).toContain('Quarterly summary');
    expect(html).toContain('@media(max-width:760px)');
    expect(html).toContain('@media print');
    expect(html).toContain('prefers-reduced-motion');
  });

  it('persists and restores source datasets and project metadata in IndexedDB', async () => {
    const adapter = createIndexedDBAdapter({ name: `jsa-phase6-${Date.now()}` });
    const source = datasetFromCsv(csv, { name: 'persisted-sales' });
    const meta = { steps: [{ id: 'step-1', type: 'filterRows', params: {} }], dashboards: [{ id: 'dash-1', title: 'Saved' }] };

    await adapter.saveSource(source);
    await adapter.saveMeta(source.id, meta);
    const restored = await adapter.loadAll();
    expect(restored).toHaveLength(1);
    expect(restored[0].source.name).toBe('persisted-sales');
    expect(restored[0].source.data).toEqual(source.data);
    expect(restored[0].meta).toEqual(meta);

    await adapter.remove(source.id);
    expect(await adapter.loadAll()).toHaveLength(0);
  });
});
