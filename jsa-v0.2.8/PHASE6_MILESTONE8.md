# JSA Phase 6 — Milestone 8: Export Reliability, Performance & Static Renderer Parity

## Goals

Improve standalone dashboard export behavior under larger and messier datasets, and bring the **static HTML export** onto the same chart-family renderer approach introduced for interactive exports in Milestone 7.

## Static HTML chart renderer parity

The static exporter now renders supported chart families with inline SVG rather than falling back to generic bar lists or tables:

- Pie and donut charts, including legends, percentages, and donut totals.
- Line and area charts, including multi-series legends.
- Grouped and stacked bar charts.
- Standard bars and horizontal bars.
- Scatter plots with X/Y labels and tooltips.
- Histograms with bin labels and counts.
- Existing table and KPI chart output remains supported.

It uses saved chart titles, saved valid hexadecimal colors, accessible SVG labels, and tooltip titles. It remains an offline snapshot: chart visuals do not respond to filters in static HTML.

For static chart rendering, very high-cardinality category charts display at most 40 categories and scatter plots at most 2,000 points. Any such cap is disclosed in the exported HTML. Existing chart data warnings and truncation information are also preserved.

## Interactive export reliability/performance improvements

- Replaced spread-based min/max calculations on large scatter/histogram inputs with a loop-based extent helper, avoiding argument-limit failures on large arrays.
- Reworked category/series grouping to collect rows in a single pass instead of repeatedly scanning all rows for every category/series combination.
- Limited standalone categorical filter dropdowns to the first 500 distinct sorted values and displays a note when more exist.
- Capped category charts at 120 categories and multi-series charts at 20 series to avoid unbounded SVG/DOM growth; the export displays notes when these caps apply.
- Cached filtered rows for each dashboard render cycle so components reuse the same filtered-row calculation until filter state changes.
- Kept the existing selected-column export and data privacy warning behavior intact.

## Verification performed

- `node --check src/core/dashboard/staticExport.js`: passed.
- `node --check src/core/dashboard/interactiveExport.js`: passed.
- `node --check src/tests/phase6-workflow.test.js`: passed.
- Generated static export smoke test: all eight SVG chart types (pie, donut, line, area, grouped, stacked, scatter, histogram) rendered; zero chart-export errors.
- Generated interactive export smoke test: category grouping, category/series caps, filter dropdown cap, and filtered-row cache are present.
- `node --check` on the generated interactive HTML runtime script: passed.
- Full Vitest suite and production build: not run because local dependencies/executables are unavailable in this environment.

## Boundaries

- Static HTML remains a non-interactive snapshot; its filter components are explanatory only.
- Interactive HTML remains a local file with selected row-level values embedded in readable JSON. The privacy warning is not encryption or access control.
- The standalone renderer aims for consistent chart-family parity, not pixel-identical rendering with JSA's in-app chart library. Advanced axis options and some specialized formatting remain simplified.
- Category/series caps are deliberate browser-performance guardrails. Users needing every category should use the underlying data or adjust the source chart's limit where supported.

## Next step

Run the full Vitest suite and production build in the development environment, then compare static and interactive exports against in-app charts using real project datasets, including missing values, negative measures, dates, high-cardinality categories, and excluded columns.

## Follow-up regression fix

The dashboard component collection now exposes `role="list"` and each exported component card exposes `role="listitem"`, preserving explicit accessible collection semantics expected by the static export regression test.
