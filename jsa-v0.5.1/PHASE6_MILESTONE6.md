# JSA Phase 6 — Milestone 6: Interactive Dashboard Export (Client-Side Preview)

## What changed

- Added **Export interactive HTML** beside the existing static HTML export.
- Added an export selection dialog so the user explicitly chooses which dataset columns are embedded. Select-all and select-none actions are available.
- The generated HTML is self-contained and runs locally without a server or external library.
- Dashboard categorical filters, numeric ranges, and date ranges filter rows client-side. Charts and KPI components recalculate from the filtered rows.
- Chart/KPI component names and filter names use their saved chart/KPI names and source column names.
- Added a visible privacy warning that states the selected row-level data is embedded and can be inspected by anyone who receives the HTML file. The export also identifies missing component dependencies when required columns were excluded.
- Added responsive styling, a reset-filters action, a filtered-row counter, and Print / Save as PDF.
- Added a regression test for the interactive export, selected-column behavior, filter/KPI runtime generation, and the privacy warning.

## Supported in this first client-side milestone

- Dropdown filters for categorical/text/boolean columns.
- Min/max controls for numeric columns and date bounds for date columns.
- Recalculation for common aggregate KPIs and category charts; table, scatter, and histogram components render filtered results.
- Analysis-based category charts are recalculated from the saved analysis definition when the required source columns are included.
- No external libraries, live database connection, authentication, or server-backed publishing are used.

## Important boundaries

- Exported data is embedded as readable JSON in the HTML. The privacy notice is not encryption or access control.
- Excluded source columns intentionally cause affected components to show missing-data messages. The user can choose a smaller data payload, but should keep columns required by components they expect to work.
- This is an initial client-side renderer, not yet pixel-identical to JSA's in-app chart renderer. Some specialized chart presentation details (for example, pie/donut visuals, date time-grain behavior, and advanced series styling) are simplified in the standalone HTML.
- Large datasets can create large HTML files and slow browser startup. The export dialog warns when the estimated number of embedded cells exceeds 500,000; no worker or streaming serializer is implemented yet.
- Do not treat a local HTML file as secure publishing. Anyone with the file can inspect its embedded data.

## Verification

- `node --check src/core/dashboard/interactiveExport.js` passed.
- `node --check src/core/dashboard/staticExport.js` passed.
- `node --check src/tests/phase6-workflow.test.js` passed.
- Direct Node smoke test generated the interactive HTML, verified interactive filtering/KPI/privacy content, checked omitted-column messaging, and passed `node --check` on the generated inline runtime script.
- Full Vitest suite and Vite production build were not run because dependencies (including Vitest/Vite executables) are not installed in this environment. Do not interpret the direct smoke checks as a replacement for the full suite.

## Next step

Run the full test suite and production build in an environment with dependencies installed. Then test exported files in Chrome and mobile browsers with representative datasets, especially large row counts, omitted dependencies, numeric/date filters, KPI ratios, and analysis-derived charts. Only after those pass should the standalone renderer be expanded to match every chart type and styling option.
