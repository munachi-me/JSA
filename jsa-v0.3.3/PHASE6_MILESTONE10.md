# Phase 6 — Milestone 10: Conditional Columns and Column Reshaping

**Release:** `0.2.66`

## Changes

- Added a visual conditional-column builder with ordered IF rules, per-rule AND/OR conditions, comparison operators, explicit missing-value checks, and a fallback value.
- Added delimiter-based column splitting into 2–10 derived text columns, with optional whitespace trimming. The source column is retained.
- Added column combination with a configurable separator and optional skipping of missing values.
- Added regression tests covering branch priority, AND/OR evaluation, missing values, invalid conditions, split output, combine output, and invalid parameters.
- Updated the README and package version metadata for `0.2.66`.

## Verification

- Node.js syntax checks passed for the changed core JavaScript modules.
- Targeted core smoke checks passed for conditional column creation, splitting, and combining.
- The complete Vitest suite and Vite production build were not run in the packaging environment because `npm ci` could not fetch a dependency from the npm registry. Run `npm ci`, `npm test`, and `npm run build` in a connected project environment before publishing this release.
