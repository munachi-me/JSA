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

# JSA v0.3.0 — Workspace UI Foundation (revised)

## Major UI refresh begins
- Reworked the app shell with a branded navigation rail, clearer section grouping, updated active states, and a privacy-oriented footer.
- Added a contextual workspace header showing the current area, a short description, local-workspace status, and dataset count.
- Made Home adaptive: new workspaces get onboarding and subtle feature discovery; returning users with datasets restored from IndexedDB get a quieter workspace-focused dashboard, saved-work status, quick actions, and recent datasets.
- Fixed Export & Publish visibility by rendering its dropdown in a viewport-level portal, outside the navbar's clipping/scrolling container, with viewport-aware positioning for desktop and mobile.
- Introduced a consistent dark visual foundation with larger cards, more generous spacing, responsive navigation, mobile-first layouts, and reduced-motion handling.

## Compatibility and testing
- Existing feature pages, routes, data workflows, and export controls remain in place.
- `node_modules` is not bundled. Run `npm install`, `npm test`, and `npm run build` in Acode before using the release.

# JSA v0.3.01 — Dataset Explorer UI

- Introduced a refreshed Dataset page header, quick Clean data action, and more prominent dataset switcher.
- Added at-a-glance summary cards for rows, columns, missing cells, and duplicate rows.
- Added a searchable column schema with clearer data-type controls and more compact Rename/Delete actions.
- Refined the data preview table, row numbering, page controls, and mobile layouts.
- Preserved dataset type overrides, column rename/delete behavior, import warnings, quality notices, dataset switching, and deletion.
- See `PHASE6_MILESTONE21.md` for the release scope. Install dependencies and run the full tests/build locally before using this release.


# JSA v0.3.2 — Clean Workspace UI

## Clean page redesign
- Rebuilt the Clean page into a responsive data-preparation workspace with a clear page header, dataset picker, and navigation to Dataset Explorer and Analysis.
- Added summary cards for imported rows, current rows, pipeline steps, and available transformation operations.
- Redesigned the step builder with clearer operation selection, improved form spacing, and a visible reminder that the original import remains unchanged.
- Redesigned the pipeline as an ordered sequence with applied/skipped status, transformation summaries, row-count changes, and touch-friendly reorder/remove controls.
- Added an intentional empty state to guide first-time cleaning, plus a clearer reset action when steps exist.
- Preserved existing transformation, preview, apply, reorder, remove, reset-confirmation, and dataset-selection behavior.

## Verification
- ZIP structure and required release files checked. Full test/build verification was not run in this packaging environment; run `npm install`, `npm test`, and `npm run build` in Acode.
- `node_modules` is intentionally excluded. MIT `LICENSE` is included.


## v0.3.3 — Workspace UI Refinements
- Updated the Analysis page to use the compact Dataset Explorer-style workspace header.
- Added quick access to Clean Data and Charts while retaining the dataset picker.
- Reworked the Dataset Explorer's no-dataset state into a polished onboarding panel with a clear import/open-data action and copy specific to inspecting data.
- Replaced the Clean Data page's oversized introductory header with the compact Dataset Explorer header pattern, showing the current dataset name, dataset picker, and quick links to Dataset Explorer and Analysis.
- Added responsive layout refinements for mobile screens while preserving cleaning and analysis behavior.


## v0.3.4 — Chart Studio UI Refresh
- Replaced the Charts page's oversized title block with the compact Dataset Explorer-style workspace header and dataset picker.
- Added at-a-glance cards for the selected chart type, active data source, and saved chart count.
- Reorganized chart configuration and live preview into clearly labeled panels, with improved spacing and responsive controls.
- Redesigned the saved-chart library as responsive cards with chart type, description, edit action, and delete control.
- Added a guided empty state for the saved-chart library.
- Preserved chart configuration, filters, appearance controls, save/update, save-as-new, plotted-data CSV export, and existing chart rendering behavior.

## Verification
- ZIP integrity and release structure checked. Full tests/build must be verified in Acode if dependency installation is unavailable in this environment.
- `node_modules` is intentionally excluded. MIT `LICENSE` is included.
