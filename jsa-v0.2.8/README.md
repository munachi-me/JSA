# JSA — JavaScript Analytics

**Version:** `0.2.8`  
**Type:** Browser-based data preparation and analytics application  
**Stack:** JavaScript, React 18, Vite 5, React Router, Vitest

JSA is a client-side workspace for importing tabular data, preparing it through a replayable transformation pipeline, exploring analyses and charts, generating rule-based insights, and assembling dashboards. Data stays in the user's browser; JSA does not require a JSA-hosted database or send datasets to a JSA backend.

## What's new in 0.2.8

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
- **Visualize:** bar, horizontal bar, line, area, pie, donut, scatter, histogram, stacked, grouped, table, and KPI chart types.
- **Insights:** rule-based data-quality observations, group comparisons, unusual values, concentration, correlation, and period-change insights. Statistical association is distinguished from causal explanation.
- **Dashboards:** arrange chart, KPI, text, and filter components on a responsive grid; import/export dashboard configuration; export static HTML or interactive, self-contained HTML.
- **Browser persistence:** datasets and workspace configuration are stored in IndexedDB in the current browser profile.

## Requirements

- Node.js 18 or newer is recommended.
- npm.
- A modern browser with JavaScript and IndexedDB support.

## Install and run

Run these commands from the extracted `jsa-v0.2.8` directory:

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
