# JSA Phase 6 — Milestone 4: Static HTML Dashboard Export

## What changed

- Added `createStaticDashboardHtml()` in `src/core/dashboard/staticExport.js`.
- Added **Export static HTML** to the dashboard editor while preserving the existing configuration JSON export.
- The generated HTML is self-contained and can be opened locally or hosted as a static file.
- Exported components include text blocks, KPI results, current insight summaries, chart summaries, and accessible tables for chart types where a table representation is more appropriate.
- User-controlled content is HTML-escaped before insertion into the exported document.
- Added a workflow test for the HTML document, escaped content, and confirmation that source rows are not dumped wholesale into the export.

## Important product boundary

This is a **static snapshot**, not a live deployed JSA application. Dashboard filter controls are explanatory notes in the export; values do not refresh when the source data changes. The export embeds values rendered by included components, so visible table rows and analytical results may still contain sensitive information. Review the HTML before sharing it publicly.

The existing `.jsa-dashboard.json` configuration export remains available for moving dashboard definitions between JSA workspaces.

## Verification status

- `node --check` passed for the new static export module and updated workflow test file.
- The full Vitest suite and Vite production build could not be run in this environment because the `vitest` executable was unavailable. An attempt to restore dependencies did not complete.
- The new test has been added but is not reported as passed until it runs in the project's normal environment.

## Next milestone

Verify the generated HTML in a browser at desktop and mobile widths, test each component type, then decide whether the next step should be a more interactive export or deployment integrations. Keep live data-source connectivity and authentication separate from this static snapshot feature.
