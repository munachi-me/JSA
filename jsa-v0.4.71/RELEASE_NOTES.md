# RELEASE_NOTES.md — JSA v0.4.71

| | |
| --- | --- |
| **Version** | `0.4.71` |
| **Stage** | Phase 7 |
| **Recorded date** | 2026-10-19 (from the git commit that added this folder) |
| **Latest in repository** | No |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [README](README.md) · [Audit](AUDIT.md)

## Release purpose

Phase 7 Milestone 3: Export Appearance Studio.

## New features

- Shared appearance configuration for static and interactive standalone HTML exports.
- Midnight, Executive, Minimal, and Custom presets with editable palette colours, typography, card corners, spacing, brand label, and optional footer.
- Compact live appearance preview before exporting.

## Improvements

- Exported appearance stays independent of JSA's in-app theme.
- Automatic chronological sorting corrected for exported month and month-year categories while respecting explicit label/value sorting.

## Scope relative to the previous release

- No new source modules were added; this release changed existing modules.
- Source modules removed: `components/data/DatasetIntelligencePanel.jsx`, `core/data/intelligence.js`.
- Application code: 6,112 → 5,918 lines (-194).

Compared against [v0.4.8](../jsa-v0.4.8/RELEASE_NOTES.md).

## Breaking changes

None recorded. No source module present in the previous release was removed, and no route was renamed or dropped, as verified by comparing the source trees.

## Compatibility and migration

Each version directory is an independent project with its own `package.json` and `package-lock.json`. To use this release, install its dependencies inside its own folder; installing at the repository root does not apply to any version.

Datasets persisted in IndexedDB are keyed to the browser origin. Running a different version folder on a different dev-server port is a different origin, so previously saved work will not appear there. Workspace data is not migrated between versions by the repository.

## Verification status

| Check | Status |
| --- | --- |
| Test suite | **Not executed** in this documentation pass. |
| Production build | **Not executed** in this documentation pass. |
| Browser behaviour | **Not verified** — no browser session was driven during documentation. |
| Coverage | **Not measured.** No coverage figure is claimed. |

"Executed and passed" above means the command was run against this exact folder in the documentation environment and exited successfully. It does not mean every feature was exercised, and it does not constitute a browser or security verification.

## Historical provenance

This release note was reconstructed from:

- The git commit that introduced this folder: *dashboard export enhancement*.
- The milestone document `PHASE6_MILESTONE10.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE11.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE12.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE13.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE14.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE15.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE16.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE17.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE18.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE2.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE20.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE21.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE22.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE23.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE24.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE25.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE26.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE3.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE4.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE5.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE6.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE7.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE8.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE9.md` originally shipped in this folder.
- The milestone document `PHASE7_MILESTONE1.md` originally shipped in this folder.
- The milestone document `PHASE7_MILESTONE2.md` originally shipped in this folder.
- The milestone document `PHASE7_MILESTONE3.md` originally shipped in this folder.
- A direct source diff against the adjacent version folders.

Milestone documents from this folder have been consolidated into `README.md`, `AUDIT.md`, and this file, and then removed from the version directory to reduce documentation clutter. The source tree, tests, and configuration files were not modified.

## License

MIT. See [LICENSE](LICENSE) in this folder and the repository-root [LICENSE](../../LICENSE).
