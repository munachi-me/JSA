# Phase 7 — Milestone 2: HTML Chart Export Refinements (v0.4.7)

## Scope
Correct static and interactive HTML export rendering for line and area charts. This release does not yet introduce the broader Export Appearance Studio.

## Changes
- Add y-axis tick labels and horizontal guide lines.
- Render both axis titles, honoring custom titles and falling back to the dimension and measure labels.
- Keep month-name categories in calendar order when Automatic sorting is selected.
- Honor the dashboard component's Show data values setting and keep labels visible.

## Compatibility
- Explicit alphabetical/label and value sorting choices remain respected.
- No dataset values, saved KPI definitions, or dashboard references are modified by exporting.
