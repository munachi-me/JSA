# JSA v0.2.0 — JavaScript Analytics Platform

> First browser release. React/Vite single-page app with CSV/JSON import, column type inference, dataset profiling, and a paginated data preview.

| | |
| --- | --- |
| **Package** | `jsa` |
| **Version** | `0.2.0` |
| **Release stage** | Phase 1 · Phase 1 — Browser foundation |
| **Application type** | Browser-based, client-side analytics application |
| **Status** | Historical release |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [Release notes](RELEASE_NOTES.md) · [Audit](AUDIT.md) · [License](LICENSE)

## What JSA is

JSA is a JavaScript analytics platform for importing tabular datasets, preparing and cleaning them, running analytical operations, generating rule-based insights, creating KPIs and charts, assembling dashboards, and exporting results.

In this release JSA is a single-page React application that runs entirely in the browser. Datasets are parsed, transformed, aggregated, and charted on the client, and persisted in IndexedDB in the current browser profile. There is no JSA backend to deploy and no server-side data store.

## Purpose of this release

First browser release. React/Vite single-page app with CSV/JSON import, column type inference, dataset profiling, and a paginated data preview.

**Introduced or materially changed in this release**

- Browser application shell with Home and Datasets routes.
- CSV and JSON import with delimiter detection and malformed-row reporting.
- Column type inference (numeric, boolean, date, time, text, categorical, identifier).
- Dataset profile covering missing values, distinct counts, and duplicates.

**Inherited from earlier releases** (verified by comparing the source trees of the adjacent version folders)

- Routes added here: `/`, `/dataset`, `/dataset/:id`.

## Features in this release

| Capability | State in this release |
| --- | --- |
| Dataset import and exploration | CSV and JSON import with delimiter detection, type inference, profiling, and paginated preview. |

**Application routes:** `/`, `/dataset`, `/dataset/:id`

## Requirements

- Node.js 18 or newer is recommended.
- npm.
- A modern browser with JavaScript and IndexedDB support.

## Installation

Each version folder is an independent project. Install dependencies inside the version directory, not at the repository root, which only holds repository-wide documentation, the license, and the version folders.

```bash
git clone https://github.com/munachi-me/JSA.git
cd JSA/jsa-v0.2.0
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

## Testing

```bash
npm test
```

Test files (2):

- `src/tests/core.test.js`
- `src/tests/integration.test.js`

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

### `src/core/analytics`

| File | Purpose |
| --- | --- |
| `aggregation.js` | Group-by and aggregate operations used by grouped analyses, KPIs, and chart data building. |
| `descriptive.js` | Descriptive statistics (count, missing, mean, median, min, max, and related measures) over column values. |

### `src/core/data`

| File | Purpose |
| --- | --- |
| `csvParser.js` | RFC-4180-style CSV parser with delimiter detection, quoted fields, escaped quotes, embedded newlines, and malformed-row reporting. Pure function with no DOM dependency. |
| `dataTypes.js` | Type inference and parsing for numeric, boolean, date, datetime, time, text, categorical, and identifier columns, including missing-value recognition. |
| `datasetModel.js` | Internal dataset representation. Columns have stable ids (`c0`, `c1`, …) and columnar value storage, so duplicate or renamed headers never break references. Provides CSV and JSON dataset constructors and immutable column helpers. |
| `profile.js` | Dataset profiling: row and column counts, missing cells, distinct values, duplicate rows, and per-column summary statistics. |

### `src/pages`

| File | Purpose |
| --- | --- |
| `DatasetPage.jsx` | Dataset Explorer: import, dataset switching, summary cards, column schema, type overrides, and paginated data preview. In later releases it also hosts data-quality intelligence findings. |
| `HomePage.jsx` | Workspace landing page with dataset and workspace summaries, import actions, and either onboarding or saved-work content depending on whether the workspace is empty. |

### `src/styles`

| File | Purpose |
| --- | --- |
| `global.css` | No description recorded. |

## Usage guide

1. **Import** — open Datasets and import a CSV or JSON file, or load the bundled sample data. JSA detects the delimiter, infers column types, and reports malformed rows.

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
