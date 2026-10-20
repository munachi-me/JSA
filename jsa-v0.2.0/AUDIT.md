# AUDIT.md — JSA v0.2.0

| | |
| --- | --- |
| **Version audited** | `0.2.0` |
| **Stage** | Phase 1 |
| **Audit type** | Static source review plus executed test run |
| **Runtime tested in this environment** | Yes |

[Root README](../../README.md) · [README](README.md) · [Release notes](RELEASE_NOTES.md)

## 1. Executive summary

This is a static technical audit of JSA 0.2.0, covering 12 application modules and 2 test files. First browser release. React/Vite single-page app with CSV/JSON import, column type inference, dataset profiling, and a paginated data preview.

The release is a client-side single-page application: 612 lines of application code and 139 lines of test code, with 4 runtime dependencies and 3 development dependencies.

Overall condition: the code shows a consistent architectural pattern — a pure, DOM-free `core/` layer (parsing, transforms, analytics, chart data, exports) with a thin React UI layer on top. That separation is what makes the core testable under Vitest's Node environment.

In this audit environment the test suite was executed and finished with exit code 0, reporting **Tests  21 passed** . See §6 for exactly what that does and does not establish.

## 2. Architecture

```
jsa-v0.2.0/
├── index.html
├── package.json
├── vite.config.js
├── public/
└── src/
    ├── main.jsx
    ├── app/            application shell, providers, workspace state
    ├── pages/          one component per route
    ├── components/     presentational components grouped by feature
    ├── core/           DOM-free domain logic (data, transforms, analytics,
    │                   visualization, dashboard, insights, export, storage)
    └── tests/          Vitest suites
```

### Subsystem responsibilities

- **`core/data`** — parsing and the dataset model. Columns carry stable ids (`c0`, `c1`, …) so a rename or a duplicated header cannot break downstream references. Values are stored per column and coerced on load.
- **`core/analytics`** — descriptive statistics, grouping/aggregation, saved analyses, KPIs, correlation, and (from 0.5.0) suggestions. These consume datasets and emit plain objects; they do not import React.
- **`app/`** — `App.jsx` owns the route table, sidebar, workspace header, and the global Export & Publish menu. `DatasetContext.jsx` is the single workspace store holding datasets, saved analyses, KPIs, charts, dashboards, insight statuses, and pipeline state.

### Dependency direction

`pages/` → `components/` → `core/` and `app/DatasetContext.jsx` → `core/`. The `core/` layer imports nothing from `app/`, `pages/`, or `components/`, and holds no DOM or React references. `src/tests/` imports `core/` directly, which is why the majority of the suite runs without a browser.

## 3. Feature inventory

| Feature | Primary source files | Implementation notes |
| --- | --- | --- |
| CSV parsing and import | `core/data/csvParser.js` | Delimiter detection, quoted fields, escaped quotes, embedded newlines, malformed-row reporting. |
| Dataset model and JSON import | `core/data/datasetModel.js` | Columnar storage with stable column ids and typed values. |
| Dataset profiling | `core/data/profile.js` | Missing cells, distinct counts, duplicate rows, per-column statistics. |
| Descriptive statistics | `core/analytics/descriptive.js` | Count, mean, median, min, max, and related measures. |
| Grouped aggregation | `core/analytics/aggregation.js` | Group-by with aggregate measures. |

Routes wired in `src/app/App.jsx`: `/`, `/dataset`, `/dataset/:id`.


## 4. Data handling

### Import

CSV import uses a hand-written RFC-4180-style parser (`csvParser.js`) rather than a library. It strips a UTF-8 BOM, auto-detects the delimiter from `,`, `;`, tab, and `|` by scoring consistency across the first ten lines, and handles quoted fields, doubled quotes, and embedded newlines. Rows whose field count does not match the header are reported as `malformed_row` warnings and then padded or truncated so the dataset stays rectangular — the import degrades to a warning rather than throwing.

JSON import (`datasetModel.js`) requires a non-empty array of objects, unions the keys across all objects, and stringifies nested values into JSON text with a `nested_values` warning.

### Representation

Types are inferred per column (`integer`, `decimal`, `currency`, `boolean`, `date`, `datetime`, `time`, `text`, `categorical`, `identifier`) and each value is coerced on load. Coercion is deliberately conservative: text values keep their original whitespace so it can be inspected and cleaned explicitly, while recognised missing markers become `null`.

### Transformation

No transformation pipeline in this release.

### Analysis, storage, export

- Analysis operates on the current (pipeline-applied) dataset and returns plain objects consumed by pages.

## 5. Reliability and correctness

Observed strengths:

- Steps and transforms return new datasets, so partial failure cannot corrupt the working dataset.
- Parser errors are collected as structured warnings with row numbers instead of aborting the import.
- Exporters escape user-controlled strings before interpolation into HTML, and the interactive exporter escapes `<`, U+2028, and U+2029 when serialising the embedded JSON.
- The interactive exporter caps categories, series, filter values, and scatter points, disclosing each cap in the output.

Edge cases worth targeted tests:

- Very wide CSVs and rows with an inconsistent field count near the header boundary.
- Numeric columns containing currency symbols or thousands separators through every aggregate.
- Division-by-zero and null handling in KPI ratios.
- Time-zone effects on `date`/`datetime` coercion, since values are normalised through `toISOString()`.
- Charts whose saved analysis, chart, or column reference has since been deleted.
- Large datasets (hundreds of thousands of rows) through the interactive export, which serialises every embedded cell.

## 6. Testing

**Test files present (2):**

- `src/tests/core.test.js`
- `src/tests/integration.test.js`

### Execution status

| Check | Command | Result |
| --- | --- | --- |
| Test suite | `npx vitest run` | **Executed.** Test files: 2 passed; tests: 21 passed. Exit code 0. |

This run was performed while producing this documentation, on the repository copy in the audit environment. It establishes that the committed suites execute and pass for this version. It does **not** establish coverage percentage, browser behaviour, or visual correctness.

### Statically reviewed only

The following were read but not executed: chart rendering paths, dashboard layout and resize behaviour, IndexedDB upgrade behaviour in a real browser, and the generated HTML from either exporter actually being opened in a browser. These are code-reviewed conclusions, not observed behaviour.

### Known limitation of the test setup

`vite.config.js` sets `test: { environment: 'node' }`. Any `.jsx` test that needs a DOM cannot pass under this configuration. A failure in `render.test.jsx` therefore reflects the test environment rather than proven application breakage — but it also means React rendering is effectively not covered by the suite as configured.

The suite does not measure coverage; no coverage percentage is asserted anywhere in this repository.

## 7. Security and privacy

This section records concrete observations. It is **not** a formal security audit, and no version should be described as "secure" on the strength of it.

### Data locality

- No JSA backend exists. Datasets are parsed and held in browser memory and persisted to IndexedDB in the current browser profile.
- There is no authentication, authorisation, or multi-user model, because there is no server and no account concept.
- Anyone with access to the same browser profile and origin can read the stored datasets through the application.

### Exported files

- Generated HTML escapes interpolated strings. The interactive exporter additionally escapes `<`, U+2028 and U+2029 in the embedded JSON to prevent a `</script>` breakout.

### Imported files and dependencies

- Imported CSV/JSON is treated as untrusted text and is escaped on export, but no size limit is enforced in the parser itself beyond what the UI reports.
- Runtime dependencies are React, React DOM, React Router, and `lucide-react` only. There is no charting, date, or CSV library; parsing and rendering are hand-written, which reduces third-party attack surface but concentrates correctness risk in this codebase.
- No dependency audit (`npm audit`) result is recorded for this version.

### Not assessed

Cross-site scripting through deeply nested JSON imports, denial of service through pathological CSV input, and browser-storage quota exhaustion were not tested.

## 8. Maintainability

- **Plain JavaScript, no TypeScript.** No `.ts`/`.tsx` files and no type-checking step exist. Type mistakes surface only at runtime or in tests.
- **Consistent layering.** The `core/` modules are pure and framework-free, which is the main reason the project is testable at all.
- **Metadata-driven UI.** Step parameters and chart options are declared as data, so forms are generated rather than hand-written per transform. Adding a step means adding one registry entry.
- **Large single files.** `stepRegistry.js` and the two HTML exporters are long and string-template heavy. The exporters are effectively small programs embedded in JavaScript template literals, which is hard to lint and hard to debug.
- **Duplication across releases.** The repository keeps a full copy of the application per version. Fixes made in a later version do not propagate backwards, and each folder carries its own lockfile.
- **Version-spanning drift.** Generated documentation in earlier releases had drifted from the code (for example a README describing a different version than its own `package.json`). This documentation pass corrects that for the files it rewrites.

## 9. Known limitations

Confirmed from source:

- No backend, accounts, sharing, or server-side scheduling. All work is local to one browser profile.
- Data volume is bounded by browser memory; the interactive export serialises every embedded cell into one HTML file.
- React rendering is not meaningfully covered by the test suite because Vitest runs in a Node environment.

Requiring verification (not confirmed either way):

- Behaviour of every chart type and dashboard layout at mobile widths in real browsers.
- Correctness of date and time coercion across time zones and daylight-saving boundaries.
- IndexedDB behaviour under quota pressure and in private-browsing modes.
- Whether very large interactive exports open acceptably in low-memory mobile browsers.

## 10. Recommendations

Prioritised, most valuable first:

1. **Add a DOM test environment** (for example `jsdom` or `happy-dom` for `.jsx` tests) so React pages and rendering paths are actually covered. Today `render.test.jsx` cannot meaningfully run.
2. **Extract the HTML exporters.** Move the export templates out of template literals into small, unit-testable builder functions. This is the highest-risk, least-testable area of the codebase.
3. **Add property-style tests for numeric and date handling** — currency strings, thousands separators, negative values, leap days, and time-zone edges — because these feed KPIs, charts, and exports alike.
4. **Introduce a typed boundary for the dataset model.** Even without adopting TypeScript, JSDoc types on the dataset, chart spec, and dashboard schema would catch the reference-drift bugs that deleted columns and charts cause.
5. **Record dependency audit results** (`npm audit`) in the repository so security posture is visible rather than assumed.
6. **Add an explicit size guard on import** in the parser, not just a UI message, so oversized files fail predictably.
7. **Consider consolidating version folders.** Keeping a full copy per release preserves an exact historical record, but it multiplies maintenance cost and makes repository-wide fixes impractical. Tagging releases in a single tree would preserve history at a fraction of the weight.
