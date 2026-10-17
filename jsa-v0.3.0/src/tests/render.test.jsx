import { it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { readFileSync } from 'node:fs';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import App from '../app/App.jsx';

const source = datasetFromCsv(readFileSync('public/sample-data/sales.csv', 'utf8'), { name: 'sales' });
const page = (path) => renderToString(
  <StaticRouter location={path}><App initialSources={[source]} persist={false} /></StaticRouter>);

it('renders every page with a dataset loaded, without crashing', () => {
  expect(page('/')).toContain('Welcome back');
  expect(page('/dataset')).toContain('Columns');
  expect(page('/clean')).toContain('Add a step');
  expect(page('/analysis')).toContain('Group and compare');
  expect(page('/charts')).toContain('Saved charts');
  expect(page('/dashboards')).toContain('New dashboard');
  const ins = page('/insights');
  expect(ins).toContain('Rule-based findings calculated from the cleaned data');
  expect(ins).toContain('Limitations');
  expect(ins).toContain('Evidence');
});
it('shows a helpful empty state when no dataset is open', () => {
  const html = renderToString(<StaticRouter location="/clean"><App persist={false} /></StaticRouter>);
  expect(html).toContain('Open a dataset first');
});

import ChartRenderer from '../components/charts/ChartRenderer.jsx';
import { buildChartData } from '../core/visualization/chartData.js';
import { CHART_TYPES } from '../core/visualization/chartRegistry.js';
import { makeSpec, normalizeSpec } from '../core/visualization/chartSpec.js';

it('every chart type renders real data from the sample set without crashing', () => {
  const ds = { ...source, analyses: [], kpis: [{ id: 'k', name: 'Units', numerator: { op: 'sum', column: 'c4' } }], visualizations: [] };
  for (const t of CHART_TYPES) {
    const spec = normalizeSpec(ds, makeSpec({ type: t.id, title: t.label, dimension: t.id === 'line' || t.id === 'area' ? 'c1' : '', measures: [{ op: 'sum', column: 'c4', as: '' }] }));
    const data = buildChartData(ds, spec);
    const html = renderToString(<ChartRenderer data={data} spec={spec} />);
    expect(html.length, t.id).toBeGreaterThan(50);
    if (['bar', 'hbar', 'line', 'area', 'stacked', 'grouped', 'scatter', 'histogram', 'pie', 'donut'].includes(t.id)) expect(html, t.id).toContain('<svg');
  }
});

import Canvas from '../components/dashboard/Canvas.jsx';
import DashComponent from '../components/dashboard/DashComponent.jsx';
import { makeDashboard, addComponent } from '../core/dashboard/dashboardSchema.js';
import { selectRows } from '../core/transforms/rows.js';
import { evaluateFilters } from '../core/transforms/filters.js';

it('renders a populated dashboard (chart, KPI, filter, text, broken chart) in edit and preview modes', () => {
  const ds = { ...source, kpis: [{ id: 'k', name: 'Units sold', numerator: { op: 'sum', column: 'c4' } }], analyses: [],
    visualizations: [{ ...makeSpec({ type: 'bar', title: 'Units by region', dimension: 'c2', measures: [{ op: 'sum', column: 'c4', as: '' }] }), id: 'v' }] };
  let d = makeDashboard({ title: 'Demo' });
  d = addComponent(d, 'filter', { column: 'c2' }); d = addComponent(d, 'kpi', { kpiId: 'k' });
  d = addComponent(d, 'chart', { vizId: 'v' }); d = addComponent(d, 'text', { text: '<b>not html</b>' }, 'Notes'); d = addComponent(d, 'chart', { vizId: 'gone' });
  const filtered = selectRows(ds, evaluateFilters(ds, [{ column: 'c2', op: 'eq', value: 'East' }]));
  for (const editing of [true, false]) {
    const html = renderToString(<Canvas dashboard={d} editing={editing} selectedId={null} onSelect={() => {}} onLayout={() => {}} onDuplicate={() => {}} onRemove={() => {}}
      renderBody={(c) => <DashComponent ds={filtered} fullDs={ds} comp={c} filterValue={{}} onFilterChange={() => {}} />} />);
    expect(html).toContain('Units by region');
    expect(html).toContain('was deleted');
    expect(html).toContain('&lt;b&gt;not html&lt;/b&gt;'); // user text is escaped, never injected as HTML
    expect(html.includes('drag-handle')).toBe(editing);
  }
});


it('offers a clear dataset selector when multiple datasets are open', () => {
  const second = datasetFromCsv(readFileSync('public/sample-data/sales.csv', 'utf8'), { name: 'sales-archive' });
  const html = renderToString(
    <StaticRouter location={`/dataset/${source.id}`}>
      <App initialSources={[source, second]} persist={false} />
    </StaticRouter>
  );
  expect(html).toContain('Select dataset for dataset page');
  expect(html).toContain('Dataset 1 — sales (240 rows');
  expect(html).toContain('Dataset 2 — sales-archive (240 rows');
});
