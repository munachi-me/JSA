# JSA — JavaScript Analytics (Phases 1–2)
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
