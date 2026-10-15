# JSA v0.2.72 — Responsive UI & Stability

## Changes

- Improved the dataset selector's accessibility and clarity.
- Dataset options now show their position, name, row count, and column count to distinguish similarly named datasets.
- Reset dataset preview pagination when switching datasets and clamp the page when row counts change.
- Added responsive layout refinements for small screens, scrollable data tables, dataset controls, pipeline labels, and touch interactions.
- Added a render regression test for dataset selection when multiple datasets are open.

## Verification

The full automated test suite and production build must be run with `npm test` and `npm run build`. Do not claim they passed unless those commands complete successfully.
