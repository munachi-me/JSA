# JSA — JavaScript Analytics (Phases 1–5)
Setup: `npm install` · `npm run dev` · `npm test` · `npm run build`

## Platform status
Phases 1–5 have implementations for data import, preparation, analysis, visualization, dashboards, browser persistence, and rule-based insights. A Phase 6 Initial Stabilization Audit (2026-10-13) has reviewed the source tree; full end-to-end verification is pending as project dependencies were unavailable in the audit environment. The current app is a browser-based platform; hosted publishing and standalone dashboard generation are not implemented yet.

## Phase 1 foundation
CSV (delimiter detection, quotes, malformed-row reporting) and JSON import; typed columnar dataset model with stable column ids; type inference with user override; descriptive statistics; group-by aggregation; data-quality profile; dataset workspace with paginated preview.

## Conventions
- Variance / std dev: sample (n−1) by default. Percentiles: linear interpolation (Excel PERCENTILE.INC).
- ISO dates parse as UTC. Missing markers: empty, NA, N/A, null, NaN, none, "-".
- Browser limit: 25 MB per file. Datasets are in memory only until Phase 7 persistence lands.

## Phase 2 additions
- **Cleaning pipeline** (`core/transforms`): filter rows, drop/fill missing (mean, median, mode, constant), dedupe, change case, replace text, change type, round, calculated columns (safe expression parser, no eval), extract date parts, flag outliers (never removes them), sort. Steps are replayable; removing one undoes it; the original import is never modified. A failing step is skipped and reported.
- **Filters**: eq/ne/range/between/contains/missing, all-or-any. Comparison operators exclude missing cells (use "is missing" to find them).
- **KPI engine**: aggregate or ratio, per-part filters, percent/currency/number formats, optional target. Zero denominators return — with a warning.
- **Saved analyses**: group-by + measures + filters + sort + top-N as a JSON definition that re-runs on the current cleaned data.

## Phase 3 additions
- **Chart spec** (`core/visualization/chartSpec.js`, schemaVersion 1) is independent of any rendering library; `chartData.js` turns spec + dataset into render-ready data using the analytics engine; renderers are plain React SVG in `components/charts`.
- 12 chart types: bar, horizontal bar, line, area, pie, donut, scatter, histogram, stacked, grouped, table, KPI card. Charts can be built from cleaned data or from a saved analysis.
- Honesty rules: bars always start at zero; pie/donut drop negatives with a warning; top-N truncation, scatter sampling (2,000 points) and table caps are stated; empty results show an empty state, never placeholder values. Every chart has a "Show data as table" alternative.
- Date dimensions group by day/month/quarter/year (UTC). Histogram bins default to Sturges' rule; the last bin includes the maximum.

## Phase 4 additions
- **Dashboard builder** (`core/dashboard`, `pages/DashboardPage.jsx`): 12-column grid; chart, KPI, text and filter components; drag by the header, resize from the corner, arrow keys (Shift = resize), or exact x/y/w/h in the settings panel. The layout engine pushes overlapping items down and closes gaps; a randomized test checks no overlaps ever remain. Mobile widths stack components in order.
- **Dashboard filters** become ordinary row conditions applied once to the data, so every component agrees. A component can opt out ("ignore dashboard filters"); chart/KPI-level filters stay inside the saved chart or KPI.
- **Schema** (`schemaVersion` 1): validated on load/import, overlapping layouts repaired, newer versions refused, a migration table ready for future changes. Broken references (deleted charts/KPIs/columns) show messages instead of crashing.
- **Download/import configuration**: a self-contained JSON of layout + the charts/KPIs/analyses used. It holds no row data, is not a standalone dashboard app, and only imports into a dataset with matching columns. Hosted publishing and standalone dashboard bundles are not implemented yet; they are candidates for a later platform milestone after Phase 6 stabilization.
- **Persistence** (`storage/idb.js`): datasets, pipelines, analyses, KPIs, charts and dashboards are saved in this browser's IndexedDB (sources written once; small metadata rewritten on change). Quota/write failures show a banner; nothing leaves the browser.

## Phase 5 additions: insight engine
- `core/insights` runs explicit rules over the cleaned data: missing data, duplicate rows, constant columns, top/bottom groups, group differences (one-way ANOVA), outcome rates by group (chi-square), unusual values (Tukey fences), concentration of totals, correlations (Pearson), period-over-period changes and missing time periods.
- Every insight has a title, description, metric, subject, numeric **evidence**, the **calculation** that produced it, **limitations**, and (where relevant) a clearly labelled follow-up *suggestion*. Types are kept apart: *observed fact*, *statistical association*, *data quality*. The engine never states why a pattern exists.
- Significance claims use real tests (`core/analytics/inference.js`, checked against known p-values) with a Bonferroni correction across the comparisons tested, an effect-size floor, and a minimum group size of 5 rows. Skipped inputs are reported, and calculated columns are not correlated with their own inputs.
- Whether a numeric column is totalled or averaged is guessed from its name (price, rate, score… are averaged) and shown in each insight; override it on the Insights page.
- Insights can be saved, dismissed, restored, saved as a chart, or added to a dashboard. Dashboard insight components store only the insight id and are **recalculated from the (filtered) data each time**; if a pattern no longer holds they say so.
- Limits: runs synchronously in the browser. Performance needs benchmarking; moving long-running work to a Web Worker should be driven by measured results. Dashboard configuration exports do not carry insight options.


## Phase 6: stabilization roadmap
1. Install dependencies and verify the production build and complete test suite.
2. Fix failing tests/build issues before adding features.
3. Verify the end-to-end flow: import → clean → analyze → visualize → insights → dashboard → save/reopen.
4. Test persistence, malformed files, empty datasets, and missing/deleted references.
5. Define dashboard publishing requirements only after the existing workflow is reliable.

**Verification note:** The repository has not yet passed a fresh build/test run in the Phase 6 audit environment because project dependencies were unavailable there. Do not interpret the presence of tests as proof that they currently pass.
