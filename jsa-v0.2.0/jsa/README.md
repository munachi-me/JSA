# JSA — JavaScript Analytics (Phase 1)
Setup: `npm install` · `npm run dev` · `npm test` · `npm run build`

## Done in Phase 1
CSV (delimiter detection, quotes, malformed-row reporting) and JSON import; typed columnar dataset model with stable column ids; type inference with user override; descriptive statistics; group-by aggregation; data-quality profile; dataset workspace with paginated preview.

## Conventions
- Variance / std dev: sample (n−1) by default. Percentiles: linear interpolation (Excel PERCENTILE.INC).
- ISO dates parse as UTC. Missing markers: empty, NA, N/A, null, NaN, none, "-".
- Browser limit: 25 MB per file. Datasets are in memory only until Phase 7 persistence lands.

## Not built yet (shown disabled in the UI)
Cleaning pipeline, Excel import, saved analyses, charts, dashboards, insights, export, storage.
