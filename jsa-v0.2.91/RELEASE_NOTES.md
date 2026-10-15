# JSA v0.2.91 — Dashboard & Analysis UI refinement

## Kept and refined
- Analysis page **Group by** checkboxes use clearer selectable cards and checked states.
- Dashboard component settings return to a **side panel on desktop** and remain a **popup on mobile**.
- Dashboard chart sort overrides support Automatic, Alphabetical / label, and By value, with ascending/descending direction. HTML exports apply the same chart sorting configuration.
- Chart visuals fit the available dashboard component area by default. When **Show data as table** is expanded, the chart component's content can scroll so the table remains accessible instead of being clipped.
- Show-data-values settings remain available on the chart creation page and dashboard chart settings.
- KPI and filter components retain compact initial sizing while allowing manual resizing.

## Installation and verification
- `node_modules` is not included. Run `npm install` in the project directory before testing.
- Run `npm test` and `npm run build` locally in Acode to verify the release in your environment.
