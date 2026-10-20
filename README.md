# JSA — JavaScript Analytics Platform

A toolkit for importing datasets, preparing and cleaning data, performing analytical operations, generating insights, creating KPIs and charts, building dashboards, exporting results, and receiving intelligent analysis recommendations.

## Overview

**JSA** is a JavaScript analytics platform for importing tabular data, preparing it through a replayable cleaning pipeline, exploring analytical operations and visualisations, generating rule-based insights, creating KPIs and charts, assembling dashboards, and exporting results.

Unlike a simple charting or spreadsheet application, JSA persists the full transformation pipeline so every cleaning operation is reproducible, and it distinguishes between imported source data and the pipeline result. Its dashboard builder and export functionality make it a self-contained workspace rather than a collection of one-off visualisations. Data never leaves the user's browser; IndexedDB stores datasets and workspace state locally.

### Check it out 🔗[LIVE PREVIEW](https://jsa-pearl.vercel.app/)

## Project status

The latest release is **v0.5.2** (`jsa-v0.5.2`), verified as the highest version directory in the repository. The project started as a Node.js command-line data-table toolkit (v0.1.0) and has incrementally added a browser-based React UI starting from v0.2.0. Each version folder (`jsa-v0.1.0` through `jsa-v0.5.2`) is an independent project with its own `package.json` and dependencies.

The current project stage is **development** — every version ships working code and test suites, and the Vitest and Vitest-based test suites execute against each version. However, no release is positioned as production-ready in the absence of a formal compliance or security certification. Users who evaluate JSA should run the test suite and production build in the version directory that interests them before committing to its use.

## Key features

JSA's capabilities across versions, from CLI toolkit to full browser application:

| Capability | First appeared in version | Description |
|---|---|---|
| **Dataset import and exploration** | 0.1.0 | CSV and JSON import with delimiter detection, type inference, column profiling, and paginated preview. Text values retain original whitespace so it can be inspected and cleaned deliberately; recognised missing markers are detected during import. |
| **Data cleaning and transformation** | 0.2.0 | A replayable, immutable pipeline of steps. The original imported data is never mutated; every step returns a new dataset plus a plain-language summary. Steps include row filters, missing-value handling, whitespace trimming/normalisation, missing-marker standardisation, case changes, text replacement, type conversion, rounding, calculated columns, date-part extraction, outlier flagging, sorting, conditional columns, column reordering, split/column combine, rename and delete. |
| **Descriptive and grouped analytics** | 0.2.1 | Descriptive statistics (count, missing cells, mean, median, min, max), saved grouped-analysis definitions, and per-column summaries. |
| **KPI creation** | 0.2.1 | KPI definitions built from numerator and denominator parts, with filters, formatting, precision, and target status. |
| **Chart types** | 0.2.2 | A searchable library of saved charts plus a Chart Builder for bar, horizontal bar, line, area, pie, donut, scatter, histogram, stacked, grouped, table, and KPI chart types. |
| **Insights** | 0.2.4 | Rule-based data-quality observations, group comparisons, unusual values, concentration, correlation, and period-change insights. Statistical association is distinguished from causal explanation. |
| **Dashboards** | 0.2.3 | A responsive 12-column grid with chart, KPI, text, and filter components. Configuration can be imported and exported as portable JSON. |
| **Static HTML export** | 0.2.6 | An offline snapshot dashboard with inline SVG charts. Filter components become explanatory notes only; only rendered component values are embedded. |
| **Interactive HTML export** | 0.2.66 | A self-contained HTML file with explicitly selected columns. Filters and recalculations run locally in the browser. A privacy warning notes that selected row-level data is embedded in readable form. |
| **Export appearance customization** | 0.4.71 | Preset colour schemes, typography, spacing, card corners, brand label, and an optional footer for both static and interactive HTML exports. |
| **Dataset Intelligence Engine** | 0.4.8 | A health score with visible heuristic inputs, completeness and duplicate summaries, recommendations for missing values/duplicates/constant columns/high-cardinality text/possible IQR outliers, and expandable column profiles. |
| **KPI and chart suggestions** | 0.5.0 | Explainable, opt-in suggestions derived from column types. KPI suggestions include record counts, numeric totals/averages, and distinct category counts. Chart suggestions cover temporal trends, category comparisons, numeric relationships, distributions, and category counts. Nothing is saved automatically. |
| **Recommended analyses** | 0.5.1 | Compact KPI and chart suggestions by default with a Show all / Show less control. Users can load suggested grouped analyses, preselect correlation variables, navigate to data-quality review, or start a trend chart. Recommendations are advisory and never save automatically. |
| **Local storage and persistence** | 0.2.0 | Datasets and workspace configuration are stored in IndexedDB in the current browser profile. |

## Technology stack

These technologies are identified from `package.json`, configuration files, and source code:

| Technology | Purpose |
|---|---|
| **JavaScript (ES module)** | Application language throughout |
| **React 18** | UI layer, starting from v0.2.0 |
| **React Router DOM** | Page navigation, from v0.2.0 |
| **Vite 5** | Development server and build, from v0.2.0 |
| **Vitest 2** | Test runner, from v0.2.5 onward |
| **lucide-react** | Icon set, from v0.2.0 |
| **fake-indexeddb** | IndexedDB mock for Vitest Node environment, from v0.2.3 |
| **papaparse** | CSV parser for the Node.js CLI, from v0.1.0 only |

## Architecture overview

JSA is organised into a DOM-free `core/` layer and a React UI layer:

- **`core/data/`** — Parsing (CSV, JSON), dataset model (columnar storage with stable ids `c0`, `c1`, …), type inference, profiling, and the Intelligence Engine.
- **`core/transforms/`** — Step registry, pipeline runner, conditional rules, expression evaluator, immutable row/column helpers, and sorting.
- **`core/analytics/`** — Descriptive statistics, aggregation, saved analyses, KPI model, correlation, dataset intelligence, and suggestion logic.
- **`core/visualization/`** — Chart specification, registry, chart data builder, and hand-written SVG renderers.
- **`core/dashboard/`** — Dashboard schema, 12-column layout, filter evaluation, validation, portable configuration, and the two standalone HTML exporters (static and interactive).
- **`core/export/`** — Dataset CSV/JSON export helpers.
- **`core/storage/`** — IndexedDB persistence adapter with idempotent object-store creation.
- **`core/insights/`** — Rule catalogue and insight engine.

The UI (`app/`, `pages/`, `components/`) consumes from `core/` and `DatasetContext.jsx` (React context holding datasets, saved analyses, KPIs, charts, dashboards, insight statuses, and pipeline state). The `core/` layer never imports from `app/`, `pages/`, or `components/`, which is why the Vitest suite runs entirely in Node without a DOM.

## Installation and setup

Each version folder is an independent project. Install inside the version directory you want to use.

```bash
git clone https://github.com/munachi-me/JSA.git
cd JSA/jsa-v0.5.2   # choose any version from jsa-v0.1.0 to jsa-v0.5.2
npm install
npm run dev          # starts Vite dev server (browser) or node src/cli.js (CLI)
```

**Choosing a version**: Clone the repository once, then `cd JSA/jsa-v0.<version>`. The repository root only contains repository-wide documentation, the root LICENSE, and the version folders. Do not install dependencies at the root.

## Usage guide

The typical workflow from importing a dataset to exporting a dashboard:

1. **Import** — open **Datasets** and import a CSV/JSON file or load the bundled sample data (`public/sample-data/sales.csv`). The parser auto-detects the delimiter, detects malformed rows, and infers column types.
2. **Prepare data** — open **Clean data** and add transformation steps from the pipeline. Every step appends to a replayable list; the original import stays unchanged. Steps include row filters, missing-value handling, whitespace trimming/normalisation, missing-marker standardisation, case changes, text replacement, type conversion, rounding, calculated columns, date-part extraction, outlier flagging, sorting, conditional columns, column reordering, split/combine, rename and delete.
3. **Analyse** — open **Analysis** for descriptive profiles, saved grouped analyses, KPI definitions with numerator/denominator parts, and the dataset intelligence health score with recommendations and column profiles.
4. **Visualise** — open **Charts** or **Chart Builder** to create a chart from a dimension and one or more measures. Save it to the library or edit its configuration.
5. **Assemble a dashboard** — open **Dashboards** and add chart, KPI, text, and filter components on the grid canvas. Adjust each component's settings. Import or export the dashboard configuration as portable JSON.
6. **Export** — download the dashboard as:
   - **Static HTML** — offline snapshot with inline SVG charts; filters become explanatory notes.
   - **Interactive HTML** — self-contained file with explicitly selected columns; filters and KPI ratios recalculate locally.
   - Or export the cleaned dataset as CSV/JSON from the global **Export & Publish** menu.

Known pipeline steps can be reordered or removed at any time, and the original imported data is always available as the pipeline base.

## Testing and build

Each version ships with its own test suite and build configuration. Run tests and build inside the target version directory:

```bash
npm test             # Vitest suite (Node environment, non-DOM for .jsx)
npm run build        # Vite production build (writes dist/)
npm run test:core    # optional faster subset, only core-smoke.test.js
```

- The Vitest suite is configured with `environment: 'node'`. Any `.jsx` test that requires a DOM cannot pass under this configuration; treat such failures as environment limitations, not proof that the feature is broken.
- `npm run build` emits `dist/`, which is git-ignored. A chunk-size warning for the main bundle is expected in later releases; it is informational, not a failure.
- For the CLI version (v0.1.0), `npm test` runs `node --test` against `src/tests/core-smoke.test.js`.

Users should inspect test output rather than assuming success. The audit document for each version records exactly what was executed and its result.

## Version history

Every actual version directory in the repository, sorted newest first, with a relative link to each version's README and RELEASE_NOTES:


| Version | Release / milestone name | Description | README | RELEASE_NOTES |
|---|---|---|---|---|
| 0.1.0 | See version README |  | ../../jsa-v0.1.0/README.md | ../../jsa-v0.1.0/RELEASE_NOTES.md |
| 0.2.0 | See version README |  | ../../jsa-v0.2.0/README.md | ../../jsa-v0.2.0/RELEASE_NOTES.md |
| 0.2.1 | See version README |  | ../../jsa-v0.2.1/README.md | ../../jsa-v0.2.1/RELEASE_NOTES.md |
| 0.2.2 | See version README |  | ../../jsa-v0.2.2/README.md | ../../jsa-v0.2.2/RELEASE_NOTES.md |
| 0.2.3 | See version README |  | ../../jsa-v0.2.3/README.md | ../../jsa-v0.2.3/RELEASE_NOTES.md |
| 0.2.4 | See version README |  | ../../jsa-v0.2.4/README.md | ../../jsa-v0.2.4/RELEASE_NOTES.md |
| 0.2.5 | See version README |  | ../../jsa-v0.2.5/README.md | ../../jsa-v0.2.5/RELEASE_NOTES.md |
| 0.2.6 | See version README |  | ../../jsa-v0.2.6/README.md | ../../jsa-v0.2.6/RELEASE_NOTES.md |
| 0.2.7 | See version README |  | ../../jsa-v0.2.7/README.md | ../../jsa-v0.2.7/RELEASE_NOTES.md |
| 0.2.8 | See version README |  | ../../jsa-v0.2.8/README.md | ../../jsa-v0.2.8/RELEASE_NOTES.md |
| 0.2.9 | See version README |  | ../../jsa-v0.2.9/README.md | ../../jsa-v0.2.9/RELEASE_NOTES.md |
| 0.2.51 | See version README |  | ../../jsa-v0.2.51/README.md | ../../jsa-v0.2.51/RELEASE_NOTES.md |
| 0.2.52 | See version README |  | ../../jsa-v0.2.52/README.md | ../../jsa-v0.2.52/RELEASE_NOTES.md |
| 0.2.53 | See version README |  | ../../jsa-v0.2.53/README.md | ../../jsa-v0.2.53/RELEASE_NOTES.md |
| 0.2.54 | See version README |  | ../../jsa-v0.2.54/README.md | ../../jsa-v0.2.54/RELEASE_NOTES.md |
| 0.2.61 | See version README |  | ../../jsa-v0.2.61/README.md | ../../jsa-v0.2.61/RELEASE_NOTES.md |
| 0.2.62 | See version README |  | ../../jsa-v0.2.62/README.md | ../../jsa-v0.2.62/RELEASE_NOTES.md |
| 0.2.63 | See version README |  | ../../jsa-v0.2.63/README.md | ../../jsa-v0.2.63/RELEASE_NOTES.md |
| 0.2.64 | See version README |  | ../../jsa-v0.2.64/README.md | ../../jsa-v0.2.64/RELEASE_NOTES.md |
| 0.2.65 | See version README |  | ../../jsa-v0.2.65/README.md | ../../jsa-v0.2.65/RELEASE_NOTES.md |
| 0.2.66 | See version README |  | ../../jsa-v0.2.66/README.md | ../../jsa-v0.2.66/RELEASE_NOTES.md |
| 0.2.71 | See version README |  | ../../jsa-v0.2.71/README.md | ../../jsa-v0.2.71/RELEASE_NOTES.md |
| 0.2.72 | See version README |  | ../../jsa-v0.2.72/README.md | ../../jsa-v0.2.72/RELEASE_NOTES.md |
| 0.2.73 | See version README |  | ../../jsa-v0.2.73/README.md | ../../jsa-v0.2.73/RELEASE_NOTES.md |
| 0.2.81 | See version README |  | ../../jsa-v0.2.81/README.md | ../../jsa-v0.2.81/RELEASE_NOTES.md |
| 0.2.82 | See version README |  | ../../jsa-v0.2.82/README.md | ../../jsa-v0.2.82/RELEASE_NOTES.md |
| 0.2.83 | See version README |  | ../../jsa-v0.2.83/README.md | ../../jsa-v0.2.83/RELEASE_NOTES.md |
| 0.2.84 | See version README |  | ../../jsa-v0.2.84/README.md | ../../jsa-v0.2.84/RELEASE_NOTES.md |
| 0.2.91 | See version README |  | ../../jsa-v0.2.91/README.md | ../../jsa-v0.2.91/RELEASE_NOTES.md |
| 0.2.92 | See version README |  | ../../jsa-v0.2.92/README.md | ../../jsa-v0.2.92/RELEASE_NOTES.md |
| 0.2.93 | See version README |  | ../../jsa-v0.2.93/README.md | ../../jsa-v0.2.93/RELEASE_NOTES.md |
| 0.3.0 | See version README |  | ../../jsa-v0.3.0/README.md | ../../jsa-v0.3.0/RELEASE_NOTES.md |
| 0.3.1 | See version README |  | ../../jsa-v0.3.1/README.md | ../../jsa-v0.3.1/RELEASE_NOTES.md |
| 0.3.2 | See version README |  | ../../jsa-v0.3.2/README.md | ../../jsa-v0.3.2/RELEASE_NOTES.md |
| 0.3.3 | See version README |  | ../../jsa-v0.3.3/README.md | ../../jsa-v0.3.3/RELEASE_NOTES.md |
| 0.3.4 | See version README |  | ../../jsa-v0.3.4/README.md | ../../jsa-v0.3.4/RELEASE_NOTES.md |
| 0.3.5 | See version README |  | ../../jsa-v0.3.5/README.md | ../../jsa-v0.3.5/RELEASE_NOTES.md |
| 0.3.6 | See version README |  | ../../jsa-v0.3.6/README.md | ../../jsa-v0.3.6/RELEASE_NOTES.md |
| 0.3.7 | See version README |  | ../../jsa-v0.3.7/README.md | ../../jsa-v0.3.7/RELEASE_NOTES.md |
| 0.3.8 | See version README |  | ../../jsa-v0.3.8/README.md | ../../jsa-v0.3.8/RELEASE_NOTES.md |
| 0.4.0 | See version README |  | ../../jsa-v0.4.0/README.md | ../../jsa-v0.4.0/RELEASE_NOTES.md |
| 0.4.1 | See version README |  | ../../jsa-v0.4.1/README.md | ../../jsa-v0.4.1/RELEASE_NOTES.md |
| 0.4.2 | See version README |  | ../../jsa-v0.4.2/README.md | ../../jsa-v0.4.2/RELEASE_NOTES.md |
| 0.4.3 | See version README |  | ../../jsa-v0.4.3/README.md | ../../jsa-v0.4.3/RELEASE_NOTES.md |
| 0.4.4 | See version README |  | ../../jsa-v0.4.4/README.md | ../../jsa-v0.4.4/RELEASE_NOTES.md |
| 0.4.5 | See version README |  | ../../jsa-v0.4.5/README.md | ../../jsa-v0.4.5/RELEASE_NOTES.md |
| 0.4.6 | See version README |  | ../../jsa-v0.4.6/README.md | ../../jsa-v0.4.6/RELEASE_NOTES.md |
| 0.4.7 | See version README |  | ../../jsa-v0.4.7/README.md | ../../jsa-v0.4.7/RELEASE_NOTES.md |
| 0.4.8 | See version README |  | ../../jsa-v0.4.8/README.md | ../../jsa-v0.4.8/RELEASE_NOTES.md |
| 0.4.71 | See version README |  | ../../jsa-v0.4.71/README.md | ../../jsa-v0.4.71/RELEASE_NOTES.md |
| 0.4.72 | See version README |  | ../../jsa-v0.4.72/README.md | ../../jsa-v0.4.72/RELEASE_NOTES.md |
| 0.5.0 | See version README |  | ../../jsa-v0.5.0/README.md | ../../jsa-v0.5.0/RELEASE_NOTES.md |
| 0.5.1 | See version README |  | ../../jsa-v0.5.1/README.md | ../../jsa-v0.5.1/RELEASE_NOTES.md |
| 0.5.2 | See version README |  | ../../jsa-v0.5.2/README.md | ../../jsa-v0.5.2/RELEASE_NOTES.md |

*Table sorted by semantic version (newest at top). Links are relative to the repository root. Every version directory from `jsa-v0.1.0` through `jsa-v0.5.2` is included.*
 (newest at top). Links are relative to the repository root. Every version directory from `jsa-v0.1.0` through `jsa-v0.5.2` is included.*

## Development principles

- **Plain JavaScript, no TypeScript.** The codebase is 100% plain ES module JavaScript. No `.ts` or `.tsx` files exist anywhere in the repository, and there is no type-checking step. Type mistakes surface only at runtime or in tests.
- **Separation of concerns.** The `core/` modules are pure and framework-free, which is the main reason the project is testable in a Node environment. The UI layer on top imports from `core/` and `DatasetContext.jsx`, never the reverse.
- **Metadata-driven UI.** Pipeline steps, chart options, and appearance settings are declared as data (parameter metadata in the step registry, chart specification model, export appearance model). Adding a feature usually means adding a declaration, not rewriting forms.
- **Immutable pipeline.** Every cleaning step returns a new dataset; the original import is never mutated. This is the strongest correctness property in the design and makes the pipeline reversible by construction.
- **Version-folder per release.** Each version directory is an independent project with its own `package.json`, `package-lock.json`, and source tree. Fixes in a later version do not propagate backwards, and a fix applied to one version folder does not affect another.

## Known limitations

- **No backend, accounts, sharing, or server-side scheduling.** All work is local to one browser profile (or the CLI). There is no built-in cloud sync or multi-user access.
- **Data volume bounded by browser memory.** The interactive HTML export serialises every embedded cell into one file; very large datasets can create large HTML files and slow browser startup.
- **Static HTML export is a snapshot.** Filter components are descriptive text only; values never refresh from a live data source.
- **Interactive export embeds data in readable JSON.** The privacy warning is a notice, not encryption or access control.
- **React rendering is not meaningfully covered by the test suite.** Vitest runs in a Node environment with `environment: 'node'`; any `.jsx` test that needs a DOM cannot pass under this configuration. This does not prove React features are broken, but it means they are effectively untested under the current suite configuration.
- **IndexedDB behaviour varies by browser and quota.** The persistence adapter creates each object store only when missing, but browser behaviour under quota pressure and in private-browsing modes has not been systematically tested.
- **Date/time coercion across time zones and DST boundaries** has not been exhaustively tested in the generated chart outputs.
- **No formal security audit has been conducted.** The section on security and privacy in the version audits records concrete observations but does not certify any release as secure.

## Contributing

1. **Install dependencies** inside the version directory you want to work in: `cd JSA/jsa-v0.<version> && npm install`.
2. **Run the test suite**: `npm test` (Vitest) or `npm run test:core` (core smoke suite). For the CLI (v0.1.0), `npm test` runs `node --test`.
3. **Run the production build**: `npm run build` (Vite). The output writes to `dist/`, which is git-ignored.
4. **Make your change** — adding a pipeline step means adding one entry to `src/core/transforms/stepRegistry.js`; the UI form renders generically from that metadata. Adding a chart type means updating `src/core/visualization/chartSpec.js`, `chartRegistry.js`, and the SVG renderer.
5. **Verify** — `npm test` and `npm run build` should pass. Check the audit document for the version to confirm what was already verified.
6. **Submit a change** — fork the repository, make your change in the target version folder, and open a pull request. The project maintainer will review against the existing test suite and audit standards.

Changes that affect the core domain (`core/`) are the highest impact; UI-only changes (`app/`, `pages/`, `components/`) carry the lowest risk because the core layer is framework-free and testable in Node.

## License

JSA is distributed under the **MIT License**. See the repository-root [LICENSE](../../LICENSE) and the version-specific [LICENSE](../../jsa-v0.<version>/LICENSE) files. The MIT license text and the copyright attribution (© 2026 Munachi) are consistent across all version LICENSE files and the root LICENSE.
