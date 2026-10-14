# JSA — JavaScript Analytics (Phases 1–4)
Setup: `npm install` · `npm run dev` · `npm test` · `npm run build`

## Done in Phase 1
CSV (delimiter detection, quotes, malformed-row reporting) and JSON import; typed columnar dataset model with stable column ids; type inference with user override; descriptive statistics; group-by aggregation; data-quality profile; dataset workspace with paginated preview.

## Conventions
- Variance / std dev: sample (n−1) by default. Percentiles: linear interpolation (Excel PERCENTILE.INC).
- ISO dates parse as UTC. Missing markers: empty, NA, N/A, null, NaN, none, "-".
- Browser limit: 25 MB per file. Datasets are in memory only until Phase 7 persistence lands.

## Not built yet (shown disabled in the UI)
Cleaning pipeline, Excel import, saved analyses, charts, dashboards, insights, export, storage.

## Phase 2 additions
- **Cleaning pipeline** (`core/transforms`): filter rows, drop/fill missing (mean, median, mode, constant), dedupe, change case, replace text, change type, round, calculated columns (safe expression parser, no eval), extract date parts, flag outliers (never removes them), sort. Steps are replayable; removing one undoes it; the original import is never modified. A failing step is skipped and reported.
- **Filters**: eq/ne/range/between/contains/missing, all-or-any. Comparison operators exclude missing cells (use "is missing" to find them).
- **KPI engine**: aggregate or ratio, per-part filters, percent/currency/number formats, optional target. Zero denominators return — with a warning.
- **Saved analyses**: group-by + measures + filters + sort + top-N as a JSON definition that re-runs on the current cleaned data.

## Still in memory only
Datasets, pipelines, analyses and KPIs reset on reload until persistence lands.

## Phase 3 additions
- **Chart spec** (`core/visualization/chartSpec.js`, schemaVersion 1) is independent of any rendering library; `chartData.js` turns spec + dataset into render-ready data using the analytics engine; renderers are plain React SVG in `components/charts`.
- 12 chart types: bar, horizontal bar, line, area, pie, donut, scatter, histogram, stacked, grouped, table, KPI card. Charts can be built from cleaned data or from a saved analysis.
- Honesty rules: bars always start at zero; pie/donut drop negatives with a warning; top-N truncation, scatter sampling (2,000 points) and table caps are stated; empty results show an empty state, never placeholder values. Every chart has a "Show data as table" alternative.
- Date dimensions group by day/month/quarter/year (UTC). Histogram bins default to Sturges' rule; the last bin includes the maximum.

## Phase 4 additions
- **Dashboard builder** (`core/dashboard`, `pages/DashboardPage.jsx`): 12-column grid; chart, KPI, text and filter components; drag by the header, resize from the corner, arrow keys (Shift = resize), or exact x/y/w/h in the settings panel. The layout engine pushes overlapping items down and closes gaps; a randomized test checks no overlaps ever remain. Mobile widths stack components in order.
- **Dashboard filters** become ordinary row conditions applied once to the data, so every component agrees. A component can opt out ("ignore dashboard filters"); chart/KPI-level filters stay inside the saved chart or KPI.
- **Schema** (`schemaVersion` 1): validated on load/import, overlapping layouts repaired, newer versions refused, a migration table ready for future changes. Broken references (deleted charts/KPIs/columns) show messages instead of crashing.
- **Download/import configuration**: a self-contained JSON of layout + the charts/KPIs/analyses used. It holds no row data, is not a standalone dashboard app, and only imports into a dataset with matching columns. Hosted publishing and static bundles are Phase 6.
- **Persistence** (`storage/idb.js`): datasets, pipelines, analyses, KPIs, charts and dashboards are saved in this browser's IndexedDB (sources written once; small metadata rewritten on change). Quota/write failures show a banner; nothing leaves the browser.
