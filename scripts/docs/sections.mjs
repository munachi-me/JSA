import { STEP_DOC, PAGE_DOC, MODULE_DOC } from './capabilities.mjs';

export const PURPOSE = {
  dev: 'Start the Vite development server with hot reload.',
  build: 'Create a production build in `dist/`.',
  preview: 'Serve the production build locally for inspection.',
  test: 'Run the full Vitest suite once (non-watch mode).',
  'test:core': 'Run only the dependency-light core smoke suite.',
  start: 'Run the example script.',
  check: 'Syntax-check each source file with `node --check`.',
};

export function capabilityHighlights(d) {
  const has = (f) => d.modules.includes(f);
  const out = [];
  if (has('src/core/data/csvParser.js')) out.push(['Dataset import and exploration', `CSV and JSON import with delimiter detection, type inference, profiling, and paginated preview.`]);
  if (has('src/core/transforms/stepRegistry.js')) out.push(['Data cleaning and transformation', `${d.steps.length} replayable pipeline steps; the original import is never mutated.`]);
  if (d.steps.includes('updateConditional')) out.push(['Conditional updates to existing columns', 'Ordered IF rules rewrite values in an existing column, with type validation and blank-fallback preservation.']);
  if (has('src/core/data/intelligence.js')) out.push(['Dataset quality checks and intelligence', 'Heuristic health score, quality recommendations, and expandable column profiles in Dataset Explorer.']);
  if (has('src/core/analytics/analyses.js')) out.push(['Descriptive and grouped analytics', 'Descriptive statistics and saved grouped analyses.']);
  if (has('src/core/analytics/kpis.js')) out.push(['KPI creation', 'KPI definitions with numerator/denominator parts, filters, formatting, and precision.']);
  if (has('src/core/analytics/suggestions.js')) out.push(['KPI and chart suggestions', 'Explainable, opt-in suggestions derived from column types; nothing is saved automatically.']);
  if (has('src/core/visualization/chartSpec.js')) out.push(['Chart creation', `${d.charts.length ? d.charts.length + ' registered chart types' : 'Chart specifications'} rendered with dependency-free SVG.`]);
  if (has('src/core/dashboard/dashboardSchema.js')) out.push(['Dashboard building', 'Twelve-column grid with chart, KPI, text, filter, table, and insight components.']);
  if (has('src/core/dashboard/staticExport.js')) out.push(['Static HTML export', 'Offline snapshot dashboard with inline SVG charts; filters become explanatory notes.']);
  if (has('src/core/dashboard/interactiveExport.js')) out.push(['Interactive HTML export', 'Self-contained HTML with explicitly selected columns, client-side filters, and local recalculation.']);
  if (has('src/core/dashboard/exportAppearance.js')) out.push(['Export appearance customization', 'Presets, palette, typography, spacing, brand label, and footer for both HTML exporters.']);
  if (has('src/core/export/datasetExport.js')) out.push(['Data export', 'Cleaned or original dataset to CSV/JSON from the global Export & Publish menu.']);
  if (has('src/core/storage/indexedDBAdapter.js')) out.push(['Local storage and persistence', 'Datasets and workspace state persist in IndexedDB in the current browser profile.']);
  if (has('src/core/insights/insightEngine.js')) out.push(['Insights', 'Rule-based findings covering quality, group comparisons, unusual values, concentration, correlation, and period change.']);
  return out;
}

export function moduleOverview(d) {
  const groups = new Map();
  for (const m of d.modules) {
    const parts = m.replace(/^src\//, '').split('/');
    const key = parts.length > 1 ? parts.slice(0, parts.length - 1).join('/') : '(root)';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }
  const lines = [];
  for (const [group, files] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`### \`src/${group}\``);
    lines.push('');
    lines.push('| File | Purpose |');
    lines.push('| --- | --- |');
    for (const f of files) {
      const base = f.split('/').pop();
      const doc = MODULE_DOC[f.replace(/^src\//, '')] || PAGE_DOC[base]?.[1] || 'No description recorded.';
      lines.push(`| \`${base}\` | ${doc} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function stepsTable(steps) {
  if (!steps.length) return '';
  return [
    '| Step key | Label | What it does |',
    '| --- | --- | --- |',
    ...steps.map((s) => {
      const [label, desc] = STEP_DOC[s] || [s, 'See `src/core/transforms/stepRegistry.js`. The step is not described in the consolidated documentation.'];
      return `| \`${s}\` | ${label} | ${desc} |`;
    }),
  ].join('\n');
}

export function workflowGuide(d, isCli) {
  const s = d.steps;
  const lines = [];
  if (isCli) {
    lines.push('1. Point the CLI at a CSV or JSON file (`node src/cli.js examples/sales.csv`).');
    lines.push('2. JSA parses the file, infers column types, and prints a profile with summary statistics.');
    lines.push('3. A dashboard document is written to `jsa-output/jsa-dashboard.json` for inspection.');
    return lines.join('\n');
  }
  lines.push('1. **Import** — open Datasets and import a CSV or JSON file, or load the bundled sample data. JSA detects the delimiter, infers column types, and reports malformed rows.');
  if (s.length) {
    lines.push('2. **Prepare** — open Clean data and add transformation steps. Every step is appended to a replayable pipeline, and the original import stays unchanged.');
  }
  if (d.modules.includes('src/core/analytics/analyses.js')) {
    lines.push('3. **Analyse** — use Analysis for descriptive profiles and grouped analyses, and define KPIs from numerator/denominator parts.');
  }
  if (d.modules.includes('src/core/visualization/chartSpec.js')) {
    lines.push(`4. **Visualise** — build charts${d.routes.includes('/chart-builder') ? ' in the Chart Builder' : ' on the Charts page'} from a dimension and one or more measures, then save them to the chart library.`);
  }
  if (d.modules.includes('src/core/dashboard/dashboardSchema.js')) {
    lines.push('5. **Assemble** — add charts, KPIs, text, and filters to a dashboard on the grid canvas and adjust each component\'s settings.');
  }
  if (d.modules.includes('src/core/dashboard/staticExport.js') || d.modules.includes('src/core/dashboard/interactiveExport.js')) {
    const kinds = [];
    if (d.modules.includes('src/core/dashboard/staticExport.js')) kinds.push('static HTML');
    if (d.modules.includes('src/core/dashboard/interactiveExport.js')) kinds.push('interactive, self-contained HTML');
    lines.push(`6. **Export** — download the dashboard as ${kinds.join(' or ')}${d.modules.includes('src/core/export/datasetExport.js') ? ', or export the dataset itself as CSV/JSON' : ''}.`);
  }
  return lines.join('\n');
}
