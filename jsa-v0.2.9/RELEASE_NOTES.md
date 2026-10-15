# JSA v0.2.9 — Dashboard Builder UX & Project Management Foundation

## Dashboard builder improvements
- Settings no longer open simply because a dashboard element is selected. Use the element's settings icon to open the contextual settings panel, and close it independently.
- Responsive dashboard layout now stacks elements cleanly on narrow screens instead of forcing desktop grid row/column placements onto mobile.
- Dashboard content and tables are constrained to their cards, with horizontally scrollable tables and safer minimum sizes.
- Resize previews enforce minimum dimensions to avoid inverted or collapsed cards.
- Added a separate **Chart table** dashboard element that references a saved chart. Add it from a chart's settings panel; it is a separate card rather than a table embedded inside the chart card.
- Static and interactive HTML exports now recognize the separate table element and render table output for it. Interactive HTML shows up to 100 source rows for this table component.
- Existing dashboard filters, chart/KPI components, layout schema and project structure are preserved.

## Validation
- Core schema smoke check passed for adding a chart and separate table component, and validating the dashboard.
- Static and interactive export modules load successfully under Node.
- Full Vitest suite and Vite production build could not be run in this environment because dependencies were unavailable; `npm install` did not complete. Run `npm install`, `npm test`, and `npm run build` locally before treating this release as fully verified.
