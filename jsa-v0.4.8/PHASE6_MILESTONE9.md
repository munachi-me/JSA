# Phase 6 — Milestone 9: Export Validation and Edge-Case Reliability

**Release:** `0.2.65`  
**Track:** Export-related maintenance release (continuation of the 2.6 export series)

## Changes

- Improved static vertical bar charts so negative values render below the zero baseline instead of disappearing.
- Updated horizontal bar styling to represent negative values to the left of the zero marker and positive values to the right.
- Added regression coverage for negative, zero, positive, and missing numeric values in a static chart export.
- Added regression coverage for clear errors when an export request is missing its required dataset/dashboard arguments.
- Retained responsive layout, print / Save as PDF styling, chart names, KPI names, and accessible list/listitem semantics from the previous release.

## Validation notes

- JavaScript syntax checks should be run for the updated exporter and test file.
- Run `npm run test` and `npm run build` in the project environment before publishing.
- This release adds regression checks and safer signed-value rendering; it does not claim an automated real-browser matrix. For manual compatibility checks, open both exported HTML formats in current Chrome, Firefox, and Edge, then verify filtering (interactive export), mobile-width layout, and Print / Save as PDF.
