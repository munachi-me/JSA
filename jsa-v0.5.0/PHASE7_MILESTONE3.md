# Phase 7 — Milestone 3: Export Appearance Studio (v0.4.71)

## Scope
- Add a shared appearance configuration flow for static and interactive standalone HTML exports.
- Keep exported appearance independent of JSA's in-app theme.
- Offer Midnight, Executive, Minimal, and Custom presets, editable palette colors, typography, card corners, spacing, brand label, and optional footer.
- Show a compact live appearance preview before exporting.
- Preserve interactive export's selected-column controls and privacy warning.
- Correct automatic chronological sorting for interactive exported month and month-year categories while respecting explicit label/value sorting.

## Validation
- Added tests for appearance normalization, both export renderers, optional footer, and month-sort logic embedded in the interactive export.
- Run `npm install`, `npm test`, and `npm run build` in Acode before marking the release fully verified.
