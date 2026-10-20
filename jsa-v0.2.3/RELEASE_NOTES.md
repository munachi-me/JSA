# RELEASE_NOTES.md — JSA v0.2.3

| | |
| --- | --- |
| **Version** | `0.2.3` |
| **Stage** | Phase 4 · Phase 4 — Dashboard builder |
| **Latest in repository** | No |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [README](README.md) · [Audit](AUDIT.md)

## Release purpose

Adds the dashboard schema, 12-column grid layout, filter components, configuration validation/portability, and IndexedDB persistence.

## New features

- Dashboard schema, layout, and validation modules.
- Dashboard canvas with chart, KPI, text, and filter components.
- Portable dashboard configuration import/export.
- IndexedDB persistence adapter for datasets and workspace state.

## Scope relative to the previous release

- Source modules added: `components/dashboard/Canvas.jsx`, `components/dashboard/DashComponent.jsx`, `core/dashboard/dashboardSchema.js`, `core/dashboard/filters.js`, `core/dashboard/layout.js`, `core/dashboard/portable.js`, `core/dashboard/validation.js`, `core/storage/indexedDBAdapter.js`, `pages/DashboardPage.jsx`, `storage/idb.js`.
- Routes added: `/dashboards`, `/dashboards/:id`, `/dashboards/:id/:did`.
- Application code: 2,168 → 2,924 lines (+756).

Compared against [v0.2.2](../jsa-v0.2.2/RELEASE_NOTES.md).

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

- The git commit that introduced this folder: *Added JSA Versions*.
- A direct source diff against the adjacent version folders.

Milestone documents from this folder have been consolidated into `README.md`, `AUDIT.md`, and this file, and then removed from the version directory to reduce documentation clutter. The source tree, tests, and configuration files were not modified.

## License

MIT. See [LICENSE](LICENSE) in this folder and the repository-root [LICENSE](../../LICENSE).
