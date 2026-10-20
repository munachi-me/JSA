# RELEASE_NOTES.md — JSA v0.2.91

| | |
| --- | --- |
| **Version** | `0.2.91` |
| **Stage** | Phase 6 |
| **Recorded date** | 2026-10-16 (from the git commit that added this folder) |
| **Latest in repository** | No |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [README](README.md) · [Audit](AUDIT.md)

## Release purpose

Phase 6 Milestone 15: dashboard chart fit, chart sort and value controls, and settings presentation.

## New features

- Dashboard chart settings support sort mode and direction, applied by both HTML exporters.
- Show-values control in chart creation and dashboard settings.

## Improvements

- Charts fit component dimensions by default; the data-table disclosure scrolls when expanded.
- Desktop settings use a side panel; mobile settings use a modal.
- KPI and filter cards start compact but remain resizable.
- Accessible checkbox-card styling for Analysis group-by choices.

## Scope relative to the previous release

- No new source modules were added; this release changed existing modules.
- Application code: 4,468 → 4,517 lines (+49).

Compared against [v0.2.84](../jsa-v0.2.84/RELEASE_NOTES.md).

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

- The git commit that introduced this folder: *moving forward*.
- The milestone document `PHASE6_MILESTONE10.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE11.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE12.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE13.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE14.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE15.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE2.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE3.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE4.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE5.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE6.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE7.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE8.md` originally shipped in this folder.
- The milestone document `PHASE6_MILESTONE9.md` originally shipped in this folder.
- A direct source diff against the adjacent version folders.

Milestone documents from this folder have been consolidated into `README.md`, `AUDIT.md`, and this file, and then removed from the version directory to reduce documentation clutter. The source tree, tests, and configuration files were not modified.

## License

MIT. See [LICENSE](LICENSE) in this folder and the repository-root [LICENSE](../../LICENSE).
