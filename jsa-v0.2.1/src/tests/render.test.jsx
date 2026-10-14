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
});
it('shows a helpful empty state when no dataset is open', () => {
  const html = renderToString(<StaticRouter location="/clean"><App /></StaticRouter>);
  expect(html).toContain('Open a dataset first');
});
