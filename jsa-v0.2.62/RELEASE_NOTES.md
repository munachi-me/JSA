# RELEASE_NOTES.md — JSA v0.2.62

| | |
| --- | --- |
| **Version** | `0.2.62` |
| **Stage** | Phase 6 |
| **Recorded date** | 2026-10-15 (from the git commit that added this folder) |
| **Latest in repository** | No |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [README](README.md) · [Audit](AUDIT.md)

## Release purpose

Phase 6 Milestone 6: first interactive dashboard HTML export with explicit column selection.

## New features

- `createInteractiveDashboardHtml()` and "Export interactive HTML".
- Export column-selection dialog with select-all / select-none.
- Client-side filtering and recalculation inside the exported file (dropdown, numeric range, date range).
- Privacy warning stating that selected row-level data is embedded in readable form.

## Important behaviour notes

- The first renderer was simplified relative to the in-app charts; chart-family parity follows in 0.2.63 and 0.2.64.

## Scope relative to the previous release

- Source modules added: `core/dashboard/interactiveExport.js`.
- Application code: 3,567 → 3,657 lines (+90).

Compared against [v0.2.61](../jsa-v0.2.61/RELEASE_NOTES.md).

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

- The milestone document `PHASE6_MILESTONE2.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE3.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE4.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE5.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE6.md` originally shipped in this folder.
- A direct source diff against the adjacent version folders.

Milestone documents from this folder have been consolidated into `README.md`, `AUDIT.md`, and this file, and then removed from the version directory to reduce documentation clutter. The source tree, tests, and configuration files were not modified.

## License

MIT. See [LICENSE](LICENSE) in this folder and the repository-root [LICENSE](../../LICENSE).
