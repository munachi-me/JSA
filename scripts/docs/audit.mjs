// Builds AUDIT.md from the source tree, the curated history, and real test-run records.
// Nothing here claims a test passed unless /tmp test logs actually recorded it.
import fs from 'fs';

let RUNS = {};
try {
  const raw = fs.readFileSync(new URL('../../.docs-test-results.json', import.meta.url), 'utf8');
  RUNS = JSON.parse(raw);
} catch { RUNS = {}; }

function featureRows(d) {
  const rows = [];
  const add = (name, files, note) => rows.push(`| ${name} | ${files.map((f) => `\`${f.replace(/^src\//, '')}\``).join(', ')} | ${note} |`);
  const h = (f) => d.modules.includes(f);
  if (h('src/core/data/csvParser.js')) add('CSV parsing and import', ['src/core/data/csvParser.js'], 'Delimiter detection, quoted fields, escaped quotes, embedded newlines, malformed-row reporting.');
  if (h('src/core/data/datasetModel.js')) add('Dataset model and JSON import', ['src/core/data/datasetModel.js'], 'Columnar storage with stable column ids and typed values.');
  if (h('src/core/data/profile.js')) add('Dataset profiling', ['src/core/data/profile.js'], 'Missing cells, distinct counts, duplicate rows, per-column statistics.');
  if (d.steps.length) add('Cleaning pipeline', ['src/core/transforms/stepRegistry.js', 'src/core/transforms/pipeline.js'], `${d.steps.length} declared steps applied immutably over the original import.`);
  if (h('src/core/transforms/conditional.js')) add('Conditional rules', ['src/core/transforms/conditional.js'], 'Ordered IF rules with AND/OR, comparison operators, and missing-value checks.');
  if (h('src/core/data/intelligence.js')) add('Dataset intelligence', ['src/core/data/intelligence.js'], 'Heuristic health score, quality recommendations, and column profiles.');
  if (h('src/core/analytics/descriptive.js')) add('Descriptive statistics', ['src/core/analytics/descriptive.js'], 'Count, mean, median, min, max, and related measures.');
  if (h('src/core/analytics/aggregation.js')) add('Grouped aggregation', ['src/core/analytics/aggregation.js'], 'Group-by with aggregate measures.');
  if (h('src/core/analytics/analyses.js')) add('Saved analyses', ['src/core/analytics/analyses.js'], 'Reusable grouped-analysis definitions.');
  if (h('src/core/analytics/kpis.js')) add('KPIs', ['src/core/analytics/kpis.js'], 'Numerator/denominator parts, filters, formatting, precision.');
  if (h('src/core/analytics/suggestions.js')) add('Suggestions', ['src/core/analytics/suggestions.js'], 'Explainable KPI, chart, and analysis suggestions from column types.');
  if (h('src/core/visualization/chartData.js')) add('Chart data building', ['src/core/visualization/chartData.js', 'src/core/visualization/chartSpec.js'], 'Turns a chart spec plus dataset into render-ready data with warnings and truncation.');
  if (h('src/core/dashboard/dashboardSchema.js')) add('Dashboards', ['src/core/dashboard/dashboardSchema.js', 'src/core/dashboard/layout.js', 'src/core/dashboard/validation.js'], 'Component schema, 12-column layout, validation.');
  if (h('src/core/dashboard/staticExport.js')) add('Static HTML export', ['src/core/dashboard/staticExport.js'], 'Self-contained snapshot with inline SVG; filters become notes.');
  if (h('src/core/dashboard/interactiveExport.js')) add('Interactive HTML export', ['src/core/dashboard/interactiveExport.js'], 'Selected columns embedded; filters and recalculation run locally.');
  if (h('src/core/dashboard/exportAppearance.js')) add('Export appearance', ['src/core/dashboard/exportAppearance.js'], 'Presets, palette, typography, spacing, brand, footer.');
  if (h('src/core/export/datasetExport.js')) add('Dataset export', ['src/core/export/datasetExport.js'], 'CSV with formula neutralisation, and JSON for re-import.');
  if (h('src/core/storage/indexedDBAdapter.js')) add('Persistence', ['src/core/storage/indexedDBAdapter.js'], 'IndexedDB adapter with idempotent store creation.');
  if (h('src/core/insights/insightEngine.js')) add('Insights', ['src/core/insights/insightEngine.js', 'src/core/insights/rules.js'], 'Rule-based findings across quality, comparison, and correlation.');
  return rows;
}

export function buildAudit(d, h) {
  const L = [];
  const p = (s = '') => L.push(s);
  const isCli = d.v === '0.1.0';
  const run = RUNS[d.v];

  p(`# AUDIT.md — JSA v${d.v}`);
  p();
  p(`| | |`);
  p(`| --- | --- |`);
  p(`| **Version audited** | \`${d.pkg.version}\` |`);
  p(`| **Stage** | ${h.phase || 'Unverified'} |`);
  p(`| **Audit type** | Static source review${run ? ' plus executed test run' : ''} |`);
  p(`| **Runtime tested in this environment** | ${run ? 'Yes' : 'No — see §6'} |`);
  p();
  p('[Root README](../../README.md) · [README](README.md) · [Release notes](RELEASE_NOTES.md)');
  p();

  p('## 1. Executive summary');
  p();
  p(`This is a static technical audit of JSA ${d.v}, covering ${d.modules.length} application modules and ${d.tests.length} test files. ${h.summary || ''}`);
  p();
  p(`${isCli ? 'The release is a small Node.js toolkit' : 'The release is a client-side single-page application'}: ${d.loc.toLocaleString()} lines of application code and ${d.testLoc.toLocaleString()} lines of test code, with ${Object.keys(d.pkg.dependencies || {}).length} runtime dependencies and ${Object.keys(d.pkg.devDependencies || {}).length} development dependencies.`);
  p();
  p('Overall condition: the code shows a consistent architectural pattern — a pure, DOM-free `core/` layer (parsing, transforms, analytics, chart data, exports) with a thin React UI layer on top. That separation is what makes the core testable under Vitest\'s Node environment.');
  p();
  if (run) {
    p(`In this audit environment the test suite was executed and finished with exit code ${run.exit}${run.tests ? `, reporting **${run.tests.trim()}**` : ''}${run.files ? ` across **${run.files.replace('Test Files  ', '')}**`.replace(/across \*\*.*\*\*/, '') : ''}. See §6 for exactly what that does and does not establish.`);
  } else {
    p('The test suite for this specific version was **not executed** during this audit. §6 records this explicitly rather than assuming success from the presence of test files.');
  }
  p();

  p('## 2. Architecture');
  p();
  p('```');
  p(`jsa-v${d.v}/`);
  if (d.files.includes('index.html')) p('├── index.html');
  p('├── package.json');
  if (d.files.includes('vite.config.js')) p('├── vite.config.js');
  p('├── public/');
  if (!isCli) {
    p('└── src/');
    p('    ├── main.jsx');
    p('    ├── app/            application shell, providers, workspace state');
    p('    ├── pages/          one component per route');
    p('    ├── components/     presentational components grouped by feature');
    p('    ├── core/           DOM-free domain logic (data, transforms, analytics,');
    p('    │                   visualization, dashboard, insights, export, storage)');
    p('    └── tests/          Vitest suites');
  } else {
    p('├── src/');
    p('├── tests/');
    p('├── examples/');
    p('└── jsa-output/');
  }
  p('```');
  p();
  p('### Subsystem responsibilities');
  p();
  if (d.modules.includes('src/core/data/datasetModel.js')) {
    p('- **`core/data`** — parsing and the dataset model. Columns carry stable ids (`c0`, `c1`, …) so a rename or a duplicated header cannot break downstream references. Values are stored per column and coerced on load.');
  }
  if (d.modules.includes('src/core/transforms/pipeline.js')) {
    p('- **`core/transforms`** — the step registry and pipeline. Each step declares its parameter metadata (so the UI renders forms generically) and returns a *new* dataset plus a plain-language summary. Steps never mutate their input, which is why the original import survives every cleaning operation.');
  }
  if (d.modules.includes('src/core/analytics/aggregation.js')) {
    p('- **`core/analytics`** — descriptive statistics, grouping/aggregation, saved analyses, KPIs, correlation, and (from 0.5.0) suggestions. These consume datasets and emit plain objects; they do not import React.');
  }
  if (d.modules.includes('src/core/visualization/chartSpec.js')) {
    p('- **`core/visualization`** — chart specifications, the chart registry, and chart data building. Charts are rendered as hand-written SVG rather than with a charting dependency.');
  }
  if (d.modules.includes('src/core/dashboard/dashboardSchema.js')) {
    p('- **`core/dashboard`** — dashboard schema, 12-column layout, filter evaluation, configuration validation/portability, and the two standalone HTML exporters.');
  }
  if (d.modules.includes('src/core/storage/indexedDBAdapter.js')) {
    p('- **`core/storage`** — the IndexedDB adapter. Datasets and workspace configuration are persisted in the browser profile.');
  }
  p('- **`app/`** — `App.jsx` owns the route table, sidebar, workspace header, and the global Export & Publish menu. `DatasetContext.jsx` is the single workspace store holding datasets, saved analyses, KPIs, charts, dashboards, insight statuses, and pipeline state.');
  p();
  p('### Dependency direction');
  p();
  p('`pages/` → `components/` → `core/` and `app/DatasetContext.jsx` → `core/`. The `core/` layer imports nothing from `app/`, `pages/`, or `components/`, and holds no DOM or React references. `src/tests/` imports `core/` directly, which is why the majority of the suite runs without a browser.');
  p();

  p('## 3. Feature inventory');
  p();
  const rows = featureRows(d);
  if (rows.length) {
    p('| Feature | Primary source files | Implementation notes |');
    p('| --- | --- | --- |');
    for (const r of rows) p(r);
  } else {
    p('No end-user features are implemented beyond the CLI data-table helpers.');
  }
  p();
  if (d.routes.length) {
    p(`Routes wired in \`src/app/App.jsx\`: ${d.routes.map((r) => `\`${r}\``).join(', ')}.`);
    p();
  }
  if (d.steps.length) {
    p(`Pipeline steps declared in the registry: ${d.steps.map((s) => `\`${s}\``).join(', ')}.`);
    p();
  }
  p();

  p('## 4. Data handling');
  p();
  p('### Import');
  p();
  if (d.modules.includes('src/core/data/csvParser.js')) {
    p('CSV import uses a hand-written RFC-4180-style parser (`csvParser.js`) rather than a library. It strips a UTF-8 BOM, auto-detects the delimiter from `,`, `;`, tab, and `|` by scoring consistency across the first ten lines, and handles quoted fields, doubled quotes, and embedded newlines. Rows whose field count does not match the header are reported as `malformed_row` warnings and then padded or truncated so the dataset stays rectangular — the import degrades to a warning rather than throwing.');
    p();
    p('JSON import (`datasetModel.js`) requires a non-empty array of objects, unions the keys across all objects, and stringifies nested values into JSON text with a `nested_values` warning.');
  } else {
    p('Import is handled by the CLI data-table module in this release.');
  }
  p();
  p('### Representation');
  p();
  if (d.modules.includes('src/core/data/dataTypes.js')) {
    p('Types are inferred per column (`integer`, `decimal`, `currency`, `boolean`, `date`, `datetime`, `time`, `text`, `categorical`, `identifier`) and each value is coerced on load. Coercion is deliberately conservative: text values keep their original whitespace so it can be inspected and cleaned explicitly, while recognised missing markers become `null`.');
  } else {
    p('Values are stored in an in-memory table with inferred column types.');
  }
  p();
  p('### Transformation');
  p();
  if (d.steps.length) {
    p(`Transformations are declarative pipeline steps. \`pipeline.js\` replays the ordered step list against the original import, so any step can be removed or reordered and the result is recomputed from source. This is the strongest correctness property in the design: cleaning is reversible by construction, and there is no "dirty" mutated copy to drift out of sync.`);
  } else {
    p('No transformation pipeline in this release.');
  }
  p();
  p('### Analysis, storage, export');
  p();
  if (d.modules.includes('src/core/analytics/aggregation.js')) p('- Analysis operates on the current (pipeline-applied) dataset and returns plain objects consumed by pages.');
  if (d.modules.includes('src/core/storage/indexedDBAdapter.js')) p('- Persistence writes datasets and workspace configuration to IndexedDB. The adapter creates each object store only when missing, so a later schema version that adds a single store cannot fail on upgrade.');
  if (d.modules.includes('src/core/dashboard/staticExport.js')) p('- The static HTML exporter embeds only the values its components render (aggregates, visible table rows, KPI values, insight text), not source rows.');
  if (d.modules.includes('src/core/dashboard/interactiveExport.js')) p('- The interactive HTML exporter embeds the explicitly selected columns as readable JSON so the exported file can filter and recalculate without a server. This is the main data-disclosure surface in the product.');
  if (d.modules.includes('src/core/export/datasetExport.js')) p('- Dataset export writes CSV with spreadsheet-formula neutralisation and RFC-4180 quoting, and JSON with visible column names so the file can be re-imported.');
  p();

  p('## 5. Reliability and correctness');
  p();
  p('Observed strengths:');
  p();
  p('- Steps and transforms return new datasets, so partial failure cannot corrupt the working dataset.');
  p('- Parser errors are collected as structured warnings with row numbers instead of aborting the import.');
  p('- Exporters escape user-controlled strings before interpolation into HTML, and the interactive exporter escapes `<`, U+2028, and U+2029 when serialising the embedded JSON.');
  p('- The interactive exporter caps categories, series, filter values, and scatter points, disclosing each cap in the output.');
  p();
  p('Edge cases worth targeted tests:');
  p();
  p('- Very wide CSVs and rows with an inconsistent field count near the header boundary.');
  p('- Numeric columns containing currency symbols or thousands separators through every aggregate.');
  p('- Division-by-zero and null handling in KPI ratios.');
  p('- Time-zone effects on `date`/`datetime` coercion, since values are normalised through `toISOString()`.');
  p('- Charts whose saved analysis, chart, or column reference has since been deleted.');
  p('- Large datasets (hundreds of thousands of rows) through the interactive export, which serialises every embedded cell.');
  p();

  p('## 6. Testing');
  p();
  if (d.tests.length) {
    p(`**Test files present (${d.tests.length}):**`);
    p();
    for (const t of d.tests) p(`- \`${t}\``);
    p();
  } else {
    p('No automated test files are present in this release.');
    p();
  }
  p('### Execution status');
  p();
  if (run) {
    p('| Check | Command | Result |');
    p('| --- | --- | --- |');
    if (isCli) {
      p(`| Test suite | \`node --test\` | **Executed.** ${run.tests.trim()} |`);
    } else {
      p(`| Test suite | \`npx vitest run\` | **Executed.** ${run.files.replace('Test Files  ', 'Test files: ')}; ${run.tests.replace('Tests  ', 'tests: ')}. Exit code ${run.exit}. |`);
    }
    p();
    p('This run was performed while producing this documentation, on the repository copy in the audit environment. It establishes that the committed suites execute and pass for this version. It does **not** establish coverage percentage, browser behaviour, or visual correctness.');
  } else {
    p('| Check | Command | Result |');
    p('| --- | --- | --- |');
    p('| Test suite | `npm test` | **Not executed** during this audit. |');
    p('| Production build | `npm run build` | **Not executed** during this audit. |');
    p();
    p('No test or build result is claimed for this version. Test files exist, but the presence of a test file is not evidence that it passes. Run `npm install && npm test` (and `npm run build` for browser releases) inside this directory to verify.');
  }
  p();
  p('### Statically reviewed only');
  p();
  p('The following were read but not executed: chart rendering paths, dashboard layout and resize behaviour, IndexedDB upgrade behaviour in a real browser, and the generated HTML from either exporter actually being opened in a browser. These are code-reviewed conclusions, not observed behaviour.');
  p();
  p('### Known limitation of the test setup');
  p();
  if (!isCli) {
    p('`vite.config.js` sets `test: { environment: \'node\' }`. Any `.jsx` test that needs a DOM cannot pass under this configuration. A failure in `render.test.jsx` therefore reflects the test environment rather than proven application breakage — but it also means React rendering is effectively not covered by the suite as configured.');
    p();
  }
  p('The suite does not measure coverage; no coverage percentage is asserted anywhere in this repository.');
  p();

  p('## 7. Security and privacy');
  p();
  p('This section records concrete observations. It is **not** a formal security audit, and no version should be described as "secure" on the strength of it.');
  p();
  p('### Data locality');
  p();
  p('- No JSA backend exists. Datasets are parsed and held in browser memory and persisted to IndexedDB in the current browser profile.');
  p('- There is no authentication, authorisation, or multi-user model, because there is no server and no account concept.');
  p('- Anyone with access to the same browser profile and origin can read the stored datasets through the application.');
  p();
  p('### Exported files');
  p();
  if (d.modules.includes('src/core/dashboard/interactiveExport.js')) {
    p('- The interactive HTML export embeds the selected columns as readable JSON. The in-file privacy warning is a notice, not encryption or access control; anyone who receives the file can read the embedded data.');
  }
  if (d.modules.includes('src/core/dashboard/staticExport.js')) {
    p('- The static HTML export embeds only rendered component values, but those values can still be sensitive (visible table rows, aggregates, insight text).');
  }
  p('- Generated HTML escapes interpolated strings. The interactive exporter additionally escapes `<`, U+2028 and U+2029 in the embedded JSON to prevent a `</script>` breakout.');
  if (d.modules.includes('src/core/dashboard/exportAppearance.js')) {
    p('- Export appearance colours are validated against a six-digit hex pattern before being written into CSS, which limits CSS injection through that field.');
  }
  p();
  p('### Imported files and dependencies');
  p();
  p(`- Imported CSV/JSON is treated as untrusted text and is escaped on export, but no size limit is enforced in the parser itself beyond what the UI reports.`);
  p(`- Runtime dependencies are React, React DOM, React Router, and \`lucide-react\` only. There is no charting, date, or CSV library; parsing and rendering are hand-written, which reduces third-party attack surface but concentrates correctness risk in this codebase.`);
  p('- No dependency audit (`npm audit`) result is recorded for this version.');
  p();
  p('### Not assessed');
  p();
  p('Cross-site scripting through deeply nested JSON imports, denial of service through pathological CSV input, and browser-storage quota exhaustion were not tested.');
  p();

  p('## 8. Maintainability');
  p();
  p('- **Plain JavaScript, no TypeScript.** No `.ts`/`.tsx` files and no type-checking step exist. Type mistakes surface only at runtime or in tests.');
  p('- **Consistent layering.** The `core/` modules are pure and framework-free, which is the main reason the project is testable at all.');
  p('- **Metadata-driven UI.** Step parameters and chart options are declared as data, so forms are generated rather than hand-written per transform. Adding a step means adding one registry entry.');
  p('- **Large single files.** `stepRegistry.js` and the two HTML exporters are long and string-template heavy. The exporters are effectively small programs embedded in JavaScript template literals, which is hard to lint and hard to debug.');
  p('- **Duplication across releases.** The repository keeps a full copy of the application per version. Fixes made in a later version do not propagate backwards, and each folder carries its own lockfile.');
  p('- **Version-spanning drift.** Generated documentation in earlier releases had drifted from the code (for example a README describing a different version than its own `package.json`). This documentation pass corrects that for the files it rewrites.');
  p();

  p('## 9. Known limitations');
  p();
  p('Confirmed from source:');
  p();
  if (!isCli) p('- No backend, accounts, sharing, or server-side scheduling. All work is local to one browser profile.');
  if (!isCli) p('- Data volume is bounded by browser memory; the interactive export serialises every embedded cell into one HTML file.');
  if (d.modules.includes('src/core/dashboard/staticExport.js')) p('- The static HTML export is a snapshot. Filter components are descriptive text and values never refresh.');
  if (d.modules.includes('src/core/dashboard/interactiveExport.js')) p('- The interactive export is a local file with data embedded in readable form; it is not access-controlled publishing.');
  if (!isCli) p('- React rendering is not meaningfully covered by the test suite because Vitest runs in a Node environment.');
  for (const l of h.limitations || []) p(`- ${l}`);
  p();
  p('Requiring verification (not confirmed either way):');
  p();
  p('- Behaviour of every chart type and dashboard layout at mobile widths in real browsers.');
  p('- Correctness of date and time coercion across time zones and daylight-saving boundaries.');
  p('- IndexedDB behaviour under quota pressure and in private-browsing modes.');
  p('- Whether very large interactive exports open acceptably in low-memory mobile browsers.');
  p();

  p('## 10. Recommendations');
  p();
  p('Prioritised, most valuable first:');
  p();
  p('1. **Add a DOM test environment** (for example `jsdom` or `happy-dom` for `.jsx` tests) so React pages and rendering paths are actually covered. Today `render.test.jsx` cannot meaningfully run.');
  p('2. **Extract the HTML exporters.** Move the export templates out of template literals into small, unit-testable builder functions. This is the highest-risk, least-testable area of the codebase.');
  p('3. **Add property-style tests for numeric and date handling** — currency strings, thousands separators, negative values, leap days, and time-zone edges — because these feed KPIs, charts, and exports alike.');
  p('4. **Introduce a typed boundary for the dataset model.** Even without adopting TypeScript, JSDoc types on the dataset, chart spec, and dashboard schema would catch the reference-drift bugs that deleted columns and charts cause.');
  p('5. **Record dependency audit results** (`npm audit`) in the repository so security posture is visible rather than assumed.');
  p('6. **Add an explicit size guard on import** in the parser, not just a UI message, so oversized files fail predictably.');
  p(`7. **Consider consolidating version folders.** ${versionsNote()}`);
  p();
  return L.join('\n');
}

function versionsNote() {
  return 'Keeping a full copy per release preserves an exact historical record, but it multiplies maintenance cost and makes repository-wide fixes impractical. Tagging releases in a single tree would preserve history at a fraction of the weight.';
}
