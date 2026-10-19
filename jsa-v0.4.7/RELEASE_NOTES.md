# Release Notes

## v0.4.7 — HTML Chart Export Refinements

- Fixed static and interactive HTML line/area charts to display readable vertical-axis tick values.
- Exported line/area charts now show horizontal and vertical axis titles, using custom titles when set and sensible column/measure labels as fallbacks.
- Preserved chronological January–December ordering for month-name categories when chart sorting is set to Automatic. Explicit user-selected label/value sorting remains respected.
- Improved exported line/area value labels so the Dashboard Builder “Show data values on chart” setting is reflected in the exported chart and labels stay within the plotting area.
- Added regression coverage for axis titles, y-axis ticks, month ordering, and data-value labels in both export modes.

# JSA Release Notes

## v0.4.5 — Interactive KPI Editing & Cleaning Operation Library

- Existing saved KPI cards are now clickable to load their saved definition into the KPI editor. Edit the name, description, aggregation, column, numerator/denominator filters, display format, decimal precision, target, and target direction, then save without recreating the KPI.
- KPI edits preserve the existing KPI ID, so dashboards and other components that reference it continue to resolve the updated definition. Invalid definitions are rejected before saving, and saved KPI changes persist through the existing browser storage workflow.
- The Analysis page distinguishes reusable saved KPI definitions from one-off measures configured inside a grouped analysis.
- The Clean Dataset page's Operations card now opens a searchable library of available transformations. Selecting an operation loads it into the existing step builder, where its settings can be configured, previewed, and applied as a normal pipeline step.
- Reduced the selected-stage inspector's summary information and refocused it on the selected operation, its result, saved parameters, and the read-only dataset snapshot. Removed unrelated comparisons to the original/current dataset and the separate column-profile table.
- MIT license included; `node_modules` excluded. Run `npm install`, `npm test`, and `npm run build` to validate locally.

## v0.4.1 — Date & Time Analytics + Direct Column Positioning (revised)

- Fixed direct column positioning regression coverage: moving a column to position 2 now verifies the expected 1-based order while preserving the relative order of the other columns.
- Date-only columns are stored as `YYYY-MM-DD` and remain date-only in the preview/export path; datetime columns continue to retain their full ISO datetime and time-zone normalization.
- Ambiguous slash dates such as `12/10/2010` follow month-first interpretation, matching the expected `2010-12-10` result; unambiguous day-first dates such as `31/01/2024` are still supported.
- Replaced the crowded row of column action buttons with a compact Options dropdown. Reorder, direct position, numeric precision, rename, and delete are grouped inside it; individual actions use accessible icons and labels.

- Expanded date parsing to support ISO dates/datetimes, slash/dot dates, month-name dates, and common slash-date datetime values. Ambiguous slash dates use month-first interpretation; unambiguous day-first dates such as 31/01/2024 remain supported.
- Time-only columns are recognized and normalized to `HH:mm:ss`; date, time, and datetime columns can use the Extract date/time part transformation.
- Added extraction for year, quarter, month number/name, ISO week number, day, weekday name/number, calendar date, hour, minute, and time.
- Month-name and weekday-derived columns carry calendar-order metadata, so row sorting and chart categories can follow conventional order instead of alphabetical order.
- Dataset Explorer now allows entering a target column position (1-based) and moving the column there in one pipeline step, alongside the existing one-position Left/Right controls.
- Added regression tests for flexible parsing, date/time extraction, natural ordering metadata, and direct column repositioning.
- MIT license included; `node_modules` excluded. Run `npm install`, `npm test`, and `npm run build` to validate locally.

## v0.4.0 — Advanced Data Preparation & Column Control

- Split columns now let you name every output column before adding the transformation. Names are validated for blanks, duplicates, and collisions.
- Dataset Explorer includes left/right column-order controls that record reversible pipeline steps.
- Numeric columns support configurable display precision from 0 to 10 decimal places. This changes display formatting, not underlying values or calculations.
- Analysis result tables include a decimal-place selector for aggregated output display. CSV exports retain full calculated numeric values to avoid lossy rounding.
- Updated column controls for narrow screens.

# JSA v0.3.8 — Dashboard Components & Analysis UI Polish

## Responsive dashboard editor revision
- Reworked the component settings experience after the initial v0.3.8 pass: desktop keeps a dedicated side panel, tablet uses a right-side drawer, and phones use a bottom-sheet editor with its own scroll area.
- Prevented settings controls from squeezing the dashboard canvas or overflowing narrow screens. Inputs, selects, checkboxes, position/size fields, and action buttons now resize to the available width.
- Improved component headers and the add-component toolbar for small screens, including narrower phones.
- Kept the existing dashboard data model, component actions, filtering, layout, export behavior, and Analysis UI updates intact.

## Dashboard editor styling
- Refined dashboard component containers, selected/hover states, drag and resize controls, KPI/text elements, settings panel, add-component toolbar, and empty dashboard canvas.

## Analysis UI
- Refined profile/correlation cards, frequency bars, KPI builder, group-and-compare controls, export controls, and saved analysis list.

## Validation
- ZIP integrity check passed; MIT license is included and `node_modules` is intentionally excluded.
- Manual core-transform checks and JSX syntax checks passed. Full Vitest tests and production build could not run here because dependency installation did not complete; run `npm install`, `npm test`, and `npm run build` to finish validation.


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


# JSA v0.3.5 — Dedicated Chart Builder

- Split chart creation from the Charts library into a dedicated Chart Builder route.
- Added a clear builder header, dataset switcher, back/cancel navigation, live preview, and save/update/save-as-new actions.
- Saved charts can be searched, previewed, edited, deleted, and linked to a dashboard from the library.
- Editing a saved chart opens its saved specification in the builder. Saving returns to the library.
- Reused the existing chart specification, chart-data builder, renderer, filters, aggregation, browser persistence, and CSV export.
- Added render tests for the Charts library and dedicated builder route.

## Verification
- ZIP integrity checked after packaging. Full test/build verification depends on installing dependencies in Acode.
- `node_modules` is intentionally excluded. MIT `LICENSE` is included.

# JSA v0.3.6 — Insights Workspace UI & Navigation Icon Polish

## Insights workspace
- Replaced the oversized title-first layout with the compact Data Workspace header used by Dataset Explorer and Clean Data.
- Added summary cards for new findings, saved findings, dismissed findings, and quality signals.
- Organized status tabs, finding-type filters, dashboard targeting, and numeric summary settings into clearer responsive controls.
- Improved the empty state, skipped-check disclosure, and insight card spacing while preserving save, unsave, dismiss, restore, save-as-chart, and add-to-dashboard actions.
- Kept rule-based insight generation and existing insight/chart/dashboard storage behavior intact.

## Icon consistency
- Changed the Clean Data page's Analysis shortcut from the chart icon to the Calculator icon used for Analysis in the main navigation, distinguishing analytical tools from Charts.

## Verification
- `node_modules` is intentionally excluded. Run `npm install`, `npm test`, and `npm run build` locally.


## v0.3.7 — Dashboard Workspace UI & Insights Navigation
- Redesigned the Dashboards library with a compact Data Workspace header, dataset picker, and direct links to Charts and Insights.
- Added workspace summary cards for saved dashboards, charts, and KPIs.
- Replaced the plain dashboard list with responsive dashboard cards showing descriptions, component counts, update dates, delete actions, and a clear open action.
- Added a guided empty state and a dedicated create/import panel while preserving the existing new-dashboard and configuration-import workflows.
- Refreshed the dashboard editor header and action bar while keeping component editing, filter behavior, validation, save, and static/interactive exports intact.
- Added an Insights shortcut to the Charts library header and dashboard editor, where users can save findings for use in dashboards.
- Kept navigation controls responsive on mobile.

## Verification
- ZIP integrity checked after packaging. Run `npm install`, `npm test`, and `npm run build` in Acode for full verification.
- `node_modules` is intentionally excluded. MIT `LICENSE` is included.


# JSA v0.3.8 — Dashboard Components & Analysis UI Polish

- Refined dashboard element containers, selection states, drag handles, resize affordances, and component action controls.
- Redesigned the component settings panel with clearer field hierarchy and responsive controls.
- Improved the dashboard add-element toolbar, KPI/text elements, and empty canvas presentation.
- Refreshed the Analysis page's profiling and correlation components, Key Metrics, KPI definition, Group and Compare builder, export controls, and saved analyses list.
- Preserved existing functionality and data structures; this is a UI-focused release.
- `node_modules` is not bundled. Run `npm install`, `npm test`, and `npm run build` locally.

# JSA v0.4.2 — Column Settings, KPI Precision & Advanced Filtering

- Replaced the in-cell column actions dropdown with a single reusable settings popup that updates for the selected column, keeping the column information table from expanding or scrolling vertically when actions open.
- KPI definitions now let users choose 0–10 decimal places for decimal numbers, currency (USD), and percentages. Saved KPIs retain their selected precision.
- Date/time extraction now accepts a custom output column name. Month names and weekdays can be extracted in long form (January, Monday) or short form (Jan, Mon); short names retain natural chronological ordering in sorting and charts.
- Strengthened chronological sorting for date, datetime, and time values, including ascending/descending behavior with missing values kept last. Short month and weekday labels sort naturally.
- Added “does not contain” and “ends with” text-filter operators.
- Analysis measures can each have their own independent filter conditions and all/any matching mode.
- Added regression coverage for the new filters, sorting, measure filters, KPI formatting, and date/time extraction.
- `node_modules` is intentionally excluded; MIT `LICENSE` is included. Run `npm install`, `npm test`, and `npm run build` locally for full verification.


### v0.4.2 test-fix revision
- Corrected the does-not-contain test expectation: both `West` and `North` do not contain the letter `a`, so both correctly match.
- Restored backward-compatible default KPI formatting when no precision is saved: percentages default to up to 2 decimal places, currencies use the locale currency default, and numbers show up to 3 decimal places without unnecessary trailing zeros. Explicit user-selected precision remains fixed and is respected.


# JSA v0.4.3 — Transformation Preview & Pipeline History

- Fixed the Dataset Explorer column Options panel overlapping the Rename prompt and Delete confirmation. The options panel closes first; the in-app dialog then opens independently.
- Transformation previews now show a read-only output table of up to 25 rows and the resulting row/column counts before a step is added. Previewing does not alter the current dataset or pipeline.
- Added an Inspect stage action to each pipeline step. It reconstructs the historical dataset from the untouched import through the selected step, displays a snapshot of up to 25 rows, shows row/column counts, and lists the saved transformation parameters.
- Historical inspection is read-only and does not change the active dataset or pipeline.
- `node_modules` is intentionally excluded; MIT `LICENSE` is included. Run `npm install`, `npm test`, and `npm run build` locally for full verification.

# JSA v0.4.4 — Final Pipeline Inspector Refinements

- Moved **Inspect stage** into each pipeline step's control group beside Move up, Move down, and Delete. The eye icon indicates when that stage is selected.
- The read-only stage inspector now opens directly underneath the selected pipeline step instead of below the entire pipeline.
- Expanded stage details with the pipeline position, operation name/type, dataset name, row/column comparisons, saved parameters, and a per-column profile showing type, non-empty values, missing values, and distinct values.
- Expanded the snapshot table to clarify its read-only status and show the visible row count against the total rows. Empty strings and null values are labelled distinctly.
- Historical inspection still reconstructs the selected stage from the original import and does not modify the active dataset.
- `node_modules` is intentionally excluded; MIT `LICENSE` is included. Run `npm install`, `npm test`, and `npm run build` locally for full verification.


## v0.4.6 — KPI Experience Redesign & Currency Column Type

- Redesigned Define KPI and Edit KPI as a responsive configuration workspace with clearer sections for identity, calculation, and presentation.
- Added a live KPI preview based on the current dataset and unsaved settings.
- Added currency selection to KPI formatting (USD, NGN, GBP, EUR, INR, CAD, AUD, and JPY). Existing KPI definitions default to USD for backward compatibility.
- Added `currency` as a column data type. Currency values are treated as numeric for profiling, aggregation, filtering, and analysis. Common currency symbols and ISO codes are supported during parsing.
- Currency-typed numeric columns use the existing numeric analysis pipeline and remain compatible with saved dashboards and analyses.
- Added regression tests for currency inference, coercion, and KPI formatting.

Verification note: run `npm install`, `npm test`, and `npm run build` in the target environment before treating the release as fully verified.
