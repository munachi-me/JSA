import { it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { readFileSync } from 'node:fs';
import { datasetFromCsv } from '../core/data/datasetModel.js';
import App from '../app/App.jsx';

const source = datasetFromCsv(readFileSync('public/sample-data/sales.csv', 'utf8'), { name: 'sales' });
const page = (path) => renderToString(
  <StaticRouter location={path}><App initialSources={[source]} /></StaticRouter>);

it('renders every page with a dataset loaded, without crashing', () => {
  expect(page('/')).toContain('Bring in a dataset');
  expect(page('/dataset')).toContain('Columns');
  expect(page('/clean')).toContain('Add a step');
  expect(page('/analysis')).toContain('Group and compare');
  expect(page('/charts')).toContain('Saved charts');
});
it('shows a helpful empty state when no dataset is open', () => {
  const html = renderToString(<StaticRouter location="/clean"><App /></StaticRouter>);
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
