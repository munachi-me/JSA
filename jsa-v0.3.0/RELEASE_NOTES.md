# RELEASE_NOTES.md — JSA v0.3.0

| | |
| --- | --- |
| **Version** | `0.3.0` |
| **Stage** | Phase 6 |
| **Recorded date** | 2026-10-17 (from the git commit that added this folder) |
| **Latest in repository** | No |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [README](README.md) · [Audit](AUDIT.md)

## Release purpose

Phase 6 Milestones 18 and 20: the 0.3.0 workspace UI foundation plus adaptive Home.

## Improvements

- Redesigned application shell with compact brand lockup, grouped navigation, and active-route styling.
- Responsive navigation rail that becomes a horizontally scrollable icon bar on phones.
- Workspace header with section context, a local-only privacy indicator, and an open-dataset count.
- Home rebuilt as a workspace dashboard with dataset/row/column summaries and recent datasets.
- Dark, premium visual foundation with focus states and reduced-motion support.
- Home adapts between onboarding and returning-user states once storage restores.

## Bug fixes

- The Export & Publish dropdown renders through a portal so it is no longer clipped by navbar overflow.

## Important behaviour notes

- Analytics, cleaning, charting, dashboard, storage, and export behaviour were intentionally unchanged. Milestones 18 and 20 were both folded into the single 0.3.0 folder.

## Scope relative to the previous release

- No new source modules were added; this release changed existing modules.
- Application code: 4,718 → 4,898 lines (+180).

Compared against [v0.2.93](../jsa-v0.2.93/RELEASE_NOTES.md).

## Breaking changes

None recorded. No source module present in the previous release was removed, and no route was renamed or dropped, as verified by comparing the source trees.

## Compatibility and migration

Each version directory is an independent project with its own `package.json` and `package-lock.json`. To use this release, install its dependencies inside its own folder; installing at the repository root does not apply to any version.

Datasets persisted in IndexedDB are keyed to the browser origin. Running a different version folder on a different dev-server port is a different origin, so previously saved work will not appear there. Workspace data is not migrated between versions by the repository.

## Verification status

| Check | Status |
| --- | --- |
| Test suite | **Executed and passed.** `npx vitest run` reported 14 passed and 132 passed. |
| Production build | **Not executed** in this documentation pass. |
| Browser behaviour | **Not verified** — no browser session was driven during documentation. |
| Coverage | **Not measured.** No coverage figure is claimed. |

"Executed and passed" above means the command was run against this exact folder in the documentation environment and exited successfully. It does not mean every feature was exercised, and it does not constitute a browser or security verification.

## Historical provenance

This release note was reconstructed from:

- The git commit that introduced this folder: *new UI / Refined Dashboard*.
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
