# Phase 8 — Milestone 2: Recommended Analyses

## Scope
- Make KPI and chart suggestions compact by default, with two visible suggestions and a Show all / Show less control.
- Add explainable recommended investigations, data-quality checks, and grouped analyses based on available dataset columns and observed quality findings.
- Let users load suggested grouped analyses, preselect correlation variables, navigate to data-quality review, or start a trend chart.

## Safety and behavior
- Recommendations are advisory and never save analyses, KPIs, or charts automatically.
- Correlation is described as association, not causation.
- Dataset-specific suggestions are generated from the current schema and quality profile.

## Verification
- Added regression coverage in `src/tests/suggestions.test.js`.
- Run `npm install`, `npm test`, and `npm run build` in the target Acode environment before treating the release as fully verified.
