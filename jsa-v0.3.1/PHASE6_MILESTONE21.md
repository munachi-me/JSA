# Phase 6 — Milestone 21: Dataset Explorer UI (v0.3.01)

## User-facing changes
- Redesigned the Dataset page header with a clear workspace breadcrumb, dataset name, supporting description, dataset switcher, and direct Clean data action.
- Added summary cards for row count, column count, missing cells, and duplicate rows.
- Added a contextual banner when the dataset includes cleaning steps, linking directly to the cleaning workflow.
- Refreshed the column schema table with searchable column names, clearer type labels, field IDs, compact action buttons, and a responsive horizontal-scroll treatment.
- Refreshed the data preview and pagination controls, including a row-number column and mobile-friendly pagination layout.
- Preserved type overrides, rename/delete column actions, warnings, data quality notices, dataset switching, and dataset deletion.

## Compatibility
- Uses the existing DatasetContext, profile and descriptive-statistics helpers, dialogs, and route structure.
- Existing dataset state and IndexedDB persistence behavior are unchanged.
- `node_modules` is intentionally excluded from release archives.

## Verification
- Run `npm install`, `npm test`, and `npm run build` in the target environment.
