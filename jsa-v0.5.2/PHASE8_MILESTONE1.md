# Phase 8 Milestone 1 — v0.5.0 Smart KPI & Chart Suggestions

## Features
- Explainable, opt-in KPI recommendations derived from dataset structure.
- Chart Builder suggestions for temporal trends, category comparisons, numeric relationships, distributions, and category counts.
- Suggested chart configurations are loaded into the builder for review and are not saved automatically.
- Charts navigation remains active while using `/chart-builder` and `/chart-builder/:id`.

## Design principles
- Suggestions are transparent and based on column types, not hidden claims about domain semantics.
- Existing saved KPIs and charts remain unchanged.
- Responsive cards match the current JSA workspace style.
