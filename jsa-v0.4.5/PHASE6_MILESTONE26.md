# Phase 6 Milestone 26 — JSA v0.4.2

## Scope
- Detached, shared column settings popup in Dataset Explorer.
- Per-KPI display precision from 0 to 10 decimal places.
- Custom names and long/short labels for date/time extraction.
- Chronological date/time sorting and natural sorting for short month/weekday labels.
- Additional text filter operators and per-measure filter conditions in analysis.

## Verification
- Manual core assertions passed for text filters, chronological date/time sorting, independent measure filters, KPI precision, and custom short-label extraction.
- All 24 JSX/TSX files passed the TypeScript transpile syntax check.
- Full Vitest suite and Vite production build were not run because dependency installation timed out in the build environment. Run `npm install`, `npm test`, and `npm run build` in Acode before accepting this release.
