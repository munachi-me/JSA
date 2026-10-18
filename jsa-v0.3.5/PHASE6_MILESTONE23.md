# Phase 6 — Milestone 23: Dedicated Chart Builder

## Scope
- Split the Charts experience into a chart library and a dedicated Chart Builder route.
- Added `/chart-builder` and `/chart-builder/:datasetId` routes. The `?chart=<chartId>` query loads a saved chart for editing.
- Reused the existing chart specification, chart data builder, renderer, filters, aggregation, IndexedDB-backed saved visualization storage, and CSV export.
- Added saved-chart preview cards, chart search, edit and delete actions, and a route back to the library.
- Saving returns users to the chart library; editing loads the saved configuration rather than starting over.
- Added render coverage for the library and dedicated builder route.

## Verification
- `node_modules` is excluded from the release archive.
- Run `npm install`, `npm test`, and `npm run build` in Acode to verify the release on the target device.
