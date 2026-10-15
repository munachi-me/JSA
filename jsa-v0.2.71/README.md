# JSA — JavaScript Analytics

**Version:** `0.2.71`  
**Type:** Browser-based data preparation and analytics application  
**Stack:** JavaScript, React 18, Vite 5, React Router, Vitest

JSA is a client-side workspace for importing tabular data, preparing it through a replayable transformation pipeline, exploring analyses and charts, generating rule-based insights, and assembling dashboards. Data stays in the user's browser; JSA does not require a JSA-hosted database or send datasets to a JSA backend.

## What's new in 0.2.71

- **Fix conditional rule condition removal:** the Remove condition button now works even when a rule has only one condition. Removing the final condition leaves an explicit empty state, and the Add condition button lets you add one back. A rule with no conditions remains invalid when applying the transformation, with validation explaining that at least one condition is required.

## Changes retained from 0.2.7

- **Rename columns:** rename a column from the dataset column table or the cleaning workflow. Column IDs remain stable so existing transformations continue to reference the same data. Empty and duplicate names are rejected.
- **Delete columns:** remove a column through a replayable cleaning step. The last remaining column cannot be deleted, and removing the step restores the column.
- **Conditional-column editor fixes:** clearer add/remove controls, accessible button labels, improved responsive layout, and validation feedback before a step is added to the pipeline.
- **Dataset selection:** switch between imported datasets directly from the Dataset page.
- **Responsive UI refinements:** improved mobile navigation, narrower-screen form layouts, touch-friendly controls, and column action wrapping.
- Retains conditional calculated columns, splitting, and combining introduced in 0.2.66; added regression tests for column rename/delete and their validation rules.

## Existing capabilities

- **Import and inspect:** CSV and JSON import, inferred column types, dataset profiling, data-quality information, and paginated data preview.
- **Prepare data:** replayable pipeline steps for filtering rows, removing or filling missing values, deduplication, text-case changes, text replacement, type conversion, rounding, arithmetic calculated columns, date-part extraction, outlier flagging, sorting, and conditional columns, split/combine columns, and rename/delete column operations.
- **Analyze:** descriptive statistics, grouping and aggregation, reusable saved analysis definitions, and KPI calculations.
- **Visualize:** bar, horizontal bar, line, area, pie, donut, scatter, histogram, stacked, grouped, table, and KPI chart types.
- **Insights:** rule-based data-quality observations, group comparisons, unusual values, concentration, correlation, and period-change insights. Statistical association is distinguished from causal explanation.
- **Dashboards:** arrange chart, KPI, text, and filter components on a responsive grid; import/export dashboard configuration; export static HTML or interactive, self-contained HTML.
- **Browser persistence:** datasets and workspace configuration are stored in IndexedDB in the current browser profile.

## Requirements

- Node.js compatible with Vite 5 (Node.js 18 or newer is recommended).
- npm.
- A modern browser with JavaScript and IndexedDB support.

## Install and run

Run these commands from the extracted `jsa-v0.2.7` directory:

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

1. Open the **Datasets** page and select the dataset you want to inspect. The dataset selector appears when multiple datasets are open.
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

Run `npm test` and `npm run build` in the project directory to verify the complete test suite and production build in your environment.

The release includes automated regression tests for rename/delete column behavior and validation. Run `npm test` and `npm run build` to verify this release in your environment; do not treat checks from earlier releases as proof that this release passed.

## License

JSA is distributed under the MIT License. See [`LICENSE`](./LICENSE).
