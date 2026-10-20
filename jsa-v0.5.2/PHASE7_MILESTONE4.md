# Phase 7 — Milestone 4: Dataset Intelligence Engine (v0.4.8)

## Goal
Help users understand dataset quality and identify sensible next actions before analysis.

## Delivered
- Dataset health score with a visible explanation of its heuristic inputs.
- Summary of completeness, exact duplicate rows, numeric fields, and date fields.
- Recommendations for missing values, duplicate rows, constant columns, high-cardinality text fields, and possible IQR outliers.
- Expandable column profiles with missingness, distinct counts, numeric ranges/median, potential outlier counts, and date ranges.
- Action links from findings into cleaning, analysis, or Dataset Explorer.
- Tests for representative findings and empty datasets.

## Interpretation notes
- A score is an at-a-glance heuristic, not a statistical guarantee.
- IQR outliers are not automatically errors; domain context is needed.
- The engine reports patterns supported by the current dataset and does not infer causes.
