# JSA — JavaScript Analytics

**Version:** `0.2.66`  
**Type:** Browser-based data preparation and analytics application  
**Stack:** JavaScript, React 18, Vite 5, React Router, Vitest

JSA is a client-side workspace for importing tabular data, preparing it through a replayable transformation pipeline, exploring analyses and charts, generating rule-based insights, and assembling dashboards. Data stays in the user's browser; JSA does not require a JSA-hosted database or send datasets to a JSA backend.

## What's new in 0.2.66

- **Conditional calculated columns:** build ordered IF rules with a visual rule editor. Each rule can use one or more conditions combined with AND/OR, supports comparisons and missing-value checks, and provides a fallback value.
- **Split columns:** split a column by a chosen delimiter into 2–10 new columns, with optional whitespace trimming. The original column is retained.
- **Combine columns:** join two or more selected columns into a new column with a configurable separator and optional skipping of missing values.
- Added automated regression tests for conditional columns, splitting, combining, validation errors, and missing-value behavior.

## Existing capabilities

- **Import and inspect:** CSV and JSON import, inferred column types, dataset profiling, data-quality information, and paginated data preview.
- **Prepare data:** replayable pipeline steps for filtering rows, removing or filling missing values, deduplication, text-case changes, text replacement, type conversion, rounding, arithmetic calculated columns, date-part extraction, outlier flagging, sorting, and the conditional/split/combine operations introduced in this release.
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

Run these commands from the extracted `jsa-v0.2.66` directory:

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

## Data handling and limitations

- Transformations operate on derived copies. The original imported dataset is retained, and removing a pipeline step replays the remaining steps.
- Data and saved workspace content are stored locally in the browser using IndexedDB. Clearing browser site data or using another browser/profile can remove or separate that local workspace.
- Static HTML exports are snapshots. Interactive HTML exports embed the selected source columns and rendered dashboard logic; anyone with the exported file may inspect embedded data. Review exports for sensitive information before sharing.
- Interactive exports run locally in the exported file; they do not provide authentication, access control, or a live database connection.
- Large datasets and long-running analyses are processed in the browser. Performance depends on the device and dataset size.
- JSA is not a hosted publishing service, and dashboard exports are not a replacement for access-controlled production reporting.

## Tests and verification

Run `npm test` and `npm run build` in the project directory to verify the complete test suite and production build in your environment.

For this release, the new transformation modules passed Node.js syntax checks and targeted core smoke checks in the packaging environment. The full Vitest suite and Vite production build could not be rerun here because the dependency installation was blocked by an unavailable npm registry package. The project owner reported that all tests passed for the previous `0.2.65` release; that result is separate from verification of this release.

## License

JSA is distributed under the MIT License. See [`LICENSE`](./LICENSE).
