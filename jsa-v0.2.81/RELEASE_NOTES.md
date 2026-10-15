# JSA v0.2.81 — Analysis UI Redesign + Analytical Functions

## Highlights
- Redesigned Analysis workspace with clearer hierarchy and responsive tool cards.
- Column profiling for numeric and categorical columns, including missing/distinct counts and frequent values.
- Numeric descriptive statistics: mean, median, minimum, maximum, range, quartiles, and standard deviation.
- Pearson correlation explorer with complete-pair count, approximate p-value, relationship strength, and visual indicator.
- Existing grouped analyses, KPIs, filters, saved definitions, and navigation retained from the supplied v0.2.8-edited baseline.

## Notes
- Install dependencies locally with `npm install`; `node_modules` is intentionally excluded from the release ZIP.
- Correlation indicates linear association, not causation. The displayed p-value is approximate.
