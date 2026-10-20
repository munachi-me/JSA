# RELEASE_NOTES.md — JSA v0.2.0

| | |
| --- | --- |
| **Version** | `0.2.0` |
| **Stage** | Phase 1 · Phase 1 — Browser foundation |
| **Recorded date** | 2026-10-14 (from the git commit that added this folder) |
| **Latest in repository** | No |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [README](README.md) · [Audit](AUDIT.md)

## Release purpose

First browser release. React/Vite single-page app with CSV/JSON import, column type inference, dataset profiling, and a paginated data preview.

## New features

- Browser application shell with Home and Datasets routes.
- CSV and JSON import with delimiter detection and malformed-row reporting.
- Column type inference (numeric, boolean, date, time, text, categorical, identifier).
- Dataset profile covering missing values, distinct counts, and duplicates.

## Scope relative to the previous release

- Source modules added: `app/App.jsx`, `app/DatasetContext.jsx`, `core/analytics/aggregation.js`, `core/analytics/descriptive.js`, `core/data/csvParser.js`, `core/data/dataTypes.js`, `core/data/datasetModel.js`, `core/data/profile.js`, `main.jsx`, `pages/DatasetPage.jsx`, `pages/HomePage.jsx`, `styles/global.css`.
- Source modules removed: `cli.js`, `data-table.js`, `index.js`, `jsa.js`.
- Routes added: `/`, `/dataset`, `/dataset/:id`.
- Application code: 296 → 612 lines (+316).

Compared against [v0.1.0](../jsa-v0.1.0/RELEASE_NOTES.md).

## Breaking changes

None recorded. No source module present in the previous release was removed, and no route was renamed or dropped, as verified by comparing the source trees.

## Compatibility and migration

Each version directory is an independent project with its own `package.json` and `package-lock.json`. To use this release, install its dependencies inside its own folder; installing at the repository root does not apply to any version.

## Verification status

| Check | Status |
| --- | --- |
| Test suite | **Executed and passed.** `npx vitest run` reported 2 passed and 21 passed. |
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
