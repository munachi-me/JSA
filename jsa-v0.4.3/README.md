# JSA v0.4.3 — JavaScript Analytics Platform

> Transformation preview and saved-stage inspection.

| | |
| --- | --- |
| **Package** | `jsa` |
| **Version** | `0.4.3` |
| **Release stage** | Phase 7 |
| **Application type** | Browser-based, client-side analytics application |
| **Status** | Historical release |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [Release notes](RELEASE_NOTES.md) · [Audit](AUDIT.md) · [License](LICENSE)

## What JSA is

JSA is a JavaScript analytics platform for importing tabular datasets, preparing and cleaning them, running analytical operations, generating rule-based insights, creating KPIs and charts, assembling dashboards, and exporting results.

In this release JSA is a single-page React application that runs entirely in the browser. Datasets are parsed, transformed, aggregated, and charted on the client, and persisted in IndexedDB in the current browser profile. There is no JSA backend to deploy and no server-side data store.

## Purpose of this release

Transformation preview and saved-stage inspection.

**Introduced or materially changed in this release**

- Preview a transformation's output table (up to 25 rows) before adding it to the pipeline; previewing does not change the active dataset.
- Inspect any saved pipeline stage to reconstruct its read-only snapshot from the original import through that step, with row/column counts and saved parameters.

**Inherited from earlier releases** (verified by comparing the source trees of the adjacent version folders)

- No pipeline steps were added here; all existing steps were inherited.
- Pipeline steps inherited unchanged: 22.
- No new routes were added here.

## Features in this release

| Capability | State in this release |
| --- | --- |
| Dataset import and exploration | CSV and JSON import with delimiter detection, type inference, profiling, and paginated preview. |
| Data cleaning and transformation | 22 replayable pipeline steps; the original import is never mutated. |
| Descriptive and grouped analytics | Descriptive statistics and saved grouped analyses. |
| KPI creation | KPI definitions with numerator/denominator parts, filters, formatting, and precision. |
| Chart creation | Chart specifications rendered with dependency-free SVG. |
| Dashboard building | Twelve-column grid with chart, KPI, text, filter, table, and insight components. |
| Static HTML export | Offline snapshot dashboard with inline SVG charts; filters become explanatory notes. |
| Interactive HTML export | Self-contained HTML with explicitly selected columns, client-side filters, and local recalculation. |
| Data export | Cleaned or original dataset to CSV/JSON from the global Export & Publish menu. |
| Local storage and persistence | Datasets and workspace state persist in IndexedDB in the current browser profile. |
| Insights | Rule-based findings covering quality, group comparisons, unusual values, concentration, correlation, and period change. |

**Application routes:** `/`, `/dataset`, `/dataset/:id`, `/clean`, `/clean/:id`, `/charts`, `/charts/:id`, `/chart-builder`, `/chart-builder/:id`, `/insights`, `/insights/:id`, `/dashboards`, `/dashboards/:id`, `/dashboards/:id/:did`, `/analysis`, `/analysis/:id`

## Requirements

- Node.js 18 or newer is recommended.
- npm.
- A modern browser with JavaScript and IndexedDB support.

## Installation

Each version folder is an independent project. Install dependencies inside the version directory, not at the repository root, which only holds repository-wide documentation, the license, and the version folders.

```bash
git clone https://github.com/munachi-me/JSA.git
cd JSA/jsa-v0.4.3
npm install
```

`package-lock.json` is included, so `npm ci` is also valid for a reproducible install.

## Development and startup

```bash
npm run dev
```

Vite prints a local URL (by default `http://localhost:5173`). The bundled sample dataset is `public/sample-data/sales.csv`.

## npm scripts

Verified against this folder's `package.json`:

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `vite` | Start the Vite development server with hot reload. |
| `build` | `vite build` | Create a production build in `dist/`. |
| `preview` | `vite preview` | Serve the production build locally for inspection. |
| `test` | `vitest run` | Run the full Vitest suite once (non-watch mode). |
| `test:core` | `vitest run src/tests/core-smoke.test.js` | Run only the dependency-light core smoke suite. |

## Testing

```bash
npm test
npm run test:core   # optional, smaller subset
```

Test files (14):

- `src/tests/advanced-prep.test.js`
- `src/tests/conditional-transforms.test.js`
- `src/tests/core-smoke.test.js`
- `src/tests/core.test.js`
- `src/tests/dashboard.test.js`
- `src/tests/dataset-export.test.js`
- `src/tests/export-reporting.test.js`
- `src/tests/insights.test.js`
- `src/tests/integration.test.js`
- `src/tests/phase2.test.js`
- `src/tests/phase6-workflow.test.js`
- `src/tests/pipeline-workflow.test.js`
- `src/tests/render.test.jsx`
- `src/tests/viz.test.js`

Vitest is configured with `environment: 'node'` in `vite.config.js`. Files with a `.jsx` extension use React APIs but still execute in the Node environment, so they can only pass if they do not require a real DOM. Treat a failure there as an environment limitation of the suite, not as proof that the feature is broken.

Read the output instead of assuming success. The audit document for this version records what was actually executed and when.

## Build

```bash
npm run build
npm run preview   # optional local check of the built output
```

The build writes to `dist/`, which is git-ignored. Later releases emit a chunk-size warning for the main bundle; that is informational, not a build failure.

## Application modules

### `src/(root)`

| File | Purpose |
| --- | --- |
| `main.jsx` | No description recorded. |

### `src/app`

| File | Purpose |
| --- | --- |
| `App.jsx` | Application shell: route table, sidebar navigation, workspace header, global Export & Publish menu, and the storage status banner. |
| `DatasetContext.jsx` | Workspace state provider: datasets, saved analyses, KPIs, charts, dashboards, insight statuses, pipeline state, and persistence, exposed to pages through React context. |
| `DialogProvider.jsx` | In-app alert, confirmation, and text-input dialogs that replace native browser prompts, with Escape handling and mobile-friendly layout. |

### `src/components/charts`

| File | Purpose |
| --- | --- |
| `Cartesian.jsx` | SVG cartesian chart renderer (bar, line, area, grouped, stacked, scatter, histogram). |
| `ChartRenderer.jsx` | Selects and renders the appropriate chart component for a chart specification. |
| `PieChart.jsx` | SVG pie and donut renderer. |
| `palette.js` | Default colour palette shared by the in-app chart renderers. |

### `src/components/dashboard`

| File | Purpose |
| --- | --- |
| `Canvas.jsx` | Dashboard grid canvas handling component placement and resizing. |
| `DashComponent.jsx` | Dashboard component frame with the settings, duplicate, and remove controls. |

### `src/components/data`

| File | Purpose |
| --- | --- |
| `ConditionalRulesEditor.jsx` | Ordered IF-rule editor for conditional columns and conditional column updates. |
| `DatasetPicker.jsx` | Dataset switcher shared by the workspace pages. |
| `FilterEditor.jsx` | Condition editor used by filters, analyses, charts, and KPIs. |
| `PartEditor.jsx` | KPI numerator/denominator part editor. |
| `StepForm.jsx` | Generic transformation step form rendered from the parameter metadata declared in the step registry. |

### `src/components/insights`

| File | Purpose |
| --- | --- |
| `InsightCard.jsx` | Insight finding card with status and follow-up actions. |

### `src/core/analytics`

| File | Purpose |
| --- | --- |
| `aggregation.js` | Group-by and aggregate operations used by grouped analyses, KPIs, and chart data building. |
| `analyses.js` | Saved grouped-analysis definitions and their evaluation against the current dataset. |
| `correlation.js` | Pearson correlation between numeric columns. |
| `descriptive.js` | Descriptive statistics (count, missing, mean, median, min, max, and related measures) over column values. |
| `inference.js` | Group-comparison helpers used by insights. |
| `kpis.js` | KPI model and calculation, including numerator/denominator parts, filters, formatting, precision, and target status. |

### `src/core/dashboard`

| File | Purpose |
| --- | --- |
| `dashboardSchema.js` | Dashboard and component schema, including component types, configuration, and layout. |
| `filters.js` | Dashboard filter evaluation over dataset rows. |
| `interactiveExport.js` | Self-contained interactive HTML dashboard that embeds only explicitly selected columns and runs filters and recalculations locally in the browser. |
| `layout.js` | Twelve-column grid layout helpers for dashboard components. |
| `portable.js` | Portable dashboard configuration export/import that carries definitions, not row data. |
| `staticExport.js` | Self-contained static HTML dashboard snapshot with inline SVG charts, escaped user content, responsive and print styles, and disclosed rendering caps. |
| `validation.js` | Dashboard configuration validation with actionable error messages. |

### `src/core/data`

| File | Purpose |
| --- | --- |
| `csvParser.js` | RFC-4180-style CSV parser with delimiter detection, quoted fields, escaped quotes, embedded newlines, and malformed-row reporting. Pure function with no DOM dependency. |
| `dataTypes.js` | Type inference and parsing for numeric, boolean, date, datetime, time, text, categorical, and identifier columns, including missing-value recognition. |
| `datasetModel.js` | Internal dataset representation. Columns have stable ids (`c0`, `c1`, …) and columnar value storage, so duplicate or renamed headers never break references. Provides CSV and JSON dataset constructors and immutable column helpers. |
| `profile.js` | Dataset profiling: row and column counts, missing cells, distinct values, duplicate rows, and per-column summary statistics. |

### `src/core/export`

| File | Purpose |
| --- | --- |
| `datasetExport.js` | Dataset export to CSV (with spreadsheet-formula neutralisation and RFC-4180 quoting) and JSON (visible column names as row objects for re-import). |
| `reporting.js` | Reporting helpers for exporting analysis and insight output. |

### `src/core/insights`

| File | Purpose |
| --- | --- |
| `insightEngine.js` | Insight engine that runs the rule catalogue against the current dataset and produces findings with options. |
| `rules.js` | Rule catalogue: data-quality observations, group comparisons, unusual values, concentration, correlation, and period changes. |

### `src/core/storage`

| File | Purpose |
| --- | --- |
| `indexedDBAdapter.js` | IndexedDB persistence adapter for datasets and workspace state, with idempotent object-store creation and error reporting. |

### `src/core/transforms`

| File | Purpose |
| --- | --- |
| `conditional.js` | Validation and evaluation of conditional rules and comparison operators used by conditional column creation and conditional updates. |
| `expression.js` | Small arithmetic expression evaluator used by calculated columns. |
| `filters.js` | Row-level filter predicate evaluation shared by the filter step, analyses, charts, and dashboard filters. |
| `pipeline.js` | Applies an ordered list of steps to the original import and produces the current dataset, so the source data is never destroyed. |
| `rows.js` | Immutable row and column helpers: select rows, add a column, map a column, require a column, and null checks. |
| `sorting.js` | Stable multi-column sorting with support for chronological date/time ordering and natural ordering of month and weekday labels. |
| `stepRegistry.js` | Transformation step catalogue. Each step declares its parameters (so the UI renders a generic form) and an `apply()` that returns a new dataset plus a plain-language summary of what changed. Steps never mutate their input. |

### `src/core/visualization`

| File | Purpose |
| --- | --- |
| `chartData.js` | Builds render-ready chart data from a dataset and a chart specification, with warnings and truncation information for large or awkward inputs. |
| `chartRegistry.js` | Registry of supported chart types and their metadata. |
| `chartSpec.js` | Chart specification model: chart type, dimension, measures, series, filters, sorting, colours, axis titles, and time grain. |
| `scales.js` | Small scale and tick helpers for the SVG chart components. |

### `src/pages`

| File | Purpose |
| --- | --- |
| `AnalysisPage.jsx` | Descriptive profiles, grouped analysis with saved definitions, KPIs, correlation, and later recommended analyses. |
| `ChartBuilderPage.jsx` | Dedicated chart authoring route with chart type, dimensions, measures, filters, sorting, appearance, live preview, and chart suggestions. |
| `CleanPage.jsx` | Transformation pipeline: build steps, review their summaries and row-count impact, reorder or remove them, and reset the pipeline. |
| `DashboardPage.jsx` | Dashboard library and editor: grid canvas, component settings, configuration import/export, and static or interactive HTML export. |
| `DatasetPage.jsx` | Dataset Explorer: import, dataset switching, summary cards, column schema, type overrides, and paginated data preview. In later releases it also hosts data-quality intelligence findings. |
| `HomePage.jsx` | Workspace landing page with dataset and workspace summaries, import actions, and either onboarding or saved-work content depending on whether the workspace is empty. |
| `InsightsPage.jsx` | Rule-based insight findings with status tabs, type filters, and save, dismiss, save-as-chart, and add-to-dashboard actions. |
| `VisualizationPage.jsx` | Saved chart library with chart previews; the chart authoring UI lives here before the dedicated Chart Builder is split out. |

### `src/storage`

| File | Purpose |
| --- | --- |
| `idb.js` | IndexedDB bootstrap used by the application shell. |

### `src/styles`

| File | Purpose |
| --- | --- |
| `global.css` | No description recorded. |

### Transformation step registry

`src/core/transforms/stepRegistry.js` declares 22 pipeline steps. Every step declares its parameters, so the UI renders forms generically, and returns a new dataset plus a plain-language summary of what changed.

| Step key | Label | What it does |
| --- | --- | --- |
| `filterRows` | Filter rows | Keep or remove rows that match all/any of a set of conditions. |
| `dropMissing` | Remove rows with missing values | Drop a row when any chosen column is missing a value. |
| `fillMissing` | Fill missing values | Fill gaps with the mean, median, most common value, or a constant. |
| `dedupe` | Remove duplicate rows | Remove exact duplicate rows, optionally considering a subset of columns. |
| `changeCase` | Change text case | Convert text to upper case, lower case, or title case. |
| `trimWhitespace` | Trim whitespace | Remove leading and trailing whitespace from a text column. |
| `normalizeWhitespace` | Normalize whitespace | Trim text and collapse repeated internal whitespace between words. |
| `missingMarkers` | Standardize missing markers | Convert configurable text markers such as N/A or NULL into real missing values. |
| `replaceText` | Replace text | Replace matching text with a new value. |
| `convertType` | Convert column type | Reinterpret a column as another data type. |
| `round` | Round numbers | Round numeric values to a chosen number of decimals. |
| `calcColumn` | Calculated column | Add a column computed from an arithmetic expression over other columns. |
| `renameColumn` | Rename column | Rename an existing column. |
| `deleteColumn` | Delete column | Remove a column; the final remaining column cannot be deleted. |
| `conditionalColumn` | Conditional calculated column | Create a column from ordered IF rules with AND/OR conditions and a fallback value. |
| `splitColumn` | Split column | Split a text column by a delimiter into 2–10 named derived columns. |
| `reorderColumns` | Reorder columns | Move columns left, right, or directly to a chosen position. |
| `setPrecision` | Set display precision | Set display precision from 0 to 10 for a numeric column without changing its values. |
| `combineColumns` | Combine columns | Join several columns into one with a configurable separator. |
| `extractDate` | Extract date part | Add a column derived from a date or time part, such as year, month, weekday, hour, or ISO week. |
| `flagOutliers` | Flag outliers | Mark numeric values outside the 1.5×IQR range so they can be reviewed or filtered. |
| `sort` | Sort rows | Sort rows by one or more columns in ascending or descending order. |

## Usage guide

1. **Import** — open Datasets and import a CSV or JSON file, or load the bundled sample data. JSA detects the delimiter, infers column types, and reports malformed rows.
2. **Prepare** — open Clean data and add transformation steps. Every step is appended to a replayable pipeline, and the original import stays unchanged.
3. **Analyse** — use Analysis for descriptive profiles and grouped analyses, and define KPIs from numerator/denominator parts.
4. **Visualise** — build charts in the Chart Builder from a dimension and one or more measures, then save them to the chart library.
5. **Assemble** — add charts, KPIs, text, and filters to a dashboard on the grid canvas and adjust each component's settings.
6. **Export** — download the dashboard as static HTML or interactive, self-contained HTML, or export the dataset itself as CSV/JSON.

## Known limitations

- Datasets and workspace state are stored in the current browser profile only; clearing site data removes them, and there is no built-in cloud sync or multi-user access.

The [audit](AUDIT.md) separates confirmed limitations from items that still require verification.

## Related documentation

- [Root README](../../README.md) — project overview, architecture, and the full version history.
- [RELEASE_NOTES.md](RELEASE_NOTES.md) — what changed in this release and its verification status.
- [AUDIT.md](AUDIT.md) — technical audit of this release.
- [Screenshot capture guide](../../docs/screenshots/README.md) — how to capture and contribute screenshots (none are committed yet).
- [LICENSE](LICENSE) — MIT License for this release.

## License

This release is distributed under the MIT License. See the version [LICENSE](LICENSE) and the repository-root [LICENSE](../../LICENSE).
