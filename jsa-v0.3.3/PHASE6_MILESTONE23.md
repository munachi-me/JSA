# Phase 6 — Milestone 23: Workspace UI Corrections (v0.3.3)

## Scope
This revision corrects two UI details in the v0.3.3 workspace refresh.

## Changes
- Dataset Explorer: replaced the plain `No dataset open` text with the shared responsive empty-state card. The copy now explains how to import a CSV/JSON or load sample data and what will become available once a dataset is open.
- Clean Data: replaced the oversized “Shape your data. Keep the signal.” header with the compact Data Workspace header pattern used by Dataset Explorer. It displays the active dataset name, consistent breadcrumb styling, the dataset picker when multiple datasets are open, and links to Dataset Explorer and Analysis.
- Analysis page changes from the initial v0.3.3 release are retained.
- Cleaning, dataset inspection, and analysis logic remain unchanged.

## Verification
The ZIP should be tested in Acode with `npm install`, `npm test`, and `npm run build`. Dependencies are not included in the archive.
