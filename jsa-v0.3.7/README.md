# JSA — JavaScript Analytics

**Version:** `0.3.5`  
**Type:** Browser-based data preparation and analytics application  
**Stack:** JavaScript, React 18, Vite 5, React Router, Vitest

JSA is a client-side workspace for importing tabular data, preparing it through a replayable transformation pipeline, exploring analyses and charts, generating rule-based insights, and assembling dashboards. Data stays in the user's browser; JSA does not require a JSA-hosted database or send datasets to a JSA backend.

## What's new in 0.2.81

- **Custom dialogs:** branded in-app alert, confirmation, and text-input dialogs replace native browser alert/confirm/prompt popups for dataset, column, dashboard, and pipeline actions. Dialogs support Escape/close, clear action labels, and mobile-friendly layouts.
- **Trim whitespace:** remove leading/trailing spaces in a text column; whitespace-only values become missing.
- **Normalize whitespace:** trim text and collapse repeated whitespace between words.
- **Standardize missing markers:** convert configurable comma-separated text markers such as `N/A`, `NULL`, `-`, or `--` to actual missing values. Matching ignores case and surrounding spaces.
- **Safe, reversible preparation:** each operation is added to the existing replayable cleaning pipeline, preserving the original imported data.
- **Regression coverage:** tests cover the new data-preparation operations and their validation behavior.

Version 0.2.73 added pipeline reordering and row-count impact summaries. Version 0.2.72 added clearer dataset selection and responsive refinements.

## Existing capabilities

- **Import and inspect:** CSV and JSON import, inferred column types, dataset profiling, data-quality information, and paginated data preview. Text values retain their original whitespace so it can be inspected and cleaned deliberately; recognized missing markers are still detected during import.
- **Prepare data:** replayable pipeline steps for filtering rows, removing or filling missing values, deduplication, trimming and normalizing whitespace, standardizing missing markers, text-case changes, text replacement, type conversion, rounding, arithmetic calculated columns, date-part extraction, outlier flagging, sorting, conditional calculated columns, splitting and combining columns, and renaming or deleting columns.
- **Analyze:** descriptive statistics, grouping and aggregation, reusable saved analysis definitions, and KPI calculations.
- **Visualize:** a searchable saved-chart library and dedicated Chart Builder for bar, horizontal bar, line, area, pie, donut, scatter, histogram, stacked, grouped, table, and KPI chart types. Saved charts can be edited and reused in dashboards.
- **Insights:** rule-based data-quality observations, group comparisons, unusual values, concentration, correlation, and period-change insights. Statistical association is distinguished from causal explanation.
- **Dashboards:** arrange chart, KPI, text, and filter components on a responsive grid; import/export dashboard configuration; export static HTML or interactive, self-contained HTML.
- **Browser persistence:** datasets and workspace configuration are stored in IndexedDB in the current browser profile.

## Requirements

- Node.js 18 or newer is recommended.
- npm.
- A modern browser with JavaScript and IndexedDB support.

## Install and run

Run these commands from the extracted `jsa-v0.3.5` directory:

```bash
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm test` | Run the Vitest test suite once. |
| `npm run test:core` | Run the core smoke test file. |

## Reordering cleaning steps

On **Clean data**, the pipeline runs from top to bottom. Use the up and down arrow controls beside a step to move it one position. The first step cannot move up, and the last step cannot move down. JSA replays the complete pipeline from the original imported data after a reorder; because order matters, review each step's status and summary afterward. When a successful step changes the row count, the pipeline also shows its before-and-after row totals.

## Custom dialogs

JSA uses its own accessible dialog design for alerts, confirmations, and text input instead of native browser popups. Use the visible action buttons to proceed or cancel; Escape and the close button dismiss a dialog.

## Advanced data preparation

On **Clean data**, select **Trim whitespace**, **Normalize whitespace**, or **Convert text markers to missing values**. Configure the target text column and preview the result before adding the step. These steps are replayed in pipeline order and can be reordered or removed without changing the original import.

## Selecting a dataset

When multiple datasets are open, use the **Dataset to view** selector on the Datasets page or the relevant analysis page. Each option shows its position in the open-dataset list, name, row count, and column count to help distinguish datasets with similar names. The selector appears only when more than one dataset is open.

## Using conditional calculated columns

1. Open **Clean data** for an imported dataset.
2. Choose **Add conditional column (IF rules)**.
3. Enter a name for the new column.
4. Add IF rules in priority order. For each rule, choose a column, condition, comparison value when required, and THEN result.
5. Add extra conditions to a rule and choose **All conditions (AND)** or **Any condition (OR)**.
6. Set the fallback value for rows that match no rule. Leave it blank to create missing values.
7. Preview the transformation, then add the step to the pipeline.

Conditions include equals, does not equal, contains, does not contain, numeric/date comparisons, is missing, and is not missing. Rules are evaluated from top to bottom; the first matching rule wins. Comparison operators do not match missing values, except the explicit missing-value operators.

## Renaming and deleting columns

1. Open the **Datasets** page and select the dataset you want to inspect.
2. In the **Columns** table, choose **Rename** to enter a new column name or **Delete** to remove that column.
3. Column changes are recorded as cleaning steps, so they can be reviewed and undone from **Clean data** by removing the relevant step.
4. JSA prevents empty or duplicate column names and prevents deleting the final remaining column.

You can also select **Rename column** or **Delete column** from the **Clean data** operation list and preview the step before adding it.

## Data handling and limitations

- Transformations operate on derived copies. The original imported dataset is retained, and removing a pipeline step replays the remaining steps.
- Data and saved workspace content are stored locally in the browser using IndexedDB. Clearing browser site data or using another browser/profile can remove or separate that local workspace.
- Static HTML exports are snapshots. Interactive HTML exports embed the selected source columns and rendered dashboard logic; anyone with the exported file may inspect embedded data. Review exports for sensitive information before sharing.
- Interactive exports run locally in the exported file; they do not provide authentication, access control, or a live database connection.
- Large datasets and long-running analyses are processed in the browser. Performance depends on the device and dataset size.
- JSA is not a hosted publishing service, and dashboard exports are not a replacement for access-controlled production reporting.

## Tests and verification

Run `npm test` and `npm run build` in the project directory to verify the complete test suite and production build. The suite includes pipeline-ordering regression tests and a render check for the multi-dataset selector. Run both commands locally before relying on a release build.

## License

JSA is distributed under the MIT License. See [`LICENSE`](./LICENSE).


## v0.2.83 — Analysis Result Export

Grouped analysis results can now be exported as CSV directly from the Analysis page. Exports include column headings and safely escape commas, quotes, and line breaks. The downloaded CSV uses UTF-8 with BOM for improved spreadsheet compatibility.


## v0.2.83
Numeric column profiling now includes a histogram with eight equal-width bins, count labels, bin-range tooltips, and handling for constant or empty numeric columns. See `RELEASE_NOTES.md`.

## v0.2.84 — Export & Reporting Pack

Analysis results now support three complementary exports:
- **CSV:** result rows and named column headers for spreadsheet use. Text values beginning with spreadsheet formula markers are neutralized.
- **JSON report:** dataset metadata, analysis settings, row counts, result column names, warnings, and result rows in a versioned report schema.
- **Markdown summary:** a readable report table and run metadata suitable for documentation and GitHub.

Export actions are available after a successful analysis run. Reports describe the currently displayed result; rerun the analysis after changing settings to refresh it.


## Current release: v0.2.9

This release improves the dashboard builder on mobile, adds an explicit contextual settings panel, strengthens element sizing/overflow behavior, and supports separate chart-linked table cards. See `RELEASE_NOTES.md` and `PHASE6_MILESTONE14.md`.


## v0.2.91
Dashboard chart sizing and sorting controls, show-values settings, compact KPI/filter components, desktop side-panel settings, mobile settings popup, and styled Analysis Group by controls. Charts fit their component area by default; expanding “Show data as table” enables scrolling. Install dependencies locally with `npm install`; node_modules is not included.


### v0.2.91 UI refinement (revised)


## Current release: v0.2.92

The navbar's **Export & Publish** item is now a context-aware dropdown. Export the untouched original dataset or the current cleaned dataset as CSV/JSON, and export the current chart preview's plotted data as CSV. On Analysis, Charts, and Dashboards pages, the menu links to relevant page-specific export controls. Online publishing is labeled as coming later because hosted share links are not implemented yet.

CSV exports preserve visible column names and quote values safely; formula-like text is neutralized. JSON exports use arrays of named row objects so they can be imported again. Run `npm install`, `npm test`, and `npm run build` locally; dependencies are not bundled.


## Current release: v0.2.93

Import workflows now handle file-reading and sample-data loading failures more clearly. JSA also shows an in-progress status and prevents repeated import clicks while a dataset is being prepared. Install dependencies locally with `npm install`; `node_modules` is not included.


## Current release: v0.3.0

The JSA UI refresh starts with a redesigned workspace shell and an adaptive Home dashboard. New workspaces see a lightweight onboarding experience with subtle feature discovery; returning users with datasets restored from IndexedDB see a quieter workspace-focused dashboard, saved-work status, quick workflow actions, and their recent datasets. The global Export & Publish dropdown now renders outside the scrolling navigation so it is not clipped or hidden inside the navbar, including on mobile. Core analytics and data workflows are preserved. Run `npm install`, `npm test`, and `npm run build` locally; dependencies are not bundled.

## Current release: v0.3.01

The Dataset Explorer now has a redesigned responsive layout, dataset summary cards, searchable column schema, clearer column actions, and a refreshed record preview with pagination. Existing dataset operations are preserved. See `RELEASE_NOTES.md` and `PHASE6_MILESTONE21.md`. Run `npm install`, `npm test`, and `npm run build` locally; dependencies are not bundled.


## Current release: v0.3.2

The Clean workspace has a redesigned responsive interface for building and reviewing data-preparation pipelines. It adds clear row and pipeline summaries, a guided transformation builder, a more legible ordered pipeline, step status and row-change summaries, and easier touch controls for reordering or removing steps. The cleaning behavior and non-destructive pipeline model are preserved. See `RELEASE_NOTES.md` and `PHASE6_MILESTONE22.md`. Run `npm install`, `npm test`, and `npm run build` locally; dependencies are not bundled.


### v0.3.3 UI update
The Analysis page uses the compact Data Workspace header pattern, with dataset switching and direct links to cleaning and charts. The Dataset Explorer now has a dedicated, polished no-dataset state with instructions tailored to importing data and inspecting columns/records. The Clean Data header now follows the same compact Dataset Explorer style, with the active dataset name, dataset switching, and direct links to Dataset Explorer and Analysis. Existing data workflows are preserved.


## Current release: v0.3.5 — Dedicated Chart Builder
The Charts page is now a searchable visualization library, while chart creation has its own `/chart-builder/:datasetId` route. Create new charts, edit saved configurations, preview changes live, validate required settings, and save back to the library. Saved chart cards include a preview and actions to edit, delete, or open dashboards. Existing chart specifications, chart-data processing, filters, renderer, IndexedDB-backed storage, and CSV export are reused. Run `npm install`, `npm test`, and `npm run build` locally; dependencies are not bundled.

## Current release: v0.3.6

The Insights page now follows the compact Data Workspace header pattern and includes finding summary cards, clearer New/Saved/Dismissed navigation, responsive filters, collapsible numeric-summary settings, and an improved empty state. Existing insight generation and save/dismiss/restore/chart/dashboard actions are preserved. The Clean Data page now uses the Calculator icon for its Analysis shortcut, distinct from the Charts icon. Run `npm install`, `npm test`, and `npm run build` locally; dependencies are not bundled.


## Current release: v0.3.7 — Dashboard Workspace UI
The Dashboards page now uses a responsive dashboard library with summary cards, dashboard cards, a guided empty state, and a clearer create/import panel. The dashboard editor has a more consistent workspace header. The Charts library now links directly to Insights and Dashboards, and the dashboard library/editor link to Insights for saving findings that can be added to a dashboard. Existing dashboard components, filters, save/validation behavior, and exports are preserved. Run `npm install`, `npm test`, and `npm run build` locally; dependencies are not bundled.
