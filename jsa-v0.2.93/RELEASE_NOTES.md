# JSA v0.2.92 — Global Export Menu & Dataset Downloads

## Global Export & Publish menu
- Replaced the disabled navbar placeholder with an accessible, context-aware dropdown.
- Menu exports the current cleaned dataset or untouched original import as CSV or JSON.
- CSV exports use visible column names, preserve quoting/newlines, and neutralize spreadsheet formula injection in text values.
- JSON exports are plain arrays of named row objects, compatible with JSA's JSON import workflow.
- On Analysis, Charts, and Dashboards pages, the menu can jump to the page's existing export controls.
- Online publishing is clearly marked as not yet available; no fake publishing action is exposed.

## Chart data export
- Added **Export plotted data (CSV)** for the current chart preview.
- Supports category, multi-series, scatter, histogram, table, and KPI chart data.

## Technical notes
- Original imported data remains separate from the cleaned working dataset; exports select the correct version.
- Added unit tests for dataset CSV/JSON and chart-data CSV export helpers.
- `node_modules` is intentionally excluded. Run `npm install` locally before testing.


# JSA v0.2.93 — Import Reliability & Workflow Feedback

## Import reliability
- File reading failures are caught and shown as actionable in-app errors instead of becoming unhandled promise rejections.
- Sample dataset loading now handles failed HTTP responses and network/fetch exceptions with a visible message.
- A missing file selection safely does nothing; supported file and 25 MB size checks remain in place.

## Workflow feedback
- Import actions are temporarily disabled while a file or sample is being prepared, preventing accidental repeated imports.
- A live status message tells users when JSA is reading and preparing a dataset.
- Existing import validation errors remain visible on the Home page.

## Verification notes
- `node_modules` is not included. Run `npm install`, `npm test`, and `npm run build` in Acode.
