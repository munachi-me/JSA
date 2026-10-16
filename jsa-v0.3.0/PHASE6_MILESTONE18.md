# Phase 6 — Milestone 18: JSA 0.3.0 Workspace UI Foundation

## Goal
Begin the major UI refresh without changing analytics, cleaning, charting, dashboard, storage, or export behavior.

## Included
- Redesigned application shell with a compact brand lockup, grouped navigation, active-route styling, and a private-workspace footer.
- Responsive desktop navigation rail that becomes a horizontally scrollable icon navigation bar on phones.
- Workspace header with current section, short contextual description, local-only privacy indicator, and open-dataset count.
- Rebuilt Home page as a dashboard: dataset/row/column summaries, import and sample-data actions, workflow shortcuts, and a recent/open datasets list.
- Dark, premium visual foundation with larger cards, improved spacing, responsive layouts, focus states, and reduced-motion support.

## Compatibility
- Existing routes and page components are preserved.
- Existing import, sample data, IndexedDB persistence, dataset cleaning, analysis, chart, insight, dashboard, and export behavior are unchanged.
- Existing Home heading phrase “Bring in a dataset” is retained for compatibility with the render smoke test.

## Verification
- ZIP structure and static source checks should be completed before distribution.
- Run `npm install`, `npm test`, and `npm run build` on the target device; dependencies are not bundled.
