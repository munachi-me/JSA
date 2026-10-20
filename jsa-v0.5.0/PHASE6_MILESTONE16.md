# Phase 6 — Milestone 16: Global Export Menu

JSA now has a global Export & Publish dropdown in the navbar. It exports the untouched original import or the current cleaned dataset to CSV/JSON, and links users to existing analysis, chart, and dashboard export controls when relevant. Chart previews can also export their plotted values as CSV. Hosted publishing remains explicitly out of scope until hosting and sharing rules are designed.

## Safety and data correctness
- CSV values use the existing spreadsheet-formula neutralization and quoting logic.
- JSON uses visible column names and row objects to support re-importing.
- Original exports use the untouched source data; cleaned exports use the successful pipeline result.

## Verification
Run `npm install`, `npm test`, and `npm run build` in the project environment. `node_modules` is not distributed.
