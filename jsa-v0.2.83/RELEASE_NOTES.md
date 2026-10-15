# JSA v0.2.83 — Numeric Distribution Explorer

## Highlights
- Add a histogram to numeric column profiling on the Analysis page.
- Display numeric value counts across eight equal-width bins.
- Show bin ranges and counts on hover, plus readable lower-bound labels.
- Handle empty numeric data and constant-value columns without errors.
- Keep the distribution chart in the existing Analysis workspace; no full-app redesign yet.

## Compatibility
- Builds on the Acode-edited v0.2.82 baseline.
- Existing grouped analysis, CSV export, KPIs, saved analyses, correlation, charts, dashboards, and data preparation are retained.
- `node_modules` is intentionally excluded. Run `npm install` after extracting.
