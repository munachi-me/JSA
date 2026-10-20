# Phase 7 — Milestone 1 (v0.4.0)

## Advanced Data Preparation & Column Control

### Delivered
- Split-column forms expose a name field for each output part. The transform validates that names are present, unique, and do not collide with existing columns.
- Added `reorderColumns` as an immutable pipeline transform; the Dataset Explorer provides directional controls.
- Added `setPrecision` to store a per-numeric-column display precision from 0 to 10 without changing values.
- Dataset Explorer statistics and preview honor column precision. Analysis profile stats honor column precision. Analysis result tables have a separate output precision selector.

### Validation status
- Manual core-transform checks passed for custom split names, legacy split defaults, column reordering, and precision metadata/value preservation.
- JSX syntax checks passed for the modified React pages/components; plain JavaScript syntax checks passed for the transform registry and pipeline.
- ZIP integrity check passed; MIT license is included and `node_modules` is excluded.
- Full Vitest suite and production build could not run in this environment because dependency installation did not complete (`vitest` and `vite` binaries are unavailable). Run `npm install`, `npm test`, and `npm run build` before treating the release as fully verified.
