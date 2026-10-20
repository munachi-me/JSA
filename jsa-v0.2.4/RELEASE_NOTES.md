# RELEASE_NOTES.md — JSA v0.2.4

| | |
| --- | --- |
| **Version** | `0.2.4` |
| **Stage** | Phase 5 · Phase 5 — Insights |
| **Latest in repository** | No |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [README](README.md) · [Audit](AUDIT.md)

## Release purpose

Adds the rule-based insight engine, correlation and inference helpers, and the Insights page, completing the Phase 1–5 feature set.

## New features

- Rule-based insight engine with a rule catalogue.
- Pearson correlation and group-comparison (inference) helpers.
- Insights page with save/dismiss actions and add-to-dashboard.

## Scope relative to the previous release

- Source modules added: `components/insights/InsightCard.jsx`, `core/analytics/correlation.js`, `core/analytics/inference.js`, `core/insights/insightEngine.js`, `core/insights/rules.js`, `pages/InsightsPage.jsx`.
- Routes added: `/insights`, `/insights/:id`.
- Application code: 2,924 → 3,457 lines (+533).

Compared against [v0.2.3](../jsa-v0.2.3/RELEASE_NOTES.md).

## Breaking changes

None recorded. No source module present in the previous release was removed, and no route was renamed or dropped, as verified by comparing the source trees.

## Compatibility and migration

Each version directory is an independent project with its own `package.json` and `package-lock.json`. To use this release, install its dependencies inside its own folder; installing at the repository root does not apply to any version.

Datasets persisted in IndexedDB are keyed to the browser origin. Running a different version folder on a different dev-server port is a different origin, so previously saved work will not appear there. Workspace data is not migrated between versions by the repository.

## Verification status

| Check | Status |
| --- | --- |
| Test suite | **Executed and passed.** `npx vitest run` reported 7 passed and 88 passed. |
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
